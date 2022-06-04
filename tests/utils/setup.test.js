import { analyzeUserRequests } from "../../src/utils";

describe("Parsing user data requests", () => {
	it("throws if no user requests are provided", () => {
		expect(() => analyzeUserRequests([]))
			.toThrow("At least one data request must be specified for the extension to function. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
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