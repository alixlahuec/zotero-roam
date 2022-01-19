import React, { Component } from "react";
import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "react-query";

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
		this.openSearchPanel = this.openSearchPanel.bind(this);
		this.handleChangeInSearchPanel = this.handleChangeInSearchPanel.bind(this);
	}

	componentDidMount(){
		addPaletteCommand("zoteroRoam : Open the search panel", this.openSearchPanel);
	}

	render() {
		let { extension, dataRequests, apiKeys, libraries, userSettings } = this.props;
		let { version, portalId } = extension;
		let { autocomplete, copy, render_inline } = userSettings;
		let { status, searchPanel } = this.state;

		return (
			<QueryClientProvider client={queryClient}>
				<ExtensionIcon status={status} version={version}
					dataRequests={dataRequests} apiKeys={apiKeys} libraries={libraries} userSettings={userSettings}
					toggleExtension={this.toggleExtension}
					openSearchPanel={this.openSearchPanel}
				/>
				{status == "on"
					? <GraphWatcher autocomplete={autocomplete} renderInline={render_inline} dataRequests={dataRequests} portalId={portalId} />
					: null}
				<SearchPanel panelState={searchPanel}
					portalTarget={portalId}
					copySettings={copy}
					handleChange={this.handleChangeInSearchPanel}
				/>
			</QueryClientProvider>
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

	handleChangeInSearchPanel(changes) {
		this.setState((prevState) => {
			return {
				searchPanel: {
					...prevState.searchPanel,
					...changes
				}
			};
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
		render_inline: PropTypes.bool
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