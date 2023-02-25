/* istanbul ignore file */
import { bool, node } from "prop-types";
import { Component, createContext, useCallback, useMemo } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { HotkeysTarget2 } from "@blueprintjs/core";

import Dashboard from "Components/Dashboard";
import ExtensionIcon from "Components/ExtensionIcon";
import GraphWatcher from "Components/GraphWatcher";
import Logger from "Components/Logger";
import SearchPanel from "Components/SearchPanel";
import { SettingsDialog } from "Components/UserSettings";

import { RoamCitekeysProvider } from "Components/RoamCitekeysContext";
import { useOtherSettings } from "Components/UserSettings/Other";
import { useRequestsSettings } from "Components/UserSettings/Requests";
import { useShortcutsSettings } from "Components/UserSettings/Shortcuts";

import { addPaletteCommand, getCurrentCursorLocation, maybeReturnCursorToPlace, removePaletteCommand } from "Roam";
import { isIDBDatabase } from "../../services/idb";
import { createPersisterWithIDB, shouldQueryBePersisted, validateShortcuts } from "../../setup";

import * as customPropTypes from "../../propTypes";


const openSearchCommand = "zoteroRoam : Open Search Panel";
const openDashboardCommand = "zoteroRoam : Open Dashboard";

const ExtensionContext = createContext();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			cacheTime: Infinity,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchIntervalInBackground: true,
			retryOnMount: false,
			staleTime: 1000 * 60
		}
	}
});

/* istanbul ignore next */
const onPersisterSuccess = () => {
	window.zoteroRoam?.info?.({
		origin: "Database",
		message: "Initialization complete"
	});
};

const QCProvider = ({ children, idbDatabase }) => {
	const [{ cacheEnabled }] = useOtherSettings();
	const persister = useMemo(() => createPersisterWithIDB(idbDatabase), [idbDatabase]);
	const shouldDehydrateQuery = useCallback((query) => {
		return cacheEnabled
			? shouldQueryBePersisted(query)
			: false;
	}, [cacheEnabled]);

	const persisterProps = useMemo(() => ({
		onSuccess: onPersisterSuccess,
		persistOptions: {
			buster: "v1.0",
			dehydrateOptions: {
				shouldDehydrateQuery
			},
			maxAge: 1000 * 60 * 60 * 24 * 3,
			persister
		}
	}), [persister, shouldDehydrateQuery]);

	return <PersistQueryClientProvider client={queryClient} {...persisterProps}>{children}</PersistQueryClientProvider>;

};
QCProvider.propTypes = {
	children: node,
	idbDatabase: isIDBDatabase
};

// https://stackoverflow.com/questions/63431873/using-multiple-context-in-a-class-component
const AppWrapper = (props) => {
	const [{ autoload }] = useOtherSettings();
	const [requests] = useRequestsSettings();
	const [shortcuts] = useShortcutsSettings();

	// Only pass valid hotkey combos
	// TODO: move validation step upstream
	const sanitizedShortcuts = useMemo(() => validateShortcuts(shortcuts), [shortcuts]);

	return <App autoload={autoload} requests={requests} shortcuts={sanitizedShortcuts} {...props} />;
};

class App extends Component {
	constructor(props){
		super(props);
		this.state = {
			isDashboardOpen: false,
			isLoggerOpen: false,
			isSearchPanelOpen: false,
			isSettingsPanelOpen: false,
			lastCursorLocation: null,
			status: (
				this.props.requests.dataRequests.length == 0
					? "disabled"
					: this.props.autoload 
						? "on" 
						: "off"
			)
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
		this.closeLogger = this.closeLogger.bind(this);
		this.openLogger = this.openLogger.bind(this);

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
		this.hotkeysOptions = {
			showDialogKeyCombo: "shift+Z+R"
		};
	}

	componentDidMount(){
		addPaletteCommand(openSearchCommand, this.openSearchPanel);
		addPaletteCommand(openDashboardCommand, this.openDashboard);
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
	}

	componentWillUnmount(){
		removePaletteCommand(openSearchCommand);
		removePaletteCommand(openDashboardCommand);
	}

	render() {
		const { status, isDashboardOpen, isLoggerOpen, isSearchPanelOpen, isSettingsPanelOpen } = this.state;
		const { extension, idbDatabase } = this.props;

		const hotkeys = Object.keys(this.shortcutsConfig)
			.map(cmd => {
				const combo = this.props.shortcuts[cmd] || "";
				if(combo !== ""){
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

		return (
			<HotkeysTarget2 hotkeys={hotkeys} options={this.hotkeysOptions}>
				<QCProvider idbDatabase={idbDatabase}>
					<ExtensionContext.Provider value={extension}>
						<ExtensionIcon
							openDashboard={this.openDashboard}
							openLogger={this.openLogger}
							openSearchPanel={this.openSearchPanel}
							openSettingsPanel={this.openSettings}
							status={status} 
							toggleExtension={this.toggleExtension} />
						<Logger isOpen={isLoggerOpen} onClose={this.closeLogger} />
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
				</QCProvider>
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

	closeLogger() {
		this.setState((_prev) => ({ isLoggerOpen: false }));
	}

	openLogger() {
		this.setState((_prev) => ({ isLoggerOpen: true }));
	}

}
App.propTypes = {
	autoload: bool,
	extension: customPropTypes.extensionType,
	idbDatabase: isIDBDatabase,
	requests: customPropTypes.requestsType,
	shortcuts: customPropTypes.shortcutsSettingsType
};

export {
	AppWrapper,
	ExtensionContext,
	queryClient
};