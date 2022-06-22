import { zotero } from "./common";
import { rest } from "msw";
import { libraries } from "./libraries";

const { userLibrary } = libraries;

const addMetadata = ({ key, library, version }) => {
	const { id, name: libName, path, type } = library;

	return {
		key,
		version,
		library: {
			type,
			id,
			name: libName,
			links: {
				alternate: {
					href: "https://www.zotero.org/" + (type == "user" ? libName : path),
					type: "text/html"
				}
			}
		},
		links: {
			self: {
				href: `https://api.zotero.org/${path}/items/${key}`,
				type: "application/json"
			},
			alternate: {
				href: `https://www.zotero.org/${type == "user" ? libName : path}/items/${key}`,
				type: "text/html"
			}
		},
		meta: {
			numChildren: 0
		}
	};
};

export const findBibliographyEntry = ({ key, path }) => {
	const [libraryType, libraryID] = path.split("/");
	return Object.values(data).find(item => item.library.type + "s" == libraryType && item.library.id == libraryID && item.key == key);
};

const data = {
	"itemFromUserLibrary": {
		...addMetadata({
			key: "PYTM394",
			library: userLibrary,
			version: 91
		}),
		meta: {
			creatorSummary: "Agarwal et al.",
			parsedDate: "2021-07-22"
		},
		bib: "<div class=\"csl-bib-body\" style=\"line-height: 1.35; padding-left: 1em; text-indent:-1em;\">\n  <div class=\"csl-entry\">Agarwal, Payal, Rick Wang, Christopher Meaney, Sakina Walji, Ali Damji, Navsheer Gill Toor, Gina Yip, et al. &#x201C;Sociodemographic Differences in Patient Experience with Virtual Care during COVID-19.&#x201D; medRxiv, July 22, 2021. https://www.medrxiv.org/content/10.1101/2021.07.19.21260373v1.</div>\n</div>"
	}
};

export const handleBibliography = rest.get(
	zotero(":libraryType/:libraryID/items/:itemKey"),
	(req, res, ctx) => {
		const { libraryType, libraryID, itemKey } = req.params;
		const include = req.url.searchParams.get("include") || "bib";
        
		const { key, version, library, links, meta, [include]: output } = findBibliographyEntry({ key: itemKey, path: `${libraryType}/${libraryID}`});

		return res(
			ctx.json({
				key,
				version,
				library,
				links,
				meta,
				[include]: output
			})
		);
	}
);

export {
	data as bibs
};