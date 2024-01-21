import { H5 } from "@blueprintjs/core";

import zrToaster from "Components/ExtensionToaster";
import { ZoteroRoamLog } from "./logging";


describe("Custom class for logs", () => {
	beforeAll(() => {
		jest.useFakeTimers()
			.setSystemTime(new Date(2022, 4, 6));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	test("It uses fallback values", () => {
		const sample_log = new ZoteroRoamLog();

		expect(sample_log)
			.toEqual({
				context: {},
				detail: "",
				intent: "primary",
				level: "info",
				message: "",
				origin: "",
				timestamp: new Date(2022, 4, 6)
			});
	});

	test("It initializes with values provided", () => {
		const sample_log = new ZoteroRoamLog(
			{
				origin: "API",
				message: "Failed to fetch",
				context: {
					text: "some text"
				}
			},
			"error"
		);

		expect(sample_log)
			.toEqual({
				context: {
					text: "some text"
				},
				detail: "",
				intent: "danger",
				level: "error",
				message: "Failed to fetch",
				origin: "API",
				timestamp: new Date(2022, 4, 6)
			});
	});

	test("It calls the toaster when showToaster is provided", () => {
		const showToasterFn = jest.spyOn(zrToaster, "show");

		const log_contents = {
			origin: "Metadata",
			message: "Failed to import metadata for @someCitekey",
			context: {
				text: "some text"
			}
		};

		new ZoteroRoamLog({ ...log_contents }, "error");
		expect(showToasterFn).not.toHaveBeenCalled();

		new ZoteroRoamLog({ ...log_contents, showToaster: 1500 }, "error");
		expect(showToasterFn).toHaveBeenCalled();
		expect(showToasterFn).toHaveBeenCalledWith({
			icon: "warning-sign",
			intent: "danger",
			message: log_contents.message,
			timeout: 1500
		});

		new ZoteroRoamLog({ ...log_contents, showToaster: true }, "warning");
		expect(showToasterFn).toHaveBeenCalledTimes(2);
		expect(showToasterFn).toHaveBeenNthCalledWith(2, {
			icon: "warning-sign",
			intent: "warning",
			message: log_contents.message,
			timeout: 1000
		});
	});

	test("It creates the right message for the toaster", () => {
		const showToasterFn = jest.spyOn(zrToaster, "show");

		new ZoteroRoamLog({
			origin: "Metadata",
			message: "Failed to import metadata for @someCitekey",
			detail: "Function customFunc doesn't exist",
			context: {},
			showToaster: 1000
		}, "error");

		expect(showToasterFn).toHaveBeenCalled();
		expect(showToasterFn).toHaveBeenCalledWith({
			icon: "warning-sign",
			intent: "danger",
			message: (
				<>
					<H5>{"Failed to import metadata for @someCitekey"}</H5>
					<p>{"Function customFunc doesn't exist"}</p>
				</>
			),
			timeout: 1000
		});
	});
});