import { reformatImportableBlocks } from "./helpers";


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