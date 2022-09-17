import { TYPEMAP_DEFAULT } from "../../src/constants";
import { analyzeUserRequests, setupInitialSettings } from "../../src/setup";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { id: userLibID, path: userPath }, groupLibrary: { id: groupLibID, path: groupPath } } = libraries;

describe("Parsing user data requests", () => {
	it("passes if an empty array of requests is provided", () => {
		expect(analyzeUserRequests([]))
			.toEqual({
				apiKeys: [],
				dataRequests: [],
				libraries: []
			});
	});
	
	it("throws if none of the requests has an API key", () => {
		const reqs = [
			{ dataURI: "users/12345/items" },
			{ dataURI: "groups/98765/items/top" }
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("At least one data request must be assigned an API key. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
	});
	
	it("throws if any of the requests is missing a data URI", () => {
		const reqs = [
			{ dataURI: "users/12345/items" },
			{ apikey: "XXXXXXXXXX" }
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});
	
	it("throws if any of the requests has an incorrect data URI", () => {
		const reqs = [
			{ dataURI: "users/12345/items" },
			{ dataURI: "groups/some_group_name/items", apikey: "XXXXXXXXXX" }
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("An incorrect data URI was provided for a request : groups/some_group_name/items. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials");
	});

	it("throws if any of the requests has an incorrect library ID", () => {
		const reqs = [
			{ library: { type: "users", id: "username" }, apikey: "XXXXXXXXXX" },
			{ library: { type: "groups", id: "123456" } }
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("A library ID is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});

	it("throws if any of the requests has an incorrect library type", () => {
		const reqs = [
			{ library: { type: "libraryname", id: "12345" }, apikey: "XXXXXXXXXX" },
			{ library: { type: "groups", id: "98765" } }
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("A library type is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});

	/* This is needed to support manual install via roam/js when the user has specified their dataRequests as an Object */
	it("accepts an Object as input", () => {
		const reqs = {
			apikey: "XXXXXXXXXX",
			dataURI: "users/12345/items"
		};

		const expected = {
			dataRequests: [
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } }
			],
			apiKeys: ["XXXXXXXXXX"],
			libraries: [
				{ path: "users/12345", apikey: "XXXXXXXXXX" }
			]
		};

		expect(analyzeUserRequests(reqs))
			.toEqual(expected);
	});
	
	it("returns proper configuration when given correct input", () => {
		const reqs = [
			{ dataURI: "users/12345/items", name: "My personal library" },
			{ dataURI: "users/12345/items/top" },
			{ dataURI: "groups/98765/items/top", apikey: "XXXXXXXXXX" }
		];

		const expected = {
			dataRequests: [
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "My personal library", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } },
				{ dataURI: "users/12345/items/top", apikey: "XXXXXXXXXX", name: "", library: { id: "12345", path: "users/12345", type: "users", uri: "items/top" } },
				{ dataURI: "groups/98765/items/top", apikey: "XXXXXXXXXX", name: "", library: { id: "98765", path: "groups/98765", type: "groups", uri: "items/top" } },
			],
			apiKeys: ["XXXXXXXXXX"],
			libraries: [
				{ path: "users/12345", apikey: "XXXXXXXXXX" },
				{ path: "groups/98765", apikey: "XXXXXXXXXX" }
			]
		};

		expect(analyzeUserRequests(reqs))
			.toEqual(expected);

	});

	it("returns proper configuration when given correct input (from library)", () => {
		const reqs = [
			{ library: { type: "users", id: "12345" }, name: "My personal library" },
			{ library: { type: "users", id: "12345" } },
			{ library: { type: "groups", id: "98765" }, apikey: "XXXXXXXXXX" }
		];

		const expected = {
			dataRequests: [
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "My personal library", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } },
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } },
				{ dataURI: "groups/98765/items", apikey: "XXXXXXXXXX", name: "", library: { id: "98765", path: "groups/98765", type: "groups", uri: "items" } },
			],
			apiKeys: ["XXXXXXXXXX"],
			libraries: [
				{ path: "users/12345", apikey: "XXXXXXXXXX" },
				{ path: "groups/98765", apikey: "XXXXXXXXXX" }
			]
		};

		expect(analyzeUserRequests(reqs))
			.toEqual(expected);

	});
});

describe("Parsing mock data requests", () => {
	it("should be a valid configuration", () => {
		const reqs = [
			{ dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
			{ dataURI: groupPath + "/items", apikey: "", name: "My group library" }
		];
		expect(analyzeUserRequests(reqs))
			.toEqual({
				apiKeys: [masterKey],
				dataRequests: [
					{ 
						apikey: masterKey, 
						dataURI: userPath + "/items", 
						library: {
							id: String(userLibID),
							path: userPath,
							type: "users",
							uri: "items"
						}, 
						name: "My user library" },
					{ 
						apikey: masterKey, 
						dataURI: groupPath + "/items", 
						library: {
							id: String(groupLibID),
							path: groupPath,
							type: "groups",
							uri: "items"
						}, 
						name: "My group library" }
				],
				libraries: [
					{ apikey: masterKey, path: userPath },
					{ apikey: masterKey, path: groupPath }
				]
			});
	});
});

describe("Parsing initial user settings", () => {
	const defaults = {
		annotations: {
			func: "",
			group_by: false,
			template_comment: "{{comment}}",
			template_highlight: "[[>]] {{highlight}} ([p. {{page_label}}]({{link_page}})) {{tags_string}}",
			use: "default",
			__with: "formatted"
		},
		autocomplete: {
			display: "citekey",
			format: "citation",
			trigger: "",
		},
		copy: {
			always: false,
			overrideKey: "shiftKey",
			preset: "citekey",
			template: "@{{key}}",
			useAsDefault: "preset",
			useQuickCopy: false
		},
		metadata: {
			func: "",
			smartblock: {
				param: "srcUid",
				paramValue: ""
			},
			use: "default"
		},
		notes: {
			func: "",
			split_char: "",
			split_preset: "\n",
			split_use: "preset",
			use: "default",
			__with: "text"
		},
		other: {
			autoload: false,
			darkTheme: false,
			render_inline: false
		},
		pageMenu: {
			defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
			trigger: "default"
		},
		sciteBadge: {
			layout: "horizontal",
			showLabels: false,
			showZero: true,
			small: false,
			tooltipPlacement: "auto",
			tooltipSlide: 0
		},
		shortcuts: {
			"copyDefault": "",
			"copyCitation": "",
			"copyCitekey": "",
			"copyPageRef": "",
			"copyTag": "",
			"focusSearchBar": "",
			"goToItemPage": "",
			"importMetadata": "",
			"toggleDashboard": "",
			"toggleNotes": "alt+N",
			"toggleSearchPanel": "alt+E",
			"toggleSettingsPanel": "",
			"toggleQuickCopy": ""
		},
		typemap: TYPEMAP_DEFAULT,
		webimport: {
			tags: []
		}
	};

	it("should return defaults if given no settings", () => {
		expect(JSON.stringify(setupInitialSettings({ dataRequests: [] })))
			.toEqual(JSON.stringify(defaults));
	});
});