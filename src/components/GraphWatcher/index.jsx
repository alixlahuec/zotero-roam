import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { menuPrefix } from "./classes";
import "./index.css";

import { 
	addPageMenus,
	findPageMenus,
	CitekeyMenuFactory, 
	DNPMenuFactory, 
	TagMenuFactory 
} from "./Menus";
import Autocomplete from "./Autocomplete";
import InlineCitekeys from "./InlineCitekeys";
import { getCitekeyPages } from "../../roam";

import * as customPropTypes from "../../propTypes";

class GraphWatcher extends PureComponent {
	constructor(props){
		super(props);
		this.state = {
			citekeyMenus: [],
			dnpMenus: [],
			tagMenus: [],
			roamCitekeys: getCitekeyPages()
		};
		this.updatePageElements = this.updatePageElements.bind(this);
	}

	componentDidMount() {
		// From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
		this._isMounted = true;
        
		// The watcher adds empty <div>s to relevant page elements
		// The contents of the <div>s will be managed by rendering portals
		this.watcher = setInterval(
			() => {
				addPageMenus();
				// TODO: Add other page elems (explo, etc)

				if(this._isMounted){
					this.updatePageElements();
				}
			},
			1000
		);
	}

	componentWillUmmount() {
		// From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
		this._isMounted = false;
		clearInterval(this.watcher);
		Array.from(document.querySelectorAll(`[class*=${menuPrefix}]`)).forEach(div => div.remove());
	}

	render() {
		let { citekeyMenus, dnpMenus, tagMenus, roamCitekeys } = this.state;
		let { autocompleteSettings, dataRequests, libraries, metadataSettings, portalId, renderInline } = this.props;

		let sharedProps = {
			dataRequests,
			metadataSettings,
			portalId,
			roamCitekeys,
			updateRoamCitekeys: this.updateRoamCitekeys
		};
        
		return <>
			{citekeyMenus ? <CitekeyMenuFactory libraries={libraries} menus={citekeyMenus} {...sharedProps} /> : null}
			{dnpMenus ? <DNPMenuFactory menus={dnpMenus} {...sharedProps} /> : null}
			{tagMenus ? <TagMenuFactory menus={tagMenus} {...sharedProps} /> : null}
			{autocompleteSettings.trigger ? <Autocomplete config={autocompleteSettings} dataRequests={dataRequests} /> : null}
			<InlineCitekeys dataRequests={dataRequests} metadataSettings={metadataSettings} portalId={portalId} renderInline={renderInline} />
		</>;
	}

	updatePageElements(){
		// TODO: Add other page elems (explo, etc)
		this.setState((prevState) => {
			let update = {};
			const currentElems = findPageMenus();
			for(let key of Object.keys(currentElems)){
				let prev = prevState[key];
				let current = currentElems[key];
				// From mauroc8 on SO: https://stackoverflow.com/questions/51958759/how-can-i-test-the-equality-of-two-nodelists
				if((prev.length + current.length) != 0 && (prev.length !== current.length || prev.some((el, i) => el !== current[i]))){
					update[key] = currentElems[key];
				}
			}

			if(JSON.stringify(update) === "{}"){
				return null;
			} else {
				return update;
			}
		});
	}

	updateRoamCitekeys(){
		this.setState({
			roamCitekeys: getCitekeyPages()
		});
	}
}
GraphWatcher.propTypes = {
	autocompleteSettings: PropTypes.object,
	libraries: PropTypes.arrayOf(customPropTypes.zoteroLibraryType),
	metadataSettings: PropTypes.object,
	dataRequests: PropTypes.array,
	portalId: PropTypes.string,
	renderInline: PropTypes.bool,
};

export default GraphWatcher;
