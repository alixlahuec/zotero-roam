import { searchEngine } from "../../src/utils";

test("Rejects invalid search inputs", () => {
	expect(() => searchEngine("query", {text: ""}))
		.toThrow();
});

test("Apply search to array", () => {
	const targets = [
		"Lorem ipsum",
		"dolor sit amet",
		"consectetur adipiscing elit"
	];
	expect(searchEngine("ipsum", targets))
		.toBe(true);
});

test("Case-sensitive search", () => {
	let targets = [
		"You could use some systems thinking.",
		"What about systems?",
		"Systems are key.",
		"Really, SYSTEMS you say?"
	];
	expect(targets.map(target => searchEngine("systems", target, { any_case: false})))
		.toEqual([
			true, 
			true, 
			false, 
			false
		]);
});

test("Include matches on partial words", () => {
	let targets = [
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

test("Match on word boundaries only", () => {
	let targets = [
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

test("Exact match only - single-word query", () => {
	let targets = [
		"organization",
		"organizational",
		"an organization",
	];
	expect(targets.map(target => searchEngine("organization", target, { match: "exact" })))
		.toEqual([
			true,
			false,
			false
		]);
});

test("Exact match only - multi-word query", () => {
	let targets = [
		"knowledge management",
		"personal knowledge management",
	];
	expect(targets.map(target => searchEngine("knowledge management", target, { match: "exact" })))
		.toEqual([
			true,
			false
		]);
});

test("Match compounds - single-word query", () => {
	let targets = [
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

test("Match compounds - multi-word query", () => {
	let targets = [
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

test("Match words in order", () => {
	let targets = [
		"That would decide world order",
		"There could be order in the world"
	];
	expect(targets.map(target => searchEngine("world order", target, { word_order: "strict" })))
		.toEqual([
			true,
			false
		]);
});

test("Match words in any order", () => {
	let targets = [
		"That would decide world order",
		"There could be order in the world"
	];
	expect(targets.map(target => searchEngine("world order", target, { word_order: "loose" })))
		.toEqual([
			true,
			true
		]);
});

test("Match word boundaries in any order", () => {
	let targets = [
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

test("Match word boundaries in strict order", () => {
	let targets = [
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