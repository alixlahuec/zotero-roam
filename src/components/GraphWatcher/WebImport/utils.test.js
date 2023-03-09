import { matchArrays } from "./utils";


test("Finds if two string arrays have elements in common", () => {
	const arr1 = ["tools", "platforms", "models"];
	const arr2 = ["makers", "founders", "tools"];
	const arr3 = ["makers", "founders", "companies"];

	expect([
		matchArrays(arr1, arr2),
		matchArrays(arr1, arr3)
	])
		.toEqual([
			true,
			false
		]);
});