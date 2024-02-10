import { identifyChildren, parseDOI } from "../../../utils";

import { SemanticScholarAPI } from "Types/externals";
import { AsBoolean } from "Types/helpers";
import { isSBacklink, RCitekeyPages, SCleanItem, SEnrichedItem, SEnrichedItemCitation, SEnrichedItemReference, SEnrichedItemTypeEnum, SRelatedEntries, ZItemTop, ZLibraryContents } from "Types/transforms";


/** Formats a list of Semantic Scholar entries for display */
function cleanSemantic(
	datastore: ZLibraryContents,
	semantic: Pick<SemanticScholarAPI.Item, "citations" | "references">,
	roamCitekeys: RCitekeyPages
): SRelatedEntries {
	const { items = [], pdfs = [], notes = [] } = datastore;
	const itemsWithDOIs = items.filter(it => it.data.DOI);
	// * Note: DOIs from the Semantic Scholar queries are sanitized at fetch
	const { citations = [], references = [] } = semantic;

	const clean_citations: SEnrichedItemCitation[] = citations.map((cit) => {
		const cleanProps = matchSemanticEntry(cit, { items: itemsWithDOIs, pdfs, notes }, roamCitekeys);
		return {
			...cleanProps,
			_type: SEnrichedItemTypeEnum.CITING
		};
	});

	const clean_references: SEnrichedItemReference[] = references.map((ref) => {
		const cleanProps = matchSemanticEntry(ref, { items: itemsWithDOIs, pdfs, notes }, roamCitekeys);
		return {
			...cleanProps,
			_type: SEnrichedItemTypeEnum.CITED
		};
	});

	return {
		citations: clean_citations,
		references: clean_references,
		backlinks: [...clean_references, ...clean_citations].filter(isSBacklink)
	};
}


/** Formats the metadata of a Semantic Scholar entry */
function cleanSemanticItem(item: SemanticScholarAPI.RelatedPaper): SCleanItem {
	const clean_item: SCleanItem = {
		authors: "",
		authorsLastNames: [],
		authorsString: "",
		//* Note: SemanticScholar DOIs are sanitized on fetch
		doi: item.doi,
		intent: item.intent,
		isInfluential: item.isInfluential,
		links: {},
		meta: item.venue.split(/ ?:/)[0], // If the publication has a colon, only take the portion that precedes it
		title: item.title,
		url: item.url || "",
		year: item.year ? item.year.toString() : "",
		_multiField: ""
	};

	// Parse authors data
	clean_item.authorsLastNames = item.authors.map(a => getAuthorLastName(a.name));
	clean_item.authorsString = clean_item.authorsLastNames.join(" ");
	clean_item.authors = makeAuthorsSummary(clean_item.authorsLastNames);

	// Parse external links
	if (item.paperId) {
		clean_item.links["semantic-scholar"] = `https://www.semanticscholar.org/paper/${item.paperId}`;
	}
	if (item.arxivId) {
		clean_item.links.arxiv = `https://arxiv.org/abs/${item.arxivId}`;
	}
	if (item.doi || item.title) {
		clean_item.links["connected-papers"] = "https://www.connectedpapers.com/" + (item.doi ? "api/redirect/doi/" + item.doi : "search?q=" + encodeURIComponent(item.title));
		clean_item.links["google-scholar"] = "https://scholar.google.com/scholar?q=" + (item.doi || encodeURIComponent(item.title));
	}

	// Set multifield property for search
	clean_item._multiField = [
		clean_item.authorsString,
		clean_item.year,
		clean_item.title
	].filter(AsBoolean).join(" ");

	return clean_item;
}


/** Compares two Zotero items by publication year then alphabetically, to determine sort order
 * @returns The comparison outcome
 */
function compareItemsByYear(a: ZItemTop, b: ZItemTop): (-1 | 1) {
	if (!a.meta.parsedDate) {
		if (!b.meta.parsedDate) {
			return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
		} else {
			return 1;
		}
	} else {
		if (!b.meta.parsedDate) {
			return -1;
		} else {
			const date_diff = new Date(a.meta.parsedDate).getUTCFullYear() - new Date(b.meta.parsedDate).getUTCFullYear();
			if (date_diff < 0) {
				return -1;
			} else if (date_diff == 0) {
				return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
			} else {
				return 1;
			}
		}
	}
}


/** Extracts an author's last name */
function getAuthorLastName(name: string): string {
	const components = name.replaceAll(".", " ").split(" ").filter(AsBoolean);
	if (components.length == 1) {
		return components[0];
	} else {
		return components.slice(1).filter(c => c.length > 1).join(" ");
	}
}


/** Formats authoring metadata */
function makeAuthorsSummary(names: string[]): string {
	switch (names.length) {
	case 0:
		return "";
	case 1:
		return names[0];
	case 2:
		return names[0] + " & " + names[1];
	case 3:
		return names[0] + ", " + names[1] + " & " + names[2];
	default:
		return names[0] + " et al.";
	}
}


/** Matches a clean Semantic Scholar entry to Zotero and Roam data */
function matchSemanticEntry(
	semanticItem: SemanticScholarAPI.RelatedPaper,
	datastore: Partial<ZLibraryContents>,
	roamCitekeys: RCitekeyPages
): SEnrichedItem {
	const { items = [], pdfs = [], notes = [] } = datastore;
	const cleanItem = cleanSemanticItem(semanticItem);
	if (!cleanItem.doi) {
		return {
			...cleanItem,
			inGraph: false,
			inLibrary: false
		};
	} else {
		const libItem = items.find(it => parseDOI(it.data.DOI) == cleanItem.doi);
		if (!libItem) {
			return {
				...cleanItem,
				inGraph: false,
				inLibrary: false
			};
		} else {
			const itemKey = libItem.data.key;
			const location = libItem.library.type + "s/" + libItem.library.id;
			const children = identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });

			return {
				...cleanItem,
				inGraph: roamCitekeys.get("@" + libItem.key) || false,
				inLibrary: {
					children,
					raw: libItem
				}
			};
		}
	}
}


export { cleanSemantic, cleanSemanticItem, compareItemsByYear, getAuthorLastName, makeAuthorsSummary };