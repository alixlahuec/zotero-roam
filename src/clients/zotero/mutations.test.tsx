import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-hooks";
import { mock } from "vitest-mock-extended";

import { fetchItems, fetchTags } from "./base";
import { useDeleteTags, useImportCitoids, useModifyTags } from "./mutations";

import { apiKeys, citoids, goodIdentifier, libraries } from "Mocks";
import { DataRequest } from "Types/extension";
import { isFulfilled } from "Types/helpers";


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

const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
const dispatchEventSpy = vi.spyOn(document, "dispatchEvent");

// https://tkdodo.eu/blog/testing-react-query
const wrapper = ({ children }) => {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("Mutation hooks for the Zotero API", () => {
	afterEach(() => {
		queryClient.clear();
	});

	describe("useDeleteTags", () => {
		beforeEach(async() => {
			const mockData = await fetchTags({ apikey: masterKey, path: userLibrary.path });
			queryClient.setQueryData(["tags", { library: userLibrary.path }], () => mockData);
		});

		test("callback on success", async () => {
			const { result, waitFor } = renderHook(() => useDeleteTags(), { wrapper });

			expect(result.current.status).toBe("idle");
			act(() => {
				result.current.mutate({
					library: { apikey: masterKey, path: userLibrary.path },
					tags: ["systems"]
				});
			});
			await waitFor(() => result.current.status == "success");

			expect(invalidateQueriesSpy).toHaveBeenCalledWith(
				["items", userLibrary.path],
				{ refetchType: "all" },
				{ throwOnError: true }
			);

			expect((dispatchEventSpy.mock.calls[0][0] as CustomEvent).detail).toEqual({
				args: { tags: ["systems"] },
				error: null,
				library: userLibrary.path,
				_type: "tags-deleted"
			});
		});
	});

	describe("useImportCitoids", () => {

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

			expect(invalidateQueriesSpy).toHaveBeenCalledWith(
				["items", userLibrary.path],
				{ refetchType: "all" }
			);

			expect((dispatchEventSpy.mock.calls[0][0] as CustomEvent).detail).toEqual({
				args: {
					collections: [],
					items: [citoids[goodIdentifier]],
					tags: []
				},
				data: {
					failed: [],
					successful: result.current.data?.filter(isFulfilled).map(res => res.value.data)
				},
				error: null,
				library: userLibrary.path,
				_type: "write"
			});
		});
	});

	describe("useModifyTags", () => {
		const sample_req = mock<DataRequest>({ apikey: masterKey, dataURI: `${groupLibrary.path}/items`, library: { path: groupLibrary.path } });

		beforeEach(async() => {
			const mockData = await fetchItems(
				{ ...sample_req, since: 0 },
				{ match: [] },
				queryClient
			);
			queryClient.setQueryData(["items", groupLibrary.path, {}], () => mockData);
		});

		test("callback on success", async () => {
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

			expect(invalidateQueriesSpy).toHaveBeenCalledWith(
				["items", groupLibrary.path],
				{ refetchType: "all" }
			);

			expect((dispatchEventSpy.mock.calls[0][0] as CustomEvent).detail).toEqual({
				args: {
					into: "HOUSING",
					tags: ["housing"]
				},
				data: {
					failed: [],
					successful: result.current.data?.filter(isFulfilled).map(res => res.value.data)
				},
				error: null,
				library: groupLibrary.path,
				_type: "tags-modified"
			});
		});
	});

});
