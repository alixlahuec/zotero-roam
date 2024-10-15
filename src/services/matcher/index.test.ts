import { Query } from ".";

describe("Query", () => {
	describe("_parse()", () => {
		const matcher = new Query("");

		it("handles single-term queries", () => {
			expect(matcher._parse("TODO")).toEqual({
				input: "TODO",
				parsedComponents: {
					operator: "AND",
					reverse: false,
					terms: ["TODO"]
				}
			});

			expect(matcher._parse("-TODO")).toEqual({
				input: "-TODO",
				parsedComponents: {
					operator: "AND",
					reverse: true,
					terms: ["TODO"]
				}
			});

			expect(matcher._parse("(TODO)")).toEqual({
				input: "(TODO)",
				parsedComponents: {
					operator: "AND",
					reverse: false,
					terms: [
						{
							input: "TODO",
							parsedComponents: {
								operator: "AND",
								reverse: false,
								terms: ["TODO"]
							}
						}
					]
				}
			});
		});

		describe("handles operator queries", () => {
			it.each([
				{ query: "history|sociology", operator: "OR" },
				{ query: "-history|sociology", operator: "OR", reverse: true },
				{ query: "history&sociology", operator: "AND" },
				{ query: "-history&sociology", operator: "AND", reverse: true }
			])(
				"$query",
				({ query, operator, reverse = false }) => {
					expect(matcher._parse(query)).toEqual({
						input: query,
						parsedComponents: {
							operator,
							reverse,
							terms: ["history", "sociology"]
						}
					})
				}
			)

			it.each([
				{ query: "(history|sociology)", operator: "OR" },
				{ query: "(history&sociology)", operator: "AND" },
			])(
				"$query",
				({ query, operator }) => {
					expect(matcher._parse(query)).toEqual({
						input: query,
						parsedComponents: {
							operator: "AND",
							reverse: false,
							terms: [
								{
									input: query.slice(1, -1),
									parsedComponents: {
										operator,
										reverse: false,
										terms: ["history", "sociology"]
									}
								}
							]
						}
					})
				}
			)

			it.each([
				{ query: "-(history|sociology)", operator: "OR" },
				{ query: "-(history&sociology)", operator: "AND" },
			])(
				"$query",
				({ query, operator }) => {
					expect(matcher._parse(query)).toEqual({
						input: query,
						parsedComponents: {
							operator: "AND",
							reverse: true,
							terms: [
								{
									input: query.slice(2, -1),
									parsedComponents: {
										operator,
										reverse: false,
										terms: ["history", "sociology"]
									}
								}
							]
						}
					})
				}
			)
		});

		describe("handles multi-level queries", () => {
			it.each([
				{
					query: "(history|sociology)&TODO",
					expectedComponents: {
						operator: "AND",
						reverse: false,
						terms: [
							{
								input: "history|sociology",
								parsedComponents: {
									operator: "OR",
									reverse: false,
									terms: ["history", "sociology"]
								}
							},
							"TODO"
						]
					}
				},
				{
					query: "history|(sociology&TODO)",
					expectedComponents: {
						operator: "OR",
						reverse: false,
						terms: [
							"history",
							{
								input: "sociology&TODO",
								parsedComponents: {
									operator: "AND",
									reverse: false,
									terms: ["sociology", "TODO"]
								}
							}
						]
					}
				},
				{
					query: "(-history)|(sociology&TODO)",
					expectedComponents: {
						operator: "OR",
						reverse: false,
						terms: [
							{
								input: "-history",
								parsedComponents: {
									operator: "AND",
									reverse: true,
									terms: ["history"]
								}
							},
							{
								input: "sociology&TODO",
								parsedComponents: {
									operator: "AND",
									reverse: false,
									terms: ["sociology", "TODO"]
								}
							}
						]
					}
				},
				{
					query: "-history|(sociology&TODO)",
					expectedComponents: {
						operator: "OR",
						reverse: true,
						terms: [
							"history",
							{
								input: "sociology&TODO",
								parsedComponents: {
									operator: "AND",
									reverse: false,
									terms: ["sociology", "TODO"]
								}
							}
						]
					}
				},
				{
					query: "-(history|(sociology&TODO))",
					expectedComponents: {
						operator: "AND",
						reverse: true,
						terms: [
							{
								input: "history|(sociology&TODO)",
								parsedComponents: {
									operator: "OR",
									reverse: false,
									terms: [
										"history",
										{
											input: "sociology&TODO",
											parsedComponents: {
												operator: "AND",
												reverse: false,
												terms: ["sociology", "TODO"]
											}
										}
									]
								}
							}
						]
					}
				},
				{
					query: "-((sociology&TODO)|history)",
					expectedComponents: {
						operator: "AND",
						reverse: true,
						terms: [
							{
								input: "(sociology&TODO)|history",
								parsedComponents: {
									operator: "OR",
									reverse: false,
									terms: [
										{
											input: "sociology&TODO",
											parsedComponents: {
												operator: "AND",
												reverse: false,
												terms: ["sociology", "TODO"]
											}
										},
										"history"
									]
								}
							}
						]
					}
				},
				{
					query: "(-DONE)&(history|sociology)",
					expectedComponents: {
						operator: "AND",
						reverse: false,
						terms: [
							{
								input: "-DONE",
								parsedComponents: {
									operator: "AND",
									reverse: true,
									terms: ["DONE"]
								}
							},
							{
								input: "history|sociology",
								parsedComponents: {
									operator: "OR",
									reverse: false,
									terms: ["history", "sociology"]
								}
							}
						]
					}
				}
			])(
				"$query",
				({ query, expectedComponents }) => {
					expect(matcher._parse(query)).toEqual({
						input: query,
						parsedComponents: expectedComponents
					});
				}
			);
		});
	});

	describe("match()", () => {
		const props = ["systems", "culture", "PKM"];
		const predicate = (q: string) => props.includes(q);
	
		const cases = [
			{ query: "systems", expectation: true },
			{ query: "software", expectation: false },
			{ query: "-TODO", expectation: true },
			{ query: "systems&software", expectation: false },
			{ query: "(systems&software)", expectation: false },
			{ query: "software|TODO", expectation: false },
			{ query: "(software|TODO)", expectation: false },
			{ query: "PKM&culture", expectation: true },
			{ query: "(PKM&culture)", expectation: true },
			{ query: "TODO&(systems|culture)", expectation: false },
			{ query: "history|(systems&culture)", expectation: true },
			// Ambiguous negations are supported but should be avoided
			{ query: "-systems&TODO", expectation: true },
			// Explicit parentheses are preferred
			{ query: "-(systems&TODO)", expectation: true },
			{ query: "(-systems)&TODO", expectation: false }
		] as const;
	
		test.each(cases)(
			"query: $query | expect: $expectation",
			({ query, expectation }) => {
				const matcher = new Query(query)
				expect(matcher.match(predicate)).toBe(expectation)
			}
		)
	})
});
