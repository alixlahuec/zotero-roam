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

	test.each(cases)(
		"%# %s %s accepts ...", 
		(prop, rel, accepted) => {
			expect(inputs.filter(input => queries[prop][rel].checkInput(input))).toEqual(accepted);
		}
	);

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
					{ property: "Item added", relationship: "after", value: new Date([2022,1,1]) },
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

		const cases = [
			["exists", null, [false, true, true]],
			["does not exist", null, [true, false, false]],
			["contains", "ipsum", [false, true, false]],
			["does not contain", "knowledge", [false, true, false]],
			["does not contain", "", [false, true, true]]
		];

		test.each(cases)(
			"%# Abstract %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Abstract", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);

	});

	describe("Querying citekey", () => {
		const items = [
			{ raw: { has_citekey: true } },
			{ raw: { has_citekey: false } }
		];

		const cases = [
			["exists", null, [true, false]],
			["does not exist", null, [false, true]]
		];

		test.each(cases)(
			"%# Citekey %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Citekey", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying DOI", () => {
		const items = [
			{ raw: { data: { DOI: "" } } },
			{ raw: { data: { DOI: "10.234/biomed.567" } } }
		];

		const cases = [
			["exists", null, [false, true]],
			["does not exist", null, [true, false]]
		];
		
		test.each(cases)(
			"%# DOI %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "DOI", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying added-on date", () => {
		const items = [
			{ raw: { data: { dateAdded: "2022-03-13T12:00:00Z" } } },
			{ raw: { data: { dateAdded: "2022-04-21T15:30:00Z" } } },
			{ raw: { data: { dateAdded: "2021-11-30T04:45:00Z" } } }
		];

		const cases = [
			["before", new Date([2022, 4, 1]), [true, false, true]],
			["before", null, [true, true, true]],
			["after", new Date([2022, 1, 1]), [true, true, false]],
			["after", null, [true, true, true]],
			["between", [new Date([2022, 1, 1]), new Date([2022, 4, 1])], [true, false, false]],
			["between", [null, new Date([2022, 4, 1])], [true, false, true]],
			["between", [new Date([2022, 1, 1]), null], [true, true, false]]
		];

		test.each(cases)(
			"%# Item added %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Item added", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying item type", () => {
		const items = [
			{ itemType: "journalArticle" },
			{ itemType: "podcast" },
			{ itemType: "conferencePaper" }
		];

		const cases = [
			["is any of", ["book", "bookChapter", "podcast"], [false, true, false]],
			["is not", ["journalArticle"], [false, true, true]]
		];

		test.each(cases)(
			"%# Item type %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Item type", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying notes", () => {
		const items = [
			{ children: { notes: [] } },
			{ children: { notes: [{}] } }
		];

		const cases = [
			["exist", null, [false, true]],
			["do not exist", null, [true, false]]
		];

		test.each(cases)(
			"%# Notes %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Notes", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying PDFs", () => {
		const items = [
			{ children: { pdfs: [] } },
			{ children: { pdfs: [{}] } }
		];

		const cases = [
			["exists", null, [false, true]],
			["does not exist", null, [true, false]]
		];

		test.each(cases)(
			"%# PDF %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "PDF", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying Roam page", () => {
		const items = [
			{ inGraph: "ABCDEF" },
			{ inGraph: false }
		];

		const cases = [
			["exists", null, [true, false]],
			["does not exist", null, [false, true]]
		];

		test.each(cases)(
			"%# Roam page %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Roam page", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying tags", () => {
		const items = [
			{ tags: [] },
			{ tags: ["PKM", "systems design"] },
			{ tags: ["healthcare"] },
			{ tags: ["healthcare", "policy"] }
		];

		const cases = [
			["include", ["healthcare", "policy"], [false, false, false, true]],
			["include any of", ["healthcare", "policy"], [false, false, true, true]],
			["do not include", ["policy", "systems design"], [true, false, true, false]]
		];

		test.each(cases)(
			"%# Tags %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Tags", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

	describe("Querying title", () => {
		const items = [
			{ title: "Designing systems that work" },
			{ title: "Systems thinking and architecture" },
			{ title: "Knowledge management" }
		];

		const cases = [
			["contains", "systems", [true, true, false]],
			["does not contain", "systems", [false, false, true]]
		];

		test.each(cases)(
			"%# Title %s (%p) ...",
			(rel, val, output) => {
				expect(items.map(item => runQuerySet(
					[{ property: "Title", relationship: rel, value: val }],
					true,
					item
				))).toEqual(output);
			}
		);
	});

});