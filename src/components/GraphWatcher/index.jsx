import React, { PureComponent } from "react";

import Autocomplete from "../Autocomplete";
import InlineCitekeys from "./InlineCitekeys";
import { CitekeyMenuFactory, DNPMenuFactory, TagMenuFactory } from "./Menus";
import { UserSettings } from "../App";

import { addPageMenus, findPageMenus } from "./Menus/utils";
import { addWebimportDivs, findWebimportDivs } from "./WebImport/utils";
import { hasNodeListChanged } from "../../utils";
import { menuPrefix, webimportClass } from "./classes";
import "./index.css";
import WebImportFactory from "./WebImport";

class GraphWatcher extends PureComponent {
	constructor(props){
		super(props);
		this.state = {
			citekeyMenus: [],
			dnpMenus: [],
			tagMenus: [],
			webimportDivs: []
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
				addWebimportDivs(this.context.webimport.tags);

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
		Array.from(document.querySelectorAll(`[class=${webimportClass}]`)).forEach(div => div.remove());
	}

	render() {
		let { citekeyMenus, dnpMenus, tagMenus, webimportDivs } = this.state;
		let { autocomplete: autocompleteSettings } = this.context;
        
		return <>
			{citekeyMenus ? <CitekeyMenuFactory menus={citekeyMenus} /> : null}
			{dnpMenus ? <DNPMenuFactory menus={dnpMenus} /> : null}
			{tagMenus ? <TagMenuFactory menus={tagMenus} /> : null}
			{autocompleteSettings.trigger ? <Autocomplete /> : null}
			<WebImportFactory divs={webimportDivs} />
			<InlineCitekeys />
		</>;
	}

	updatePageElements(){
		// TODO: Add other page elems (explo, etc)
		this.setState((prevState) => {
			let update = {};

			// Page menus
			const currentMenus = findPageMenus();
			for(let key of Object.keys(currentMenus)){
				if(hasNodeListChanged(prevState[key], currentMenus[key])){
					update[key] = currentMenus[key];
				}
			}

			// Webimport divs
			const currentDivs = findWebimportDivs();
			if(hasNodeListChanged(prevState.webimportDivs, currentDivs)){
				update.webimportDivs = currentDivs;
			}

			if(JSON.stringify(update) === "{}"){
				return null;
			} else {
				return update;
			}
		});
	}
}
GraphWatcher.contextType = UserSettings;

export default GraphWatcher;
