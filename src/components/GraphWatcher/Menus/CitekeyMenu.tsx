import { memo, useCallback, useMemo, useState } from "react";
import { Button, ButtonGroup, Card, Classes, Collapse, IconName, Tag } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import ButtonLink from "Components/ButtonLink";
import CitekeyPopover from "Components/CitekeyPopover";
import { ErrorBoundary, ErrorCallout } from "Components/Errors";
import ItemDetails from "Components/ItemDetails";
import NotesImport from "Components/NotesImport";
import SciteBadge from "Components/SciteBadge";
import SemanticPanel from "../SemanticPanel";
import { useAnnotationsSettings, useMetadataSettings, useNotesSettings, usePageMenuSettings, useSciteSettings, useTypemapSettings } from "Components/UserSettings";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";

import { useSemantic } from "@clients/semantic";
import { useBool } from "@hooks";
import { findRoamPage, importItemMetadata } from "@services/roam";


import { cleanSemantic, compareItemsByYear } from "./helpers";
import { showClasses } from "../classes";
import { ShowPropertiesSemantic, ShowTypeSemantic } from "../types";
import { cleanLibraryItem, getLocalLink, getPDFLink, getWebLink, identifyChildren, parseDOI, pluralize } from "../../../utils";

import { CustomClasses } from "../../../constants";
import { SEnrichedItemInLibrary, ZCleanItemTop, ZItemAnnotation, ZItemNote, ZItemTop, ZLibraryContents } from "Types/transforms";


function BacklinksItem({ entry }: { entry: SEnrichedItemInLibrary}) {
	const { _type, inLibrary, inGraph } = entry;
	const { children: { pdfs, notes }, raw: item } = inLibrary;
	const { key, data, meta } = item;

	const pub_year = meta.parsedDate ? new Date(meta.parsedDate).getUTCFullYear() : "";
	const pub_type = _type == "cited" ? "reference" : "citation";

	const itemActions = useMemo(() => {
		return <CitekeyPopover 
			inGraph={inGraph} 
			item={item}
			notes={notes}
			pdfs={pdfs} />;
	}, [inGraph, item, notes, pdfs]);

	return (
		<li className="zr-backlink-item" 
			data-backlink-type={pub_type} 
			data-in-graph={(inGraph != false).toString()} 
			data-item-year={pub_year}
			data-key={"@" + key}
		>
			<div className="zr-backlink-item--year">{pub_year}</div>
			<div className="zr-backlink-item--info" data-item-type={data.itemType} >
				<span zr-role="item-authors" className={pub_type == "reference" ? CustomClasses.TEXT_ACCENT_1 : CustomClasses.TEXT_ACCENT_2}>{meta.creatorSummary || ""}</span>
				<span zr-role="item-publication" className={CustomClasses.TEXT_SECONDARY}>{data.publicationTitle || data.bookTitle || data.university || ""}</span>
				<span zr-role="item-title">{data.title}</span>
			</div>
			<div className="zr-backlink-item--state">
				{itemActions}
			</div>
		</li>
	);
}


type BacklinksProps = {
	isOpen: boolean,
	items: SEnrichedItemInLibrary[],
	origin: string
};

const Backlinks = memo<BacklinksProps>(function Backlinks(props) {
	const { isOpen, items = [], origin } = props;

	if(items.length == 0){
		return null;
	} else {
		const itemList = [...items];
		const sortedItems = itemList.sort((a,b) => compareItemsByYear(a.inLibrary.raw, b.inLibrary.raw));
		const references = sortedItems.filter(it => it._type == "cited");
		const citations = sortedItems.filter(it => it._type == "citing");

		const separator = <Tag className="zr-backlinks-divider--tag" fill={true} minimal={true} multiline={true}>{origin}</Tag>;

		return (
			<Collapse isOpen={isOpen} keepChildrenMounted={true}>
				<div className="zr-citekey-menu--backlinks" >
					{references.length > 0 
						? <ul className={Classes.LIST_UNSTYLED} zr-role="sublist" list-type="references">
							{references.map((ref) => <BacklinksItem key={`${ref.doi}`} entry={ref} />)}
						</ul> 
						: null}
					{(references.length > 0 && citations.length > 0)
						? separator
						: null}
					{citations.length > 0 
						? <ul className={Classes.LIST_UNSTYLED} zr-role="sublist" list-type="citations">
							{citations.map((cit) => <BacklinksItem key={`${cit.doi}`} entry={cit} />)}
						</ul> 
						: null}
				</div>
			</Collapse>
		);
	}
});


type RelatedItemsBarProps = {
	doi: string,
	itemList: ZLibraryContents,
	origin: string,
	title: string
};

