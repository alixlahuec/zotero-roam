import React, { Component } from "react";
import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "react-query";
import { HotkeysTarget2 } from "@blueprintjs/core";

import ExtensionIcon from "../ExtensionIcon";
import GraphWatcher from "../GraphWatcher";
import SearchPanel from "../SearchPanel";

import { _getChildren, _getItems } from "../../queries";
import { addPaletteCommand } from "../../roam";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchIntervalInBackground: true,
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
					combo: this.props.userSettings.shortcuts.toggleSearchPanel,
					global: true,
					label: "Toggle Search Panel",
					onKeyDown: this.toggleSearchPanel()
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
		let { extension, dataRequests, apiKeys, libraries, userSettings } = this.props;
		let { version, portalId } = extension;
		let { autocomplete, copy, metadata, render_inline, shortcuts } = userSettings;
		let { status, searchPanel } = this.state;

		return (
			<HotkeysTarget2 hotkeys={this.hotkeys} options={this.hotkeysOptions}>
				<QueryClientProvider client={queryClient}>
					<ExtensionIcon status={status} version={version}
						dataRequests={dataRequests} apiKeys={apiKeys} libraries={libraries} userSettings={userSettings}
						toggleExtension={this.toggleExtension}
						openSearchPanel={this.openSearchPanel}
					/>
					{status == "on"
						? <GraphWatcher autocompleteSettings={autocomplete} metadataSettings={metadata} 
							renderInline={render_inline} 
							dataRequests={dataRequests} 
							portalId={portalId} />
						: null}
					<SearchPanel panelState={searchPanel}
						closePanel={this.closeSearchPanel}
						copySettings={copy}
						dataRequests={dataRequests}
						metadataSettings={metadata}
						portalTarget={portalId}
						shortcutsSettings={shortcuts}
					/>
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
					...rest,
					isOpen: false,
					isSidePanelOpen: false
				};
			} else {
				return {
					...rest,
					isOpen: true
				};
			}
		});
	}

}
App.propTypes = {
	extension: PropTypes.shape({
		version: PropTypes.string,
		portalId: PropTypes.string
	}),
	dataRequests: PropTypes.array,
	apiKeys: PropTypes.array,
	libraries: PropTypes.array,
	userSettings: PropTypes.shape({
		autocomplete: PropTypes.object,
		autoload: PropTypes.bool,
		copy: PropTypes.shape({
			always: PropTypes.bool,
			defaultFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag"]),
			overrideKey: PropTypes.oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
			useQuickCopy: PropTypes.bool
		}),
		metadata: PropTypes.object,
		render_inline: PropTypes.bool,
		shortcuts: PropTypes.object
	}),
};

// Utilities to be exposed via global zoteroRoam variable, for consumption by users :
const getChildren = (item) => _getChildren(item, queryClient);
const getItems = (select = "all", filters = {}) => _getItems(select, filters, queryClient);

export {
	App,
	getChildren,
	getItems
};