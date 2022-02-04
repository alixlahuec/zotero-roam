import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

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

const GraphWatcher = React.memo(function GraphWatcher(){
	// From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
	// https://jasonwatmore.com/post/2021/08/27/react-how-to-check-if-a-component-is-mounted-or-unmounted
	const mounted = useRef(false);
	const [{ citekeyMenus, dnpMenus, tagMenus }, setMenus] = useState({ citekeyMenus: [], dnpMenus: [], tagMenus: []});
	const [webimportDivs, setWebimportDivs] = useState([]);
	const { autocomplete: { trigger }, webimport: { tags }} = useContext(UserSettings);

	const updatePageElements = useCallback(() => {
		// Page menus
		setMenus((prevState) => {
			let update = {};

			const currentMenus = findPageMenus();
			for(let key of Object.keys(currentMenus)){
				if(hasNodeListChanged(prevState[key], currentMenus[key])){
					update[key] = currentMenus[key];
				}
			}

			if(JSON.stringify(update) === "{}"){
				return prevState;
			} else {
				return {
					...prevState,
					...update
				};
			}
		});

		// Webimport divs
		setWebimportDivs((prevState) => {
			const currentDivs = findWebimportDivs();
			if(hasNodeListChanged(prevState, currentDivs)){
				return currentDivs;
			} else {
				return prevState;
			}
		});
	}, []);

	useEffect(() => {
		mounted.current = true;
		// The watcher adds empty <div>s to relevant page elements
		// The contents of the <div>s will be managed by rendering portals
		const watcher = setInterval(
			() => {
				addPageMenus();
				addWebimportDivs(tags);

				if(mounted.current){
					updatePageElements();
				}
			},
			1000
		);

		return () => {
			mounted.current = false;
			clearInterval(watcher);
			Array.from(document.querySelectorAll(`[class*=${menuPrefix}]`)).forEach(div => div.remove());
			Array.from(document.querySelectorAll(`[class=${webimportClass}]`)).forEach(div => div.remove());
		};
	}, [updatePageElements, tags]);

	return <>
		{citekeyMenus ? <CitekeyMenuFactory menus={citekeyMenus} /> : null}
		{dnpMenus ? <DNPMenuFactory menus={dnpMenus} /> : null}
		{tagMenus ? <TagMenuFactory menus={tagMenus} /> : null}
		{trigger ? <Autocomplete /> : null}
		<WebImportFactory divs={webimportDivs} />
		<InlineCitekeys />
	</>;
});

export default GraphWatcher;
