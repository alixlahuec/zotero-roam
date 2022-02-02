function _getChildren(item, queryClient) {
	let location = item.library.type + "s/" + item.library.id;
	return _getItems("children", { predicate: (queryKey) => queryKey[1].dataURI.startsWith(location) }, queryClient)
		.filter(el => el.data.parentItem == item.data.key);
}

function _getItems(select = "all", filters = {}, queryClient) {
	let items = queryClient.getQueriesData(["items"], filters).map(query => (query[1] || {}).data || []).flat(1);
	switch(select){
	case "items":
		return items.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType));
	case "attachments":
		return items.filter(it => it.data.itemType == "attachment");
	case "children":
		return items.filter(it => it.data.itemType == "note" || it.data.itemType == "attachment" && it.data.contentType == "application/pdf");
	case "notes":
		return items.filter(it => it.data.itemType == "note");
	case "pdfs":
		return items.filter(it => it.data.itemType == "attachment" && it.data.contentType == "application/pdf");
	case "all":
	default:
		return items;
	}
}

function _getTags(queryClient) {
	return queryClient.getQueriesData(["tags"]).map(query => (query[1] || {}).data || []).flat(1);
}

export {
	_getChildren,
	_getItems,
	_getTags
};