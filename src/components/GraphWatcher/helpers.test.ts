import { hasNodeListChanged, sortElems } from "./helpers";


describe("hasNodeListChanged", () => {
	document.body.innerHTML = `
		<div class="some-div"></div>
		<div class="another-div"></div>
	`;

	const someNodeList = document.querySelectorAll(".some-div");
	const anotherNodeList = document.querySelectorAll(".another-div");
	const allNodesList = document.querySelectorAll("div");
	const emptyList = document.querySelectorAll(".non-existent-class");

	test("Empty list doesn't get identified as a change", () => {
		expect(hasNodeListChanged(emptyList, emptyList))
			.toBe(false);
	});

	test("Identical list doesn't get identified as a change", () => {
		expect(hasNodeListChanged(someNodeList, someNodeList))
			.toBe(false);
	});

	test("Non-empty list becoming empty is a change", () => {
		expect(hasNodeListChanged(someNodeList, emptyList))
			.toBe(true);
	});

	test("Empty list becoming non-empty is a change", () => {
		expect(hasNodeListChanged(emptyList, someNodeList))
			.toBe(true);
	});

	test("Change in list contents is a change", () => {
		expect(hasNodeListChanged(someNodeList, anotherNodeList))
			.toBe(true);
		expect(hasNodeListChanged(someNodeList, allNodesList))
			.toBe(true);
	});
});

describe("sortElems", () => {
	it("sorts object arrays on a string key", () => {
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
});