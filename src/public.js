import { findRoamPage } from "./roam";
import { getPDFLink } from "./utils";

function formatPDFs(pdfs, as = "links"){
	if(!pdfs){
		return [];
	} else {
		switch(as){
		case "identity":
			return pdfs.map(file => ({
				title: file.data.title, 
				key: file.key, 
				link: getPDFLink(file, as = "href")
			}));
		case "links":
		default:
			return pdfs.map(file => getPDFLink(file, as = "markdown"));
		}
	}
}

function _getItemCollections(item, collectionList, { brackets = true } = {}){
	if(item.data.collections.length > 0){
		let output = [];

		item.data.collections.forEach(cl => {
			let libCollection = collectionList.find(el => el.key == cl);
			if(libCollection){ output.push(libCollection.data.name); }
		});

		return (brackets == true ? output.map(cl => `[[${cl}]]`) : output).join(", ");
	} else {
		return false;
	}
}

function getItemCreators(item, { creators_as = "string", brackets = true, use_type = true } = {}){
	let creatorsInfoList = item.data.creators.map(creator => {
		let nameTag = creator.name || `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
		return {
			name: nameTag,
			type: creator.creatorType,
			inGraph: findRoamPage(nameTag)
		};
	});
	switch(creators_as){
	case "identity":
		return creatorsInfoList;
	case "array":
		return creatorsInfoList.map(c => c.name);
	case "string":
	default:
		if(use_type == true){
			return creatorsInfoList.map(creator => {
				let creatorTag = brackets == true ? `[[${creator.name}]]` : creator.name;
				return creatorTag + (creator.type == "author" ? "" : ` (${creator.type})`);
			}).join(", ");
		} else {
			return creatorsInfoList.map(creator => {
				return (brackets == true ? `[[${creator.name}]]` : creator.name);
			}).join(", ");
		}
	}
}

function getItemTags(item, { brackets = true } = {}){
	let tags = item.data.tags.map(t => t.tag);
	return (brackets == true ? tags.map(el => `#[[${el}]]`) : tags).join(", ");
}

function _getItemRelated(item, datastore, { return_as = "citekeys", brackets = true } = {}){
	if(item.data.relations && item.data.relations["dc:relation"]){
		let relatedItems = item.data.relations["dc:relation"];
		if(relatedItems.constructor === String){ relatedItems = [relatedItems]; }
        
		let output = [];
		let relRegex = /(users|groups)\/([^/]+)\/items\/(.+)/g;
        
		relatedItems.forEach(itemURI => {
			let [ , , , itemKey] = Array.from(itemURI.matchAll(relRegex))[0];
			let libItem = datastore.find(it => it.data.key == itemKey);
			if(libItem){ output.push(libItem); }
		});
        
		switch(return_as){
		case "raw":
			return output;
		case "citekeys":
		default:
			return (brackets == true ? output.map(i => `[[@${i.key}]]`) : output.map(i => i.key));
		}
	} else {
		return false;
	}
}

function _getItemType(item, typemap, { brackets = true } = {}){
	let type = typemap[item.data.itemType] || item.data.itemType;
	return (brackets == true ? `[[${type}]]` : type);
}

export {
	formatPDFs,
	getItemCreators,
	getItemTags,
	_getItemCollections,
	_getItemRelated,
	_getItemType
};
