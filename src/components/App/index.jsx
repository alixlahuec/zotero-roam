import React, { Component } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HotkeysTarget2 } from "@blueprintjs/core";

import ExtensionIcon from "../ExtensionIcon";
import GraphWatcher from "../GraphWatcher";
import { RoamCitekeysProvider } from "../RoamCitekeysContext";
import SearchPanel from "../SearchPanel";

import { _getBibliography, _getChildren, _getItems, _getTags } from "../../api/public";
import { addPaletteCommand } from "../../roam";

import * as customPropTypes from "../../propTypes";

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
			searchPanel: {
				isOpen: false,
				isSidePanelOpen: false
			}
		};
		this.toggleExtension = this.toggleExtension.bind(this);
		this.closeSearchPanel = this.closeSearchPanel.bind(this);
		this.openSearchPanel = this.openSearchPanel.bind(this);
		this.toggleSearchPanel = this.toggleSearchPanel.bind(this);
		this.hotkeys = this.props.userSettings.shortcuts.toggleSearchPanel == false
			? []
			: [
				{
					allowInInput: true,
					combo: this.props.userSettings.shortcuts.toggleSearchPanel,
					global: true,
					label: "Toggle Search Panel",
					onKeyDown: () => this.toggleSearchPanel()
				}
			];
		this.hotkeysOptions = {
			showDialogKeyCombo: "shift+Z+R"
		};
	}

	componentDidMount(){
		addPaletteCommand("zoteroRoam : Open the search panel", this.openSearchPanel);
	}

	render() {
		let { status, searchPanel } = this.state;
		let { extension, userSettings } = this.props;
		
		return (
			<HotkeysTarget2 hotkeys={this.hotkeys} options={this.hotkeysOptions}>
				<QueryClientProvider client={queryClient}>
					<ExtensionContext.Provider value={extension}>
						<UserSettings.Provider value={userSettings}>
							<ExtensionIcon
								openSearchPanel={this.openSearchPanel}
								status={status} 
								toggleExtension={this.toggleExtension} />
							<RoamCitekeysProvider>
								{status == "on" ? <GraphWatcher /> : null}
								<SearchPanel
									closePanel={this.closeSearchPanel}
									panelState={searchPanel}
									status={status} />
							</RoamCitekeysProvider>
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
		this.setState((prevState) => {
			let { isOpen, isSidePanelOpen, ...rest } = prevState.searchPanel;
			if (isOpen) {
				return {
					searchPanel: {
						isOpen: false,
						isSidePanelOpen: false,
						...rest
					}
				};
			} else {
				return {};
			}
		});
	}

	openSearchPanel() {
		this.setState((prevState) => {
			let { isOpen, ...rest } = prevState.searchPanel;
			if (!isOpen) {
				return {
					searchPanel: {
						isOpen: true,
						...rest
					}
				};
			} else {
				return {};
			}
		});
	}

	toggleSearchPanel() {
		this.setState((prevState) => {
			let { isOpen, ...rest } = prevState.searchPanel;
			if(isOpen){
				return {
					searchPanel: {
						...rest,
						isOpen: false,
						isSidePanelOpen: false
					}
				};
			} else {
				return {
					searchPanel: {
						...rest,
						isOpen: true
					}
				};
			}
		});
	}

}
App.propTypes = {
	extension: customPropTypes.extensionType,
	userSettings: customPropTypes.userSettingsType
};

// Utilities to be exposed via global zoteroRoam variable, for consumption by users :
const getBibliography = (item, config, library) => _getBibliography(item, config, library, queryClient);
const getChildren = (item) => _getChildren(item, queryClient);
const getItems = (select = "all", filters = {}) => _getItems(select, filters, queryClient);
const getTags = (library) => _getTags(library, queryClient);

export {
	App,
	ExtensionContext,
	getBibliography,
	getChildren,
	getItems,
	getTags,
	UserSettings
};