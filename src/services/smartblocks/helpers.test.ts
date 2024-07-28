import { evalTerm, reformatImportableBlocks } from "./helpers";


const props = ["systems", "culture", "PKM"];

test("Simple term evals correctly", () => {
	expect(evalTerm("systems", props)).toBe(true);
	expect(evalTerm("software", props)).toBe(false);
	expect(evalTerm("-TODO", props)).toBe(true);
});

test("Simple grouping evals correctly", () => {
	expect(evalTerm("(systems&software)", props)).toBe(false);
	expect(evalTerm("(software|TODO)", props)).toBe(false);
	expect(evalTerm("(PKM&culture)", props)).toBe(true);
});

describe("reformatImportableBlocks", () => {
	const cases = [
		[
			[],
			[]
		],
		[
			["some", "block"],
			[
				{ string: "some", text: "some", children: [] },
				{ string: "block", text: "block", children: [] }
			]
		],
		[
			["some", { string: "object", text: "object", children: [] }],
			[
				{ string: "some", text: "some", children: [] },
				{ string: "object", text: "object", children: [] }
			]
		],
		[
			["some", { string: "object", text: "object", children: ["child", "string"] }],
			[
				{ string: "some", text: "some", children: [] },
				{
					string: "object", text: "object", children: [
						{ string: "child", text: "child", children: [] },
						{ string: "string", text: "string", children: [] }
					]
				}
			]
		]
	];

	test.each(cases)(
		"%# - %s",
		(arr, expectation) => {
			expect(reformatImportableBlocks(arr))
				.toEqual(expectation);
		}
	);

	it("throws when passed an invalid element", () => {
		// @ts-expect-error "Test expects bad input"
		expect(() => reformatImportableBlocks([23]))
			.toThrow("All array items should be of type String or Object, not number");
	});
});