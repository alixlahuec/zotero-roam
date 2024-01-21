import axios from "axios";


describe("Mock fallback", () => {
	it("is called when no matching handler exists", async () => {
		const res = await axios.get("https://example.com/")
			.catch((error) => {
				if (error.response) {
					return error.response;
				}
			});
		expect(res.status).toBe(404);
		expect(res.statusText).toBe("You need to add a handler for https://example.com/");
	});
});