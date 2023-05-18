import zrToaster from "Components/ExtensionToaster";
import { SettingsAnnotations, SettingsNotes, ZItemReferenceFormat } from "Types/extension";
import { SemanticScholarAPI, ZoteroAPI } from "Types/externals";
import { AsBoolean } from "Types/helpers";
import { RCitekeyPages, RImportableBlock, ZCleanItemPDF, ZCleanItemTop, ZEnrichedCollection, ZItem, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop, ZLibraryContents, ZLinkOptions, ZSimplifiedAnnotation, ZSimplifiedNote, ZTagDictionary, isZAnnotation, isZAttachment, isZNoteOrAnnotation } from "Types/transforms";
import { SCleanItem, SEnrichedItem, SEnrichedItemCitation, SEnrichedItemReference, SEnrichedItemTypeEnum, SRelatedEntries, isSBacklink } from "Types/transforms/semantic";


/** Converts a string from camelCase to Title Case
 * @see https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-title-case-text */
function camelToTitleCase(text: string): string {
	const result = text.replace(/([A-Z])/g, " $1");
	const finalResult = result.charAt(0).toUpperCase() + result.slice(1);

	return finalResult;
}

/** Categorizes library items according to their type (items, PDFs attachments, notes)
 * @param datastore - The items to categorize 
 * @returns The categorized object
 */
function categorizeLibraryItems(datastore: ZItem[]): ZLibraryContents{
	return datastore.reduce<{ items: ZItemTop[], pdfs: ZItemAttachment[], notes: (ZItemNote | ZItemAnnotation)[] }>((obj, item) => {
		if (isZNoteOrAnnotation(item)) {
			obj.notes.push(item);
		} else if (isZAttachment(item)) {
			if (item.data.contentType == "application/pdf") {
				obj.pdfs.push(item);
			}
			// If the attachment is not a PDF, ignore it
		} else {
			obj.items.push(item);
		}

		return obj;

	}, { items: [], pdfs: [], notes: [] });
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

/** Categorizes library data into top-level items, annotations/notes, and PDFs with their metadata, children, and links */
function cleanLibrary(arr: ZItem[], roamCitekeys: RCitekeyPages): ZCleanItemTop[] {
	const lib = categorizeLibraryItems(arr);

	return lib.items
		.map((item: ZItemTop) => {
			const itemKey = item.data.key;
			const location = item.library.type + "s/" + item.library.id;
			const { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: lib.pdfs, notes: lib.notes });

			return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
		});
}

/** Formats a Zotero item's metadata into a clean format, with Roam & children data
 * @param item - The Zotero item
 * @param pdfs - The Zotero item's attached PDFs
 * @param notes - The Zotero item's notes and annotations
 * @param roamCitekeys - The map of citekey pages in the Roam graph. Each entry contains the page's UID.
 * @returns The simplified item
 * @see cleanLibraryItemType
 */
function cleanLibraryItem(item: ZItemTop, pdfs: ZItemAttachment[] = [], notes: (ZItemNote | ZItemAnnotation)[] = [], roamCitekeys: RCitekeyPages): ZCleanItemTop{
	const hasURL = item.data.url;
	const hasDOI = parseDOI(item.data.DOI);
	const weblink = hasURL
		? { href: hasURL, title: hasURL }
		: hasDOI
			? { href: "https://doi/org/" + hasDOI, title: hasDOI }
			: false as const;
	
	const creators = item.data.creators.map(cre => {
		return {
			full: "name" in cre ? cre.name : [cre.firstName, cre.lastName].filter(AsBoolean).join(" ") || "",
			last: ("lastName" in cre ? cre.lastName : cre.name) || "",
			role: cre.creatorType || ""
		};
	});
	const tags = Array.from(new Set(item.data.tags.map(t => t.tag)));

	const authors = item.meta.creatorSummary || "";
	const maybeYear = !item.meta.parsedDate
		? ""
		: isNaN(Number(new Date(item.meta.parsedDate)))
			? ""
			: (new Date(item.meta.parsedDate)).getUTCFullYear().toString();
	const pub_year = maybeYear ? `(${maybeYear})` : "";

	const clean_item = {
		abstract: item.data.abstractNote || "",
		authors,
		authorsFull: creators.map(cre => cre.full),
		authorsLastNames: creators.map(cre => cre.last),
		authorsRoles: creators.map(cre => cre.role),
		children: {
			pdfs,
			notes
		},
		createdByUser: item.meta.createdByUser?.username || null,
		inGraph: roamCitekeys.get("@" + item.key) || false as const,
		itemKey: item.data.key,
		itemType: item.data.itemType,
		key: item.key,
		location: item.library.type + "s/" + item.library.id,
		meta: [authors, pub_year].filter(AsBoolean).join(" "),
		publication: item.data.publicationTitle || item.data.bookTitle || item.data.university || "",
		tags: tags,
		title: item.data.title,
		weblink,
		year: maybeYear,
		zotero: {
			local: getLocalLink(item, { format: "target" }),
			web: getWebLink(item, { format: "target" })
		},
		raw: item,
		_multiField: ""
	};

	clean_item._multiField = [
		clean_item.abstract,
		clean_item.authorsFull.join(" "), 
		clean_item.year, 
		clean_item.title, 
		clean_item.tags.map(tag => `#${tag}`).join(", "),
		clean_item.key
	].filter(AsBoolean).join(" ");

	return clean_item;
}

