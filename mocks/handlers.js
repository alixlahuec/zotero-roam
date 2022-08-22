/* istanbul ignore file */
import { handleAPIKey } from "./zotero/keys";
import { handleBibliography } from "./zotero/bib";
import { handleCitoid } from "./citoid";
import { handleCollections } from "./zotero/collections";
import { handleDeleted } from "./zotero/deleted";
import { handleItems } from "./zotero/items";
import { handleSemantic } from "./semantic-scholar";
import { handleTags } from "./zotero/tags";
import { rest } from "msw";

export const fallbackHandler = rest.get(
	"*", 
	(req, res, ctx) => {
		return res(
			ctx.status(404, "You need to add a handler for " + req.url)
		);
	}
);

export const roamAssetsHandler = rest.get(
	"https://roamresearch.com/assets/*", 
	(req, _res, _ctx) => req.passthrough()
);

export const sciteAssetsHandler = rest.get(
	"https://cdn.scite.ai/assets/*",
	(req, _res, _ctx) => req.passthrough()
);

export const apiHandlers = [
	handleBibliography,
	handleCitoid,
	handleCollections,
	handleDeleted,
	...handleItems,
	handleSemantic,
	...handleTags,
	handleAPIKey
];