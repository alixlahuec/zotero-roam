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
	/https:\/\/roamresearch\.com\/assets\//, 
	(req, _res, _ctx) => {
		return req.passthrough();
	}
);

export const apiHandlers = {
	citoid: [handleCitoid],
	zotero: [
		...handleCollections,
		handleAPIKey
	]
};