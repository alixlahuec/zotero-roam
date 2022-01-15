function findRoamPage(title){
	let pageSearch = window.roamAlphaAPI.q("[:find ?uid :in $ ?title :where[?p :node/title ?title][?p :block/uid ?uid]]", title);
	if(pageSearch.length > 0){
		return pageSearch[0][0];
	} else{
		return false;
	}
}

function getCitekeyPages(){
	return new Map(window.roamAlphaAPI.q("[:find ?title ?uid :where[?e :node/title ?title][(clojure.string/starts-with? ?title '@')][?e :block/uid ?uid]]"));
}

export {
	findRoamPage,
	getCitekeyPages
};