import { sortElems } from "../../src/utils";


test("Sorts object arrays on a string key", () => {
	const arr = [
		{ title: "Quantitative theory" },
		{ title: "Quantitative measurement" },
		{ title: "Chaos theory" },
		{ title: "Barometry" },
		{ title: "Swarm intelligence" },
		{ title: "Non-competitive signaling" }
	];
	expect(sortElems(arr, "title"))
		.toEqual([
			{ title: "Barometry" },
			{ title: "Chaos theory" },
			{ title: "Non-competitive signaling" },
			{ title: "Quantitative measurement" },
			{ title: "Quantitative theory" },
			{ title: "Swarm intelligence" }
		]);
});