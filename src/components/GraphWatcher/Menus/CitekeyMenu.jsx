import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Callout, Card, Classes, Collapse, Tag } from "@blueprintjs/core";

import AuxiliaryDialog from "../AuxiliaryDialog";
import ButtonLink from "../../ButtonLink";
import SciteBadge from "../../SciteBadge";
import { useQuery_Semantic } from "../../../queries";
import { cleanSemantic, compareItemsByYear, getLocalLink, getWebLink, parseDOI, pluralize } from "../../../utils";
import { showClasses } from "../classes";

function BacklinksItem(props) {
	const { _type, inLibrary: item, inGraph } = props.entry;
	const { key, data, meta } = item;
	const pub_year = meta.parsedDate ? new Date(meta.parsedDate).getUTCFullYear() : "";
	const pub_type = _type == "cited" ? "reference" : "citation";

	const itemActions = useMemo(() => {
		if(!inGraph){
			return (
				<Button className="zr-text-small"
					minimal={true}
					icon="plus"
					aria-label={"Add & open @" + key + " in the sidebar"}
				>
					{"@" + key}
				</Button>
			);
		} else {
			return (
				<Button className="zr-text-small"
					minimal={true}
					icon="inheritance"
					intent={pub_type == "reference" ? "primary" : "warning"}
					aria-label={"Open @" + key + " in the sidebar"}
				/>
			);
		}
	}, [inGraph, pub_type, key]);

	return (
		<li className="zr-backlink-item" 
			data-backlink-type={pub_type} 
			data-key={"@" + key} 
			data-item-type={data.itemType} 
			data-item-year={pub_year}
		>
			<div className="zr-backlink-item--year">{pub_year}</div>
			<div className="zr-backlink-item--info">
				<span zr-role="item-authors" className={["zotero-roam-search-item-authors", pub_type == "reference" ? "zr-highlight" : "zr-highlight-2"].join(" ")}>{meta.creatorSummary || ""}</span>
				<span zr-role="item-publication" className="zr-secondary">{data.publicationTitle || data.bookTitle || data.university || ""}</span>
				<span zr-role="item-title" className="zotero-roam-search-item-title">{data.title}</span>
			</div>
			<div className="zr-backlink-item--state">
				{itemActions}
			</div>
		</li>
	);
}
BacklinksItem.propTypes = {
	entry: PropTypes.object
};

const Backlinks = React.memo(function Backlinks(props) {
	const { items, origin, isOpen } = props;

	if(items.length == 0){
		return null;
	} else {
		let [...itemList] = items;
		const sortedItems = itemList.sort((a,b) => compareItemsByYear(a.inLibrary, b.inLibrary));
		const references = sortedItems.filter(it => it._type == "cited");
		const citations = sortedItems.filter(it => it._type == "citing");

		const refList = references.length > 0 
			? <ul className={Classes.LIST_UNSTYLED} zr-role="sublist" list-type="references">
				{references.map((ref) => <BacklinksItem key={ref.doi} entry={ref} />)}
			</ul> 
			: null;
		const citList = citations.length > 0 
			? <ul className={Classes.LIST_UNSTYLED} zr-role="sublist" list-type="citations">
				{citations.map((cit) => <BacklinksItem key={cit.doi} entry={cit} />)}
			</ul> 
			: null;
		const separator = <span className="backlinks-list_divider"><Tag minimal={true} multiline={true}>{origin}</Tag><hr /></span>;

		return (
			<Collapse isOpen={isOpen} keepChildrenMounted={true}>
				<ul className={[ Classes.LIST_UNSTYLED, "zr-citekey-menu--backlinks"].join(" ")}>
					{refList}
					{separator}
					{citList}
				</ul>
			</Collapse>
		);
	}
});
Backlinks.propTypes = {
	items: PropTypes.array,
	origin: PropTypes.string,
	isOpen: PropTypes.bool
};

function RelatedItemsBar(props) {
	const { doi, title, origin, items, portalId, roamCitekeys } = props;
	const { isLoading, isError, data = {}, error } = useQuery_Semantic(doi);
	
	const [isBacklinksListOpen, setBacklinksListOpen] = useState(false);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isShowing, setShowing] = useState({title, type: "is_reference"});

	const toggleBacklinks = useCallback(() => {
		setBacklinksListOpen(!isBacklinksListOpen);
	}, [isBacklinksListOpen]);

	const openDialog = useCallback(() => {
		setDialogOpen(true);
	}, []);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
	}, []);

	const showReferences = useCallback(() => {
		setShowing({
			title,
			type: "is_reference"
		});
		openDialog();
	}, [title, openDialog]);

	const showCitations = useCallback(() => {
		setShowing({
			title,
			type: "is_citation"
		});
		openDialog();
	}, [title, openDialog]);

	// Only select items with valid DOIs to reduce dataset size
	const itemsWithDOIs = useMemo(() => items.filter(it => parseDOI(it.data.DOI)), [items]);

	const refCount = data.references?.length || null;
	const citCount = data.citations?.length || null;

	const cleanSemanticData = useMemo(() => {
		let { citations = [], references = [] } = data;
		return cleanSemantic(itemsWithDOIs, { citations, references }, roamCitekeys);
	}, [data, itemsWithDOIs, roamCitekeys]);

	const showBacklinksButtonProps = useMemo(() => {
		return cleanSemanticData.backlinks.length == 0
			? {
				disabled: true,
				icon: null,
				text: "No related library items"
			}
			: {
				icon: isBacklinksListOpen ? "caret-down" : "caret-right",
				text: pluralize(cleanSemanticData.backlinks.length, "related library item")
			};
	}, [cleanSemanticData.backlinks.length, isBacklinksListOpen]);

	return (
		<div className="zotero-roam-page-menu-citations">
			{isError
				? <Callout intent="danger">
                Citations and references could not be retrieved from SemanticScholar :
					{error}
				</Callout>
				:
				<>
					<ButtonGroup minimal={true} fill={true}>
						<Button className={ showClasses.references } loading={isLoading} onClick={showReferences} icon="citation" intent="primary">{ pluralize(refCount, "reference") }</Button>
						<Button className={ showClasses.citations } loading={isLoading} onClick={showCitations} icon="chat" intent="warning" >{ pluralize(citCount, "citation") }</Button>
						<Button className={ showClasses.backlinks } loading={isLoading} onClick={toggleBacklinks} {...showBacklinksButtonProps} ></Button>
					</ButtonGroup>
					{refCount + citCount > 0
						? <AuxiliaryDialog className="citations" 
							ariaLabelledBy={"zr-aux-dialog--" + title}
							show={isShowing} 
							items={cleanSemanticData}
							isOpen={isDialogOpen} 
							portalId={portalId}
							onClose={closeDialog} />
						: null}
					<Backlinks items={cleanSemanticData.backlinks} origin={origin} isOpen={isBacklinksListOpen} />
				</>
			}
		</div>
	);
}
RelatedItemsBar.propTypes = {
	doi: PropTypes.string,
	title: PropTypes.string,
	origin: PropTypes.string,
	items: PropTypes.array,
	portalId: PropTypes.string,
	roamCitekeys: PropTypes.instanceOf(Map)
};

