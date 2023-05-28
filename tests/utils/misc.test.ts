import { addElemToArray, removeArrayElemAt, updateArrayElemAt, camelToTitleCase, executeFunctionByName, hasNodeListChanged } from "../../src/utils";


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

describe("Convert camelCase to Title Case", () => {
	const cases = [
		["someText", "Some Text"],
		["toggleDashboard", "Toggle Dashboard"],
		["copyAsReference", "Copy As Reference"]
	];

	test.each(cases)(
		"%# - %s",
		(input, expectation) => {
			expect(camelToTitleCase(input))
				.toBe(expectation);
		}
	);
});

describe("Executing a function by name", () => {
	afterEach(() => {
		if(global.customFunc){
			delete global.customFunc;
		}
	});

	it("executes a function attached to the window", () => {
		global.customFunc = jest.fn();
		executeFunctionByName("customFunc", window);
		expect(global.customFunc).toHaveBeenCalled();
	});

	it("executes the function with args", () => {
		global.customFunc = jest.fn();
		executeFunctionByName("customFunc", window, "my arg");
		expect(global.customFunc).toHaveBeenCalledWith("my arg");
	});

	it("throws a custom error if the function doesn't exist", () => {
		expect(() => {
			executeFunctionByName("customFunc", window);
		}).toThrow("Function customFunc doesn't exist");
	});
});

describe("Checking for changes in a list of nodes", () => {
	document.body.innerHTML = `
		<div class="some-div"></div>
		<div class="another-div"></div>
	`;

	const someNodeList = document.querySelectorAll(".some-div");
	const anotherNodeList = document.querySelectorAll(".another-div");
	const allNodesList = document.querySelectorAll("div");
	const emptyList = document.querySelectorAll(".non-existent-class");

	test("Empty list doesn't get identified as a change", () => {
		expect(hasNodeListChanged(emptyList, emptyList))
			.toBe(false);
	});

	test("Identical list doesn't get identified as a change", () => {
		expect(hasNodeListChanged(someNodeList, someNodeList))
			.toBe(false);
	});

	test("Non-empty list becoming empty is a change", () => {
		expect(hasNodeListChanged(someNodeList, emptyList))
			.toBe(true);
	});

	test("Empty list becoming non-empty is a change", () => {
		expect(hasNodeListChanged(emptyList, someNodeList))
			.toBe(true);
	});

	test("Change in list contents is a change", () => {
		expect(hasNodeListChanged(someNodeList, anotherNodeList))
			.toBe(true);
		expect(hasNodeListChanged(someNodeList, allNodesList))
			.toBe(true);
	});
});