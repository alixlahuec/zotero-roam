import { rest } from "msw";
import { handleAPIKey } from "./zotero/keys";

export const handlers = [
	handleAPIKey,
	// Fallback
	rest.get("*", (req, res, ctx) => {
		return res(
			ctx.status(404, "You need to add a handler for " + req.url),
			ctx.json({})
		);
	})
];