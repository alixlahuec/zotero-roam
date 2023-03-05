import { camelToTitleCase, executeFunctionByName, hasNodeListChanged } from "../../src/utils";


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
		if(window.customFunc){
			delete window.customFunc;
		}
	});

	it("executes a function attached to the window", () => {
		window.customFunc = jest.fn();
		executeFunctionByName("customFunc", window);
		expect(window.customFunc).toHaveBeenCalled();
	});

	it("executes the function with args", () => {
		window.customFunc = jest.fn();
		executeFunctionByName("customFunc", window, "my arg");
		expect(window.customFunc).toHaveBeenCalledWith("my arg");
	});

	it("throws a custom error if the function doesn't exist", () => {
		expect(() => {
			executeFunctionByName("customFunc", window);
		}).toThrow("Function customFunc doesn't exist");
	});
});

describe("Checking for changes in a list of nodes", () => {
	const someDiv = document.createElement("div");
	const anotherDiv = document.createElement("div");

	test("Empty list doesn't get identified as a change", () => {
		expect(hasNodeListChanged([], []))
			.toBe(false);
	});

	test("Identical list doesn't get identified as a change", () => {
		expect(hasNodeListChanged([someDiv], [someDiv]))
			.toBe(false);
	});

	test("Non-empty list becoming empty is a change", () => {
		expect(hasNodeListChanged([someDiv], []))
			.toBe(true);
	});

	test("Empty list becoming non-empty is a change", () => {
		expect(hasNodeListChanged([], [someDiv]))
			.toBe(true);
	});

	test("Change in list contents is a change", () => {
		expect(hasNodeListChanged([someDiv], [anotherDiv]))
			.toBe(true);
		expect(hasNodeListChanged([someDiv], [someDiv, anotherDiv]))
			.toBe(true);
	});
});