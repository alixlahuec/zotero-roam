import React, { useContext } from "react";
import { Classes, H3, H4 } from "@blueprintjs/core";

import Toggle from "./Toggle";
import { UserSettings } from "../../App";

const pairings = {
	"addMetadata": "Import metadata", 
	"importNotes": "Add notes", 
	"viewItemInfo": "View item information", 
	"openZoteroLocal": "Zotero link (local)", 
	"openZoteroWeb": "Zotero link (web)", 
	"pdfLinks": "PDF links", 
	"sciteBadge": "Scite badge", 
	"connectedPapers": "Link to Connected Papers", 
	"semanticScholar": "Link to Semantic Scholar", 
	"googleScholar": "Link to Google Scholar", 
	"citingPapers": "Related items"
};


function PageMenuSettings(){
	const { pageMenu: { defaults, trigger } } = useContext(UserSettings);

	return <>
		<H3>Page menu</H3>
		{trigger.constructor === Boolean
			? <Toggle label="Show page menus" value={trigger} />
			: <>
				<H4>Trigger</H4>
				<pre className={Classes.CODE_BLOCK}>{trigger.toString()}</pre>
			</>}
		{Object.keys(pairings).map(elem => <Toggle key={elem} isChecked={defaults.includes(elem)} label={pairings[elem]} />)}
	</>;
}

export default PageMenuSettings;