/** Formats a Zotero PDF's metadata into a clean format, with parent & annotations data */
function cleanLibraryPDF(pdf: ZItemAttachment, parent: (ZItemTop | Record<string, never>) = {}, annotations: ZItemAnnotation[] = []): ZCleanItemPDF {
	return {
		annotations,
		key: pdf.data.key,
		link: getPDFLink(pdf, "href"),
		parent,
		title: pdf.data.filename || pdf.data.title,
		raw: pdf,
		tags: pdf.data.tags.map(t => t.tag)
	};
}

/** Removes newlines at the beginning and end of a string */
function cleanNewlines(text: string){
	let cleanText = text;
	if(cleanText.startsWith("\n")){
		cleanText = cleanText.slice(1);
		cleanText = cleanNewlines(cleanText);
	} else if(cleanText.endsWith("\n")){
		cleanText = cleanText.slice(0, -1);
		cleanText = cleanNewlines(cleanText);
	}

	cleanText = cleanText.replaceAll(/\n{2}/g, "\n");

	return cleanText;
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

/** Orders the indices of two Zotero annotations
 * @param a - The first index to compare
 * @param b - The second index to compare
 * @returns The comparison outcome
 */
function compareAnnotationIndices(a: number[], b: number[]): number {
	const [pageA = 0, lineA = 0, colA = 0] = a;
	const [pageB = 0, lineB = 0, colB = 0] = b;

	if(pageA < pageB){
		return -1;
	} else if(pageA == pageB){
		if(lineA < lineB){
			return -1;
		} else if(lineA == lineB){
			if(colA <= colB){
				return -1;
			} else {
				return 1;
			}
		} else {
			return 1;
		}
	} else {
		return 1;
	}
}

/** Orders the (raw) indices of two Zotero annotations
 * @param a - The first string index to compare
 * @param b - The second string index to compare
 * @returns The comparison outcome
 */
function compareAnnotationRawIndices(a: string, b: string): number {
	return compareAnnotationIndices(
		extractSortIndex(a),
		extractSortIndex(b)
	);
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

/** Extracts the numerical index of a Zotero annotation, from its string origin
 * @param str - The string index
 * @returns The index in numerical Array form
 */
function extractSortIndex(str: string){
	return str.split("|").map(ind => Number(ind));
}

/** Copies a portion of text to the user's clipboard */
function copyToClipboard(text: string){
	if(navigator.clipboard){
		navigator.clipboard.writeText(text)
			.then((_response) => {
				zrToaster.show({
					intent: "success",
					message: `Successfully copied to clipboard: ${text}`,
					timeout: 800
				});
			})
			.catch((e) => {
				window.zoteroRoam?.error?.({
					origin: "Copy",
					message: `Failed to copy to clipboard: ${text}`,
					detail: e.message,
					showToaster: 1000
				});
			});
	} else {
		zrToaster.show({
			message: `Clipboard API is not available. The following could not be copied: ${text}`,
			timeout: 1000
		});
	}
}

/** Escapes special characters in a string, so that it can be used as RegExp.
 * From Darren Cook on SO : https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 * @param string - The original string to escape
 * @returns The escaped string
 */
function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/** Executes a function by its name, with optional arguments.
 * From Jason Bunting on SO : https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
 * @param functionName - The name of the function to execute. Can be namespaced (e.g, window.myFunc). 
 * @param context - The context where the function should be trigger. For most cases, it should be `window`.
 * @returns The output of the function
 */
function executeFunctionByName(functionName: string, context: Window | any, ..._argList: any[]) {
	const args = Array.prototype.slice.call(arguments, 2);
	const namespaces = functionName.split(".");
	const func = namespaces.pop()!;
    
	let ctx = context;
	for (let i = 0; i < namespaces.length; i++) {
		ctx = ctx[namespaces[i]];
	}
	if(!ctx[func]){
		throw new Error(`Function ${func} doesn't exist`);
	}
	return ctx[func](...args);
}

/** Formats a single Zotero annotation with params
 * @returns A block object, ready for import into Roam
 */
function formatAnnotationWithParams(
	/** The annotation to be formatted */
	annotation: ZSimplifiedAnnotation,
	/** Additional configuration  */
	{ template_comment = "{{comment}}", template_highlight = "[[>]] {{highlight}} ([p. {{page_label}}]({{link_page}})) {{tags_string}}" }: Partial<Pick<SettingsAnnotations, "template_comment" | "template_highlight">> = {}
) {
	if(annotation.type == "highlight"){
		const { comment, page_label, link_page, tags_string, text } = annotation;

		let commentBlock = template_comment;
		let highlightBlock = template_highlight;

		const specs = {
			comment,
			highlight: text,
			page_label,
			link_page,
			tags_string
		};

		for(const prop in specs){
			commentBlock = commentBlock.replaceAll(`{{${prop}}}`, `${specs[prop]}`);
			highlightBlock = highlightBlock.replaceAll(`{{${prop}}}`, `${specs[prop]}`);
		}

		return {
			string: highlightBlock,
			text: highlightBlock,
			children: comment ? [commentBlock] : []
		};

	} else if(annotation.type == "image"){
		// let { pageIndex, rects } = ann.position;
		// TODO: Can rect selections be extracted into an image ?
		return null;
	} else {
		return null;
	}
}

/** Default formatter for annotations 
 * @returns An array of block objects, ready for import into Roam.
 */
function formatItemAnnotations(
	/** The annotations to be formatted */
	annotations: ZItemAnnotation[],
	/** Additional configuration */
	{ group_by = false, template_comment, template_highlight }: Partial<Pick<SettingsAnnotations, "group_by" | "template_comment" | "template_highlight">> = {}
): RImportableBlock[] {
	const annots = simplifyZoteroAnnotations(annotations);

	if(group_by == "day_added"){
		const day_dict = annots
			.sort((a,b) => a.date_added < b.date_added ? -1 : 1)
			.reduce<{[i: string]: ZSimplifiedAnnotation[]}>((dict, elem) => {
				const ymd = new Date(elem.date_added).toLocaleDateString("en-CA");
				if(dict[ymd]){
					dict[ymd].push(elem);
				} else {
					dict[ymd] = [elem];
				}
				return dict;
			}, {});
		return Object.keys(day_dict)
			.sort((a,b) => new Date(a) < new Date(b) ? -1 : 1)
			.map(date => {
				const sortedAnnots = day_dict[date].sort((a,b) => compareAnnotationIndices(a.sortIndex, b.sortIndex));
				return {
					string: makeDNP(`${date}T00:00`, { brackets: true }),
					text: makeDNP(`${date}T00:00`, { brackets: true }),
					children: sortedAnnots
						.map(ann => formatAnnotationWithParams(ann,
							{ 
								template_comment, 
								template_highlight
							}
						))
						.filter(AsBoolean)
				};
			})
			.filter(date => date.children.length > 0);
	} else {
		return annots
			.map(ann => formatAnnotationWithParams(ann, { 
				template_comment, 
				template_highlight }))
			.filter(AsBoolean);
	}
}

/** Default formatter for notes
 * @param notes - The (raw) array of notes to be formatted
 * @param separator - The string on which to split notes into blocks
 * @returns A flat array of strings, separated according to `separator`, and ready for import into Roam.
 */
function formatItemNotes(notes: ZItemNote[], separator = "\n"): string[] {
	return splitNotes(notes, separator)
		.flat(1)
		.map(b => parseNoteBlock(b))
		.filter(b => b.trim());
}


/** Converts an item into a given string format
 * @param item - The item to convert 
 * @param format - The format to convert into 
 * @param config - Additional parameters 
 * @returns The formatted reference
 */
function formatItemReference(item: ZItemTop, format: ZItemReferenceFormat | string, { accent_class = "zr-accent-1" }: { accent_class?: string } = {}){
	const key = item.key;
	const title = item.data.title;
	const authors = item.meta.creatorSummary || "";
	const year = !item.meta.parsedDate 
		? ""
		: isNaN(Number(new Date(item.meta.parsedDate)))
			? ""
			: (new Date(item.meta.parsedDate)).getUTCFullYear();
	const summary = [authors, year ? `(${year})` : ""].filter(AsBoolean).join(" ");
	const citekey = "@" + key;
	const summary_or_key = summary || key;

	const TEMPLATES_MAPPING = {
		"citation": "[{{summary_or_key}}]([[{{citekey}}]])",
		"citekey": "{{citekey}}",
		"inline": "{{summary}}",
		"key": "{{key}}",
		"pageref": "[[{{citekey}}]]",
		"popover": "{{=: {{summary_or_key}} | {{embed: [[{{citekey}}]]}} }}",
		"tag": "#[[{{citekey}}]]",
		"zettlr": `<span class="${accent_class}">{{summary_or_key}}</span> {{title}}`
	};

	const specs = {
		authors,
		citekey,
		key,
		summary,
		summary_or_key,
		title,
		year
	};

	let output: string = TEMPLATES_MAPPING[format] || format || "{{citekey}}";

	for(const prop in specs){
		output = output.replaceAll(`{{${prop}}}`, `${specs[prop]}`);
	}

	return output;

}

/** Formats an array of Zotero annotations into Roam blocks, with optional configuration
 * @param annotations - The Zotero annotations to format
 * @param config - Additional settings 
 * @returns The formatted annotations
 */
function formatZoteroAnnotations(annotations: ZItemAnnotation[], { func = "", use = "default", __with = "raw", ...settings }: Partial<SettingsAnnotations> = {}){
	if(use == "function" && func){
		// If the user has provided a custom function, execute it with the desired input
		return executeFunctionByName(func, window, __with == "raw" ? annotations : simplifyZoteroAnnotations(annotations));
	} else {
		return formatItemAnnotations(annotations, { ...settings });
	}
}

/** Formats an array of Zotero notes into Roam blocks, with optional configuration
 * @param notes - The Zotero notes to format
 * @param config - Additional settings
 * @returns The formatted notes
 */
function formatZoteroNotes(notes: ZItemNote[], { func = "", split_char = "", split_preset = "\n", split_use = "preset", use = "default", __with = "raw" }: Partial<SettingsNotes> = {}){
	const separator = (split_use == "custom")
		? split_char
		: split_preset;

	if(use == "function" && func){
		// If the user has provided a custom function, execute it with the desired input
		return executeFunctionByName(func, window, __with == "raw" ? notes : splitNotes(notes, separator));
	} else {
		// Otherwise use the default formatter
		return formatItemNotes(notes, separator);
	}
}

/** Creates a local link to a specific Zotero item, which opens in the standalone app.
 * @param item - The targeted Zotero item
 * @param config - Additional settings
 * @returns A link to the item, either as a Markdown link or a URI
 */
function getLocalLink(item: ZItemTop, { format = "markdown", text = "Local library" }: Partial<ZLinkOptions> = {}){
	const location = item.library.type == "group" ? `groups/${item.library.id}` : "library";
	const target = `zotero://select/${location}/items/${item.data.key}`;
	switch(format){
	case "markdown":
		return `[${text}](${target})`;
	case "target":
	default:
		return target;
	}
}

/** Creates a link to a specific PDF attachment in Zotero.
 * If the PDF is a `linked_file`, `imported_file` or `imported_url`, the link opens through the local Zotero app ; otherwise, it's the PDF's URL.
 * @param pdfItem - The targeted Zotero PDF item
 * @param as - The format in which to return the link
 * @returns The link to the PDF
 */
function getPDFLink(pdfItem: ZItemAttachment, as: ("href" | "markdown") = "href"){
	const libLoc = pdfItem.library.type == "group" ? `groups/${pdfItem.library.id}` : "library";
	let href = "";
	let name = "";
	
	if(["linked_file", "imported_file", "imported_url"].includes(pdfItem.data.linkMode)){
		href = "zotero://open-pdf/" + libLoc + "/items/" + pdfItem.data.key;
		name = pdfItem.data.filename || pdfItem.data.title;
	} else {
		href = pdfItem.data.url;
		name = pdfItem.data.title;
	}

	switch(as){
	case "markdown":
		return `[${name}](${href})`;
	case "href":
	default:
		return href;
	}
}

/** Creates a web link to a specific Zotero item, which opens in the browser.
 * @param item - The targeted Zotero item 
 * @param config - Additional settings 
 * @returns A link to the item, either as a Markdown link or a URL
 */
function getWebLink(item: ZItemTop, { format = "markdown", text = "Web library" }: Partial<ZLinkOptions> = {}){
	const location = ((item.library.type == "user") ? "users" : "groups") + `/${item.library.id}`;
	const target = `https://www.zotero.org/${location}/items/${item.data.key}`;
	switch(format){
	case "markdown":
		return `[${text}](${target})`;
	case "target":
	default:
		return target;
	}
}

/** Checks if the contents of a NodeList have changed
 * @see https://stackoverflow.com/questions/51958759/how-can-i-test-the-equality-of-two-nodelists
 * @returns `true` if the NodeList has changed ; `false` otherwise
 */
function hasNodeListChanged(prev: NodeList, current: NodeList): boolean {
	const arrPrev = Array.from(prev);
	const arrCurrent = Array.from(current);
	return (arrPrev.length + arrCurrent.length) != 0 && (arrPrev.length !== arrCurrent.length || arrPrev.some((el, i) => el !== arrCurrent[i]));
}

/** Identifies the children of a Zotero item within a given set of PDF and note entries
 * @param itemKey - The Zotero key of the parent item
 * @param location - The library location of the parent item
 * @param data - The items among which children are to be identified 
 * @returns The item's children
 */
function identifyChildren(itemKey: string, location: string, { pdfs = [], notes = [] }: { pdfs?: ZItemAttachment[], notes?: (ZItemNote | ZItemAnnotation)[] } = {}){
	const pdfItems = pdfs.filter(p => p.data.parentItem == itemKey && (p.library.type + "s/" + p.library.id == location));
	const pdfKeys = pdfItems.map(p => p.key);
	const noteItems = notes.filter(n => [itemKey, ...pdfKeys].includes(n.data.parentItem) && n.library.type + "s/" + n.library.id == location);

	return {
		pdfs: pdfItems,
		notes: noteItems
	};
}

/** Identifies the connections of a Zotero PDF within a given set of item and notes entries
 * @param itemKey - The Zotero key of the PDF item
 * @param parentKey - The Zotero key of the PDF's parent
 * @param location - The library location of the PDF item
 * @param data - The items among which connections are to be identified 
 * @returns The item's connections
 */
function identifyPDFConnections(
	itemKey: string,
	parentKey: string,
	location: string,
	{ items = [], notes = [] }: Pick<ZLibraryContents, "items" | "notes">
): { parent?: ZItemTop, annotations: ZItemAnnotation[] } {
	const parentItem = items.find(it => it.data.key == parentKey && (it.library.type + "s/" + it.library.id == location));
	const annotationItems = notes.filter(isZAnnotation)
		.filter(n => n.data.parentItem == itemKey && n.library.type + "s/" + n.library.id == location);

	return {
		parent: parentItem,
		annotations: annotationItems
	};
}

/** Checks if a string input is an HTML tag
 * @param {String} input - The targeted string
 * @returns The outcome of the test
 */
function isHTMLTag(input: string){
	if(typeof(input) !== "string"){
		throw new Error(`Input is of type ${typeof(input)}, expected String`);
	}

	const pattern = new RegExp(/^<\/?(.+?)>|<(.+?)>$/);
	const result = pattern.test(input);

	return {
		result,
		htmlTag: (result && input.match(pattern)?.[1]) || null
	};
}

/** Creates a dictionary from a String Array
 * @param arr - The array from which to make the dictionary
 * @returns An object where each entry is made up of a key (String ; a given letter or character, in lowercase) and the strings from the original array that begin with that letter or character (in any case).
 */
function makeDictionary(arr: string[]): ZTagDictionary {
	return arr.reduce((dict, elem) => {
		try {
			const initial = elem.charAt(0).toLowerCase();
			if (dict[initial]) {
				dict[initial].push(elem);
			} else {
				dict[initial] = [elem];
			}
		} catch (e) {
			throw new Error(`Could not add ${JSON.stringify(elem)} to dictionary`);
		}
		return dict;
	}, {});
}

/** Converts a date into a String format, in relation to the current date.
 * For dates that belong to today : `Today at HH:MM` ; for dates that belong to yesterday : `Yesterday at HH:MM`.
 * For any previous dates : `MMMM DD, YYYY` (DNP format).
 * @param date - The date to convert
 * @returns
 */
function makeDateFromAgo(date: Date | any){
	const thisdate = date.constructor === Date ? date : new Date(date);
	// Vars
	const today = new Date();
	today.setHours(0,0,0);
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	yesterday.setHours(0,0,0);

	if(thisdate > today){
		return `Today at ${makeTimestamp(thisdate)}`;
	} else if(thisdate > yesterday){
		return `Yesterday at ${makeTimestamp(thisdate)}`;
	} else {
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const monthDay =`${months[thisdate.getMonth()]} ${makeOrdinal(thisdate.getDate())}`;
		const maybeYear = thisdate.getFullYear() != today.getFullYear() ? thisdate.getFullYear() : false;

		return [monthDay, maybeYear].filter(AsBoolean).join(" ");
	}
}

/** Converts a date into Roam DNP format
 * @param date - The date to parse and convert 
 * @param config - Additional parameters 
 * @returns 
 */
function makeDNP(date: Date | any, { brackets = true }: { brackets?: boolean } = {}){
	const thisdate = date.constructor === Date ? date : new Date(date);
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const dateString = `${months[thisdate.getMonth()]} ${makeOrdinal(thisdate.getDate())}, ${thisdate.getFullYear()}`;
	if(brackets){
		return `[[${dateString}]]`;
	} else{
		return dateString;
	}
}

/** Converts a number into ordinal format
 * @param i - The number to convert
 * @returns The number in ordinal format
 */
function makeOrdinal(i: number): string {
	const j = i % 10;
	if (j == 1 && i != 11) {
		return i + "st";
	} else if (j == 2 && i != 12) {
		return i + "nd";
	} else if (j == 3 && i != 13) {
		return i + "rd";
	} else {
		return i + "th";
	}
}

/** Creates a user-readable timestamp for a given date-time.
 * @param date - The date to convert 
 * @returns A timestamp in text format, HH:MM
 */
function makeTimestamp(date: Date | string | number){
	const d = date.constructor === Date ? date : new Date(date);
	return `${d.getHours()}:${("0" + d.getMinutes()).slice(-2)}`;
}

/** Determines if two arrays have any elements in common
 * @param arr1 - The first array to use 
 * @param arr2 - The second array to use
 * @returns `true` if at least one elements is present in both arrays - otherwise `false`
 */
function matchArrays(arr1: any[], arr2: any[]){
	return arr1.some(el => arr2.includes(el));
}

/** Extracts a valid DOI from a string
 * @param doi - The string to test 
 * @returns The DOI (starting with `10.`) if any - otherwise `false`
 */
function parseDOI(doi: string | any): string | false {
	if (!doi) {
		return false;
	} else {
		// Clean up the DOI format if needed, to extract prefix + suffix only
		const formatCheck = doi.match(/10\.([0-9]+?)\/(.+)/g);
		if (formatCheck) {
			return formatCheck[0].toLowerCase();
		} else {
			return false;
		}
	}
}

/** Default parser for cleaning up HTML tags in raw Zotero notes.
 * @param block - The note block to be cleaned
 * @returns The clean, HTML-free contents of the block
 */
function parseNoteBlock(block: string): string {
	let cleanBlock = block;
	const formattingSpecs = {
		"<blockquote>": "> ",
		"</blockquote>": "",
		"<strong>": "**",
		"</strong>": "**",
		"<em>": "__",
		"</em>": "__",
		"<b>": "**",
		"</b>": "**",
		"<br />": "\n",
		"<br/>": "\n",
		"<br>": "\n",
		"<u>": "",
		"</u>": "",
		"<ul>": "",
		"</ul>": "",
		"<ol>": "",
		"</ol>": "",
		"</li><li>": " ",
		"<li>": "",
		"</li>": ""
	};
	for(const prop in formattingSpecs){
		cleanBlock = cleanBlock.replaceAll(`${prop}`, `${formattingSpecs[prop]}`);
	}

	// HTML tags that might have attributes : p, div, span, headers
	const richTags = ["p", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6"];
	richTags.forEach(tag => {
		// eslint-disable-next-line no-useless-escape
		const tagRegex = new RegExp(`<\/?${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag> or </tag>, and the case with modifiers : <tag :modifier>
		cleanBlock = cleanBlock.replaceAll(tagRegex, tag.startsWith("h") ? "**" : "");
	});

	const linkRegex = /<a.+?href="(.+?)">(.+?)<\/a>/g;
	cleanBlock = cleanBlock.replaceAll(linkRegex, "[$2]($1)");

	cleanBlock = cleanNewlines(cleanBlock);

	return cleanBlock;
}

/** Quantifies an ordinary English noun
 * @param num - The quantity 
 * @param string - The noun to quantify 
 * @param suffix - An optional suffix for the noun, apposed immediately after the noun (without spacing).
 * @returns A properly pluralized string
 */
function pluralize(num: number, string: string, suffix = "") {
	return `${num == 0 ? "No" : num} ${string}${num == 1 ? "" : "s"}${suffix}`;
}

/** Converts a Roam Daily Note title into a JavaScript date
 * @param string - Daily Note Page (DNP) title 
 * @param config - Additional settings 
 * @returns The corresponding date, either as a Date or an Array (YYYY,M,DD)
 */
function readDNP(string: string, { as_date = true }: { as_date?: boolean } = {}){
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [match, mm, dd, yy] = Array.from(string.matchAll(/(.+) ([0-9]+).{2}, ([0-9]{4})/g))[0];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
	const parsedDate = [parseInt(yy), months.findIndex(month => month == mm), parseInt(dd)] as const;
    
	return as_date ? new Date(...parsedDate) : parsedDate;
}

interface SearchEngineParams {
	any_case: boolean,
	match: "exact" | "partial" | "word",
	search_compounds: boolean,
	word_order: "loose" | "strict"
}

/** Inclusive multi-field search engine, with optional configuration
 * @param query - The query string to search 
 * @param target - The text to be searched. Can be a String or a String Array.
 * @param config - Additional configuration
 * @returns `true` if the query is matched in the target (if String) or any of its elements (if String Array) ; `false` otherwise.
 */
function searchEngine(query: string, target: string | string[], { any_case = true, match = "partial", search_compounds = true, word_order = "strict" }: Partial<SearchEngineParams> = {}): boolean {
	if(target.constructor === String){
		return searchEngine_string(query, target, { any_case, match, search_compounds, word_order });
	} else if(target.constructor === Array){
		return target.some(el => searchEngine_string(query, el, { any_case, match, search_compounds, word_order }));
	} else {
		throw new Error(`Unexpected input type ${target.constructor.name} : target should be a String or an Array`);
	}
}

/** Inclusive search engine, with optional configuration
 * @param str - The query string to search 
 * @param text - The text to be searched
 * @param config - Additional configuration
 * @returns `true` if the query is matched in the target string ; `false` otherwise.
 */
function searchEngine_string(str: string, text: string, { any_case = true, match = "partial", search_compounds = true , word_order = "strict" }: Partial<SearchEngineParams> = {}): boolean {
	let query = str;
	let target = text;

	// If search is case-insensitive, transform query & target to lowercase
	if(any_case == true){
		query = str.toLowerCase();
		target = text.toLowerCase();
	}

	// Is the query multi-word? Aka, has 1+ space(s) ?
	const queryWords = query.split(" ");
	const isHyphenated = queryWords.some(w => w.includes("-"));

	if(queryWords.length == 1){
		// Single-word query
		let searchString = escapeRegExp(query);
		if(isHyphenated && search_compounds == true){
			// Replace hyphen by inclusive match (hyphen, space, nothing)
			searchString = searchString.replace("-", "(?: |-)?");
		}
		// Then carry on with the search op
		switch (match) {
		case "partial": {
			const searchReg = new RegExp(searchString);
			return searchReg.test(target);
		}
		case "exact": {
			const searchReg = new RegExp("^" + searchString + "$");
			return searchReg.test(target);
		}
		case "word": {
			const searchReg = new RegExp("(?:\\W|^)" + searchString + "(?:\\W|$)");
			return searchReg.test(target);
		}
		default:
			return false;
		}
	} else {
		// Multi-word query
		let searchArray = queryWords.map(w => escapeRegExp(w));
		if(search_compounds == true){
			if(isHyphenated){
				// For each hyphenated term, replace hyphen by inclusive match (hyphen, space, nothing)
				searchArray = searchArray.map(w => w.includes("-") ? w.replace("-", "(?: |-)?") : w);
			} else if(!isHyphenated && word_order == "strict"){
				// If strict mode :
				// Join the search Array by inclusive match pattern (hyphen, space, nothing)
				searchArray = [searchArray.join("(?: |-)?")]; // keeping Array form so that the logic can be the same later on       
			}
			// If loose mode :
			// No special action necessary, should use searchArray = queryWords as defined above (default)
		}
		// If search_compounds == false :
		// No special action necessary, should use searchArray = queryWords as defined above (default)

		// Then carry on with the search op
		if(word_order == "loose"){
			if(match == "word"){
				const searchArrayReg = searchArray.map(t => "(?:\\W|^)" + t + "(?:\\W|$)");
				return searchArrayReg.every(exp => {
					const regex = new RegExp(exp);
					return regex.test(target);
				});
			} else {
				// Partial matching
				return searchArray.every(exp => {
					const regex = new RegExp(exp);
					return regex.test(target);
				});
			}
		} else {
			if(match == "partial"){
				const searchReg = new RegExp(searchArray.join(" "));
				return searchReg.test(target);
			} else if(match == "exact"){
				const searchReg = new RegExp("^" + searchArray.join(" ") + "$");
				return searchReg.test(target);
			} else {
				const searchReg = new RegExp("(?:\\W|^)" + searchArray.join(" ") + "(?:\\W|$)");
				return searchReg.test(target);
			}
		}
	}

}

/** Simplifies data structure for Zotero 6 annotations
 * @param annotations - The list of annotations to simplify
 * @returns The simplified array of annotations
 */
function simplifyZoteroAnnotations(annotations: ZItemAnnotation[]): ZSimplifiedAnnotation[]{
	return annotations.map(annot => {
		const { 
			annotationColor: color, 
			annotationComment: comment, 
			annotationPageLabel: page_label,
			annotationPosition,
			annotationSortIndex,
			annotationText: text,
			annotationType: type,
			dateAdded: date_added,
			dateModified: date_modified,
			parentItem: parent_item,
			tags
		} = annot.data;

		const day_added = makeDNP(date_added, { brackets: false });
		const day_modified = makeDNP(date_modified, { brackets: false });
		const library = annot.library.type + "s/" + annot.library.id;
		const libLoc = library.startsWith("groups/") ? library : "library";
		const position = JSON.parse(annotationPosition);
		const link_pdf = `zotero://open-pdf/${libLoc}/items/${parent_item}`;
		const link_page = link_pdf + `?page=${position.pageIndex + 1}`;

		return {
			color,
			comment,
			date_added,
			date_modified,
			day_added,
			day_modified,
			key: annot.key,
			library,
			link_pdf,
			link_page,
			page_label,
			parent_item,
			position,
			raw: annot,
			sortIndex: extractSortIndex(annotationSortIndex),
			tags: tags.map(t => t.tag),
			tags_string: tags.map(t => `#[[${t.tag}]]`).join(", "),
			text,
			type
		};
	});
}

/** Simplifies data structure for Zotero notes
 * @returns The simplified array of notes
 */
function simplifyZoteroNotes(notes: ZItemNote[]): ZSimplifiedNote[] {
	return notes.map(nt => {
		const {
			dateAdded: date_added,
			dateModified: date_modified,
			parentItem: parent_item,
			note,
			tags
		} = nt.data;

		const location = nt.library.type + "s/" + nt.library.id;
		const libLoc = location.startsWith("groups/") ? location : "library";
		const link_note = `zotero://select/${libLoc}/items/${nt.key}`;

		return {
			date_added,
			date_modified,
			key: nt.key,
			location,
			link_note,
			note,
			parent_item,
			raw: nt,
			tags: tags.map(t => t.tag)
		};
	});
}

/** Sorts the children of a Zotero collection, with nested children
 * @returns The sorted array
 */
function sortCollectionChildren(
	parent: ZoteroAPI.Collection,
	children: ZoteroAPI.Collection[],
	depth = 0
): ZEnrichedCollection[] {
	const parColl = {
		...parent,
		depth
	};

	const chldn = children.filter(ch => ch.data.parentCollection == parColl.key);
	// If the collection has children, recurse
	if (chldn.length > 0) {
		const collArray = [parColl];
		// Go through each child collection 1-by-1
		// If a child has children itself, the recursion should ensure everything gets added where it should
		for (let j = 0; j < chldn.length; j++) {
			collArray.push(...sortCollectionChildren(chldn[j], children, depth + 1));
		}
		return collArray;
	} else {
		return [parColl];
	}

}

/** Sorts an array of Zotero collections in A-Z order, with child collections
 * @param arr - The array of Zotero collections to sort
 * @returns The sorted array
 */
function sortCollections(arr: ZoteroAPI.Collection[]): ZEnrichedCollection[] {
	if (arr.length > 0) {
		// Sort collections A-Z
		const array = [...arr].sort((a, b) => (a.data.name.toLowerCase() < b.data.name.toLowerCase() ? -1 : 1));
		const childColls = array.filter(cl => cl.data.parentCollection);
		const topColls: ZEnrichedCollection[] = array
			.filter(cl => !cl.data.parentCollection)
			.map(cl => ({ ...cl, depth: 0 }));

		const orderedArray: ZEnrichedCollection[] = [];

		for (let k = 0; k < topColls.length; k++) {
			const chldn = childColls.filter(ch => ch.data.parentCollection == topColls[k].key);
			// If the collection has children, pass it to sortCollectionChildren to recursively process the nested collections
			if (chldn.length > 0) {
				orderedArray.push(...sortCollectionChildren(topColls[k], childColls));
			} else {
				orderedArray.push(topColls[k]);
			}
		}
		return orderedArray;
	} else {
		return [];
	}
}

/** Sorts an array of objects on a given string key, in A-Z order
 * @returns The sorted array
 */
function sortElems<T extends Record<string, any>[]>(arr: T, sort: string) {
	return arr.sort((a, b) => (`${a[sort]}`.toLowerCase() < `${b[sort]}`.toLowerCase()) ? -1 : 1);
}

/** Splits Zotero notes on a given string
 * @param notes - The raw array of notes to split
 * @param separator - The string on which to split notes
 * @returns A nested array of strings, where each entry contains the splitting results for a given note
 */
function splitNotes(notes: ZItemNote[], separator: string): string[][] {
	const { result, htmlTag } = isHTMLTag(separator);

	if(result && htmlTag){
		// eslint-disable-next-line no-useless-escape
		const tagRegex = new RegExp(`<\/?${htmlTag}>|<${htmlTag} .+?>`, "g");
		return notes.map(n => n.data.note.split(tagRegex).filter(AsBoolean));
	} else {
		return notes.map(n => n.data.note.split(separator).filter(AsBoolean));
	}
}

export {
	camelToTitleCase,
	categorizeLibraryItems,
	makeAuthorsSummary,
	cleanLibrary,
	cleanLibraryItem,
	cleanLibraryPDF,
	cleanNewlines,
	cleanSemantic,
	cleanSemanticItem,
	compareItemsByYear,
	compareAnnotationIndices,
	compareAnnotationRawIndices,
	copyToClipboard,
	escapeRegExp,
	executeFunctionByName,
	extractSortIndex,
	formatItemAnnotations,
	formatItemNotes,
	formatItemReference,
	formatZoteroAnnotations,
	formatZoteroNotes,
	getAuthorLastName,
	getPDFLink,
	getLocalLink,
	getWebLink,
	hasNodeListChanged,
	identifyChildren,
	identifyPDFConnections,
	makeDateFromAgo,
	makeDictionary,
	makeDNP,
	makeTimestamp,
	matchArrays,
	parseDOI,
	pluralize,
	readDNP,
	searchEngine,
	simplifyZoteroAnnotations,
	simplifyZoteroNotes,
	sortCollections,
	sortElems,
	splitNotes
};