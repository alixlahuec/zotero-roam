import { ReactChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WrapperComponent, renderHook } from "@testing-library/react-hooks";

import { mock } from "jest-mock-extended";
import * as apiUtils from "../../src/api/utils";
import { wrappedFetchItems, useQuery_Citoid, useQuery_Collections, useQuery_Items, useQuery_Semantic, useQuery_Tags, useWriteableLibraries } from "../../src/api/queries";

import { apiKeys, badIdentifier, goodIdentifier, findCollections, findItems, items, libraries, semantics, tags } from "Mocks";
import { DataRequest } from "Types/extension";


const { makeTagList, parseSemanticDOIs } = apiUtils;

const { 
	keyWithFullAccess: { key: masterKey },
	keyWithNoGroupAccess: { key: userOnlyKey }
} = apiKeys;
const { 
	userLibrary: { path: userPath }, 
	groupLibrary: { path: groupPath } 
} = libraries;

// https://github.com/swc-project/swc/discussions/7024#discussioncomment-6629202
jest.mock("../../src/api/utils", () => ({
	__esModule: true,
	...jest.requireActual("../../src/api/utils")
}));

// https://tkdodo.eu/blog/testing-react-query
const wrapper: WrapperComponent<{ children: ReactChildren }> = ({ children }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Set global defaults here
			}
		},
		logger: {
			log: console.log,
			warn: console.warn,
			error: () => {}
		}
	});
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("Hook for citoid queries", () => {
	const cases = [
		[
			"1 valid identifier",
			[goodIdentifier],
			{},
			["success"]
		],
		[
			"1 invalid identifier",
			[badIdentifier],
			{},
			["error"]
		],
		[
			"1 valid + 1 invalid",
			[goodIdentifier, badIdentifier],
			{ retry: false },
			["success", "error"]
		]
	];

	test.each(cases)(
		"%s",
		async(_id, urls: string[], options: Record<string, any>, expectation) => {
			const { result, waitFor } = renderHook(() => useQuery_Citoid(urls, options), { wrapper });

			await waitFor(
				() => result.current.every(res => !res.isLoading),
				{
					timeout: 3000
				});

			expect(result.current.map(res => res.status))
				.toEqual(expectation);
		}
	);
});

describe("Hook for semantic queries", () => {
	const cases = Object.entries(semantics);

	test.each(cases)(
		"returns fetch results - %s",
		async(doi, expectation) => {
			const { result, waitFor } = renderHook(() => useQuery_Semantic(doi, {}), { wrapper });

			await waitFor(() => !result.current.isLoading);

			expect(result.current.data)
				.toEqual({
					doi,
					citations: parseSemanticDOIs(expectation.citations),
					references: parseSemanticDOIs(expectation.references)
				});
		}
	);
});

describe("Hook for collections queries", () => {
	it("returns fetch results", async() => {
		const libs = Object.values(libraries).map(lib => ({
			apikey: masterKey,
			path: lib.path
		}));
    
		const { result, waitFor } = renderHook(() => useQuery_Collections(libs, {}), { wrapper });
    
		await waitFor(() => result.current.every(res => !res.isLoading));

		const libData = Object.values(libraries).map(lib => ({
			data: findCollections(lib.type, lib.id, 0),
			lastUpdated: lib.version
		}));
    
		expect(result.current.map(res => res.data))
			.toEqual(libData);
	});
});

describe("Hook for items queries", () => {
	it("returns fetch results", async() => {
		const reqs = Object.values(libraries).map((lib) => mock<DataRequest>({
			apikey: masterKey,
			dataURI: `${lib.path}/items`,
			library: { path: lib.path }
		}));

		const { result, waitFor } = renderHook(() => useQuery_Items(reqs, {}), { wrapper });

		await waitFor(() => result.current.every(res => !res.isLoading));

		const itemData = Object.values(libraries).map(lib => ({
			data: findItems({ type: lib.type, id: lib.id, since: 0 }),
			lastUpdated: lib.version
		}));

		expect(result.current.map(res => res.data))
			.toEqual(itemData);
	});
});

describe("Hook for tags queries", () => {
	it("returns fetch results", async() => {
		const libs = Object.values(libraries).map(lib => ({
			apikey: masterKey,
			path: lib.path
		}));

		const { result, waitFor } = renderHook(() => useQuery_Tags(libs, {}), { wrapper });

		await waitFor(() => result.current.every(res => !res.isLoading));

		const tagData = Object.values(libraries).map(lib => ({
			data: makeTagList(tags[lib.path]),
			lastUpdated: lib.version
		}));

		expect(result.current.map(res => res.data))
			.toEqual(tagData);
	});
});

describe("Hook for writeable libraries", () => {
	test("Key with full access", async() => {
		const libs = [
			{ apikey: masterKey, path: userPath },
			{ apikey: masterKey, path: groupPath }
		];

		const { result, waitFor } = renderHook(() => useWriteableLibraries(libs), { wrapper });

		await waitFor(() => !result.current.isLoading);
  
		expect(result.current.data)
			.toEqual(libs);

	});

	test("Key with no group access", async() => {
		const libs = [
			{ apikey: userOnlyKey, path: userPath },
			{ apikey: userOnlyKey, path: groupPath }
		];

		const { result, waitFor } = renderHook(() => useWriteableLibraries(libs), { wrapper });

		await waitFor(() => !result.current.isLoading);
  
		expect(result.current.data)
			.toEqual([
				{ apikey: userOnlyKey, path: userPath }
			]);

	});
});

describe("Wrapper for fetching items", () => {
	let client: QueryClient;
	const sample_req = mock<DataRequest>({
		library: {
			path: userPath
		},
		apikey: masterKey,
		dataURI: userPath + "/items"
	});
	const { apikey, library, ...identifiers } = sample_req;
	const fetchItemsSpy = jest.spyOn(apiUtils, "fetchItems");

	beforeEach(() => {
		client = new QueryClient();
	});

	test("Fetching items when query cache is empty", async() => {
		await wrappedFetchItems(sample_req, client);

		expect(fetchItemsSpy).toHaveBeenCalledWith({ ...sample_req, since: 0 }, { match: [] }, client);
	});

	test("Fetching items when query cache has version data", async() => {
		const cachedData = {
			data: [items[0]],
			lastUpdated: 13
		};
		client.setQueryData(
			["items", library.path, { ...identifiers }],
			(_prev) => cachedData
		);

		await wrappedFetchItems(sample_req, client);

		expect(fetchItemsSpy).toHaveBeenCalledWith({ ...sample_req, since: cachedData.lastUpdated }, { match: cachedData.data }, client);
	});
});