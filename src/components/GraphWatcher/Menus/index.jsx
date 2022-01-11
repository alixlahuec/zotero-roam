import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, ButtonGroup, Callout, Card, Classes, Collapse, Tag } from '@blueprintjs/core';

import { getLocalLink, getWebLink, parseDOI, pluralize, readDNP, sortItemsByYear } from '../../../utils';
import { queryItems, querySemantic } from '../../../queries';
import ButtonLink from '../../ButtonLink';
import SciteBadge from '../../SciteBadge';
import './index.css';

const menuPrefix = 'zr-page-menu--';
const menuClasses = ['citekey', 'dnp', 'tag'].reduce((obj, elem) => {
    obj[elem] = menuPrefix + elem;
    return obj;
}, {});

const showPrefix = 'zr-page-menu-show--';
const showClasses = ['references', 'citations', 'backlinks'].reduce((obj, elem) => {
    obj[elem] = showPrefix + elem;
    return obj;
}, {});

const addPageMenus = () => {
    let newPages = Array.from(document.querySelectorAll('h1.rm-title-display'))
    .filter(page => !(page.parentElement.querySelector(`[class*=${menuPrefix}]`)));
    for(const page of newPages) {
        let title = page.querySelector('span') ? page.querySelector('span').innerText : page.innerText;
        // DEP: page menu trigger setting
        // TODO: add Roam page UIDs as data-uid below
        let menu = document.createElement('div');
        menu.setAttribute('data-title', title);
        // Case 1 (ref-citekey) : on-page menu
        if(title.startsWith('@')){
            menu.classList.add(menuClasses.citekey);
            menu.setAttribute('data-citekey', title.slice(1));
        } else if(title.match(/(.+) ([0-9]+).{2}, ([0-9]{4})/g)) {
            // Case 2 (DNP) : "XX items added"
            let dnp_date = readDNP(title, { as_date: false });
            menu.classList.add(menuClasses.dnp);
            menu.setAttribute('data-dnp-date', JSON.stringify(dnp_date));
        } else {
            // Case 3 (all other pages) : "XX abstracts", "YY tagged items"
            menu.classList.add(menuClasses.tag);
        }

        page.insertAdjacentElement('afterend', menu);
    }
}

