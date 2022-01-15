import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Callout, Card, Classes, Collapse, Tag } from "@blueprintjs/core";

import { getLocalLink, getWebLink, parseDOI, pluralize, readDNP, sortItemsByYear } from "../../../utils";
import { queryItems, querySemantic } from "../../../queries";
import ButtonLink from "../../ButtonLink";
import SciteBadge from "../../SciteBadge";
import AuxiliaryDialog from "../../AuxiliaryDialog";
import "./index.css";
import { menuPrefix, menuClasses, showClasses } from "../classes";

const addPageMenus = () => {
	let newPages = Array.from(document.querySelectorAll("h1.rm-title-display"))
		.filter(page => !(page.parentElement.querySelector(`[class*=${menuPrefix}]`)));
	for(const page of newPages) {
		let title = page.querySelector("span") ? page.querySelector("span").innerText : page.innerText;
		// DEP: page menu trigger setting
		// TODO: add Roam page UIDs as data-uid below
		let menu = document.createElement("div");
		menu.setAttribute("data-title", title);
		// Case 1 (ref-citekey) : on-page menu
		if(title.startsWith("@")){
			menu.classList.add(menuClasses.citekey);
			menu.setAttribute("data-citekey", title.slice(1));
		} else if(title.match(/(.+) ([0-9]+).{2}, ([0-9]{4})/g)) {
			// Case 2 (DNP) : "XX items added"
			let dnp_date = readDNP(title, { as_date: false });
			menu.classList.add(menuClasses.dnp);
			menu.setAttribute("data-dnp-date", JSON.stringify(dnp_date));
		} else {
			// Case 3 (all other pages) : "XX abstracts", "YY tagged items"
			menu.classList.add(menuClasses.tag);
		}

		page.insertAdjacentElement("afterend", menu);
	}
};

