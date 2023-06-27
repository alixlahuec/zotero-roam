import { searchEngine } from "../../src/utils";


describe("Search engine inputs", () => {
	it("rejects invalid search inputs", () => {
		// @ts-expect-error "Test expects bad input"
		expect(() => searchEngine("query", { text: "" }))
			.toThrow("Unexpected input type Object : target should be a String or an Array");
	});
	
	it("applies search to an array", () => {
		const targets = [
			"Lorem ipsum",
			"dolor sit amet",
			"consectetur adipiscing elit"
		];
		expect(searchEngine("ipsum", targets))
			.toBe(true);
	});

	describe("escapes strings with special characters", () => {
		const cases = [
			"In-text *asterisks*",
			"*Self-Management"
		];

		test.each(cases)(
			"%# - %s",
			(target) => {
				expect(searchEngine("*", target))
					.toBe(true);
				expect(searchEngine(target, target))
					.toBe(true);
			}
		);
	});
});

test("Case-sensitive search", () => {
	const targets = [
		"You could use some systems thinking.",
		"What about systems?",
		"Systems are key.",
		"Really, SYSTEMS you say?"
	];
	expect(targets.map(target => searchEngine("systems", target, { any_case: false })))
		.toEqual([
			true, 
			true, 
			false, 
			false
		]);
});

describe("Search - matching modes", () => {
	it("matches on partial words", () => {
		const targets = [
			"There are new renderings.",
			"This might rend the cloth.",
			"Is this a trend?"
		];
		expect(targets.map(target => searchEngine("rend", target, { match: "partial" })))
			.toEqual([
				true,
				true,
				true
			]);
	});
	
	it("matches on word boundaries only", () => {
		const targets = [
			"This was the turning point of the enterprise.",
			"The turn of the century upended it all.",
			"They did not expect his return."
		];
		expect(targets.map(target => searchEngine("turn", target, { match: "word" })))
			.toEqual([
				false,
				true,
				false
			]);
	});

	it("finds exact matches - single-word query", () => {
		const targets = [
			"organization",
			"organizational",
			"an organization"
		];
		expect(targets.map(target => searchEngine("organization", target, { match: "exact" })))
			.toEqual([
				true,
				false,
				false
			]);
	});
	
	it("finds exact matches - multi-word query", () => {
		const targets = [
			"knowledge management",
			"personal knowledge management"
		];
		expect(targets.map(target => searchEngine("knowledge management", target, { match: "exact" })))
			.toEqual([
				true,
				false
			]);
	});
});

describe("Search - compounds", () => {
	it("matches compounds - single-word query", () => {
		const targets = [
			"These antipatterns provide unique insights.",
			"This is likely one of its anti-patterns.",
			"You can begin by identifying anti patterns."
		];
		expect(targets.map(target => searchEngine("anti-patterns", target, { search_compounds: true })))
			.toEqual([
				true,
				true,
				true
			]);
	});
	
	it("matches compounds - multi-word query", () => {
		const targets = [
			"There are inter-operational models in development",
			"I've been reading about interoperational models",
			"These inter operational models are questionable"
		];
		expect(targets.map(target => searchEngine("inter-operational models", target, { search_compounds: true })))
			.toEqual([
				true,
				true,
				true
			]);
	});
});

describe("Search - word order", () => {
	it("matches words in the order provided", () => {
		const targets = [
			"That would decide world order",
			"There could be order in the world"
		];
		expect(targets.map(target => searchEngine("world order", target, { word_order: "strict" })))
			.toEqual([
				true,
				false
			]);
	});
	
	it("matches words in any order", () => {
		const targets = [
			"That would decide world order",
			"There could be order in the world"
		];
		expect(targets.map(target => searchEngine("world order", target, { word_order: "loose" })))
			.toEqual([
				true,
				true
			]);
	});

	it("matches in the order provided, on word boundaries", () => {
		const targets = [
			"That would decide world order",
			"There could be order in the world",
			"World order is a long way from here",
			"The order of the world could have been decided",
			"Ordering the world does not work"
		];
		expect(targets.map(target => searchEngine("world order", target, { word_order: "strict", match: "word" })))
			.toEqual([
				true,
				false,
				true,
				false,
				false
			]);
	});
	
	it("matches words in any order, on word boundaries", () => {
		const targets = [
			"That would decide world order",
			"There could be order in the world",
			"World order is a long way from here",
			"The order of the world could have been decided",
			"Ordering the world does not work"
		];
		expect(targets.map(target => searchEngine("world order", target, { word_order: "loose", match: "word" })))
			.toEqual([
				true,
				true,
				true,
				true,
				false
			]);
	});
});