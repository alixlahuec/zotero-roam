import { identifyChildren, parseDOI } from "../../../utils";
import { ZoteroItemAnnotation, ZoteroItemAttachment, ZoteroItemNote, ZoteroItemTop } from "Types/externals/zotero";
import { RoamCitekeysList } from "Types/roam";
import { ZLibraryContents } from "Types/zotero";
import { SemanticScholarItem, SemanticScholarRelatedEntry } from "Types/externals/semantic";


type SemanticLinkType = "arxiv" | "connected-papers" | "google-scholar" | "semantic-scholar";

interface CleanSemanticItem {
	authors: string,
	authorsLastNames: string[],
	authorsString: string,
	doi: string | false,
	intent: string[],
	isInfluential: boolean,
	links: (Record<SemanticLinkType, string>|Record<string,never>),
	meta: string,
	title: string,
	url: string,
	year: string,
	_multiField: string
}

interface EnrichedSemanticItem extends CleanSemanticItem {
	inGraph: false | string,
	inLibrary: false | {
		children: { notes: (ZoteroItemAnnotation | ZoteroItemNote)[], pdfs: ZoteroItemAttachment[] },
		raw: ZoteroItemTop
	},
	_type?: "citing" | "cited"
}

interface SRelatedEntries {
	citations: EnrichedSemanticItem[],
	references: EnrichedSemanticItem[],
	backlinks: EnrichedSemanticItem[]
}

/** Extracts an author's last name */
function getAuthorLastName(name: string): string {
	const components = name.replaceAll(".", " ").split(" ").filter(Boolean);
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

/** Formats the metadata of a Semantic Scholar entry */
function cleanSemanticItem(item: SemanticScholarRelatedEntry): CleanSemanticItem {
	const clean_item: CleanSemanticItem = {
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
	].filter(Boolean).join(" ");

	return clean_item;
}

/** Matches a clean Semantic Scholar entry to Zotero and Roam data
 * @returns The matched entry for the item
 */
function matchSemanticEntry(
	semanticItem: SemanticScholarRelatedEntry,
	datastore: Partial<ZLibraryContents>,
	roamCitekeys: RoamCitekeysList
): EnrichedSemanticItem {
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

/** Formats a list of Semantic Scholar entries for display
 * @returns The formatted list
 */
function cleanSemantic(
	datastore: ZLibraryContents,
	semantic: Pick<SemanticScholarItem, "citations" | "references">,
	roamCitekeys: RoamCitekeysList
): SRelatedEntries {
	const { items = [], pdfs = [], notes = [] } = datastore;
	const itemsWithDOIs = items.filter(it => it.data.DOI);
	// * Note: DOIs from the Semantic Scholar queries are sanitized at fetch
	const { citations = [], references = [] } = semantic;

	const clean_citations: EnrichedSemanticItem[] = citations.map((cit) => {
		const cleanProps = matchSemanticEntry(cit, { items: itemsWithDOIs, pdfs, notes }, roamCitekeys);
		return {
			...cleanProps,
			_type: "citing"
		};
	});

	const clean_references: EnrichedSemanticItem[] = references.map((ref) => {
		const cleanProps = matchSemanticEntry(ref, { items: itemsWithDOIs, pdfs, notes }, roamCitekeys);
		return {
			...cleanProps,
			_type: "cited"
		};
	});

	return {
		citations: clean_citations,
		references: clean_references,
		backlinks: [...clean_references, ...clean_citations].filter(item => item.inLibrary)
	};
}

export {
	getAuthorLastName,
	makeAuthorsSummary,
	cleanSemanticItem,
	matchSemanticEntry,
	cleanSemantic
};