import { camelToTitleCase } from "./common";


describe("camelToTitleCase", () => {
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