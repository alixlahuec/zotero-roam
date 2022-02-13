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

function getTagUsage(token, {count_roam = false} = {}){
	return token.zotero.reduce((count, tag) => count += tag.meta.numItems, 0) + (count_roam ? token.roam.length : 0);
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
							// Spread is required because array cloning via Array.from, spread, etc. is only shallow
							// i.e, nested arrays will be copied as references not values
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
	matchTagData,
	sortTags
};
