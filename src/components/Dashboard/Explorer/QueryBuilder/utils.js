function addElemToArray(arr, elem){
	return [...arr, elem];
}

function removeArrayElemAt(arr, index){
	return [...arr.slice(0, index), ...arr.slice(index + 1, arr.length)];
}

function returnSiblingArray(elem, sibling){
	if(elem.constructor === Array){
		return addElemToArray(elem, sibling);
	} else {
		return [elem, sibling];
	}
}

function updateArrayElemAt(arr, index, value){
	return [...arr.slice(0, index), value, ...arr.slice(index + 1, arr.length)];
}

export {
	addElemToArray,
	removeArrayElemAt,
	returnSiblingArray,
	updateArrayElemAt
};