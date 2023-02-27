import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-hooks";

import * as apiUtils from "../../src/api/utils";
import { fetchItems, fetchTags } from "../../src/api/utils";
import { useDeleteTags, useImportCitoids, useModifyTags } from "../../src/api/write";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";
import { citoids, goodIdentifier } from "Mocks/citoid";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { groupLibrary, userLibrary } = libraries;

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
		const deleteTagsSpy = jest.spyOn(apiUtils, "deleteTags");

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

			expect(document.dispatchEvent.mock.calls[0][0].detail).toEqual({
				data: result.current.data,
				error: null,
				library: userLibrary.path,
				tags: ["systems"]
			});
		});
	});

	describe("useImportCitoids", () => {
		const writeCitoidsSpy = jest.spyOn(apiUtils, "writeCitoids");

		test("args passed to writeCitoids", async() => {
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

			expect(writeCitoidsSpy).toHaveBeenCalledWith(
				[citoids[goodIdentifier]],
				{ collections: [], library: { apikey: masterKey, path: userLibrary.path }, tags: [] }
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
					successful: result.current.data.map(res => res.value)
				},
				error: null,
				library: userLibrary.path
			});
		});
	});

	describe("useModifyTags", () => {
		const writeItemsSpy = jest.spyOn(apiUtils, "writeItems");

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
					successful: result.current.data.map(res => res.value)
				},
				error: null,
				library: groupLibrary.path
			});
		});
	});

});