import { FC, memo, useCallback, useMemo } from "react";
import { Classes, Menu, MenuDivider, MenuItem, Tag, useHotkeys } from "@blueprintjs/core";

import DataDrawer from "Components/DataDrawer";
import { ErrorBoundary } from "Components/Errors";
import NotesDrawer from "Components/NotesDrawer";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";
import { formatItemReferenceWithDefault } from "Components/SearchPanel/helpers";
import ShortcutSequence from "Components/ShortcutSequence";
import { useAnnotationsSettings, useCopySettings, useMetadataSettings, useNotesSettings, useShortcutsSettings, useTypemapSettings } from "Components/UserSettings";

import { useBool } from "@hooks";
import { importItemMetadata, importItemNotes, openPageByUID } from "@services/roam";

import { CustomClasses } from "../../constants";
import { validateShortcuts } from "../../setup";
import { copyToClipboard, makeDateFromAgo } from "../../utils";

import { AsBoolean } from "Types/helpers";
import { ZCleanItemTop } from "Types/transforms";
import "./_index.sass";


type ItemCopyFormat = "citation" | "citekey" | "page-reference" | "tag";


const popoverProps = {
	popoverClassName: CustomClasses.POPOVER
};

/** Creates a formatted reference to an item */
const makeItemReference = (citekey: string, format: ItemCopyFormat, item: ZCleanItemTop) => {
	const pageRef = "[[@" + citekey + "]]";
	switch(format){
	case "page-reference":
		return pageRef;
	case "tag":
		return "#" + pageRef;
	case "citation":
		return "[" + item.authors + " (" + item.year + ")](" + pageRef + ")";
	case "citekey":
	default:
		return "@" + citekey;
	}
};


function CopyOption(props: CopyButtonsProps & { format: ItemCopyFormat }){
	const { citekey, format, item } = props;
	const [shortcuts] = useShortcutsSettings();
	// Only pass valid hotkey combos
	// TODO: move validation step upstream
	const sanitizedShortcuts = useMemo(() => validateShortcuts(shortcuts), [shortcuts]);

	const textOutput = useMemo(() => makeItemReference(citekey, format, item), [citekey, format, item]);
	const formatCitekey = useCallback(() => copyToClipboard(textOutput), [textOutput]);

	const label = useMemo(() => {
		const mapping = {
			"citation": {
				action: "copy as citation",
				command: "copyCitation"
			},
			"citekey": {
				action: "copy as citekey",
				command: "copyCitekey"
			},
			"page-reference": {
				action: "copy as page reference",
				command: "copyPageRef"
			},
			"tag": {
				action: "copy as tag",
				command: "copyTag"
			}
		};

		if(mapping[format]){
			const { action, command } = mapping[format];
			if(sanitizedShortcuts[command] !== ""){
				return <ShortcutSequence action={action} text={sanitizedShortcuts[command]} />;
			}
		}

		return null;

	}, [format, sanitizedShortcuts]);
  
	return <MenuItem htmlTitle={textOutput} labelElement={label} onClick={formatCitekey} text={textOutput} />;
}


type CopyButtonsProps = {
	citekey: string,
	item: ZCleanItemTop
};

function CopyButtons(props: CopyButtonsProps){
	const { citekey, item } = props;
	const [copySettings] = useCopySettings();
	const [shortcuts] = useShortcutsSettings();
	// Only pass valid hotkey combos
	// TODO: move validation step upstream
	const sanitizedShortcuts = useMemo(() => validateShortcuts(shortcuts), [shortcuts]);

	const defaultCopyText = useMemo(() => {
		return formatItemReferenceWithDefault(item, copySettings);
	}, [copySettings, item]);

	const copyAsDefault = useCallback(() => {
		copyToClipboard(defaultCopyText);
	}, [defaultCopyText]);

	const optionsMenu = useMemo(() => {
		let standardOptions: ItemCopyFormat[] = ["citation", "citekey", "page-reference", "tag"];

		if (copySettings.useAsDefault == "preset") {
			standardOptions = standardOptions.filter(op => op != copySettings.preset);
		}
		
		return <>
			<MenuItem htmlTitle={defaultCopyText} labelElement={<Tag intent="success" minimal={true}>Default</Tag>} onClick={copyAsDefault} text={defaultCopyText} />
			{standardOptions.map(op => <CopyOption key={op} citekey={citekey} format={op} item={item} />)}
		</>;
	}, [citekey, copyAsDefault, copySettings, defaultCopyText, item]);

	const label = useMemo(() => {
		const combo = sanitizedShortcuts.copyDefault || "";
		return (combo !== "")
			? <ShortcutSequence action="copy as default" text={combo} />
			: null;
	}, [sanitizedShortcuts]);

	const hotkeys = useMemo(() => {
		const defaultProps = {
			allowInInput: false,
			global: true,
			preventDefault: true,
			stopPropagation: true
		};

		const configs = {
			"copyDefault": {
				label: "Copy the item in view (default format)",
				onKeyDown: () => copyAsDefault()
			},
			"copyCitation": {
				label: "Copy the item in view (as citation)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "citation", item))
			},
			"copyCitekey": {
				label: "Copy the item in view (as citekey)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "citekey", item))
			},
			"copyPageRef": {
				label: "Copy the item in view (as page reference)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "page-reference", item))
			},
			"copyTag": {
				label: "Copy the item in view (as page reference)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "tag", item))
			}
		};

		return Object.keys(configs)
			.map(cmd => {
				const combo = sanitizedShortcuts[cmd] || "";
				if(combo !== ""){
					return {
						...defaultProps,
						...configs[cmd],
						combo
					};
				} else {
					return false;
				}
			}).filter(AsBoolean);

	}, [citekey, copyAsDefault, item, sanitizedShortcuts]);

	useHotkeys(hotkeys, { showDialogKeyCombo: "shift+Z+R" });

	return <MenuItem 	
		icon="clipboard"
		labelElement={label}
		multiline={true} 
		onClick={copyAsDefault} 
		popoverProps={popoverProps}
		text="Copy reference" >
		{optionsMenu}
	</MenuItem>;
}


