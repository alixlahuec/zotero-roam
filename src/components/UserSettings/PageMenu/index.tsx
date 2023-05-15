import { useMemo } from "react";
import { InputMultiSelect } from "Components/Inputs";
import { RowCol, SingleInput, SettingsManager } from "Components/UserSettings";


const { Provider: PageMenuProvider, useSettings: usePageMenuSettings } = new SettingsManager<"pageMenu">();

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
		<RowCol title="Elements" >
			<InputMultiSelect fill={true} openOnKeyDown={false} options={ELEM_OPTIONS} setValue={handlers.updateMenuElems} value={defaults} />
		</RowCol>
		<SingleInput description="Select when contextual menus should be shown. By default, menus are displayed if the page title is longer than 5 characters." menuTitle="Select whether to show the page menu" onSelect={handlers.updateMenuTrigger} options={TRIGGER_OPTIONS} title="Show menus" value={trigger} />
	</>;
}

export {
	PageMenuProvider,
	PageMenuWidget,
	usePageMenuSettings
};