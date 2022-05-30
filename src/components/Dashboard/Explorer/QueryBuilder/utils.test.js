import { 
	addElemToArray, 
	removeArrayElemAt, 
	returnSiblingArray, 
	updateArrayElemAt } from "./utils";

test("Appends element in array", () => {
	expect(addElemToArray(["a", "b", "c"], {title: "12th century"}))
		.toEqual(["a", "b", "c", {title: "12th century"}]);
});

test("Removes array element at index", () => {
	const arr = ["a", "b", "c"];
	expect(removeArrayElemAt(arr, 0)).toEqual(["b", "c"]);
	expect(removeArrayElemAt(arr, 1)).toEqual(["a", "c"]);
	expect(removeArrayElemAt(arr, 2)).toEqual(["a", "b"]);
	expect(removeArrayElemAt(arr, 3)).toEqual(["a", "b", "c"]);
});

test("Correctly adds sibling to an element", () => {
	const obj = {id: 123};
	expect(returnSiblingArray(obj, {id: 456})).toEqual([{id: 123}, {id: 456}]);
	expect(returnSiblingArray([obj], {id: 456})).toEqual([{id: 123}, {id: 456}]);
});

test("Updates value of array element", () => {
	const arr = ["a", "b", "c"];
	expect(updateArrayElemAt(arr, 0, {id: 123})).toEqual([{id: 123}, "b", "c"]);
	expect(updateArrayElemAt(arr, 3, {id: 456})).toEqual(["a", "b", "c", {id: 456}]);
});