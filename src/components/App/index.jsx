/* istanbul ignore file */
import { Component, createContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { bool } from "prop-types";

import { HotkeysTarget2 } from "@blueprintjs/core";

import Dashboard from "../Dashboard";
import ExtensionIcon from "../ExtensionIcon";
import GraphWatcher from "../GraphWatcher";
import SearchPanel from "../SearchPanel";

import { RoamCitekeysProvider } from "../RoamCitekeysContext";
import { useOtherSettings } from "../UserSettings/Other";
import { useRequestsSettings } from "../UserSettings/Requests";
import { useShortcutsSettings } from "../UserSettings/Shortcuts";

import { addPaletteCommand, getCurrentCursorLocation, maybeReturnCursorToPlace } from "Roam";

import * as customPropTypes from "../../propTypes";
import { SettingsDialog } from "../UserSettings";


const ExtensionContext = createContext();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchIntervalInBackground: true,
			retryOnMount: false,
			staleTime: 1000 * 60
		}
	}
});

// https://stackoverflow.com/questions/63431873/using-multiple-context-in-a-class-component
const AppWrapper = (props) => {
	const [otherSettings] = useOtherSettings();
	const [requests] = useRequestsSettings();
	const [shortcuts] = useShortcutsSettings();

	return <App autoload={otherSettings.autoload} requests={requests} shortcuts={shortcuts} {...props} />;
};

// TODO: make component reactive to changes in dataRequests, shortcuts
class App extends Component {
	constructor(props){
		super(props);
		this.state = {
			isDashboardOpen: false,
			isSearchPanelOpen: false,
			isSettingsPanelOpen: false,
			lastCursorLocation: null,
			status: (
				this.props.requests.dataRequests.length == 0
					? "disabled"
					: this.props.autoload 
						? "on" 
						: "off")
		};
		this.toggleExtension = this.toggleExtension.bind(this);
		this.closeSearchPanel = this.closeSearchPanel.bind(this);
		this.openSearchPanel = this.openSearchPanel.bind(this);
		this.toggleSearchPanel = this.toggleSearchPanel.bind(this);
		this.closeDashboard = this.closeDashboard.bind(this);
		this.openDashboard = this.openDashboard.bind(this);
		this.toggleDashboard = this.toggleDashboard.bind(this);
		this.closeSettings = this.closeSettings.bind(this);
		this.openSettings = this.openSettings.bind(this);
		this.toggleSettings = this.toggleSettings.bind(this);

		this.shortcutsConfig = {
			"toggleDashboard": {
				label: "Show/hide the dashboard",
				onKeyDown: () => this.toggleDashboard()
			},
			"toggleSearchPanel": {
				label: "Show/hide the search panel",
				onKeyDown: () => this.toggleSearchPanel()
			},
			"toggleSettingsPanel": {
				label: "Show/hide the settings panel",
				onKeyDown: () => this.toggleSettings()
			}
		};
		this.hotkeys = Object.keys(this.shortcutsConfig)
			.map(cmd => {
				const combo = this.props.shortcuts[cmd];
				if(combo != false){
					return {
						allowInInput: true,
						combo,
						global: true,
						...this.shortcutsConfig[cmd]
					};
				} else {
					return false;
				}
			}).filter(Boolean);
		this.hotkeysOptions = {
			showDialogKeyCombo: "shift+Z+R"
		};
	}

	componentDidMount(){
		addPaletteCommand("zoteroRoam : Open Search Panel", this.openSearchPanel);
		addPaletteCommand("zoteroRoam : Open Dashboard", this.openDashboard);
	}

	componentDidUpdate(prevProps){
		if(this.props.requests.dataRequests.length == 0 && prevProps.requests.dataRequests.length > 0){
			this.setState((_prev) => {
				queryClient.clear();
				return {
					status: "disabled"
				};
			});
		} else if(prevProps.requests.dataRequests.length == 0 && this.props.requests.dataRequests.length > 0){
			this.setState((_prev) => ({
				status: "on"
			}));
		}
		// In the case of a change in requests, the old requests should become inactive & be eventually cleared
		// TODO: check if *changed* requests would require an explicit update
	}

	render() {
		const { status, isDashboardOpen, isSearchPanelOpen, isSettingsPanelOpen } = this.state;
		const { extension } = this.props;
		
		return (
			<HotkeysTarget2 hotkeys={this.hotkeys} options={this.hotkeysOptions}>
				<QueryClientProvider client={queryClient}>
					<ExtensionContext.Provider value={extension}>
						<ExtensionIcon
							openDashboard={this.openDashboard}
							openSearchPanel={this.openSearchPanel}
							openSettingsPanel={this.openSettings}
							status={status} 
							toggleExtension={this.toggleExtension} />
						<SettingsDialog isOpen={isSettingsPanelOpen} onClose={this.closeSettings} />
						<RoamCitekeysProvider>
							{status == "on" ? <GraphWatcher /> : null}
							<SearchPanel
								isOpen={isSearchPanelOpen}
								onClose={this.closeSearchPanel}
								status={status} />
							<Dashboard isOpen={isDashboardOpen} onClose={this.closeDashboard} />
						</RoamCitekeysProvider>
					</ExtensionContext.Provider>
				</QueryClientProvider>
			</HotkeysTarget2>
		);
	}

	toggleExtension() {
		this.setState((prevState) => {
			const { status } = prevState;
			if (status == "on") {
				// Aka, turning off the extension
				queryClient.clear();
			}
			return {
				status: status == "off" ? "on" : "off"
			};
		});
	}

	closeSearchPanel() {
		this.setState((_prev) => {
			maybeReturnCursorToPlace(_prev.lastCursorLocation);
			return { 
				isSearchPanelOpen: false,
				lastCursorLocation: null
			};
		});
	}

	openSearchPanel() {
		this.setState((_prev) => ({ lastCursorLocation: getCurrentCursorLocation(), isSearchPanelOpen: true }));
	}

	toggleSearchPanel() {
		if(this.state.status == "on"){
			this.setState((prev) => ({ isSearchPanelOpen: !prev.isSearchPanelOpen }));
		}
	}

	closeDashboard() {
		this.setState((_prev) => ({ isDashboardOpen: false }));
	}

	openDashboard() {
		this.setState((_prev) => ({ isDashboardOpen: true }));
	}

	toggleDashboard(){
		if(this.state.status == "on"){
			this.setState((prev) => ({ isDashboardOpen: !prev.isDashboardOpen }));
		}
	}

	closeSettings() {
		this.setState((_prev) => ({ isSettingsPanelOpen: false }));
	}

	openSettings() {
		this.setState((_prev) => ({ isSettingsPanelOpen: true }));
	}

	toggleSettings() {
		this.setState((prev) => ({ isSettingsPanelOpen: !prev.isSettingsPanelOpen }));
	}

}
App.propTypes = {
	autoload: bool,
	extension: customPropTypes.extensionType,
	requests: customPropTypes.requestsType,
	shortcuts: customPropTypes.shortcutsSettingsType
};

export {
	AppWrapper,
	ExtensionContext,
	queryClient
};