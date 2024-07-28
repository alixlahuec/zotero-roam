import { renderHook } from "@testing-library/react-hooks";
import { mock } from "vitest-mock-extended";
import { wrapper } from "../query-test-wrapper";

import { makeTagList } from "./helpers";
import { useCollections, useItems, useTags, useWriteableLibraries } from "./hooks";

import { apiKeys, findCollections, findItems, libraries, tags } from "Mocks";
import { DataRequest } from "Types/extension";


const {
	keyWithFullAccess: { key: masterKey },
	keyWithNoGroupAccess: { key: userOnlyKey }
} = apiKeys;
const {
	userLibrary: { path: userPath },
	groupLibrary: { path: groupPath }
} = libraries;


describe("useCollections", () => {
	it("returns fetch results", async () => {
		const libs = Object.values(libraries).map(lib => ({
			apikey: masterKey,
			path: lib.path
		}));

		const { result, waitFor } = renderHook(() => useCollections(libs, {}), { wrapper });

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
	it("returns fetch results", async () => {
		const reqs = Object.values(libraries).map((lib) => mock<DataRequest>({
			apikey: masterKey,
			dataURI: `${lib.path}/items`,
			library: { path: lib.path }
		}));

		const { result, waitFor } = renderHook(() => useItems(reqs, {}), { wrapper });

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
	it("returns fetch results", async () => {
		const libs = Object.values(libraries).map(lib => ({
			apikey: masterKey,
			path: lib.path
		}));

		const { result, waitFor } = renderHook(() => useTags(libs, {}), { wrapper });

		await waitFor(() => result.current.every(res => !res.isLoading));

		const tagData = Object.values(libraries).map(lib => ({
			data: makeTagList(tags[lib.path]),
			lastUpdated: lib.version
		}));

		expect(result.current.map(res => res.data))
			.toEqual(tagData);
	});
});

describe("useWriteableLibraries", () => {
	test("Key with full access", async () => {
		const libs = [
			{ apikey: masterKey, path: userPath },
			{ apikey: masterKey, path: groupPath }
		];

		const { result, waitFor } = renderHook(() => useWriteableLibraries(libs), { wrapper });

		await waitFor(() => !result.current.isLoading);

		expect(result.current.data)
			.toEqual(libs);

	});

	test("Key with no group access", async () => {
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
