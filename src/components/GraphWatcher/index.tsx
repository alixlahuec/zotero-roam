/* istanbul ignore file */
import { memo, useCallback, useEffect, useRef, useState } from "react";

import Autocomplete from "Components/Autocomplete";
import { useAutocompleteSettings, useWebImportSettings } from "Components/UserSettings";
import InlineCitekeys from "./InlineCitekeys";
import { CitekeyMenuFactory, DNPMenuFactory, TagMenuFactory } from "./Menus";
import WebImportFactory from "./WebImport";

import { hasNodeListChanged } from "./helpers";
import { addPageMenus, findPageMenus } from "./Menus/utils";
import { findWebimportDivs, setWebimportDivs } from "./WebImport/helpers";
import { menuPrefix, webimportClass } from "./classes";


const GraphWatcher = memo(function GraphWatcher(){
	// From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
	// https://jasonwatmore.com/post/2021/08/27/react-how-to-check-if-a-component-is-mounted-or-unmounted
	const mounted = useRef(false);
	const [{ citekeyMenus, dnpMenus, tagMenus }, setMenus] = useState<{
		citekeyMenus: Element[],
		dnpMenus: Element[],
		tagMenus: Element[]
	}>({ citekeyMenus: [], dnpMenus: [], tagMenus: [] });
	const [webimports, setWebimports] = useState<ArrayLike<Element>>([]);
	const [{ trigger }] = useAutocompleteSettings();
	const [{ tags }] = useWebImportSettings();

	const updatePageElements = useCallback(() => {
		// Page menus
		setMenus((prevState) => {
			const update = {};

			const currentMenus = findPageMenus();
			for(const key of Object.keys(currentMenus)){
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
		setWebimports((prevState) => {
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
				setWebimportDivs(tags);

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
		<WebImportFactory divs={webimports} />
		<InlineCitekeys />
	</>;
});

export default GraphWatcher;
