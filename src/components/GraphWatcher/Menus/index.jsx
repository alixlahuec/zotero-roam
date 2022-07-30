/* istanbul ignore file */
import React, { useContext, useMemo } from "react";
import { arrayOf, object } from "prop-types";
import { createPortal } from "react-dom";

import CitekeyMenu from "./CitekeyMenu";
import DNPMenu from "./DNPMenu";
import TagMenu from "./TagMenu";

import { ExtensionContext, UserSettings } from "../../App";
import { useQuery_Items } from "../../../api/queries";
import { useRoamCitekeys } from "../../RoamCitekeysContext";

import { categorizeLibraryItems } from "../../../utils";
import { cleanRelatedItem } from "./utils";

import "./index.css";

function CitekeyMenuFactory({ menus }){
	const { dataRequests } = useContext(ExtensionContext);
	const { pageMenu: { trigger } } = useContext(UserSettings);
	const itemQueries = useQuery_Items(dataRequests, { 
		select: (datastore) => datastore.data, 
		notifyOnChangeProps: ["data"] 
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	const citekeyItems = useMemo(() => itemList.items.filter(it => it.has_citekey), [itemList]);
	const citekeyMenus = useMemo(() => {
		if (!citekeyItems) {
			return null;
		} else {
			return menus
				.filter(menu => {
					if(trigger.constructor === Boolean){
						return trigger;
					} else {
						const title = menu.getAttribute("data-citekey");
						return trigger(title);
					}
				})
				.map(menu => {
					const item = citekeyItems.find(it => it.key == menu.getAttribute("data-citekey"));
					return { div: menu, item };
				})
				.filter(menu => menu.item)
				.map((menu, i) => {
					const { item, div } = menu;
					return (
						createPortal(<CitekeyMenu key={i} item={item} itemList={itemList} />, div)
					);
				});
		}
	}, [citekeyItems, itemList, menus, trigger]);

	return citekeyMenus;
}
CitekeyMenuFactory.propTypes = { 
	menus: arrayOf(object)
};

function DNPMenuFactory({ menus }){
	const { dataRequests } = useContext(ExtensionContext);
	const { pageMenu: { trigger } } = useContext(UserSettings);
	const [roamCitekeys,] = useRoamCitekeys();

	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"], 
		select: (datastore) => datastore.data
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);
	
	const dnpPortals = useMemo(() => {
		const { items, pdfs, notes } = itemList;

		if(!items){
			return null;
		} else {
			return menus
				.filter(menu => {
					if(trigger.constructor === Boolean){
						return trigger;
					} else {
						const title = menu.getAttribute("data-title");
						return trigger(title);
					}
				})
				.map(menu => {
					const title = menu.getAttribute("data-title");
					const dnp_date = new Date(JSON.parse(menu.getAttribute("data-dnp-date"))).toDateString();
					const added = items
						.filter(it => new Date(it.data.dateAdded).toDateString() == dnp_date)
						.map(it => cleanRelatedItem(it, { pdfs, notes }, roamCitekeys));
					return { div: menu, added, date: dnp_date, title };
				})
				.filter(menu => menu.added)
				.map((menu, i) => {
					const { added, date, div, title } = menu;
					return (
						createPortal(<DNPMenu key={i} 
							added={added} date={date} title={title} />, div)
					);
				});
		}
	}, [itemList, menus, roamCitekeys, trigger]);

	return dnpPortals;
}
DNPMenuFactory.propTypes = { 
	menus: arrayOf(object)
};

function TagMenuFactory({ menus }){
	const { dataRequests } = useContext(ExtensionContext);
	const { pageMenu: { trigger } } = useContext(UserSettings);
	const [roamCitekeys,] = useRoamCitekeys();
	
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data 
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	// Select to reduce dataset size :
	// - for tag matching, only top-level items that have any tags
	// - for abstract matching, only items that have an abstract
	const with_tags_or_abstract = useMemo(() => {
		return itemList.items
			.filter(it => it.data.abstractNote || it.data.tags.length > 0)
			.map(it => {
				return {
					itemData: it,
					abstract: it.data.abstractNote || "",
					tagList: it.data.tags.map(t => t.tag)
				};
			});
	}, [itemList.items]);

	const tagPortals = useMemo(() => {
		const { items, pdfs, notes } = itemList;
		if(!items){
			return null;
		} else {
			return menus
				.filter(menu => {
					if(trigger.constructor === Boolean){
						return trigger;
					} else {
						const title = menu.getAttribute("data-title");
						return trigger(title);
					}
				})
				.map(menu => {
					const title = menu.getAttribute("data-title");
					const results = with_tags_or_abstract.reduce((obj, item) => {
						if(item.abstract.includes(title)){
							obj.with_abstract.push(cleanRelatedItem(item.itemData, { pdfs, notes }, roamCitekeys));
						}
						if(item.tagList.includes(title)){
							obj.with_tags.push(cleanRelatedItem(item.itemData, { pdfs, notes }, roamCitekeys));
						}
						return obj;
					}, { with_tags: [], with_abstract: [] });
					
					return { div: menu, tag: title, ...results };
				})
				.filter(menu => menu.with_tags.length > 0 || menu.with_abstract.length > 0)
				.map((menu,i) => {
					const { with_tags, with_abstract, div, tag } = menu;
					return (
						createPortal(<TagMenu key={i} 
							tag={tag} inAbstract={with_abstract} tagged={with_tags} />, div)
					);
				});
		}
	}, [itemList, menus, roamCitekeys, trigger, with_tags_or_abstract]);

	return tagPortals;
}
TagMenuFactory.propTypes = { 
	menus: arrayOf(object)
};

export {
	CitekeyMenuFactory,
	DNPMenuFactory,
	TagMenuFactory
};
