import { rest } from "msw";
import { handleCollections } from "./zotero/collections";
import { handleAPIKey } from "./zotero/keys";

export const handlers = [
	...handleCollections,
	handleAPIKey,
	// Catch requests for Roam CSS assets
	rest.get("https://roamresearch.com/assets/css/*", (req, res, ctx) => {
		return res(
			ctx.status(301, "Ignoring a request for Roam CSS resources at " + req.url)
		);
	}),
	// Fallback
	rest.get("*", (req, res, ctx) => {
		return res(
			ctx.status(404, "You need to add a handler for " + req.url)
		);
	})
];