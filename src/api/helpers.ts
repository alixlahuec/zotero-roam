import { findRoamBlock, makeDNP } from "@services/roam";

import { cleanNewlines, compareAnnotationIndices, executeFunctionByName, extractSortIndex, formatItemAnnotations, formatZoteroNotes, getLocalLink, getWebLink, simplifyZoteroAnnotations } from "../utils";
import { _formatPDFs, _getItemCreators, _getItemTags } from "./public";

import { SettingsAnnotations, SettingsNotes, SettingsTypemap } from "Types/extension";
import { RImportableElement, ZItem, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop, ZLinkType, ZLinkOptions, isZAnnotation, isZNote } from "Types/transforms";


/** Parses the XHTML bibliography for a Zotero item into Roam formatting
 * @param bib - The item's XHTML bibliography
 * @returns The clean bibliography string
 */
function cleanBibliographyHTML(bib: string) {
	let bibString = bib;

	// Strip divs
	const richTags = ["div"];
	richTags.forEach(tag => {
		// eslint-disable-next-line no-useless-escape
		const tagRegex = new RegExp(`<\/?${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag> or </tag>, and the case with modifiers : <tag :modifier>
		bibString = bibString.replaceAll(tagRegex, "");
	});

	bibString = cleanNewlines(bibString).trim();

	// Use a textarea element to decode HTML
	const formatter = document.createElement("textarea");
	formatter.innerHTML = bibString;
	let formattedBib = formatter.innerText;
	// Convert italics
	formattedBib = formattedBib.replaceAll(/<\/?i>/g, "__");
	// Convert links
	const linkRegex = /<a href="(.+)">(.+)<\/a>/g;
	formattedBib = formattedBib.replaceAll(linkRegex, "[$2]($1)");

	return formattedBib;
}


/** Orders the (raw) indices of two Zotero annotations */
function compareAnnotationRawIndices(a: string, b: string): number {
	return compareAnnotationIndices(
		extractSortIndex(a),
		extractSortIndex(b)
	);
}


/* istanbul ignore next */
/** Formats an item's and its children's metadata for import to Roam using the default template */
function formatItemMetadata(
	item: ZItemTop, pdfs: ZItemAttachment[], notes: (ZItemNote | ZItemAnnotation)[],
	{ annotationsSettings, notesSettings, typemap }: { annotationsSettings: SettingsAnnotations, notesSettings: SettingsNotes, typemap: SettingsTypemap }
): RImportableElement[] {
	const metadata: RImportableElement[] = [];

	if (item.data.title) { metadata.push(`Title:: ${item.data.title}`); } // Title, if available
	if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${_getItemCreators(item, { return_as: "string", brackets: true, use_type: true })}`); } // Creators list, if available
	if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`); } // Abstract, if available
	if (item.data.itemType) { metadata.push(`Type:: ${getItemType(item, { brackets: true }, { typemap })}`); } // Item type, according to typemap
	metadata.push(`Publication:: ${getItemPublication(item, { brackets: true })}`);
	if (item.data.url) { metadata.push(`URL : ${item.data.url}`); }
	if (item.data.dateAdded) { metadata.push(`Date Added:: ${getItemDateAdded(item)}`); } // Date added, as Daily Notes Page reference
	metadata.push(`Zotero links:: ${getItemLink(item, "local", { format: "markdown", text: "Local library" })}, ${getItemLink(item, "web", { format: "markdown", text: "Web library" })}`); // Local + Web links to the item
	if (item.data.tags.length > 0) { metadata.push(`Tags:: ${_getItemTags(item, { return_as: "string", brackets: true })}`); } // Tags, if any

	if (pdfs.length > 0) {
		metadata.push(`PDF links : ${(_formatPDFs(pdfs, "links") as string[]).join(", ")}`);
	}
	if (notes.length > 0) {
		const formattedOutput = formatNotes(notes, null, { annotationsSettings, notesSettings });
		metadata.push(...formattedOutput);
	}

	return metadata;
}


/** Formats Zotero notes/annotations items */
function formatNotes(
	/** The Array of Zotero notes/annotations */
	notes: (ZItemNote | ZItemAnnotation)[],
	/** The UID of the parent item's Roam page, if it exists */
	pageUID: string | null = null,
	/** The user's current settings */
	{ annotationsSettings, notesSettings }: { annotationsSettings: SettingsAnnotations, notesSettings: SettingsNotes }
): RImportableElement[] {
	if (!notes || notes.length == 0) {
		return [];
	} else {
		const annotItems = notes
			.filter(isZAnnotation)
			.sort((a, b) => compareAnnotationRawIndices(a.data.annotationSortIndex, b.data.annotationSortIndex));
		const noteItems = notes
			.filter(isZNote)
			.sort((a, b) => a.data.dateAdded < b.data.dateAdded ? -1 : 1);
		const formattedOutput = [
			...formatZoteroAnnotations(annotItems, annotationsSettings),
			...formatZoteroNotes(noteItems, notesSettings)
		];

		const { nest_char, nest_position, nest_preset, nest_use } = notesSettings;

		// If nesting is disabled, simply return the array of blocks
		if (nest_use == "preset" && !nest_preset) {
			return formattedOutput;
		}

		// Else if the page UID was provided, check if the page already has a block with the same content
		// If yes, set that block as the parent for all the outputted blocks
		if (pageUID) {
			const blockString = ((nest_use == "custom") ? nest_char : nest_preset) || "";
			const existingBlock = findRoamBlock(blockString, pageUID);

			if (existingBlock) {
				const { uid, children = [] } = existingBlock;
				const pos = (nest_position == "bottom") ? children.length : 0;

				return formattedOutput.map(blck => {
					if (blck.constructor === String) {
						return {
							string: blck,
							text: blck,
							order: pos,
							parentUID: uid
						};
					} else {
						return {
							...blck,
							order: pos,
							parentUID: uid
						};
					}
				});
			}
		}

		const blockString = (nest_use == "custom" ? nest_char : nest_preset) || "";
		return [{
			string: blockString,
			text: blockString,
			children: formattedOutput
		}];

	}
}


/** Formats an array of Zotero annotations into Roam blocks, with optional configuration */
function formatZoteroAnnotations(
	annotations: ZItemAnnotation[],
	{ func = "", use = "default", __with = "raw", ...settings }: Partial<SettingsAnnotations> = {}
): any {
	if (use == "function" && func) {
		// If the user has provided a custom function, execute it with the desired input
		return executeFunctionByName(func, window, __with == "raw" ? annotations : simplifyZoteroAnnotations(annotations));
	} else {
		return formatItemAnnotations(annotations, { ...settings });
	}
}


/** Returns the date on which an item was added to Zotero, in DNP format */
function getItemDateAdded(item: ZItem, { brackets = true }: { brackets?: boolean } = {}): string {
	return makeDNP(item.data.dateAdded, { brackets });
}

/** Returns a link for the item (web or local) */
function getItemLink(item: ZItemTop, type: ZLinkType = "local", config: Partial<ZLinkOptions> = {}) {
	return (type == "local")
		? getLocalLink(item, config)
		: getWebLink(item, config);
}


/** Retrieves the publication details for a given item.
 * The extension will check for the existence of a `publicationTitle`, then a `bookTitle`, then a `university` name.
 */
function getItemPublication(item: ZItemTop, { brackets = true }: { brackets?: boolean } = {}): string {
	const maybePublication = item.data.publicationTitle || item.data.bookTitle || item.data.university;
	if (maybePublication) {
		return (brackets == true)
			? `[[${maybePublication}]]`
			: maybePublication;
	} else {
		return "";
	}
}

/** Retrieves the type of a Zotero item, according to a given typemap */
function getItemType(item: ZItemTop, { brackets = true }: { brackets?: boolean } = {}, { typemap }: { typemap: SettingsTypemap }): string {
	const type = typemap[item.data.itemType] || item.data.itemType;
	return (brackets == true ? `[[${type}]]` : type);
}


/** Groups a list of citekeys by the library they belong to. */
function groupCitekeysByLibrary(citekeys: string[], { items }: { items: ZItem[] }) {
	return citekeys.reduce<Record<string, string[]>>((obj, citekey) => {
		const libItem = items.find(it => it.key == citekey);
		if (libItem) {
			const location = libItem.library.type + "s/" + libItem.library.id;
			if (Object.keys(obj).includes(location)) {
				obj[location].push(libItem.data.key);
			} else {
				obj[location] = [libItem.data.key];
			}
		}
		return obj;
	}, {});
}


export {
	cleanBibliographyHTML,
	compareAnnotationRawIndices,
	formatItemMetadata,
	formatNotes,
	formatZoteroAnnotations,
	getItemDateAdded,
	getItemLink,
	getItemPublication,
	getItemType,
	groupCitekeysByLibrary
};