const CitekeyMenu = React.memo(function CitekeyMenu(props) {
	const { item, itemList, portalId, roamCitekeys } = props;
	const { items, pdfs, notes } = itemList;

	const doi = parseDOI(item.data.DOI);
	const has_pdfs = pdfs.filter(pdf => pdf.data.parentItem == item.data.key && pdf.library.id == item.library.id);
	const has_notes = notes.filter(note => note.data.parentItem == item.data.key && note.library.id == item.library.id);

	const doiHeader = useMemo(() => {
		return doi 
			? <span className="zr-citekey-doi" data-doi={doi}><a href={"https://doi.org/" + doi} target="_blank" className={Classes.TEXT_MUTED} rel="noreferrer">{doi}</a></span> 
			: null;
	}, [doi]);
    
	const importNotes = has_notes ? <Button icon="comment">Import notes</Button> : null;
	const pdfLinks = useMemo(() => {
		if(has_pdfs.length == 0) {
			return null;
		} else {
			return (
				has_pdfs.map(pdf => {
					let location = pdf.library.type == "group" ? `groups/${pdf.library.id}` : "library";
					let href = (["linked_file", "imported_file", "imported_url"].includes(pdf.data.linkMode)) ? `zotero://open-pdf/${location}/items/${pdf.data.key}` : pdf.data.url;
					return (
						<ButtonLink zr-role="pdf-link" key={pdf.key}
							href={href}
							icon="paperclip"
							minimal={true}
							text={pdf.data.filename || pdf.data.title} />
					);
				})
			);
		}
	}, [has_pdfs]);
    
	const open_zotero = useMemo(() => {
		return (
			<>
				<ButtonLink icon="application" text="Open in Zotero" href={getLocalLink(item, { format: "target" })} />
				<ButtonLink icon="cloud" text="Open in Zotero [Web library]" href={getWebLink(item, { format: "target" })} />
			</>
		);
	},[item]);

	const sciteBadge = useMemo(() => {
		return doi ? <SciteBadge doi={doi} /> : null;
	}, [doi]);

	const ext_links = useMemo(() => {
		let connectedPapersLink = <ButtonLink icon="layout" text="Connected Papers" href={"https://www.connectedpapers.com/" + (doi ? "api/redirect/doi/" + doi : "search?q=" + encodeURIComponent(item.data.title)) } />;
		let semanticLink = doi ? <ButtonLink icon="bookmark" text="Semantic Scholar" href={"https://api.semanticscholar.org/" + doi} /> : null;
		let googleScholarLink = <ButtonLink icon="learning" text="Google Scholar" href={"https://scholar.google.com/scholar?q=" + (doi || encodeURIComponent(item.data.title))} />;

		return (
			<>
				{connectedPapersLink}
				{semanticLink}
				{googleScholarLink}
			</>
		);
	}, [doi, item.data.title]);
    
	const relatedBar = useMemo(() => {
		return doi
			? <RelatedItemsBar doi={doi}
				title={"@" + item.key}
				origin={item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear() : ""} 
				items={items}
				portalId={portalId}
				roamCitekeys={roamCitekeys}
			/>
			: null;
	}, [doi, item.key, item.meta.parsedDate, items, portalId, roamCitekeys]);

	return (
		<>
			{doiHeader}
			<Card elevation={0} className="zr-citekey-menu">
				<div className="zr-citekey-menu--header">
					<ButtonGroup className="zr-citekey-menu--actions" minimal={true}>
						<Button icon="add">Add metadata</Button>
						{importNotes}
						<Button icon="info-sign">View item information</Button>
						{open_zotero}
						{pdfLinks}
						{ext_links}
					</ButtonGroup>
					{sciteBadge}
				</div>
				{relatedBar}
			</Card>
		</>
	);
});
CitekeyMenu.propTypes = {
	item: PropTypes.object,
	itemList: PropTypes.array,
	portalId: PropTypes.string,
	roamCitekeys: PropTypes.instanceOf(Map)
};

export default CitekeyMenu;
