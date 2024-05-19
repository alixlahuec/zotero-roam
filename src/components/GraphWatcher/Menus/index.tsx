import { createPortal } from "react-dom";
import { useMemo } from "react";

import { useRoamCitekeys } from "Components/RoamCitekeysContext";
import { usePageMenuSettings, useRequestsSettings } from "Components/UserSettings";
import CitekeyMenu from "./CitekeyMenu";
import DNPMenu from "./DNPMenu";
import TagMenu from "./TagMenu";

import { useItems } from "@clients/zotero";

import { categorizeLibraryItems } from "../../../utils";
import { cleanRelatedItem } from "../helpers";

import { SCleanRelatedItem } from "Types/transforms";
import "./_index.sass";


function CitekeyMenuFactory({ menus }: { menus: Element[] }){
	const [{ trigger }] = usePageMenuSettings();
	const [{ dataRequests }] = useRequestsSettings();

	const itemQueries = useItems(dataRequests, { 
		select: (datastore) => datastore.data, 
		notifyOnChangeProps: ["data"] 
	});

	const data = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	const citekeyItems = useMemo(() => itemList.items.filter(it => it.has_citekey), [itemList]);
	const citekeyMenus = useMemo(() => {
		if (!citekeyItems) {
			return null;
		} else {
			return menus
				.filter(_menu => {
					if(trigger.constructor === Boolean){
						return trigger;
					} else {
						// If trigger isn't a Boolean, set default behavior
						// i.e citekey menus are always shown
						return true;
					}
				})
				.map(menu => {
					const item = citekeyItems.find(it => it.key == menu.getAttribute("data-citekey"));
					return { div: menu, item };
				})
				.map((menu, i) => {
					if (menu.item) {
						const { item, div } = menu;
						return (
							createPortal(<CitekeyMenu key={i} item={item} itemList={itemList} />, div)
						);	
					}
				});
		}
	}, [citekeyItems, itemList, menus, trigger]);

	return <>{citekeyMenus}</>;
}


function DNPMenuFactory({ menus }: { menus: Element[] }){
	const [{ trigger }] = usePageMenuSettings();
	const [{ dataRequests }] = useRequestsSettings();
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();

	const itemQueries = useItems(dataRequests, {
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
				.filter(_menu => {
					if(typeof(trigger) == "boolean"){
						return trigger;
					} else {
						// If trigger isn't a Boolean, set default behavior
						// i.e DNP menus are always shown
						return true;
					}
				})
				.map(menu => {
					const title = menu.getAttribute("data-title")!;

					// e.g. [2023,5,6] is June 6th, 2023
					// For the month to be parsed correctly, the array has to be spread - otherwise it will be off by 1
					const date_as_array = JSON.parse(menu.getAttribute("data-dnp-date")!) as [number, number, number];
					const dnp_date = new Date(...date_as_array).toDateString();

					const added = items
						.filter(it => new Date(it.data.dateAdded).toDateString() == dnp_date)
						.map(it => cleanRelatedItem(it, { pdfs, notes }, roamCitekeys));
					return { div: menu, added, title };
				})
				.filter(menu => menu.added)
				.map((menu, i) => {
					const { added, div, title } = menu;
					return (
						createPortal(<DNPMenu key={i} 
							added={added} title={title} />, div)
					);
				});
		}
	}, [itemList, menus, roamCitekeys, trigger]);

	return <>{dnpPortals}</>;
}


function TagMenuFactory({ menus }: { menus: Element[] }){
	const [{ trigger }] = usePageMenuSettings();
	const [{ dataRequests }] = useRequestsSettings();
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();
	
	const itemQueries = useItems(dataRequests, {
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
					if(typeof(trigger) == "boolean"){
						return trigger;
					} else {
						// If trigger isn't a Boolean, set default behavior
						// i.e page menus are shown only if the page title is > 5 characters
						const title = menu.getAttribute("data-title")!;
						return title.length > 5;
					}
				})
				.map(menu => {
					const title = menu.getAttribute("data-title")!;
					const results = with_tags_or_abstract.reduce<{ with_tags: SCleanRelatedItem[], with_abstract: SCleanRelatedItem[] }>((obj, item) => {
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

	return <>{tagPortals}</>;
}


export {
	CitekeyMenuFactory,
	DNPMenuFactory,
	TagMenuFactory
};