type MetadataProps = {
	direction?: "col" | "row",
	label: string
}

const Metadata: FC<MetadataProps> = ({ direction = "row", label, children }) => {
	return <div zr-role={"metadata-" + direction}>
		<span className={CustomClasses.TEXT_AUXILIARY}>{label}</span>
		<div>{children}</div>
	</div>;
};


type ItemDetailsProps = {
	closeDialog: () => void,
	item: ZCleanItemTop
};

const ItemDetails = memo<ItemDetailsProps>(function ItemDetails({ closeDialog, item }) {
	const {
		abstract, 
		authors, 
		authorsFull, 
		authorsRoles,
		children, 
		createdByUser,
		inGraph, 
		key,
		publication,
		raw,
		tags, 
		title, 
		weblink, 
		year,
		zotero } = item;
	const [isNotesDrawerOpen, { toggle: toggleNotes, on: showNotes, off: closeNotes }] = useBool(false);
	const [isDataDrawerOpen, { on: showData, off: closeData }] = useBool(false);

	const [annotationsSettings] = useAnnotationsSettings();
	const [metadataSettings] = useMetadataSettings();
	const [notesSettings] = useNotesSettings();
	const [shortcuts] = useShortcutsSettings();
	// Only pass valid hotkey combos
	// TODO: move validation step upstream
	const sanitizedShortcuts = useMemo(() => validateShortcuts(shortcuts), [shortcuts]);
	const [typemap] = useTypemapSettings();

	const [, updateRoamCitekeys] = useRoamCitekeys();

	const importMetadata = useCallback(async() => {
		const { pdfs = [], notes = [] } = children;
		const outcome = await importItemMetadata({ item: item.raw, pdfs, notes }, inGraph, metadataSettings, typemap, notesSettings, annotationsSettings);
		if(outcome.success){
			updateRoamCitekeys();
		}
		return outcome;
	}, [annotationsSettings, children, inGraph, item.raw, metadataSettings, notesSettings, typemap, updateRoamCitekeys]);

	const importNotes = useCallback(async () => {
		const outcome = await importItemNotes({ item: item.raw, notes: children.notes }, inGraph, notesSettings, annotationsSettings);
		if(outcome.success){
			updateRoamCitekeys();
		}
		return outcome;
	}, [annotationsSettings, children.notes, inGraph, item, notesSettings, updateRoamCitekeys]);
	
	const navigateToPage = useCallback(() => {
		if(inGraph != false){
			openPageByUID(inGraph);
			closeDialog();
		}
	}, [closeDialog, inGraph]);

	const goToPageButton = useMemo(() => {
		const combo = sanitizedShortcuts.goToItemPage || "";
		const label = (combo !== "")
			? <ShortcutSequence action="go to the item's page" text={combo} />
			: null;
		return inGraph 
			? <MenuItem icon="arrow-right" labelElement={label} onClick={navigateToPage} text="Go to Roam page" />
			: null;
	}, [inGraph, navigateToPage, sanitizedShortcuts]);

	const importMetadataButton = useMemo(() => {
		const combo = sanitizedShortcuts.importMetadata || "";
		const label = (combo !== "")
			? <ShortcutSequence action="import the item's metadata" text={combo} />
			: null;
		return <MenuItem icon="add" labelElement={label} onClick={importMetadata} text="Import metadata" />;
	}, [importMetadata, sanitizedShortcuts]);

	const pdfs = useMemo(() => {
		if(children.pdfs.length == 0){
			return null;
		} else {
			const firstElem = children.pdfs[0];
			const libLoc = firstElem.library.type == "group" ? `groups/${firstElem.library.id}` : "library";
            
			return children.pdfs.map(p => {
				const pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
				return <MenuItem key={p.key} href={pdfHref} icon="paperclip" multiline={true} rel="noreferrer" target="_blank" text={p.data.filename || p.data.title} />;
			});
		}
	}, [children.pdfs]);

	const notes = useMemo(() => {
		if(children.notes.length == 0){
			return null;
		} else {
			const combo = sanitizedShortcuts.toggleNotes || "";
			const label = (combo !== "")
				? <ShortcutSequence action="toggle the notes panel" text={combo} />
				: null;
			return <>
				<MenuItem icon="highlight" labelElement={label} onClick={showNotes} text="Highlights & Notes" />
				<NotesDrawer isOpen={isNotesDrawerOpen} notes={children.notes} onClose={closeNotes} />
			</>;
		}
	}, [children.notes, closeNotes, isNotesDrawerOpen, sanitizedShortcuts, showNotes]);

	// * The data drawer here could show additional metadata (formatted ; PDFs ; notes)
	const rawData = useMemo(() => {
		return <>
			<MenuItem icon="eye-open" onClick={showData} text="View raw metadata" />
			<DataDrawer item={item.raw} isOpen={isDataDrawerOpen} onClose={closeData} />
		</>;
	}, [closeData, item.raw, isDataDrawerOpen, showData]);

	const hotkeys = useMemo(() => {
		const defaultProps = {
			allowInInput: false,
			global: true,
			preventDefault: true,
			stopPropagation: true
		};

		const configs = {
			"goToItemPage": {
				disabled: !inGraph,
				label: "Go to the item's Roam page",
				onKeyDown: () => navigateToPage()
			},
			"importMetadata": {
				label: "Import the item's metadata to Roam",
				onKeyDown: () => importMetadata()
			},
			"toggleNotes": {
				disabled: children.notes.length == 0,
				label: "Show the item's linked notes",
				onKeyDown: () => toggleNotes()
			}
		};

		return Object.keys(configs)
			.map(cmd => {
				const combo = sanitizedShortcuts[cmd] || "";
				if(combo !== ""){
					return {
						...defaultProps,
						...configs[cmd],
						combo
					};
				} else {
					return false;
				}
			}).filter(AsBoolean);

	}, [children.notes, importMetadata, inGraph, navigateToPage, sanitizedShortcuts, toggleNotes]);

	useHotkeys(hotkeys, { showDialogKeyCombo: "shift+Z+R" });

	return <div id="zr-item-details">
		<ErrorBoundary>
			<div zr-role="item-metadata">
				<div zr-role="item-metadata--header">
					<h5>{title}</h5>
					<span className={CustomClasses.TEXT_ACCENT_1}>{authors + " (" + year + ")"}</span>
					{publication
						? <span className={CustomClasses.TEXT_SECONDARY}>{publication}</span>
						: null}
					{weblink
						? <span zr-role="item-weblink" className={CustomClasses.TEXT_SECONDARY} >
							<a href={weblink.href} rel="noreferrer" target="_blank" >{weblink.title}</a>
						</span>
						: null}
				</div>
				<Metadata direction="col" label="Abstract">
					<p zr-role="item-abstract" className={[CustomClasses.TEXT_SMALL, Classes.RUNNING_TEXT].join(" ")}>
						{abstract}
					</p>
				</Metadata>
				<div zr-role="item-metadata--footer">
					<Metadata label="Added">
						<span className={CustomClasses.TEXT_SECONDARY}>
							{makeDateFromAgo(raw.data.dateAdded)}
						</span>
						{createdByUser
							? <span>by <b>{createdByUser}</b></span>
							: null}
					</Metadata>
					{authorsFull.length > 0
						? <Metadata label="Contributors">
							{authorsFull.map((aut, i) => <Tag key={i} className={CustomClasses.TEXT_SMALL} intent="primary" minimal={true}>{aut}{authorsRoles[i] == "author" ? "" : " (" + authorsRoles[i] + ")"}</Tag>)}
						</Metadata>
						: null}
					{tags.length > 0
						? <Metadata label="Tags">
							<div>
								{tags.map((tag, i) => <Tag key={i} className={CustomClasses.TEXT_SMALL} minimal={true}>#{tag}</Tag>)}
							</div>
						</Metadata>
						: null}
				</div>
			</div>
			<div zr-role="item-actions">
				<Menu className={CustomClasses.TEXT_SMALL} data-in-graph={inGraph.toString()} >
					{navigator.clipboard && <CopyButtons citekey={key} item={item} />}
					<MenuDivider className={CustomClasses.DIVIDER_MINIMAL} title="Actions" />
					{goToPageButton}
					{importMetadataButton}
					{children.notes.length > 0 && <MenuItem icon="chat" onClick={importNotes} text="Import notes" />}
					<MenuItem href={zotero.local} icon="application" rel="noreferrer" target="_blank" text="Open in Zotero" />
					<MenuItem href={zotero.web} icon="cloud" rel="noreferrer" target="_blank" text="Open in Zotero (web)" />
					{rawData}
					<MenuDivider className={CustomClasses.DIVIDER_MINIMAL} title="Linked Content" />
					{pdfs}
					{notes}
				</Menu>
			</div>
		</ErrorBoundary>
	</div>;
});

export default ItemDetails;
