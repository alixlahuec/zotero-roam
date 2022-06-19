import { rest } from "msw";
import { handleCitoid } from "./citoid";
import { handleCollections } from "./zotero/collections";
import { handleAPIKey } from "./zotero/keys";

export const fallbackHandler = rest.get(
	"*", 
	(req, res, ctx) => {
		return res(
			ctx.status(404, "You need to add a handler for " + req.url)
		);
	}
);

export const roamAssetsHandler = rest.get(
	"https://roamresearch.com/assets/css/*", 
	(req, res, ctx) => {
		return res(
			ctx.status(301, "Ignoring a request for Roam CSS resources at " + req.url)
		);
	}
);

export const apiHandlers = [
	handleCitoid,
	...handleCollections,
	handleAPIKey
];