import { rest } from "msw";

export const handlers = [
	// Fallback
	rest.get("*", (req, res, ctx) => {
		return res(
			ctx.status(404, "You need to add a handler for " + req.url),
			ctx.json({})
		);
	})
];