function RelatedItemsBar(props: RelatedItemsBarProps) {
	const { doi, itemList, origin, title } = props;
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();
	const { isLoading, isError, data, error } = useSemantic(doi);
	
	const [isBacklinksListOpen, { toggle: toggleBacklinks }] = useBool(false);
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);
	const [isShowing, setShowing] = useState<ShowPropertiesSemantic>({ title, type: ShowTypeSemantic.REFERENCES });

	const showReferences = useCallback(() => {
		setShowing({
			title,
			type: ShowTypeSemantic.REFERENCES
		});
		openDialog();
	}, [title, openDialog]);

	const showCitations = useCallback(() => {
		setShowing({
			title,
			type: ShowTypeSemantic.CITATIONS
		});
		openDialog();
	}, [title, openDialog]);

	const refCount = (data || {}).references?.length || 0;
	const citCount = (data || {}).citations?.length || 0;

	const cleanSemanticData = useMemo(() => {
		if(!data){
			return {
				backlinks: [],
				citations: [],
				references: []
			};
		} else {
			const { citations, references } = data;
			return cleanSemantic(itemList, { citations, references }, roamCitekeys);
		}
	}, [data, itemList, roamCitekeys]);

	const showBacklinksButtonProps = useMemo(() => {
		return cleanSemanticData.backlinks.length == 0
			? {
				"aria-disabled": true,
				disabled: true,
				icon: null,
				text: "No related library items"
			}
			: {
				icon: (isBacklinksListOpen ? "caret-down" : "caret-right") as IconName,
				text: pluralize(cleanSemanticData.backlinks.length, "related library item")
			};
	}, [cleanSemanticData.backlinks.length, isBacklinksListOpen]);

	return (
		<div className="zotero-roam-page-menu-citations">
			{isError
				? <ErrorCallout error={error} />
				:
				<>
					<ButtonGroup minimal={true} fill={true} role="menubar">
						<Button aria-disabled={refCount == 0} disabled={refCount == 0} className={ showClasses.references } loading={isLoading} minimal={true} onClick={showReferences} icon="citation" intent="primary" role="menuitem" aria-haspopup="dialog" aria-label="Show references" title="Show references" >{ pluralize(refCount, "reference") }</Button>
						<Button aria-disabled={citCount == 0} disabled={citCount == 0} className={ showClasses.citations } loading={isLoading} minimal={true} onClick={showCitations} icon="chat" intent="warning" role="menuitem" aria-haspopup="dialog" title="Show citations" >{ pluralize(citCount, "citation") }</Button>
						<Button className={ showClasses.backlinks } loading={isLoading} minimal={true} onClick={toggleBacklinks} {...showBacklinksButtonProps} role="menuitem" title="Show backlinks" />
					</ButtonGroup>
					{refCount + citCount > 0
						? <SemanticPanel
							isOpen={isDialogOpen} 
							items={cleanSemanticData}
							onClose={closeDialog}
							show={isShowing} />
						: null}
					<Backlinks isOpen={isBacklinksListOpen} items={cleanSemanticData.backlinks} origin={origin} />
				</>
			}
		</div>
	);
}


function ViewItem({ item }: { item: ZCleanItemTop}) {
	const [isPanelOpen, { on: openPanel, off: closePanel }] = useBool(false);

	return (
		<>
			<Button icon="info-sign" onClick={openPanel} role="menuitem" aria-haspopup="dialog" >View item information</Button>
			<AuxiliaryDialog
				className="view-item-information"
				isOpen={isPanelOpen}
				onClose={closePanel}>
				<ItemDetails
					closeDialog={closePanel}
					item={item}
				/>
			</AuxiliaryDialog>
		</>
	);
}


type ViewNotesProps = {
	item: ZItemTop,
	notes: (ZItemAnnotation | ZItemNote)[],
	pageUID: string | false
};

function ViewNotes({ item, notes, pageUID }: ViewNotesProps){
	const [isPanelOpen, { on: openPanel, off: closePanel }] = useBool(false);

	return <>
		<Button icon="comment" onClick={openPanel} role="menuitem" aria-haspopup="dialog" >Import notes</Button>
		<AuxiliaryDialog
			className="import-item-notes"
			isOpen={isPanelOpen}
			label="Import notes"
			onClose={closePanel} >
			<NotesImport closeDialog={closePanel} item={item} notes={notes} pageUID={pageUID} />
		</AuxiliaryDialog>
	</>;
}


type CitekeyMenuProps = {
	item: ZItemTop,
	itemList: ZLibraryContents
};

