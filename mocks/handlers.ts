/* istanbul ignore file */
import { http, passthrough, HttpResponse } from "msw";
import { handleAPIKey } from "./zotero/keys";
import { handleBibliography } from "./zotero/bib";
import { handleCitoid } from "./citoid";
import { handleCollections } from "./zotero/collections";
import { handleDeleted } from "./zotero/deleted";
import { handleItems } from "./zotero/items";
import { handleSemantic } from "./semantic-scholar";
import { handleTags } from "./zotero/tags";


export const fallbackHandler = http.get(
	"*", 
	({ request }) => {
		return new HttpResponse(null, { status: 404, statusText: "You need to add a handler for " + request.url });
	}
);

export const chromaticHandler = http.get(
	"https://*.chromatic.com/assets/*",
	() => passthrough()
);

export const roamAssetsHandler = http.get(
	"https://roamresearch.com/assets/*", 
	() => passthrough()
);

export const sciteApiHandler = http.post(
	"https://api.scite.ai/*",
	() => passthrough()
);

export const sciteAssetsHandler = http.get(
	"https://cdn.scite.ai/assets/*",
	() => passthrough()
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