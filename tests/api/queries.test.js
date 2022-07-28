import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-hooks";

import { goodIdentifier, badIdentifier } from "Mocks/citoid";
import { findCollections } from "Mocks/zotero/collections";
import { findItems } from "Mocks/zotero/items";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";
import { tags } from "Mocks/zotero/tags";
import { useQuery_Citoid, useQuery_Collections, useQuery_Items, useQuery_Semantic, useQuery_Tags, useWriteableLibraries } from "../../src/api/queries"; 
import { makeTagList, parseSemanticDOIs } from "../../src/api/utils";
import { semantics } from "Mocks/semantic-scholar";

const { 
	keyWithFullAccess: { key: masterKey },
	keyWithNoGroupAccess: { key: userOnlyKey },
} = apiKeys;
const { 
	userLibrary: { path: userPath }, 
	groupLibrary: { path: groupPath } 
} = libraries;

// https://tkdodo.eu/blog/testing-react-query
const wrapper = ({ children }) => {
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
		async(_id, urls, options, expectation) => {
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
		const reqs = Object.values(libraries).map((lib, ind) => ({
			apikey: masterKey,
			dataURI: `${lib.path}/items`,
			library: lib.path,
			name: `${ind}`,
			params: ""
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