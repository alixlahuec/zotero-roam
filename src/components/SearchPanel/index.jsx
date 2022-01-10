import React, { useCallback, useRef, useState } from 'react';
import { Button, ButtonGroup, Classes, Icon, InputGroup, Menu, MenuItem, Switch, Tag } from '@blueprintjs/core';
import { QueryList } from '@blueprintjs/select';
import DialogOverlay from '../DialogOverlay';
import { useQueryClient } from 'react-query';
import { copyToClipboard } from '../../utils';

const query_threshold = 3;
const query_debounce = 300;
const results_limit = 50;

const dialogLabel="zr-library-search-dialogtitle";
const dialogClass="search-library";

// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
function useDebounceCallback(callback, timeout) {
  let timeoutRef = useRef(undefined);

  const cancel = function() {
    if (!!timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const debounceCallback = useCallback(
    value => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        callback(value);
      }, timeout);
    },
    [callback, timeout]
  );

  return [debounceCallback, cancel];
}

function CopyButton(props){
  let { copyProps, ...rest } = props;

  const formatCitekey = () => {
    let {citekey, item, format} = copyProps;
    let output;
    let pageRef = "[[@" + citekey + "]]";
  
    switch(format){
      case "page-reference":
        output = pageRef;
        break;
      case "tag":
        output = "#" + pageRef;
        break;
      case "citation":
        output = "[" + item.authors + " (" + item.year + ")](" + pageRef + ")";
        break;
      case "citekey":
      default:
        output = '@' + citekey;
        break;
    }
    
    copyToClipboard(output);
  }
  
  return <Button {...rest} onClick={formatCitekey} />
}

function CopyButtonsSet(props){
  return <ButtonGroup fill={true} minimal={true} className="copy-buttons">
    <CopyButton text="Copy @citekey" intent="primary" small={true} copyProps={{format: "citekey", ...props}} />
    <CopyButton text="[Citation]([[@]])" intent="primary" small={true} copyProps={{format: "citation", ...props}} />
    <CopyButton text="#@" intent="primary" small={true} copyProps={{format: "tag", ...props}} />
    <CopyButton text="[[@]]" intent="primary" small={true} copyProps={{format: "page-reference", ...props}} />
  </ButtonGroup>
}