const findPageMenus = () => {
	return {
		citekeyMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.citekey}]`)),
		dnpMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.dnp}]`)),
		tagMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.tag}]`))
	};
};

/** Matches citation data obtained from Semantic Scholar against Zotero items, to identify in-library backlinks
 * @param {ZoteroItem[]|Object[]} datastore - The list of Zotero items to match against 
 * @param {{citations: Object[], references: Object[]}} semantic - The Semantic Scholar citation data to scan 
 * @returns {ZoteroItem[]|Object[]} The list of items present in both datasets, if any
 */
function findBacklinks(datastore, semantic){
	// Note: DOIs from the Semantic Scholar queries are sanitized at fetch
	let citedDOIs = semantic.references.map(ref => { return { _doi: ref.doi, _type: "cited" }; });
	let citingDOIs = semantic.citations.map(cit => { return { _doi: cit.doi, _type: "citing" }; });

	return [...citedDOIs, ...citingDOIs]
		.map(elem => {
			let found = datastore.find(it => parseDOI(it.data.DOI) == elem._doi);
			if(found){
				return {...elem, ...found};
			} else {
				return false;
			}
		})
		.filter(Boolean);
}

function BacklinksItem(props) {
	const { _doi, _type, ...item } = props.entry;
	const { key, data, meta } = item;
	const pub_year = meta.parsedDate ? new Date(meta.parsedDate).getUTCFullYear() : "";
	const pub_type = _type == "cited" ? "reference" : "citation";

	return (
		<li className="zr-backlink-item" 
			data-backlink-type={pub_type} 
			data-key={"@" + key} 
			data-item-type={data.itemType} 
			data-item-year={pub_year}
		>
			<div className="zr-backlink-item--year">{pub_year}</div>
			<div className="zr-backlink-item--info">
				<span zr-role="item-authors" className="zotero-roam-search-item-authors zr-highlight">{meta.creatorSummary || ""}</span>
				<span zr-role="item-publication" className="zr-secondary">{data.publicationTitle || data.bookTitle || data.university || ""}</span>
				<span zr-role="item-title" className="zotero-roam-search-item-title">{data.title}</span>
			</div>
			<div className="zr-backlink-item--state">
				<Button className="zr-text-small"
					minimal={true}
					icon="plus"
					aria-label={"Add & open @" + key + " in the sidebar"}
				>
					{"@" + key}
				</Button>
			</div>
		</li>
	);
}
BacklinksItem.propTypes = {
	entry: PropTypes.shape({
		_doi: PropTypes.string,
		_type: PropTypes.oneOf(["cited", "citing"])
	})
};

const Backlinks = React.memo(function Backlinks(props) {
	const { items, origin, isOpen } = props;

	if(items.length == 0){
		return null;
	} else {
		const sortedItems = sortItemsByYear(items);
		const references = sortedItems.filter(it => it._type == "cited");
		const citations = sortedItems.filter(it => it._type == "citing");

		const refList = references.length > 0 
			? <ul className={Classes.LIST_UNSTYLED} list-type="references">
				{references.map((ref) => <BacklinksItem key={ref._doi} entry={ref} />)}
			</ul> 
			: null;
		const citList = citations.length > 0 
			? <ul className={Classes.LIST_UNSTYLED} list-type="citations">
				{citations.map((cit) => <BacklinksItem key={cit._doi} entry={cit} />)}
			</ul> 
			: null;
		const separator = <span className="backlinks-list_divider"><Tag minimal={true} multiline={true}>{origin}</Tag><hr /></span>;

		return (
			<Collapse isOpen={isOpen} keepChildrenMounted={true}>
				<ul className={Classes.LIST_UNSTYLED + " zotero-roam-page-menu-backlinks-list "}>
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
	const { doi, title, origin, items, dialogProps } = props;
	const { extensionPortal } = dialogProps;
	const { isLoading, isError, data = {}, error } = querySemantic(doi);
	
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
		openDialog();
		setShowing({
			title,
			type: "is_reference"
		});
	}, [title]);

	const showCitations = useCallback(() => {
		openDialog();
		setShowing({
			title,
			type: "is_citation"
		});
	}, [title]);

	// Only select items with valid DOIs to reduce dataset size
	const itemsWithDOIs = useMemo(() => items.filter(it => parseDOI(it.data.DOI)), [items]);

	const refCount = data.references?.length || null;
	const citCount = data.citations?.length || null;

	const backlinks_matched = useMemo(() => {
		return (
			refCount + citCount > 0 
				? findBacklinks(itemsWithDOIs, data) 
				: []
		);
	}, [refCount + citCount > 0, data]);

	const showBacklinksButtonProps = useMemo(() => {
		return backlinks_matched.length == 0
			? {
				disabled: true,
				icon: null,
				text: "No related library items"
			}
			: {
				icon: isBacklinksListOpen ? "caret-down" : "caret-right",
				text: pluralize(backlinks_matched.length, "related library item")
			};
	}, [backlinks_matched.length > 0, isBacklinksListOpen]);

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
							items={(isShowing.type == "is_reference" ? data.references : data.citations) || []}
							isOpen={isDialogOpen} 
							portalTarget={extensionPortal} 
							onClose={closeDialog} />
						: null}
					<Backlinks items={backlinks_matched} origin={origin} isOpen={isBacklinksListOpen} />
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
	dialogProps: PropTypes.shape({
		extensionPortal: PropTypes.string
	})
};

const CitekeyMenu = React.memo(function CitekeyMenu(props) {
	const { item, itemList, extensionPortal } = props;
	const { items, pdfs, notes } = itemList;

	const doi = parseDOI(item.data.DOI);
	const has_pdfs = pdfs.filter(pdf => pdf.data.parentItem == item.data.key && pdf.library.id == item.library.id);
	const has_notes = notes.filter(note => note.data.parentItem == item.data.key && note.library.id == item.library.id);

	const doiHeader = useMemo(() => {
		return doi 
			? <span className="zotero-roam-page-doi" data-doi={doi}><a href={"https://doi.org/" + doi} target="_blank" className={Classes.TEXT_MUTED} rel="noreferrer">{doi}</a></span> 
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
						<ButtonLink linkClass={[Classes.MINIMAL, "zotero-roam-page-menu-pdf-link"]} 
							key={pdf.key}
							href={href}
							icon="paperclip"
							text={pdf.data.filename || pdf.data.title} />
					);
				})
			);
		}
	}, has_pdfs);
    
	const open_zotero = useMemo(() => {
		return (
			<>
				<ButtonLink icon="application" text="Open in Zotero" href={getLocalLink(item, { format: "target" })} />
				<ButtonLink icon="cloud" text="Open in Zotero [Web library]" href={getWebLink(item, { format: "target" })} />
			</>
		);
	},[item.library, item.data.key]);

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
				dialogProps={{ extensionPortal}}
			/>
			: null;
	}, [doi, item.key, item.meta.parsedDate, items, extensionPortal]);

	return (
		<>
			{doiHeader}
			<Card elevation={0} className='zotero-roam-page-menu'>
				<div className="zotero-roam-page-menu-header">
					<ButtonGroup className='zotero-roam-page-menu-actions' minimal={true}>
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
	extensionPortal: PropTypes.string
};

function DNPMenu(props){
	const { added, date, title, extensionPortal } = props;
	const [isDialogOpen, setDialogOpen] = useState(false);

	const hasAddedItems = added.length > 0;

	const isShowing = useMemo(() => {
		return {
			date,
			title,
			type: "added_on"
		};
	}, [date]);

	const openDialog = useCallback(() => {
		setDialogOpen(true);
	}, []);
    
	const closeDialog = useCallback(() => {
		setDialogOpen(false);
	}, []);

	return (
		<>
			{hasAddedItems 
				? <>
					<Button minimal={true} icon="calendar" onClick={openDialog}>{pluralize(added.length, "item", " added")}</Button>
					<AuxiliaryDialog className="added-on" 
						isOpen={isDialogOpen}
						show={isShowing} 
						items={added} 
						portalTarget={extensionPortal}
						onClose={closeDialog}
					/>
				</>
				: null}
		</>
	);
}
DNPMenu.propTypes = {
	added: PropTypes.array,
	date: PropTypes.date,
	title: PropTypes.string,
	extensionPortal: PropTypes.string
};

function TagMenu(props){
	const { tagged = [], inAbstract = [], tag, extensionPortal } = props;
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isShowing, setShowing] = useState({});

	const hasTaggedItems = tagged.length > 0;
	const hasAbstracts = inAbstract.length > 0;

	const showTagged = useCallback(() => {
		setDialogOpen(true);
		setShowing({
			title: tag,
			type: "with_tag"
		});
	}, [tag]);

	const showAbstracts = useCallback(() => {
		setDialogOpen(true);
		setShowing({
			title: tag,
			type: "with_abstract"
		});
	}, [tag]);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
	}, []);

	return (
		<>
			{hasTaggedItems
				? <Button minimal={true} icon="manual" onClick={showTagged}>{pluralize(tagged.length, "tagged item")}</Button>
				: null}
			{hasAbstracts
				? <Button minimal={true} icon="manually-entered-data" onClick={showAbstracts}>{pluralize(inAbstract.length, "abstract")}</Button>
				: null}
			{hasTaggedItems || hasAbstracts
				? <AuxiliaryDialog className="related"
					isOpen={isDialogOpen}
					show={isShowing} 
					items={isShowing.type == "with_tag" ? tagged : inAbstract} 
					portalTarget={extensionPortal}
					onClose={closeDialog} />
				: null}
		</>
	);
}
TagMenu.propTypes = {
	tagged: PropTypes.array,
	inAbstract: PropTypes.array,
	tag: PropTypes.string,
	extensionPortal: PropTypes.string
};

function CitekeyMenuFactory(props){
	const { menus, dataRequests, extensionPortal } = props;
	const itemQueries = queryItems(dataRequests, { 
		select: (datastore) => datastore.data, 
		notifyOnChangeProps: ["data"] 
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => {
		return data.reduce((obj, item) => {
			if (["note", "annotation"].includes(item.data.itemType)) {
				obj.notes.push(item);
			} else if (item.data.itemType == "attachment") {
				if (item.data.contentType == "application/pdf") {
					obj.pdfs.push(item);
				}
				// If the attachment is not a PDF, ignore it
			} else {
				obj.items.push(item);
			}

			return obj;

		}, { items: [], pdfs: [], notes: [] });
	}, [data]);

	const citekeyItems = useMemo(() => itemList.items.filter(it => it.has_citekey), [itemList]);
	const citekeyMenus = useMemo(() => {
		if (!citekeyItems) {
			return null;
		} else {
			return menus.map(menu => {
				let item = citekeyItems.find(it => it.key == menu.getAttribute("data-citekey"));
				return { div: menu, item };
			})
				.filter(menu => menu.item)
				.map((menu, i) => {
					let { item, div } = menu;
					return (
						createPortal(<CitekeyMenu key={i} item={item} itemList={itemList} extensionPortal={extensionPortal} />, div)
					);
				});
		}
	}, [menus, citekeyItems]);

	return citekeyMenus;
}

function DNPMenuFactory(props){
	const { menus, dataRequests, extensionPortal } = props;
	const itemQueries = queryItems(dataRequests, { 
		select: (datastore) => datastore.data.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType)),
		notifyOnChangeProps: ["data"]
	});

	const items = itemQueries.map(q => q.data || []).flat(1);
	const dnpPortals = useMemo(() => {
		if(!items){
			return null;
		} else {
			return menus.map(menu => {
				let title = menu.getAttribute("data-title");
				let dnp_date = new Date(JSON.parse(menu.getAttribute("data-dnp-date"))).toDateString();
				let added = items.filter(it => new Date(it.data.dateAdded).toDateString() == dnp_date);
				return { div: menu, added, date: dnp_date, title};
			})
				.filter(menu => menu.added)
				.map((menu, i) => {
					let { added, date, div, title } = menu;
					return (
						createPortal(<DNPMenu key={i} date={date} title={title} added={added} extensionPortal={extensionPortal} />, div)
					);
				});
		}
	}, [menus, items]);

	return dnpPortals;
}

function TagMenuFactory(props){
	const { menus, dataRequests, extensionPortal } = props;
	const itemQueries = queryItems(dataRequests, { 
		select: (datastore) => datastore.data.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType)),
		notifyOnChangeProps: ["data"]
	});
    
	const items = itemQueries.map(q => q.data || []).flat(1);
	// Select to reduce dataset size :
	// - for tag matching, only top-level items that have any tags
	// - for abstract matching, only items that have an abstract
	const with_tags_or_abstract = useMemo(() => {
		return items
			.filter(it => it.data.abstractNote || it.data.tags.length > 0)
			.map(it => {
				return {
					itemData: it,
					abstract: it.data.abstractNote || "",
					tagList: it.data.tags.map(t => t.tag)
				};
			});
	}, [items]);

	const tagPortals = useMemo(() => {
		if(!items){
			return null;
		} else {
			return menus.map(menu => {
				let title = menu.getAttribute("data-title");
				let results = with_tags_or_abstract.reduce((obj, item) => {
					if(item.abstract.includes(title)){
						obj.with_abstract.push(item.itemData);
					}
					if(item.tagList.includes(title)){
						obj.with_tags.push(item.itemData);
					}
					return obj;
				}, { with_tags: [], with_abstract: []});
                
				return { div: menu, tag: title, ...results };
			})
				.filter(menu => menu.with_tags.length > 0 || menu.with_abstract.length > 0)
				.map((menu,i) => {
					let { with_tags, with_abstract, div, tag } = menu;
					return (
						createPortal(<TagMenu key={i} tag={tag} tagged={with_tags} inAbstract={with_abstract} extensionPortal={extensionPortal} />, div)
					);
				});
		}
	}, [menus, items]);

	return tagPortals;
}

export {
	addPageMenus,
	findPageMenus,
	CitekeyMenuFactory,
	DNPMenuFactory,
	TagMenuFactory
};