const findPageMenus = () => {
    return {
        citekeyMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.citekey}]`)),
        dnpMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.dnp}]`)),
        tagMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.tag}]`))
    }
}

function findBacklinks(datastore, semantic){
    // Note: DOIs from the Semantic Scholar queries are sanitized at fetch
    let citedDOIs = semantic.references.map(ref => { return { _doi: ref.doi, _type: 'cited' } });
    let citingDOIs = semantic.citations.map(cit => { return { _doi: cit.doi, _type: 'citing' } });

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
    const pub_year = meta.parsedDate ? new Date(meta.parsedDate).getUTCFullYear() : '';
    const pub_type = _type == "cited" ? "reference" : "citation";

    return (
        <li className="related-item_listed" 
        data-backlink-type={pub_type} 
        data-key={'@' + key} 
        data-item-type={data.itemType} 
        data-item-year={pub_year}
        >
            <div className="related_year">{pub_year}</div>
            <div className="related_info">
                <span className="zotero-roam-search-item-authors zr-highlight">{meta.creatorSummary || ""}</span>
                <span className="zr-secondary">{data.publicationTitle || data.bookTitle || data.university || ""}</span>
                <span className="zotero-roam-search-item-title">{data.title}</span>
            </div>
            <div className="related_state">
                <Button className="zr-text-small"
                minimal={true}
                icon="plus"
                aria-label={"Add & open @" + key + " in the sidebar"}
                >
                    {'@' + key}
                </Button>
            </div>
        </li>
    )
}

const Backlinks = React.memo(props => {
    const { items, origin, isOpen } = props;

    if(items.length == 0){
        return null;
    } else {
        const sortedItems = sortItemsByYear(items);
        const references = sortedItems.filter(it => it._type == "cited");
        const citations = sortedItems.filter(it => it._type == "citing");

        const refList = references.length > 0 
            ? <ul className={Classes.LIST_UNSTYLED} list-type="references">{references.map((ref) => <BacklinksItem key={ref._doi} entry={ref} />)}</ul> 
            : null;
        const citList = citations.length > 0 
            ? <ul className={Classes.LIST_UNSTYLED} list-type="citations">{citations.map((cit) => <BacklinksItem key={cit._doi} entry={cit} />)}</ul> 
            : null;
        const separator = <span className="backlinks-list_divider"><Tag minimal={true} multiline={true}>{origin}</Tag><hr /></span>;

        return (
            <Collapse isOpen={isOpen} keepChildrenMounted={true}>
                <ul className={Classes.LIST_UNSTYLED + ' zotero-roam-page-menu-backlinks-list '}>
                    {refList}
                    {separator}
                    {citList}
                </ul>
            </Collapse>
        )
    }
})

function RelatedItemsBar(props) {
    const { doi, origin, items } = props;
    const { isLoading, isError, data = {}, error } = querySemantic(doi);
    const [isBacklinksListOpen, setBacklinksListOpen] = useState(false);

    const toggleBacklinks = useCallback(() => {
        setBacklinksListOpen(!isBacklinksListOpen)
    }, [isBacklinksListOpen]);

    // Only select items with valid DOIs to reduce dataset size
    const itemsWithDOIs = useMemo(() => items.filter(it => parseDOI(it.data.DOI)), [items]);

    const refCount = data.references?.length || null;
    const citCount = data.citations?.length || null;

    const backlinks_matched = useMemo(() => (refCount + citCount > 0 ? findBacklinks(itemsWithDOIs, data) : []), [refCount + citCount > 0, data]);
    const showBacklinksButtonProps = useMemo(() => {
        return backlinks_matched.length == 0
        ? {
            disabled: true,
            icon: null,
            text: 'No related library items'
        }
        : {
            icon: isBacklinksListOpen ? 'caret-down' : 'caret-right',
            text: pluralize(backlinks_matched.length, 'related library item')
        }
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
                    <Button className={ showClasses.references } loading={isLoading} icon="citation" intent="primary">{ pluralize(refCount, 'reference') }</Button>
                    <Button className={ showClasses.citations } loading={isLoading} icon="chat" intent="warning" >{ pluralize(citCount, 'citation') }</Button>
                    <Button className={ showClasses.backlinks } loading={isLoading} onClick={toggleBacklinks} {...showBacklinksButtonProps} ></Button>
                </ButtonGroup>
                <Backlinks items={backlinks_matched} origin={origin} isOpen={isBacklinksListOpen} />
            </>
            }
        </div>
    )
}

const CitekeyMenu = React.memo(props => {
    const { item, itemList } = props;
    const { items, pdfs, notes } = itemList;

    const doi = parseDOI(item.data.DOI);

    const has_pdfs = pdfs.filter(pdf => pdf.data.parentItem == item.data.key && pdf.library.id == item.library.id);
    const has_notes = notes.filter(note => note.data.parentItem == item.data.key && note.library.id == item.library.id);

    const doiHeader = useMemo(() => {
        return doi 
        ? <span className="zotero-roam-page-doi" data-doi={doi}><a href={'https://doi.org/' + doi} target="_blank" className={Classes.TEXT_MUTED}>{doi}</a></span> 
        : null;
    }, [doi]);
    
    const importNotes = has_notes ? <Button icon="comment">Import notes</Button> : null;
    const pdfLinks = useMemo(() => {
        if(has_pdfs.length == 0) {
            return null;
        } else {
            return (
                has_pdfs.map(pdf => {
                    let location = pdf.library.type == "group" ? `groups/${pdf.library.id}` : `library`;
                    let href = (["linked_file", "imported_file", "imported_url"].includes(pdf.data.linkMode)) ? `zotero://open-pdf/${location}/items/${pdf.data.key}` : pdf.data.url;
                    return (
                        <ButtonLink linkClass={[Classes.MINIMAL, 'zotero-roam-page-menu-pdf-link']} 
                        key={pdf.key}
                        href={href}
                        icon="paperclip"
                        text={pdf.data.filename || pdf.data.title} />
                    )
                })
            )
        }
    }, has_pdfs);
    
    const open_zotero = useMemo(() => {
        return (
            <>
                <ButtonLink icon="application" text="Open in Zotero" href={getLocalLink(item, { format: 'target' })} />
                <ButtonLink icon="cloud" text="Open in Zotero [Web library]" href={getWebLink(item, { format: 'target' })} />
            </>
        )
    },[item.library, item.data.key]);

    const sciteBadge = doi ? <SciteBadge doi={doi} /> : null;

    const ext_links = useMemo(() => {
        let connectedPapersLink = <ButtonLink icon="layout" text="Connected Papers" href={"https://www.connectedpapers.com/" + (doi ? 'api/redirect/doi/' + doi : 'search?q=' + encodeURIComponent(item.data.title)) } />;
        let semanticLink = doi ? <ButtonLink icon="bookmark" text="Semantic Scholar" href={"https://api.semanticscholar.org/" + doi} /> : null;
        let googleScholarLink = <ButtonLink icon="learning" text="Google Scholar" href={"https://scholar.google.com/scholar?q=" + (doi || encodeURIComponent(item.data.title))} />;

        return (
            <>
                {connectedPapersLink}
                {semanticLink}
                {googleScholarLink}
            </>
        )
    }, [doi, item.data.title])
    
    const relatedBar = useMemo(() => {
        return doi
        ? <RelatedItemsBar doi={doi} origin={item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear() : ''} items={items} />
        : null;
    }, [doi, item.meta.parsedDate, items]);

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
    )
})