const CitekeyMenu = memo<CitekeyMenuProps>(function CitekeyMenu({ item, itemList }) {
	const [annotationsSettings] = useAnnotationsSettings();
	const [metadataSettings] = useMetadataSettings();
	const [notesSettings] = useNotesSettings();
	const [{ defaults }] = usePageMenuSettings();
	const [sciteBadgeSettings] = useSciteSettings();
	const [typemap] = useTypemapSettings();
	
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();

	const doi = parseDOI(item.data.DOI);
	const pageUID = findRoamPage("@" + item.key);

	const children = useMemo(() => {
		const itemKey = item.data.key;
		const location = item.library.type + "s/" + item.library.id;
		const { pdfs, notes } = itemList;

		return identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });
	}, [itemList, item]);

	const doiHeader = useMemo(() => {
		return doi 
			? <span className="zr-citekey-doi" data-doi={doi}><a href={"https://doi.org/" + doi} target="_blank" rel="noreferrer">{doi}</a></span> 
			: null;
	}, [doi]);

	const importMetadata = useCallback(async() => {
		const { pdfs, notes } = children;
		return await importItemMetadata({ item, pdfs, notes }, pageUID, metadataSettings, typemap, notesSettings, annotationsSettings);
	}, [annotationsSettings, children, item, metadataSettings, notesSettings, pageUID, typemap]);

	const pdfLinks = useMemo(() => {
		if(children.pdfs.length == 0 || !defaults.includes("pdfLinks")) {
			return null;
		} else {
			return (
				children.pdfs.map(pdf => {
					return (
						<ButtonLink zr-role="pdf-link" key={pdf.key}
							alignText="left"
							href={getPDFLink(pdf, "href")}
							icon="paperclip"
							intent="none"
							minimal={true}
							role="menuitem"
							text={pdf.data.filename || pdf.data.title} />
					);
				})
			);
		}
	}, [defaults, children.pdfs]);

	const notesButton = useMemo(() => {
		if(children.notes.length == 0 || !defaults.includes("importNotes")){
			return null;
		} else {
			return <ViewNotes item={item} notes={children.notes} pageUID={pageUID} />;
		}
	}, [defaults, children.notes, item, pageUID]);
    
	const open_zotero = useMemo(() => {
		return (
			<>
				{defaults.includes("openZoteroLocal")
					? <ButtonLink icon="application" intent="none" text="Open in Zotero" href={getLocalLink(item, { format: "target" })} role="menuitem" />
					: null}
				{defaults.includes("openZoteroWeb")
					? <ButtonLink icon="cloud" intent="none" text="Open in Zotero [Web library]" href={getWebLink(item, { format: "target" })} role="menuitem" />
					: null}
			</>
		);
	},[defaults, item]);

	const sciteBadge = useMemo(() => {
		return doi && defaults.includes("sciteBadge") ? <SciteBadge doi={doi} {...sciteBadgeSettings} /> : null;
	}, [defaults, doi, sciteBadgeSettings]);

	const ext_links = useMemo(() => {
		const connectedPapersLink = defaults.includes("connectedPapers")
			? <ButtonLink icon="layout" intent="primary" text="Connected Papers" href={"https://www.connectedpapers.com/" + (doi ? "api/redirect/doi/" + doi : "search?q=" + encodeURIComponent(item.data.title)) } role="menuitem" />
			: null;
		const semanticLink = doi && defaults.includes("semanticScholar") 
			? <ButtonLink icon="bookmark" intent="primary" text="Semantic Scholar" href={"https://api.semanticscholar.org/" + doi} role="menuitem" /> 
			: null;
		const googleScholarLink = defaults.includes("googleScholar")
			? <ButtonLink icon="learning" intent="primary" text="Google Scholar" href={"https://scholar.google.com/scholar?q=" + (doi || encodeURIComponent(item.data.title))} role="menuitem" />
			: null;

		return (
			<>
				{connectedPapersLink}
				{semanticLink}
				{googleScholarLink}
			</>
		);
	}, [defaults, doi, item.data.title]);
    
	const relatedBar = useMemo(() => {
		return doi && defaults.includes("citingPapers")
			? <RelatedItemsBar doi={doi}
				itemList={itemList}
				origin={item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear().toString() : ""} 
				title={"@" + item.key}
			/>
			: null;
	}, [defaults, doi, item.key, item.meta.parsedDate, itemList]);

	const clean_item = useMemo(() => {
		return cleanLibraryItem(item, children.pdfs, children.notes, roamCitekeys);
	}, [children, item, roamCitekeys]);

	return (
		<ErrorBoundary>
			{doiHeader}
			<Card elevation={0} className="zr-citekey-menu">
				<div className="zr-citekey-menu--header">
					<ButtonGroup className="zr-citekey-menu--actions" minimal={true} role="menubar">
						{defaults.includes("addMetadata")
							? <Button icon="add" onClick={importMetadata} role="menuitem" >Add metadata</Button>
							: null}
						{notesButton}
						{defaults.includes("viewItemInfo")
							? <ViewItem item={clean_item} />
							: null}
						{open_zotero}
						{pdfLinks}
						{ext_links}
					</ButtonGroup>
					{sciteBadge}
				</div>
				{relatedBar}
			</Card>
		</ErrorBoundary>
	);
});


export default CitekeyMenu;
export { Backlinks };
