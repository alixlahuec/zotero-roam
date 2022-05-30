import { getInitialedPages } from "../../../roam";
import { searchEngine } from "../../../utils";

function getTagStats(tagListData){
	return tagListData.map(t => {
		return {
			nTags: t.zotero.length,
			nAuto: t.zotero.length == 0 ? 0 : t.zotero.filter(tag => tag.meta.type == 1).length,
			in_roam: t.roam.length > 0 ? 1 : 0
		};
	}).reduce((out, tk) => {
		out.nTags += tk.nTags;
		out.nAuto += tk.nAuto;
		out.nRoam += tk.in_roam;
		return out;
	}, 
	{nTags: 0, nAuto: 0, nRoam: 0, nTotal: tagListData.length});
}

function getTagUsage(entry, {count_roam = false} = {}){
	return entry.zotero.reduce((count, tag) => count += tag.meta.numItems, 0) + (count_roam ? entry.roam.length : 0);
}

function isSingleton(entry){
	return entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));
}

function makeSuggestionFor(entry){
	let roamTags = entry.roam.map((el) => el.title);
	let zoteroTags = entry.zotero.reduce((arr, el) => {
		if (roamTags.includes(el.tag) || arr.includes(el.tag)) {
		// Do nothing
		} else {
			arr.push(el.tag);
		}
		return arr;
	}, []);

	let use = {
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
				recommend: null,
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

/** Matches Zotero tags with existing Roam pages
 * @param {Object<String, Array>} tagList - The list of tokenized Zotero tags
 * @returns {Promise<{}[]>}
 */
function matchTagData(tagList){
	return new Promise((resolve) => {
		setTimeout(() => {
			const data = Object.keys(tagList).map(initial => {
				let rdata = getInitialedPages(Array.from(new Set([initial, initial.toUpperCase()])))
					.sort((a,b) => a.title > b.title ? -1 : 1);
				let zdata = Array.from(tagList[initial]);
				
				for(let elem of rdata){
					let in_table = zdata.findIndex(token => searchEngine(elem.title, token.token, {match: "exact"}));
					if(in_table >= 0){
						let { roam, ...rest } = zdata[in_table];
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

/** Sorts Zotero tags
 * @param {{roam: [], zotero: []}[]} tagList - The list of Zotero tags to sort
 * @param {("alphabetical"|"roam"|"usage")} by - The type of sorting to use
 * @returns 
 */
function sortTags(tagList, by = "alphabetical"){
	let arr = [...tagList];
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
