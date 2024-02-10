import { renderHook } from "@testing-library/react-hooks";
import { wrapper } from "../query-test-wrapper";
import { useCitoids } from "./hooks";

import { badIdentifier, goodIdentifier } from "Mocks/citoid";


describe("useCitoids", () => {
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
		async (_id, urls: string[], options: Record<string, any>, expectation) => {
			const { result, waitFor } = renderHook(() => useCitoids(urls, options), { wrapper });

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