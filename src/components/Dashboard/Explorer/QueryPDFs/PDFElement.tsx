import { Button } from "@blueprintjs/core";

import ButtonLink from "Components/ButtonLink";
import DataDrawer from "Components/DataDrawer";
import { ListItem } from "Components/DataList";
import NotesDrawer from "Components/NotesDrawer";

import { useBool } from "@hooks";

import { pluralize } from "../../../../utils";

import { CustomClasses } from "../../../../constants";
import { ZCleanItemPDF } from "Types/transforms";

import "../_index.sass";


type OwnProps = {
	item: ZCleanItemPDF
};

function PDFElement({ item }: OwnProps){
	const [isDataDrawerOpen, { on: openDataDrawer, off: closeDataDrawer }] = useBool(false);
	const [isNotesDrawerOpen, { on: openNotesDrawer, off: closeNotesDrawer }] = useBool(false);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className={CustomClasses.TEXT_AUXILIARY} zr-role="item-title">{item.title}</span>
					{item.parent.key && <span className={CustomClasses.TEXT_ACCENT_1}>@{item.parent.key}</span>}
					<Button className={CustomClasses.TEXT_SMALL} icon="eye-open" minimal={true} onClick={openDataDrawer} title="Show the item's raw metadata" />
					{item.annotations.length > 0
						? <Button className={CustomClasses.TEXT_SMALL} icon="duplicate" minimal={true} text={pluralize(item.annotations.length, "linked note")} onClick={openNotesDrawer} />
						: null}
				</div>
				<ButtonLink className={CustomClasses.TEXT_SMALL} href={item.link} icon="paperclip">Open PDF</ButtonLink>
			</div>
		</ListItem>
		<DataDrawer item={item.raw} isOpen={isDataDrawerOpen} onClose={closeDataDrawer} />
		{item.annotations.length > 0 && <NotesDrawer notes={item.annotations} isOpen={isNotesDrawerOpen} onClose={closeNotesDrawer} />}
	</>;
}


export default PDFElement;