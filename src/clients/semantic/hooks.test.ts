import { renderHook } from "@testing-library/react-hooks";
import { wrapper } from "../query-test-wrapper";

import { useSemantic } from "./hooks";
import { transformDOIs } from "../../utils";

import { semantics } from "Mocks/semantic-scholar";


describe("useSemantic", () => {
	const cases = Object.entries(semantics);

	test.each(cases)(
		"returns fetch results - %s",
		async (doi, expectation) => {
			const { result, waitFor } = renderHook(() => useSemantic(doi, {}), { wrapper });

			await waitFor(() => !result.current.isLoading);

			expect(result.current.data)
				.toEqual({
					doi,
					citations: transformDOIs(expectation.citations),
					references: transformDOIs(expectation.references)
				});
		}
	);
});