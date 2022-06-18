import { rest } from "msw";
import { handleCollections } from "./zotero/collections";
import { handleAPIKey } from "./zotero/keys";

export const handlers = [
	...handleCollections,
	handleAPIKey,
	// Fallback
	rest.get("*", (req, res, ctx) => {
		return res(
			ctx.status(404, "You need to add a handler for " + req.url),
			ctx.json({})
		);
	})
];