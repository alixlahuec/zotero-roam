import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import { queryItems } from "../../../queries";

import CitekeyMenu from "./CitekeyMenu";
import DNPMenu from "./DNPMenu";
import TagMenu from "./TagMenu";

import { addPageMenus, cleanRelatedItem, findPageMenus } from "./utils";
import "./index.css";

function CitekeyMenuFactory(props){
	const { menus, dataRequests, portalId, roamCitekeys } = props;
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
						createPortal(<CitekeyMenu key={i} item={item} itemList={itemList} portalId={portalId} roamCitekeys={roamCitekeys} />, div)
					);
				});
		}
	}, [menus, citekeyItems, itemList, portalId, roamCitekeys]);

	return citekeyMenus;
}
CitekeyMenuFactory.propTypes = {
	menus: PropTypes.arrayOf(PropTypes.node,), 
	dataRequests: PropTypes.array,
	portalId: PropTypes.string,
	roamCitekeys: PropTypes.instanceOf(Map)
};

function DNPMenuFactory(props){
	const { menus, dataRequests, portalId, roamCitekeys } = props;
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
				let added = items
					.filter(it => new Date(it.data.dateAdded).toDateString() == dnp_date)
					.map(it => cleanRelatedItem(it, roamCitekeys));
				return { div: menu, added, date: dnp_date, title};
			})
				.filter(menu => menu.added)
				.map((menu, i) => {
					let { added, date, div, title } = menu;
					return (
						createPortal(<DNPMenu key={i} date={date} title={title} added={added} portalId={portalId} />, div)
					);
				});
		}
	}, [menus, items, portalId, roamCitekeys]);

	return dnpPortals;
}
DNPMenuFactory.propTypes = {
	menus: PropTypes.arrayOf(PropTypes.node,), 
	dataRequests: PropTypes.array,
	portalId: PropTypes.string,
	roamCitekeys: PropTypes.instanceOf(Map)
};

function TagMenuFactory(props){
	const { menus, dataRequests, portalId, roamCitekeys } = props;
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
						obj.with_abstract.push(cleanRelatedItem(item.itemData, roamCitekeys));
					}
					if(item.tagList.includes(title)){
						obj.with_tags.push(cleanRelatedItem(item.itemData, roamCitekeys));
					}
					return obj;
				}, { with_tags: [], with_abstract: []});
                
				return { div: menu, tag: title, ...results };
			})
				.filter(menu => menu.with_tags.length > 0 || menu.with_abstract.length > 0)
				.map((menu,i) => {
					let { with_tags, with_abstract, div, tag } = menu;
					return (
						createPortal(<TagMenu key={i} tag={tag} tagged={with_tags} inAbstract={with_abstract} portalId={portalId} />, div)
					);
				});
		}
	}, [menus, items, portalId, roamCitekeys, with_tags_or_abstract]);

	return tagPortals;
}
TagMenuFactory.propTypes = {
	menus: PropTypes.arrayOf(PropTypes.node,), 
	dataRequests: PropTypes.array,
	portalId: PropTypes.string,
	roamCitekeys: PropTypes.instanceOf(Map)
};

export {
	addPageMenus,
	findPageMenus,
	CitekeyMenuFactory,
	DNPMenuFactory,
	TagMenuFactory
};
