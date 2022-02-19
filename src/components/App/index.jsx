import React, { Component } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HotkeysTarget2 } from "@blueprintjs/core";

import ExtensionIcon from "../ExtensionIcon";
import GraphWatcher from "../GraphWatcher";
import { RoamCitekeysProvider } from "../RoamCitekeysContext";
import SearchPanel from "../SearchPanel";

import { _getBibliography, _getCollections, _getChildren, _getItems, _getTags } from "../../api/public";
import { addPaletteCommand } from "../../roam";

import * as customPropTypes from "../../propTypes";
import Dashboard from "../Dashboard";

const ExtensionContext = React.createContext();
const UserSettings = React.createContext();

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

class App extends Component {
	constructor(props){
		super(props);
		this.state = {
			status: this.props.userSettings.autoload ? "on" : "off",
			isDashboardOpen: false,
			isSearchPanelOpen: false
		};
		this.toggleExtension = this.toggleExtension.bind(this);
		this.closeSearchPanel = this.closeSearchPanel.bind(this);
		this.openSearchPanel = this.openSearchPanel.bind(this);
		this.toggleSearchPanel = this.toggleSearchPanel.bind(this);
		this.closeDashboard = this.closeDashboard.bind(this);
		this.openDashboard = this.openDashboard.bind(this);
		this.toggleDashboard = this.toggleDashboard.bind(this);

		this.shortcutsConfig = {
			"toggleDashboard": {
				label: "Show/hide the dashboard",
				onKeyDown: () => this.toggleDashboard()
			},
			"toggleSearchPanel": {
				label: "Show/hide the search panel",
				onKeyDown: () => this.toggleSearchPanel()
			}
		};
		this.hotkeys = Object.keys(this.shortcutsConfig)
			.map(cmd => {
				let combo = this.props.userSettings.shortcuts[cmd];
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

	render() {
		let { status, isDashboardOpen, isSearchPanelOpen } = this.state;
		let { extension, userSettings } = this.props;
		
		return (
			<HotkeysTarget2 hotkeys={this.hotkeys} options={this.hotkeysOptions}>
				<QueryClientProvider client={queryClient}>
					<ExtensionContext.Provider value={extension}>
						<UserSettings.Provider value={userSettings}>
							<ExtensionIcon
								openDashboard={this.openDashboard}
								openSearchPanel={this.openSearchPanel}
								status={status} 
								toggleExtension={this.toggleExtension} />
							<RoamCitekeysProvider>
								{status == "on" ? <GraphWatcher /> : null}
								<SearchPanel
									isOpen={isSearchPanelOpen}
									onClose={this.closeSearchPanel}
									status={status} />
							</RoamCitekeysProvider>
							<Dashboard isOpen={isDashboardOpen} onClose={this.closeDashboard} />
						</UserSettings.Provider>
					</ExtensionContext.Provider>
				</QueryClientProvider>
			</HotkeysTarget2>
		);
	}

	toggleExtension() {
		this.setState((prevState) => {
			let { status } = prevState;
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
		this.setState((_prev) => ({ isSearchPanelOpen: false }));
	}

	openSearchPanel() {
		this.setState((_prev) => ({ isSearchPanelOpen: true }));
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

}
App.propTypes = {
	extension: customPropTypes.extensionType,
	userSettings: customPropTypes.userSettingsType
};

// Utilities to be exposed via global zoteroRoam variable, for consumption by users :
const getBibliography = (item, library, config = {}) => _getBibliography(item, library, config);
const getChildren = (item) => _getChildren(item, queryClient);
const getCollections = (library) => _getCollections(library, queryClient);
const getItems = (select = "all", filters = {}) => _getItems(select, filters, queryClient);
const getTags = (library) => _getTags(library, queryClient);

export {
	App,
	ExtensionContext,
	getBibliography,
	getCollections,
	getChildren,
	getItems,
	getTags,
	UserSettings
};