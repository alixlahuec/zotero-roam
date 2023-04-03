import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-hooks";

import * as itemUtils from "../../src/api/zotero/items";
import * as citoidUtils from "../../src/api/citoid";
import * as tagsUtils from "../../src/api/zotero/tags";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";
import { citoids, goodIdentifier } from "Mocks/citoid";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { groupLibrary, userLibrary } = libraries;

const { useImportCitoids } = citoidUtils;
const { fetchItems } = itemUtils;
const { fetchTags, useDeleteTags, useModifyTags } = tagsUtils;

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Set global defaults here
		}
	},
	logger: {
		log: console.log,
		warn: console.warn,
		error: () => { }
	}
});

queryClient.invalidateQueries = jest.fn();
document.dispatchEvent = jest.fn();

// https://tkdodo.eu/blog/testing-react-query
const wrapper = ({ children }) => {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("Mutation hooks for the Zotero API", () => {
	afterEach(() => queryClient.clear());

	describe("useDeleteTags", () => {
		const deleteTagsSpy = jest.spyOn(tagsUtils, "deleteTags");

		beforeEach(() => {
			return fetchTags({ apikey: masterKey, path: userLibrary.path })
				.then((mockData) => queryClient.setQueryData(["tags", { library: userLibrary.path }], () => mockData));
		});

		test("args passed to deleteTags", async () => {
			const { result, waitFor } = renderHook(() => useDeleteTags(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					library: { apikey: masterKey, path: userLibrary.path },
					tags: ["systems"]
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(deleteTagsSpy).toHaveBeenCalledWith(
				["systems"],
				{ apikey: masterKey, path: userLibrary.path },
				userLibrary.version
			);
		});

		test("callback on success", async() => {
			const { result, waitFor } = renderHook(() => useDeleteTags(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					library: { apikey: masterKey, path: userLibrary.path },
					tags: ["systems"]
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
				["items", userLibrary.path],
				{ refetchType: "all" },
				{ throwOnError: true }
			);

			console.log(result.current.data);

			expect(document.dispatchEvent.mock.calls[0][0].detail).toEqual({
				args: { tags: ["systems"] },
				error: null,
				library: userLibrary.path,
				_type: "tags-deleted"
			});
		});
	});

	describe("useImportCitoids", () => {
		const writeItemsSpy = jest.spyOn(itemUtils, "writeItems");

		test("args passed to writeItems", async () => {
			const library = { apikey: masterKey, path: userLibrary.path };
			const { result, waitFor } = renderHook(() => useImportCitoids(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					collections: [],
					items: [citoids[goodIdentifier]],
					library,
					tags: []
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(writeItemsSpy).toHaveBeenCalledWith(
				[
					{
						...citoids[goodIdentifier],
						collections: [],
						tags: []
					}
				],
				library
			);
		});

		test("callback on success", async () => {
			const { result, waitFor } = renderHook(() => useImportCitoids(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					collections: [],
					items: [citoids[goodIdentifier]],
					library: { apikey: masterKey, path: userLibrary.path },
					tags: []
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
				["items", userLibrary.path],
				{ refetchType: "all" }
			);

			expect(document.dispatchEvent.mock.calls[0][0].detail).toEqual({
				args: {
					collections: [],
					items: [citoids[goodIdentifier]],
					tags: []
				},
				data: {
					failed: [],
					successful: result.current.data.map(res => res.value.data)
				},
				error: null,
				library: userLibrary.path,
				_type: "write"
			});
		});
	});

	describe("useModifyTags", () => {
		const writeItemsSpy = jest.spyOn(itemUtils, "writeItems");

		beforeEach(() => {
			return fetchItems(
				{ apikey: masterKey, dataURI: `${groupLibrary.path}/items`, library: groupLibrary, since: 0 },
				{ match: [] },
				queryClient
			).then((mockData) => queryClient.setQueryData(["items", groupLibrary.path, {}], () => mockData));
		});

		test("args passed to writeItems", async() => {
			const { result, waitFor } = renderHook(() => useModifyTags(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					into: "HOUSING",
					library: { apikey: masterKey, path: groupLibrary.path },
					tags: ["housing"]
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(writeItemsSpy).toHaveBeenCalledWith(
				[{ key: "D53X926C", version: 17, tags: [{ tag: "HOUSING", type: 0 }] }],
				{ apikey: masterKey, path: groupLibrary.path }
			);
		});

		test("callback on success", async() => {
			const { result, waitFor } = renderHook(() => useModifyTags(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					into: "HOUSING",
					library: { apikey: masterKey, path: groupLibrary.path },
					tags: ["housing"]
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
				["items", groupLibrary.path],
				{ refetchType: "all" }
			);

			expect(document.dispatchEvent.mock.calls[0][0].detail).toEqual({
				args: {
					into: "HOUSING",
					tags: ["housing"]
				},
				data: {
					failed: [],
					successful: result.current.data.map(res => res.value.data)
				},
				error: null,
				library: groupLibrary.path,
				_type: "tags-modified"
			});
		});
	});

});