function SelectedItem(props) {
  let {
    abstract, 
    authors, 
    authorsFull, 
    authorsRoles, 
    inGraph, 
    key, 
    publication, 
    tags, 
    title, 
    weblink, 
    year} = props.item;

  return <div id="zotero-roam-search-selected-item">
    <div className="selected-item-header">
      <div className="item-basic-metadata">
        <h4 className="item-title">{title}</h4>
        <span className="zotero-roam-search-item-authors zr-highlight">{authors + " (" + year + ")"}</span>
        {publication
        ? <span className="zr-secondary">{publication}</span>
        : null}
        {weblink
        ? <span className="item-weblink zr-secondary" style={{ display: 'block' }}>
            <a href={weblink.href} target="_blank">{weblink.title}</a>
          </span>
        : null}
      </div>
      <div className="item-citekey-section" in-graph={inGraph.toString()}>
        <div className={Classes.FILL + " citekey-element"}>
          {inGraph
          ? <Icon icon="symbol-circle" />
          : <Icon icon="minus" intent="warning" />}
          {'@' + key}
        </div>
        {navigator.clipboard
        ? <CopyButtonsSet citekey={key} item={props.item} />
        : null}
      </div>
    </div>
    <div className="selected-item-body">
      <div className="item-additional-metadata">
        <p className={"item-abstract zr-text-small " + Classes.RUNNING_TEXT}>{abstract}</p>
        {authorsFull.length > 0
        ? <p className="item-creators">
            <strong>Contributors : </strong>
            {authorsFull.map((aut, i) => <Tag key={i} intent="primary" className="item-creator-tag" >{aut}{authorsRoles[i] == "author" ? "" : " (" + authorsRoles[i] + ")"}</Tag>)}
          </p>
        : null}
        {tags.length > 0
        ? <p className="item-tags">
            <strong>Tags : </strong>
            {tags.map((tag, i) => <Tag key={i}>#{tag}</Tag>)}
          </p>
        : null}
      </div>
      <div className="item-actions">
        <div className={Classes.CARD}>
          <ButtonGroup minimal={true} alignText="left" vertical={true} fill={true}>
            { inGraph 
            ? <Button text="Go to Roam page"
              className="item-go-to-page"
              intent="primary"
              icon="arrow-right"
              onClick={() => window.roamAlphaAPI.ui.mainWindow.openPage({page: {title: '@' + key}})} />
            : null  
            }
            <Button text="Import item metadata"
              className="item-add-metadata" 
              intent="primary" 
              icon="add" />
          </ButtonGroup>
        </div>
      </div>
    </div>
  </div>
}

function listItemRenderer(item, itemProps) {
  let { handleClick, modifiers } = itemProps;
  let itemClass = Classes.TEXT_OVERFLOW_ELLIPSIS + " zotero-roam-search-item-contents";
  let keyClass = Classes.MENU_ITEM_LABEL + " zotero-roam-search-item-key";
  
  let passedProps = { item, handleClick, modifiers, itemClass, keyClass };
  let { location, key } = item;

  return <SearchResult key={[location, key].join('-')} {...passedProps} />;
}

const SearchResult = React.memo(props => {
  const { item, handleClick, modifiers, itemClass, keyClass } = props;
  const { authors, inGraph, itemType, key, location, publication, title, year} = item;

  return <MenuItem
    onClick={handleClick}
    className="zotero-roam-search_result"
    role="option"
    aria-selected={modifiers.active}
    data-item-type={itemType}
    in-graph={inGraph.toString()}
    labelElement={<span>{key}</span>}
    labelClassName={keyClass}
    tagName="div"
    text={
      <>
        <span className="zotero-roam-search-item-title">{title}</span>
        <span className="zr-details">
          <span className="zotero-roam-search-item-authors zr-highlight">{authors + " (" + year + ")"}</span>
          <span className="zr-secondary">{publication}</span>
        </span>
      </>
    }
    textClassName={itemClass}
  />
})

function searchEngine(query, items) {
  if(query.length < query_threshold){
    return [];
  } else {
    let matches = [];

    for(let i = 0; matches.length < results_limit && i < items.length;i++){
      let item = items[i];
      if(item.title.includes(query)){
        matches.push(item);
      }
    }
  
    return matches;
  }
}

function simplifyRequestData(arr){
  return arr
  .filter(i => !['note', 'attachment', 'annotation'].includes(i.data.itemType))
  .map(item => {
    let hasURL = item.data.url || item.data.DOI || false;
    let creators = item.data.creators.map(cre => {
      return {
        full: cre.name || [cre.firstName, cre.lastName].filter(Boolean).join(" ") || "",
        last: cre.lastName || cre.name || "",
        role: cre.creatorType || ""
      }
    });
    let tags = Array.from(new Set(item.data.tags.map(t => t.tag)));

    return {
      key: item.key,
      itemKey: item.data.key,
      title: item.data.title,
      abstract: item.data.abstractNote || "",
      authors: item.meta.creatorSummary || "",
      year: item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear().toString() : "",
      meta: "",
      publication: item.data.publicationTitle || item.data.bookTitle || item.data.university || "",
      tags: tags,
      tagsString: tags.map(tag => `#${tag}`).join(", "),
      authorsFull: creators.map(cre => cre.full),
      authorsRoles: creators.map(cre => cre.role),
      authorsLastNames: creators.map(cre => cre.last),
      authorsString: creators.map(cre => cre.full).join(" "),
      location: item.library.type + "s/" + item.library.id,
      itemType: item.data.itemType,
      "_multiField": "",
      inGraph: false,
      weblink: hasURL ? {href: hasURL, title: hasURL} : false
    }
  });
}

const SearchPanel = React.memo(props => {
  const { isOpen, isSidePanelOpen } = props.panelState;
  const { handleChange, portalTarget, version } = props;

  // Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
  let [query, setQuery] = useState();
  const [debouncedCallback, cancel] = useDebounceCallback(query => {
    //
  }, query_debounce);

  const searchbar = useRef();
  let [selectedItem, itemSelect] = useState(null);
  let [quickCopyActive, setQuickCopy] = useState(false); // DEP

  const client = useQueryClient();
  const items = simplifyRequestData(client.getQueriesData('items').map((res) => res[1]?.data || []).flat(1));

  const handleClose = useCallback(() => {
    setQuery("");
    itemSelect(null);
    handleChange({
      isOpen: false,
      isSidePanelOpen: false
    })
  }, []);

  const handleOpen = useCallback(() => { searchbar.current.focus() }, []);

  const toggleQuickCopy = useCallback(() => { setQuickCopy(!quickCopyActive) }, [quickCopyActive]);

  const handleItemSelect = useCallback((item, e) => {
    if(item === selectedItem){ 
      return; 
    } else if(!item){
      itemSelect(null);
    } else {
      if(quickCopyActive){
        // Mode: Quick Copy
        copyToClipboard('@' + item.key);
        handleClose();
      } else {
        searchbar.current.blur();
        itemSelect(item);
      }
    }
  }, [selectedItem, quickCopyActive]);

  function handleQueryChange(query, e) {
    handleItemSelect(null);
    setQuery(query);
    debouncedCallback(query);
  };

  function itemListRenderer(listProps) {
    const { query, filteredItems, renderItem, itemsParentRef } = listProps;

    const nbFilteredResults = filteredItems.length;
    const maxedOut = nbFilteredResults == results_limit;
    const hasNoResults = query.length > 0 && nbFilteredResults == 0 && !selectedItem;
    const isInitial = query.length == 0;

    const menuContent = !hasNoResults && !isInitial
      ? <Menu ulRef={itemsParentRef}>
          {listRenderer(query, filteredItems, renderItem)}
      </Menu>
      : null;

    const resultsShown = nbFilteredResults > 0 ? (maxedOut ? `Only showing the first ${results_limit} results` : `${nbFilteredResults} results`) : null;
    
    return (
      <div className="zr-querylist">
        <div className="header-bottom">
          <span id={dialogLabel} className="zr-search-scope">
            Zotero Library
            <Icon icon="chevron-right" />
          </span>
          <InputGroup
            className={(Classes.INPUT, Classes.FILL)}
            id="zotero-roam-search-autocomplete"
            placeholder="Search by title, year, authors (last names), citekey, tags"
            spellCheck="false"
            autoComplete="off"
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            inputRef={searchbar}
          />
        </div>
        {!selectedItem
        ? <>
          <div id="zotero-roam-library-rendered" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            {menuContent}
          </div>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <span className={['zr-auxiliary', 'zr-querylist-results-count'].join(' ')}>{resultsShown}</span>
            <Switch className='zr-quick-copy' label='Quick Copy' checked={quickCopyActive} onChange={toggleQuickCopy} />
            <Tag className="zr-extension-info" minimal={true}>{version}</Tag>
          </div>
        </>
        : <SelectedItem item={selectedItem} />}
      </div>
    )
  }

  function listRenderer(query, items, renderItem) {
    return (
      items.length == 0
      ? null
      : items.map(item => renderItem(item))
    )
  };

  return (
    <DialogOverlay
      ariaLabelledBy={dialogLabel}
      className={dialogClass}
      isOpen={isOpen}
      isSidePanelOpen={isSidePanelOpen}
      lazy={false}
      onClose={handleClose}
      onOpening={handleOpen}
      mainPanel={<>
          <div className="header-content">
            <div className="header-right">
              <div className="controls-top">
                <Button className={Classes.MINIMAL} icon="small-cross" onClick={handleClose} />
              </div>
            </div>
          </div>
          <QueryList
            initialContent={null}
            items={items}
            itemListPredicate={searchEngine}
            itemListRenderer={itemListRenderer}
            itemRenderer={listItemRenderer}
            onItemSelect={handleItemSelect}
            onQueryChange={handleQueryChange}
            query={query}
          />
        </>}
      portalTarget={document.getElementById(portalTarget)}
      sidePanel=""
    />
  )

})

export default SearchPanel;