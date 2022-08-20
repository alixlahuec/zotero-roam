import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";
import { MultiInput, SingleInput } from "../common";

const PageMenuSettings = createContext({});

const PageMenuProvider = ({ children, init, updater }) => {
	const [pageMenu, _setPageMenu] = useState(init);

	const setPageMenu = useCallback((updateFn) => {
		_setPageMenu((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [pageMenu, setPageMenu], [pageMenu, setPageMenu]);

	return (
		<PageMenuSettings.Provider value={contextValue}>
			{children}
		</PageMenuSettings.Provider>
	);
};
PageMenuProvider.propTypes = {
	children: node,
	init: customPropTypes.pageMenuSettingsType,
	updater: func
};

const usePageMenuSettings = () => {
	const context = useContext(PageMenuSettings);

	return context;
};

const ELEM_OPTIONS = [
	{ label: "Metadata import", value: "addMetadata" }, 
	{ label: "Notes import", value: "importNotes" },
	{ label: "Item details", value: "viewItemInfo" },
	{ label: "Zotero link (local)", value: "openZoteroLocal" },
	{ label: "Zotero link (web)", value: "openZoteroWeb" },
	{ label: "PDF links", value: "pdfLinks" },
	{ label: "Scite Badge", value: "sciteBadge" },
	{ label: "Connected Papers link", value: "connectedPapers" },
	{ label: "Semantic Scholar link", value: "semanticScholar" },
	{ label: "Google Scholar link", value: "googleScholar" },
	{ label: "Citations & References", value: "citingPapers" }
];

const TRIGGER_OPTIONS = [
	{ label: "Default", value: "default" },
	{ label: "Always", value: true },
	{ label: "Never", value: false }
];

function PageMenuWidget(){
	const [
		{
			defaults,
			trigger
		},
		setOpts
	] = usePageMenuSettings();

	const handlers = useMemo(() => {
		function setOptValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateMenuElems: (val) => setOptValue("defaults", val),
			updateMenuTrigger: (val) => setOptValue("trigger", val)
		};
	}, [setOpts]);

	return <>
		<MultiInput description="Choose which elements to display in citekey page menus" options={ELEM_OPTIONS} setValue={handlers.updateMenuElems} title="Elements" value={defaults} />
		<SingleInput description="Select when contextual menus should be shown" menuTitle="Select whether to show the page menu" onChange={handlers.updateMenuTrigger} options={TRIGGER_OPTIONS} title="Show menus" value={trigger} />
	</>;
}

export {
	PageMenuProvider,
	PageMenuWidget,
	usePageMenuSettings
};