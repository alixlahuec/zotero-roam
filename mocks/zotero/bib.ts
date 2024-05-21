import { http, HttpResponse } from "msw";

import { makeEntityLinks, makeLibraryMetadata, zotero } from "./common";
import { libraries } from "./libraries";

import { ObjValues } from "../../src/types/helpers";
import { Mocks } from "Mocks";


const { userLibrary } = libraries;

const addMetadata = ({ key, library, version }) => ({
	key,
	version,
	library: makeLibraryMetadata(library),
	links: makeEntityLinks({ key, library }),
	meta: {
		numChildren: 0
	}
});

export const findBibliographyEntry = ({ key, path }: { key: string, path: string }): ObjValues<typeof data> => {
	const [libraryType, libraryID] = path.split("/") as [Mocks.Library["type"], string];
	return Object.values(data).find(item => item.library.type + "s" == libraryType && item.library.id == Number(libraryID) && item.key == key)!;
};

const data: Record<string, Mocks.ItemBibliography> = {
	"itemInLibrary": {
		...addMetadata({
			key: "PPD648N6",
			library: userLibrary,
			version: 1
		}),
		meta: {
			creatorSummary: "Bloch and Rozmovits",
			parsedDate: "2021-11-08"
		},
		bib: "<div class=\"csl-bib-body\" style=\"line-height: 1.35; padding-left: 1em; text-indent:-1em;\">\n  <div class=\"csl-entry\">Bloch, Gary, and Linda Rozmovits. &#x201C;Implementing Social Interventions in Primary Care.&#x201D; <i>CMAJ</i> 193, no. 44 (November 8, 2021): E1696&#x2013;1701. https://doi.org/10.1503/cmaj.210229.</div>\n</div>"
	},
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


export const handleBibliography = http.get<Mocks.RequestParams.Bibliography, never, Mocks.Responses.Bibliography>(
	zotero(":libraryType/:libraryID/items/:itemKey"),
	({ request, params }) => {
		const { libraryType, libraryID, itemKey } = params;
		const url = new URL(request.url);
		const includeFormats = (url.searchParams.get("include") || "").split(",");
        
		const { key, version, library, links, meta, ...outputs } = findBibliographyEntry({ key: `${itemKey}`, path: `${libraryType}/${libraryID}` });

		const formatsData = Object.fromEntries(
			Object.entries(outputs)
				.filter(([format, _output]) => includeFormats.includes(format))) as { bib: string };

		return HttpResponse.json({
			key,
			version,
			library,
			links,
			meta,
			...formatsData
		});
	}
);

export {
	data as bibs
};