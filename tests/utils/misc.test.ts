import { vi } from "vitest";

import { addElemToArray, removeArrayElemAt, updateArrayElemAt, executeFunctionByName } from "../../src/utils";


test("Appends element in array", () => {
	expect(addElemToArray(["a", "b", "c"], { title: "12th century" }))
		.toEqual(["a", "b", "c", { title: "12th century" }]);
});

test("Removes array element at index", () => {
	const arr = ["a", "b", "c"];
	expect(removeArrayElemAt(arr, 0)).toEqual(["b", "c"]);
	expect(removeArrayElemAt(arr, 1)).toEqual(["a", "c"]);
	expect(removeArrayElemAt(arr, 2)).toEqual(["a", "b"]);
	expect(removeArrayElemAt(arr, 3)).toEqual(["a", "b", "c"]);
});

test("Updates value of array element", () => {
	const arr: any[] = ["a", "b", "c"];
	expect(updateArrayElemAt(arr, 0, { id: 123 })).toEqual([{ id: 123 }, "b", "c"]);
	expect(updateArrayElemAt(arr, 3, { id: 456 })).toEqual(["a", "b", "c", { id: 456 }]);
});

describe("Executing a function by name", () => {
	afterEach(() => {
		if(global.customFunc){
			delete global.customFunc;
		}
	});

	it("executes a function attached to the window", () => {
		global.customFunc = vi.fn();
		executeFunctionByName("customFunc", window);
		expect(global.customFunc).toHaveBeenCalled();
	});

	it("executes the function with args", () => {
		global.customFunc = vi.fn();
		executeFunctionByName("customFunc", window, "my arg");
		expect(global.customFunc).toHaveBeenCalledWith("my arg");
	});

	it("throws a custom error if the function doesn't exist", () => {
		expect(() => {
			executeFunctionByName("customFunc", window);
		}).toThrow("Function customFunc doesn't exist");
	});
});