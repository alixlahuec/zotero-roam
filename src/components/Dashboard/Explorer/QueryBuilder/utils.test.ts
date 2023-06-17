import { returnSiblingArray } from "./utils";


test("Correctly adds sibling to an element", () => {
	const obj = { id: 123 };
	expect(returnSiblingArray(obj, { id: 456 })).toEqual([{ id: 123 }, { id: 456 }]);
	expect(returnSiblingArray([obj], { id: 456 })).toEqual([{ id: 123 }, { id: 456 }]);
});