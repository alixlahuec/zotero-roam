import { eval_term } from "../src/smartblocks";

// Queries

const props = ["systems", "culture", "PKM"];

test("Simple term evals correctly", () => {
	expect(eval_term("systems", props)).toBe(true);
	expect(eval_term("software", props)).toBe(false);
	expect(eval_term("-TODO", props)).toBe(true);
});

test("Simple grouping evals correctly", () => {
	expect(eval_term("(systems&software)", props)).toBe(false);
	expect(eval_term("(software|TODO)", props)).toBe(false);
	expect(eval_term("(PKM&culture)", props)).toBe(true);
});