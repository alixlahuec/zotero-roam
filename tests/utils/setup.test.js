import { default_typemap } from "../../src/constants";
import { apiKeys} from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

import { analyzeUserRequests, setupInitialSettings } from "../../src/utils";

const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath } } = libraries;

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
			{dataURI: "users/12345/items"},
			{dataURI: "groups/98765/items/top"}
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("At least one data request must be assigned an API key. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
	});
	
	it("throws if any of the requests is missing a data URI", () => {
		const reqs = [
			{dataURI: "users/12345/items"},
			{apikey: "XXXXXXXXXX"}
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});
	
	it("throws if any of the requests has an incorrect data URI", () => {
		const reqs = [
			{dataURI: "users/12345/items"},
			{dataURI: "groups/some_group_name/items", apikey: "XXXXXXXXXX"}
		];
		expect(() => analyzeUserRequests(reqs))
			.toThrow("An incorrect data URI was provided for a request : groups/some_group_name/items. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials");
	});
	
	it("returns proper configuration when given correct input", () => {
		const reqs = [
			{dataURI: "users/12345/items", name: "My personal library"},
			{dataURI: "users/12345/items/top"},
			{dataURI: "groups/98765/items/top", apikey: "XXXXXXXXXX", params: "limit=100"}
		];
		expect(analyzeUserRequests(reqs))
			.toEqual({
				dataRequests: [
					{dataURI: "users/12345/items", apikey: "XXXXXXXXXX", params: "", name: "My personal library", library: "users/12345"},
					{dataURI: "users/12345/items/top", apikey: "XXXXXXXXXX", params: "", name: "1", library: "users/12345"},
					{dataURI: "groups/98765/items/top", apikey: "XXXXXXXXXX", params: "limit=100", name: "2", library: "groups/98765"},
				],
				apiKeys: ["XXXXXXXXXX"],
				libraries: [
					{path: "users/12345", apikey: "XXXXXXXXXX"},
					{path: "groups/98765", apikey: "XXXXXXXXXX"}
				]
			});
	});
});

describe("Parsing mock data requests", () => {
	it("should be a valid configuration", () => {
		const reqs = [
			{ dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
			{ dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
		];
		expect(analyzeUserRequests(reqs))
			.toEqual({
				apiKeys: [masterKey],
				dataRequests: [
					{ 
						apikey: masterKey, 
						dataURI: userPath + "/items", 
						library: userPath, 
						name: "My user library", 
						params: "" },
					{ 
						apikey: masterKey, 
						dataURI: groupPath + "/items", 
						library: groupPath, 
						name: "My group library", 
						params: "" }
				],
				libraries: [
					{ apikey: masterKey, path: userPath },
					{ apikey: masterKey, path: groupPath}
				]
			});
	});
});

describe("Parsing initial user settings", () => {
	const defaults = {
		annotations: {
			comment_prefix: "",
			comment_suffix: "",
			group_by: false,
			highlight_prefix: "[[>]]",
			highlight_suffix: "([p. {{page_label}}]({{link_page}})) {{tags_string}}",
			use: "formatted"
		},
		autocomplete: {},
		autoload: false,
		copy: {
			always: false,
			defaultFormat: "citekey",
			overrideKey: "shiftKey",
			useQuickCopy: false
		},
		darkTheme: false,
		metadata: {
			use: "function"
		},
		notes: {
			split_char: "/n",
			use: "text"
		},
		pageMenu: {
			defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
			trigger: (title) => title.length > 3 || false
		},
		render_inline: false,
		sciteBadge: {
			layout: "horizontal",
			showLabels: false,
			showZero: true,
			small: false,
			tooltipPlacement: "auto",
			tooltipSlide: 0
		},
		shareErrors: false,
		shortcuts: {
			"copyDefault": false,
			"copyCitation": false,
			"copyCitekey": false,
			"copyPageRef": false,
			"copyTag": false,
			"focusSearchBar": false,
			"goToItemPage": false,
			"importMetadata": false,
			"toggleDashboard": false,
			"toggleNotes": "alt+N",
			"toggleSearchPanel": "alt+E",
			"toggleQuickCopy": false
		},
		typemap: default_typemap,
		webimport: {
			tags: []
		}
	};

	it("should return defaults if given no settings", () => {
		expect(JSON.stringify(setupInitialSettings({ dataRequests: [] })))
			.toEqual(JSON.stringify(defaults));
	});
});