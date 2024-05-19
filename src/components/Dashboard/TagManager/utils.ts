import { getInitialedPages } from "@services/roam";
import { TagManagerSortBy } from "./types";

import { searchEngine } from "../../../utils";
import { ZTagEntry, ZTagList, ZTagStats, ZTagSuggestion } from "Types/transforms";


/** Compiles statistics about tags (automatic vs manual, in Roam vs not in Roam, totals)
 * @param tagListData - The list of matched tags, as returned by {@link matchTagData}
 * @returns 
 */
function getTagStats(tagListData: ZTagEntry[]): ZTagStats{
	return tagListData.map(t => {
		return {
			nTags: t.zotero.length,
			nAuto: t.zotero.length == 0 ? 0 : t.zotero.filter(tag => tag.meta.type == 1).length,
			in_roam: t.roam.length > 0 ? 1 : 0
		};
	}).reduce<ZTagStats>((out, tk) => {
		out.nTags += tk.nTags;
		out.nAuto += tk.nAuto;
		out.nRoam += tk.in_roam;
		return out;
	}, 
	{ nTags: 0, nAuto: 0, nRoam: 0, nTotal: tagListData.length });
}


/** Compiles the usage count for a given tag. This returns the number of Zotero items which use the tag, with an option to add +1 if the tag has a Roam page. */
function getTagUsage(entry: ZTagEntry, { count_roam = false }: { count_roam?: boolean } = {}): number{
	return entry.zotero.reduce((count, tag) => {
		return count + tag.meta.numItems;
	}, 0) + (count_roam ? entry.roam.length : 0);
}


/** Evaluates if a given tag is a singleton (i.e, has a single version in Zotero and Roam). */
function isSingleton(entry: ZTagEntry): boolean{
	return entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));
}


/** Emits a suggestion, if possible, for handling a given tag. */
function makeSuggestionFor(entry: ZTagEntry): ZTagSuggestion{
	const roamTags = entry.roam.map((el) => el.title);
	const zoteroTags = entry.zotero.reduce<string[]>((arr, el) => {
		if (roamTags.includes(el.tag) || arr.includes(el.tag)) {
		// Do nothing
		} else {
			arr.push(el.tag);
		}
		return arr;
	}, []);

	const use = {
		roam: roamTags,
		zotero: zoteroTags
	};

	if (roamTags.length == 0) {
		if (entry.zotero.length == 1) {
			return {
				recommend: zoteroTags[0],
				type: null,
				use
			};
		} else if (zoteroTags.length == 1) {
			return {
				recommend: zoteroTags[0],
				type: "auto",
				use
			};
		} else {
			return {
				recommend: entry.zotero.find(t => t.meta.type == 0)?.tag || null,
				type: "manual",
				use
			};
		}
	} else if (roamTags.length == 1) {
		if (zoteroTags.length == 0) {
			return {
				recommend: roamTags[0],
				type: entry.zotero.length == 1 ? null : "auto", // To support case where tag is in Roam + duplicate in Zotero
				use
			};
		} else {
			return {
				recommend: roamTags[0],
				type: "auto",
				use
			};
		}
	} else {
		return {
			recommend: null,
			type: "manual",
			use
		};
	}
}


/** Matches Zotero tags with existing Roam pages */
function matchTagData(tagList: ZTagList): Promise<ZTagEntry[]>{
	return new Promise((resolve) => {
		setTimeout(() => {
			const data = Object.keys(tagList).map(initial => {
				const rdata = getInitialedPages(Array.from(new Set([initial, initial.toUpperCase()])))
					.sort((a,b) => a.title > b.title ? -1 : 1);
				const zdata = Array.from(tagList[initial]);
				
				for(const elem of rdata){
					const in_table = zdata.findIndex(token => searchEngine(elem.title, token.token, { match: "exact" }));
					if(in_table >= 0){
						const { roam, ...rest } = zdata[in_table];
						zdata[in_table] = { 
							// * Spread is required because array cloning via Array.from, spread, etc. is only shallow
							// * i.e, nested arrays will be copied as references not values
							roam: [...roam, elem],
							...rest
						};
					}
				}
			
				return zdata ;
				
			}).flat(1);
	
			resolve(data);
		}, 0);
	});
}


/** Sorts Zotero tags */
function sortTags(tagList: ZTagEntry[], by: TagManagerSortBy = TagManagerSortBy.ALPHABETICAL){
	const arr = [...tagList];
	switch(by){
	case "usage":
		return arr.sort((a,b) => {
			return getTagUsage(a) > getTagUsage(b) ? -1 : 1;
		});
	case "roam":
		return arr.sort((a,b) => a.roam.length > b.roam.length ? -1 : 1);
	case "alphabetical":
	default:
		return arr;
	}
}

export {
	getTagStats,
	getTagUsage,
	isSingleton,
	makeSuggestionFor,
	matchTagData,
	sortTags
};
