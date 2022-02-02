export function getItemTags(item, {tags_as = "string"} = {}){
	let tagsList = Array.from(new Set(item.data.tags.map(t => t.tag)));

	switch(tags_as){
	case "array":
		return tagsList;
	case "string":
	default:
		return tagsList.map(tag => "#[[" + tag + "]]").join(", ");
	}
}
