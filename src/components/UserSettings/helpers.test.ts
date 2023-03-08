import { camelToTitleCase } from "./helpers";


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