import { queries, runQuerySet } from "./queries";

describe("Input checks", () => {
	const date = new Date([2022,1,1]);
	const inputs = [
		"",
		null,
		undefined,
		["keyword"],
		"query",
		date,
		[date, date],
		[null, date],
		[date, null],
		[null, null],
		["journalArticle", "podcast"],
		["history", "culture"]
	];

	const cases = [
		["Abstract", "exists", []],
		["Abstract", "does not exist", []],
		["Abstract", "contains", ["", "query"]],
		["Abstract", "does not contain", ["", "query"]],
		["Citekey", "exists", []],
		["Citekey", "does not exist", []],
		["DOI", "exists", []],
		["DOI", "does not exist", []],
		["Item added", "before", [date]],
		["Item added", "after", [date]],
		["Item added", "between", [[date, date], [null, date], [date, null], [null, null]]],
		["Item type", "is any of", [["keyword"], ["journalArticle", "podcast"], ["history", "culture"]]],
		["Item type", "is not", [["keyword"], ["journalArticle", "podcast"], ["history", "culture"]]],
		["Notes", "exist", []],
		["Notes", "do not exist", []],
		["PDF", "exists", []],
		["PDF", "does not exist", []],
		["Roam page", "exists", []],
		["Roam page", "does not exist", []],
		["Tags", "include", [["keyword"], ["journalArticle", "podcast"], ["history", "culture"]]],
		["Tags", "include any of", [["keyword"], ["journalArticle", "podcast"], ["history", "culture"]]],
		["Tags", "do not include", [["keyword"], ["journalArticle", "podcast"], ["history", "culture"]]],
		["Title", "contains", ["", "query"]],
		["Title", "does not contain", ["", "query"]]
	];

	test.each(cases)("$s $s accepts: $p", (prop, rel, accepted) => {
		expect(inputs.filter(input => queries[prop][rel].checkInput(input))).toEqual(accepted);
	});

});

