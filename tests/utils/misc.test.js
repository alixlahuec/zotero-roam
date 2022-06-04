import { executeFunctionByName } from "../../src/utils";

describe("Executing a function by name", () => {
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
});