function DNPMenu(props){
    const { added } = props;
    const hasAddedItems = added.length > 0;

    return (
        <>
            {hasAddedItems 
            ? <Button minimal={true} icon="calendar">{pluralize(added.length, 'item', ' added')}</Button>
            : null}
        </>
    )
}

function TagMenu(props){
    const { tagged = [], inAbstract = [] } = props;
    const hasTaggedItems = tagged.length > 0;
    const hasAbstracts = inAbstract.length > 0;

    return (
        <>
            {hasTaggedItems
            ? <Button minimal={true} icon="manual">{pluralize(tagged.length, 'tagged item')}</Button>
            : null}
            {hasAbstracts
            ? <Button minimal={true} icon="manually-entered-data">{pluralize(inAbstract.length, 'abstract')}</Button>
            : null}
        </>
    )
}

function CitekeyMenuFactory(props){
    const { menus, dataRequests } = props;
    const itemQueries = queryItems(dataRequests, { 
        select: (datastore) => datastore.data, 
        notifyOnChangeProps: ['data'] 
    });

    const data = itemQueries.map(q => q.data || []).flat(1);
    const itemList = useMemo(() => {
        return data.reduce((obj, item) => {
            if (['note', 'annotation'].includes(item.data.itemType)) {
                obj.notes.push(item);
            } else if (item.data.itemType == 'attachment') {
                if (item.data.contentType == "application/pdf") {
                    obj.pdfs.push(item);
                }
                // If the attachment is not a PDF, ignore it
            } else {
                obj.items.push(item);
            }

            return obj;

        }, { items: [], pdfs: [], notes: [] })
    }, [data]);

    const citekeyItems = useMemo(() => itemList.items.filter(it => it.has_citekey), [itemList]);
    const citekeyMenus = useMemo(() => {
        if (!citekeyItems) {
            return null;
        } else {
            return menus.map(menu => {
                let item = citekeyItems.find(it => it.key == menu.getAttribute('data-citekey'));
                return { div: menu, item }
            })
                .filter(menu => menu.item)
                .map((menu, i) => {
                    let { item, div } = menu;
                    return (
                        createPortal(<CitekeyMenu key={i} item={item} itemList={itemList} />, div)
                    )
                })
        }
    }, [menus, citekeyItems]);

    return citekeyMenus;
}

function DNPMenuFactory(props){
    const { menus, dataRequests } = props;
    const itemQueries = queryItems(dataRequests, { 
        select: (datastore) => datastore.data.filter(it => !['attachment', 'note', 'annotation'].includes(it.data.itemType)),
        notifyOnChangeProps: ['data']
    });

    const items = itemQueries.map(q => q.data || []).flat(1);
    const dnpPortals = useMemo(() => {
        if(!items){
            return null;
        } else {
            return menus.map(menu => {
                let dnp_date = new Date(JSON.parse(menu.getAttribute('data-dnp-date'))).toDateString();
                let added = items.filter(it => new Date(it.data.dateAdded).toDateString() == dnp_date);
                return { div: menu, added }
            })
            .filter(menu => menu.added)
            .map((menu, i) => {
                let { added, div } = menu;
                return (
                    createPortal(<DNPMenu key={i} added={added} />, div)
                )
            });
        }
    }, [menus, items]);

    return dnpPortals;
}

function TagMenuFactory(props){
    const { menus, dataRequests } = props;
    const itemQueries = queryItems(dataRequests, { 
        select: (datastore) => datastore.data.filter(it => !['attachment', 'note', 'annotation'].includes(it.data.itemType)),
        notifyOnChangeProps: ['data']
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
            }
        })
    }, [items]);

    const tagPortals = useMemo(() => {
        if(!items){
            return null;
        } else {
            return menus.map(menu => {
                let title = menu.getAttribute('data-title');
                let results = with_tags_or_abstract.reduce((obj, item) => {
                    if(item.abstract.includes(title)){
                        obj.with_abstract.push(item.itemData);
                    }
                    if(item.tagList.includes(title)){
                        obj.with_tags.push(item.itemData);
                    }
                }, { with_tags: [], with_abstract: []});
                
                return { div: menu, ...results }
            })
            .filter(menu => menu.with_tags.length > 0 || menu.with_tags.length > 0)
            .map((menu,i) => {
                let { with_tags, with_abstract, div } = menu;
                return (
                    createPortal(<TagMenu key={i} tagged={with_tags} inAbstract={with_abstract} />, div)
                )
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
}
