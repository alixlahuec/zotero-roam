import { analyzeUserRequests } from "../../src/utils";
import { apiKeys} from "../../mocks/zotero/keys";
import { libraries } from "../../mocks/zotero/libraries";

const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath } } = libraries;

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