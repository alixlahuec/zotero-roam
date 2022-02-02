import { findRoamPage } from "../roam";

export function getItemCreators(item, {creators_as = "string", brackets = true, use_type = true} = {}){
	let creatorsInfoList = item.data.creators.map(creator => {
		let nameTag = (creator.name) ? `${creator.name}` : `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
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
