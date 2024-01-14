import { renderHook } from "@testing-library/react-hooks";
import { wrapper } from "../query-test-wrapper";

import { useSemantic } from "./hooks";
import { parseSemanticDOIs } from "./helpers";

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
					citations: parseSemanticDOIs(expectation.citations),
					references: parseSemanticDOIs(expectation.references)
				});
		}
	);
});