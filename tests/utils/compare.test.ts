import { 
	compareItemsByYear,
	matchArrays,
	sortCollections,
	sortElems } from "../../src/utils";

import { ZoteroAPI } from "Types/externals";


test("Sorts Zotero items by publication year & creators", () => {
	const a = { meta: { creatorSummary: "Smith et al.", parsedDate: "" } };
	const b = { meta: { creatorSummary: "Scott et al.", parsedDate: "" } };
	const c = { meta: { creatorSummary: "Smith et al.", parsedDate: "2022-01-01" } };
	const d = { meta: { creatorSummary: "Tikki and Noald", parsedDate: "2021-01-01" } };
	const e = { meta: { creatorSummary: "Chen and Talmanes", parsedDate: "2021" } };

	expect([
		[a, b].sort(compareItemsByYear),
		[a, c].sort(compareItemsByYear),
		[c, a].sort(compareItemsByYear),
		[b, c].sort(compareItemsByYear),
		[c, d].sort(compareItemsByYear),
		[d, c].sort(compareItemsByYear),
		[d, e].sort(compareItemsByYear),
	])
		.toEqual([
			[b, a],
			[c, a],
			[c, a],
			[c, b],
			[d, c],
			[d, c],
			[e, d],
		]);
});

test("Finds if two string arrays have elements in common", () => {
	const arr1 = ["tools", "platforms", "models"];
	const arr2 = ["makers", "founders", "tools"];
	const arr3 = ["makers", "founders", "companies"];

	expect([
		matchArrays(arr1, arr2),
		matchArrays(arr1, arr3)
	])
		.toEqual([
			true,
			false
		]);
});

describe("Zotero collections sorting", () => {
	it("returns an empty array when given an empty input", () => {
		expect(sortCollections([])).toEqual([]);
	});

	it("correctly sorts an array of Zotero collections", () => {
		const colls: ZoteroAPI.Collection[] = [
			{
				"key": "N7W92H48",
				"version": 1,
				"library": {
					"type": "user",
					"id": 475425,
					"name": "Z public library",
					"links": {
						"alternate": {
							"href": "https://www.zotero.org/z_public_library",
							"type": "text/html"
						}
					}
				},
				"links": {
					"self": {
						"href": "https://api.zotero.org/users/475425/collections/N7W92H48",
						"type": "application/json"
					},
					"alternate": {
						"href": "https://www.zotero.org/z_public_library/collections/N7W92H48",
						"type": "text/html"
					}
				},
				"meta": {
					"numCollections": 1,
					"numItems": 16
				},
				"data": {
					"key": "N7W92H48",
					"version": 1,
					"name": "LoC",
					"parentCollection": false,
					"relations": {
		
					}
				}
			},
			{
				"key": "TVPC4XK4",
				"version": 1,
				"library": {
					"type": "user",
					"id": 475425,
					"name": "Z public library",
					"links": {
						"alternate": {
							"href": "https://www.zotero.org/z_public_library",
							"type": "text/html"
						}
					}
				},
				"links": {
					"self": {
						"href": "https://api.zotero.org/users/475425/collections/TVPC4XK4",
						"type": "application/json"
					},
					"alternate": {
						"href": "https://www.zotero.org/z_public_library/collections/TVPC4XK4",
						"type": "text/html"
					},
					"up": {
						"href": "https://api.zotero.org/users/475425/collections/QM6T3KHX",
						"type": "application/atom+xml"
					}
				},
				"meta": {
					"numCollections": 0,
					"numItems": 1
				},
				"data": {
					"key": "TVPC4XK4",
					"version": 1,
					"name": "sherlock films",
					"parentCollection": "QM6T3KHX",
					"relations": {
		
					}
				}
			},
			{
				"key": "M7MNCCXU",
				"version": 1,
				"library": {
					"type": "user",
					"id": 475425,
					"name": "Z public library",
					"links": {
						"alternate": {
							"href": "https://www.zotero.org/z_public_library",
							"type": "text/html"
						}
					}
				},
				"links": {
					"self": {
						"href": "https://api.zotero.org/users/475425/collections/M7MNCCXU",
						"type": "application/json"
					},
					"alternate": {
						"href": "https://www.zotero.org/z_public_library/collections/M7MNCCXU",
						"type": "text/html"
					},
					"up": {
						"href": "https://api.zotero.org/users/475425/collections/N7W92H48",
						"type": "application/atom+xml"
					}
				},
				"meta": {
					"numCollections": 0,
					"numItems": 0
				},
				"data": {
					"key": "M7MNCCXU",
					"version": 1,
					"name": "Digital Newspaper project",
					"parentCollection": "N7W92H48",
					"relations": {
		
					}
				}
			},
			{
				"key": "QM6T3KHX",
				"version": 1,
				"library": {
					"type": "user",
					"id": 475425,
					"name": "Z public library",
					"links": {
						"alternate": {
							"href": "https://www.zotero.org/z_public_library",
							"type": "text/html"
						}
					}
				},
				"links": {
					"self": {
						"href": "https://api.zotero.org/users/475425/collections/QM6T3KHX",
						"type": "application/json"
					},
					"alternate": {
						"href": "https://www.zotero.org/z_public_library/collections/QM6T3KHX",
						"type": "text/html"
					}
				},
				"meta": {
					"numCollections": 1,
					"numItems": 11
				},
				"data": {
					"key": "QM6T3KHX",
					"version": 1,
					"name": "Non-English items",
					"parentCollection": false,
					"relations": {
		
					}
				}
			},
			{
				"key": "2GUIGKC9",
				"version": 1,
				"library": {
					"type": "user",
					"id": 475425,
					"name": "Z public library",
					"links": {
						"alternate": {
							"href": "https://www.zotero.org/z_public_library",
							"type": "text/html"
						}
					}
				},
				"links": {
					"self": {
						"href": "https://api.zotero.org/users/475425/collections/2GUIGKC9",
						"type": "application/json"
					},
					"alternate": {
						"href": "https://www.zotero.org/z_public_library/collections/2GUIGKC9",
						"type": "text/html"
					}
				},
				"meta": {
					"numCollections": 0,
					"numItems": 12
				},
				"data": {
					"key": "2GUIGKC9",
					"version": 1,
					"name": "pubmed",
					"parentCollection": false,
					"relations": {
		
					}
				}
			}
		];
	
		expect(sortCollections(colls))
			.toMatchObject([
				{ key: "N7W92H48", depth: 0 },
				{ key: "M7MNCCXU", depth: 1 },
				{ key: "QM6T3KHX", depth: 0 },
				{ key: "TVPC4XK4", depth: 1 },
				{ key: "2GUIGKC9", depth: 0 }
			]);
	});
});

test("Sorts object arrays on a string key", () => {
	const arr = [
		{ title: "Quantitative theory" },
		{ title: "Quantitative measurement" },
		{ title: "Chaos theory" },
		{ title: "Barometry" },
		{ title: "Swarm intelligence" },
		{ title: "Non-competitive signaling" }
	];
	expect(sortElems(arr, "title"))
		.toEqual([
			{ title: "Barometry" },
			{ title: "Chaos theory" },
			{ title: "Non-competitive signaling" },
			{ title: "Quantitative measurement" },
			{ title: "Quantitative theory" },
			{ title: "Swarm intelligence" }
		]);
});