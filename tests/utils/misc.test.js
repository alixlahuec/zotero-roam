import { emitCustomEvent } from "../../src/events";
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

test("Event emitter warns about unrecognized event names", () => {
	console.warn = jest.fn();
	emitCustomEvent("unrecognized-event-name");
	expect(console.warn).toHaveBeenCalled();
});