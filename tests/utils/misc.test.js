import { executeFunctionByName } from "../../src/utils";

test("Executes a window function by name", () => {
	window.customFunc = jest.fn();
	executeFunctionByName("customFunc", window);
	expect(window.customFunc).toHaveBeenCalled();
});

test("Executes a window function by name, with args", () => {
	window.customFunc = jest.fn();
	executeFunctionByName("customFunc", window, "my arg");
	expect(window.customFunc).toHaveBeenCalledWith("my arg");
});