describe("Search queries", () => {
	it("returns true when given no terms or incomplete terms", () => {
		expect(runQuerySet(
			[], 
			true, 
			{}
		)).toBe(true);
		expect(runQuerySet(
			[{ property: "Citekey", value: null }],
			true,
			{}
		));
	});

	it("rejects invalid query terms", () => {
		expect(() => runQuerySet(
			["citekey"],
			true,
			{}
		)).toThrow();
	});

	it("supports complex queries", () => {
		const item = {
			abstract: "",
			itemType: "journalArticle",
			raw: {
				data: {
					dateAdded: "2022-03-13T12:00:00Z"
				},
				has_citekey: false
			}
		};

		expect(runQuerySet(
			[
				[
					{ property: "Item added", relationship: "after", value: new Date([2022,1,1])},
					{ property: "Citekey", relationship: "exists", value: null }
				],
				{ property: "Item type", relationship: "is any of", value: ["conferencePaper", "journalArticle"] }
			],
			false,
			item
		)).toBe(true);
	});

	describe("Querying abstract", () => {
		const items = [
			{ abstract: "" },
			{ abstract: "Lorem ipsum" },
			{ abstract: "Knowledge management" }
		];

		it("should identify an empty string as invalid", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Abstract", relationship: "exists", value: null }],
				true,
				item
			))).toEqual(
				[
					false,
					true,
					true
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "Abstract", relationship: "does not exist", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					false,
					false
				]
			);
		});
		it("should find abstracts that contain the input", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Abstract", relationship: "contains", value: "ipsum" }],
				true,
				item
			))).toEqual(
				[
					false,
					true,
					false
				]
			);
		});
		it("should find abstracts that don't contain the input", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Abstract", relationship: "does not contain", value: "knowledge" }],
				true,
				item
			))).toEqual(
				[
					false,
					true,
					false
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "Abstract", relationship: "does not contain", value: "" }],
				true,
				item
			))).toEqual(
				[
					false,
					true,
					true
				]
			);
		});
	});

	describe("Querying citekey", () => {
		it("should detect which items have a citekey", () => {
			const items = [
				{ raw: { has_citekey: true }},
				{ raw: { has_citekey: false }}
			];

			expect(items.map(item => runQuerySet(
				[{ property: "Citekey", relationship: "exists", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					false
				]
			);

			expect(items.map(item => runQuerySet(
				[{ property: "Citekey", relationship: "does not exist", value: null }],
				true,
				item
			))).toEqual(
				[
					false,
					true
				]
			);
		});
	});

	describe("Querying DOI", () => {
		const items = [
			{ raw: { data: { DOI: "" }}},
			{ raw: { data: { DOI: "10.234/biomed.567" }}}
		];
		it("should detect which items have a DOI", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "DOI", relationship: "exists", value: null }],
				true,
				item
			))).toEqual(
				[
					false,
					true
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "DOI", relationship: "does not exist", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					false
				]
			);
		});
	});

	describe("Querying added-on date", () => {
		const items = [
			{ raw: { data: { dateAdded: "2022-03-13T12:00:00Z"}}},
			{ raw: { data: { dateAdded: "2022-04-21T15:30:00Z" }}},
			{ raw: { data: { dateAdded: "2021-11-30T04:45:00Z" }}}
		];
		
		it("should find items added before a date", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "before", value: new Date([2022, 4, 1]) }],
				true,
				item
			))).toEqual(
				[
					true,
					false,
					true
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "before", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					true,
					true
				]
			);
		});

		it("should find items added after a date", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "after", value: new Date([2022, 1, 1]) }],
				true,
				item
			))).toEqual(
				[
					true,
					true,
					false
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "after", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					true,
					true
				]
			);
		});

		it("should find items added during a date range", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "between", value: [new Date([2022, 1, 1]), new Date([2022, 4, 1])] }],
				true,
				item
			))).toEqual(
				[
					true,
					false,
					false
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "between", value: [null, new Date([2022, 4, 1])] }],
				true,
				item
			))).toEqual(
				[
					true,
					false,
					true
				]
			);
			expect(items.map(item => runQuerySet(
				[{ property: "Item added", relationship: "between", value: [new Date([2022, 1, 1]), null] }],
				true,
				item
			))).toEqual(
				[
					true,
					true,
					false
				]
			);
		});
	});

	describe("Querying item type", () => {
		const items = [
			{ itemType: "journalArticle" },
			{ itemType: "podcast" },
			{ itemType: "conferencePaper" }
		];

		it("should find item types contained in an array", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Item type", relationship: "is any of", value: ["book", "bookChapter", "podcast"] }],
				true,
				item
			))).toEqual(
				[
					false,
					true,
					false
				]
			);
		});

		it("should find item types that do not match the input", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Item type", relationship: "is not", value: ["journalArticle"]}],
				true,
				item
			))).toEqual(
				[
					false,
					true,
					true
				]
			);
		});
	});

	describe("Querying notes", () => {
		const items = [
			{ children: { notes: [] }},
			{ children: { notes: [{}] }}
		];

		it("should find items with linked notes", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Notes", relationship: "exist", value: null }],
				true,
				item
			))).toEqual(
				[
					false,
					true
				]
			);
		});

		it("should find items without linked notes", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Notes", relationship: "do not exist", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					false
				]
			);
		});
	});

	describe("Querying PDFs", () => {
		const items = [
			{ children: { pdfs: [] }},
			{ children: { pdfs: [{}] }}
		];

		it("should find items with linked PDF", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "PDF", relationship: "exists", value: null }],
				true,
				item
			))).toEqual(
				[
					false,
					true
				]
			);
		});

		it("should find items without linked PDF", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "PDF", relationship: "does not exist", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					false
				]
			);
		});
	});

	describe("Querying Roam page", () => {
		const items = [
			{ inGraph: "ABCDEF" },
			{ inGraph: false }
		];

		it("should find items that have a Roam page", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Roam page", relationship: "exists", value: null }],
				true,
				item
			))).toEqual(
				[
					true,
					false
				]
			);
		});

		it("should find items that don't have a Roam page", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Roam page", relationship: "does not exist", value: null }],
				true,
				item
			))).toEqual(
				[
					false,
					true
				]
			);
		});
	});

	describe("Querying tags", () => {
		const items = [
			{ tags: [] },
			{ tags: ["PKM", "systems design"] },
			{ tags: ["healthcare"] },
			{ tags: ["healthcare", "policy"] }
		];

		it("should find items with all the input tags", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Tags", relationship: "include", value: ["healthcare", "policy"]}],
				true,
				item
			))).toEqual(
				[
					false,
					false,
					false,
					true
				]
			);
		});

		it("should find items with any of the input tags", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Tags", relationship: "include any of", value: ["healthcare", "policy"]}],
				true,
				item
			))).toEqual(
				[
					false,
					false,
					true,
					true
				]
			);
		});

		it("should find items without any of the input tags", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Tags", relationship: "do not include", value: ["policy", "systems design"]}],
				true,
				item
			))).toEqual(
				[
					true,
					false,
					true,
					false
				]
			);
		});
	});

	describe("Querying title", () => {
		const items = [
			{ title: "Designing systems that work"},
			{ title: "Systems thinking and architecture" },
			{ title: "Knowledge management" }
		];

		it("should find titles that contain the input", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Title", relationship: "contains", value: "systems" }], 
				true, 
				item)))
				.toEqual(
					[
						true,
						true,
						false
					]
				);
		});

		it("should find titles that don't contain the input", () => {
			expect(items.map(item => runQuerySet(
				[{ property: "Title", relationship: "does not contain", value: "systems" }],
				true,
				item)))
				.toEqual(
					[
						false,
						false,
						true
					]
				);
		});
	});

});