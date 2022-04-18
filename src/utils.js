import ReactDOM from "react-dom";
import "./typedefs";

/** Generates a data requests configuration object
 * @param {Array} reqs - Data requests provided by the user
 * @returns {{dataRequests: {dataURI: String, apikey: String, params: String, name: String, library: String}[], apiKeys: Array, libraries: Array}} A configuration object for the extension to use
 */
function analyzeUserRequests(reqs){
	if(reqs.length == 0){
		throw new Error("At least one data request must be specified for the extension to function. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
	} else {
		let fallbackAPIKey = reqs.find(req => req.apikey).apikey;
		if(!fallbackAPIKey){
			throw new Error("At least one data request must be assigned an API key. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
		} else {
			const dataRequests = reqs.map((req, i) => {
				let { dataURI, apikey = fallbackAPIKey, params = "", name = `${i}`} = req;
				if(!dataURI){
					throw new Error("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
				} else {
					let library = dataURI.match(/(users|groups)\/(\d+?)(?=\/items)/g)?.[0];
					if(!library){
						throw new Error(`An incorrect data URI was provided for a request : ${dataURI}. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials`);
					} else {
						return { dataURI, apikey, params, name, library };
					}
				}
			});

			const apiKeys = Array.from(new Set(dataRequests.map(req => req.apikey)));
			const libraries = dataRequests.reduce((arr, req) => {
				let { library: path, apikey} = req;
				let has_lib = arr.find(lib => lib.path == path);
				if(!has_lib){
					arr.push({ path, apikey });
				}
				return arr;
			}, []);

			return {
				dataRequests,
				apiKeys,
				libraries
			};
		}
	}
}

/** Categorize library items according to their type (items, PDFs attachments, notes)
 * @param {Object[]} datastore - The items to categorize 
 * @returns {{items: ZoteroItem[], pdfs: ZoteroItem[], notes: Object[]}} The categorized object
 */
function categorizeLibraryItems(datastore){
	return datastore.reduce((obj, item) => {
		if (["note", "annotation"].includes(item.data.itemType)) {
			obj.notes.push(item);
		} else if (item.data.itemType == "attachment") {
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

/** Converts library data into a simplified list of top-level items, with their metadata, children, and links
 * @param {Object[]} arr - The library's contents, including top-level items, attachments and notes/annotations
 * @param {Map} roamCitekeys - The map of citekey pages present in Roam 
 * @returns {Object[]} The simplified items
 * @see cleanLibraryReturnArrayType
 */
function cleanLibrary(arr, roamCitekeys){
	let lib = categorizeLibraryItems(arr);

	return lib.items
		.map(item => {
			let itemKey = item.data.key;
			let location = item.library.type + "s/" + item.library.id;
			let { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: lib.pdfs, notes: lib.notes });

			return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
		});
}

/**
 * 
 * @param {ZoteroItem|Object} item - The Zotero item
 * @param {Object[]} pdfs - The Zotero item's attached PDFs
 * @param {Object[]} notes - The Zotero item's notes and annotations
 * @param {Map} roamCitekeys - The map of citekey pages present in Roam 
 * @returns {Object} The simplified item
 * @see cleanLibraryItemType
 */
function cleanLibraryItem(item, pdfs = [], notes = [], roamCitekeys){
	let hasURL = item.data.url;
	let hasDOI = parseDOI(item.data.DOI);
	let weblink = hasURL
		? { href: hasURL, title: hasURL }
		: hasDOI
			? { href: "https://doi/org/" + hasDOI, title: hasDOI}
			: false;
	
	let creators = item.data.creators.map(cre => {
		return {
			full: cre.name || [cre.firstName, cre.lastName].filter(Boolean).join(" ") || "",
			last: cre.lastName || cre.name || "",
			role: cre.creatorType || ""
		};
	});
	let tags = Array.from(new Set(item.data.tags.map(t => t.tag)));

	let authors = item.meta.creatorSummary || "";
	let maybeYear = item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear().toString() : "";
	let pub_year = maybeYear ? `(${maybeYear})` : "";

	let clean_item = {
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
		inGraph: roamCitekeys.has("@" + item.key) ? roamCitekeys.get("@" + item.key) : false,
		itemKey: item.data.key,
		itemType: item.data.itemType,
		key: item.key,
		location: item.library.type + "s/" + item.library.id,
		meta: [authors, pub_year].filter(Boolean).join(" "),
		publication: item.data.publicationTitle || item.data.bookTitle || item.data.university || "",
		tags: tags,
		title: item.data.title,
		weblink,
		year: maybeYear,
		zotero: {
			local: getLocalLink(item, {format: "target"}),
			web: getWebLink(item, {format: "target"})
		},
		raw: item
	};

	clean_item._multiField = [
		clean_item.authorsFull.join(" "), 
		clean_item.year, 
		clean_item.title, 
		clean_item.tags.map(tag => `#${tag}`).join(", ")
	].join(" ");

	return clean_item;
}

/** Removes newlines at the beginning and end of a string
 * @param {String} text - The string to be trimmed
 * @returns The clean string
 */
function cleanNewlines(text){
	let cleanText = text;
	if(cleanText.startsWith("\n")){
		cleanText = cleanText.slice(1);
		cleanText = cleanNewlines(cleanText);
	} else if(cleanText.endsWith("\n")){
		cleanText = cleanText.slice(0, -1);
		cleanText = cleanNewlines(cleanText);
	}

	return cleanText;
}

/** Formats the metadata of a Semantic Scholar entry
 * @param {Object} item - The Semantic Scholar entry to format 
 * @returns {{
 * authors: String, 
 * authorsLastNames: String,
 * authorsString: String,
 * doi: String, 
 * intent: String[], 
 * isInfluential: Boolean,
 * links: Object,
 * meta: String,
 * title: String,
 * url: String,
 * year: String,
 * _multiField: String
 * }[]} The formatted entry
 * @see cleanSemanticItemType
 */
function cleanSemanticItem(item){
	let clean_item = {
		authors: "",
		doi: parseDOI(item.doi),
		intent: item.intent,
		isInfluential: item.isInfluential,
		links: {},
		meta: item.venue.split(/ ?:/)[0], // If the publication has a colon, only take the portion that precedes it
		title: item.title,
		url: item.url || "",
		year: item.year ? item.year.toString() : ""
	};

	// Parse authors data
	clean_item.authorsLastNames = item.authors.map(a => {
		let components = a.name.replaceAll(".", " ").split(" ").filter(Boolean);
		if(components.length == 1){
			return components[0];
		} else {
			return components.slice(1).filter(c => c.length > 1).join(" ");
		}
	});
	clean_item.authorsString = clean_item.authorsLastNames.join(" ");
	switch(clean_item.authorsLastNames.length){
	case 0:
		break;
	case 1:
		clean_item.authors = clean_item.authorsLastNames[0];
		break;
	case 2:
		clean_item.authors = clean_item.authorsLastNames[0] + " & " + clean_item.authorsLastNames[1];
		break;
	case 3:
		clean_item.authors = clean_item.authorsLastNames[0] + ", " + clean_item.authorsLastNames[1] + " & " + clean_item.authorsLastNames[2];
		break;
	default:
		clean_item.authors = clean_item.authorsLastNames[0] + " et al.";
	}

	// Parse external links
	if(item.paperId){
		clean_item.links["semantic-scholar"] = `https://www.semanticscholar.org/paper/${item.paperId}`;
	}
	if(item.arxivId){
		clean_item.links["arxiv"] = `https://arxiv.org/abs/${item.arxivId}`;
	}
	if(item.doi){
		clean_item.links["connected-papers"] = `https://www.connectedpapers.com/api/redirect/doi/${item.doi}`;
		clean_item.links["google-scholar"] = `https://scholar.google.com/scholar?q=${item.doi}`;
	}

	// Set multifield property for search
	clean_item._multiField = [
		clean_item.authorsString,
		clean_item.year,
		clean_item.title
	].join(" ");

	return clean_item;
}

/** Matches a clean Semantic Scholar entry to Zotero and Roam data
 * @param {Object} semanticItem - A Semantic Scholar item, as returned by {@link cleanSemanticItem}
 * @param {{items: Array, pdfs: Array, notes: Array}} datastore - The categorized list of Zotero items to match against 
 * @param {Map} roamCitekeys - The map of citekey pages in the Roam graph 
 * @returns {Object} - The matched entry for the item
 * @see cleanSemanticReturnType
 */
function cleanSemanticMatch(semanticItem, {items = [], pdfs = [], notes = []} = {}, roamCitekeys){
	let cleanSemantic = cleanSemanticItem(semanticItem);
	if(!cleanSemantic.doi){
		return {
			...cleanSemantic,
			inGraph: false,
			inLibrary: false
		};
	} else {
		let libItem = items.find(it => parseDOI(it.data.DOI) == cleanSemantic.doi);
		if(!libItem){
			return {
				...cleanSemantic,
				inGraph: false,
				inLibrary: false
			};	
		} else { 
			let itemKey = libItem.data.key;
			let location = libItem.library.type + "s/" + libItem.library.id;
			let children = identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });

			return {
				...cleanSemantic,
				inGraph: roamCitekeys.has("@" + libItem.key) ? roamCitekeys.get("@" + libItem.key) : false,
				inLibrary: {
					children,
					raw: libItem
				}
			};
		}
	}
}

/** Formats a list of Semantic Scholar entries for display
 * @param {ZoteroItem[]} datastore - The list of Zotero items to match against 
 * @param {{citations: Object[], references: Object[]}} semantic - The Semantic Scholar citation data to format 
 * @param {Map} roamCitekeys - The map of citekey pages in the Roam graph. Each entry contains the page's UID.
 * @returns {{
 * citations: Object[], 
 * references: Object[],
 * backlinks: Object[]}} The formatted list
 * @see cleanSemanticReturnObjectType
 */
function cleanSemantic(datastore, semantic, roamCitekeys){
	let { items = [], pdfs = [], notes = []} = datastore;
	let itemsWithDOIs = items.filter(it => it.data.DOI);
	// * Note: DOIs from the Semantic Scholar queries are sanitized at fetch
	let { citations = [], references = [] } = semantic;

	let clean_citations = citations.map((cit) => {
		let cleanProps = cleanSemanticMatch(cit, {items: itemsWithDOIs, pdfs, notes}, roamCitekeys);
		return {
			...cleanProps,
			_type: "citing"
		};
	});

	let clean_references = references.map((ref) => {
		let cleanProps = cleanSemanticMatch(ref, {items: itemsWithDOIs, pdfs, notes}, roamCitekeys);
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

function compareAnnotationIndices(a, b){
	let [pageA = 0, lineA = 0, colA = 0] = a;
	let [pageB = 0, lineB = 0, colB = 0] = b;

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

/** Compares two Zotero items by publication year then alphabetically, to determine sort order
 * @param {ZoteroItem} a - The first item to compare
 * @param {ZoteroItem} b - The second item to compare
 * @returns {(0|1)} The comparison outcome
 */
function compareItemsByYear(a, b) {
	if(!a.meta.parsedDate){
		if(!b.meta.parsedDate){
			return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
		} else {
			return 1;
		}
	} else {
		if(!b.meta.parsedDate){
			return -1;
		} else {
			let date_diff = new Date(a.meta.parsedDate).getUTCFullYear() - new Date(b.meta.parsedDate).getUTCFullYear();
			if(date_diff < 0){
				return -1;
			} else if(date_diff == 0){
				return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
			} else {
				return 1;
			}
		}
	}
}

/** Copies a portion of text to the user's clipboard
 * @param {String} text - The text to copy 
 * @returns {{success: Boolean|null}} The outcome of the operation
 */
function copyToClipboard(text){
	if(navigator.clipboard){
		navigator.clipboard.writeText(text)
			.then((_response) => {
				return {
					success: true
				};
			})
			.catch((error) => {
				console.error(error);
				return {
					success: false
				};
			});
	} else {
		return {
			success: null
		};
	}
}

/** Escapes special characters in a string, so that it can be used as RegExp.
 * From Darren Cook on SO : https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 * @param {String} string - The original string to escape
 * @returns {String} The escaped string
 */
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/** Executes a function by its name, with optional arguments.
 * From Jason Bunting on SO : https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
 * @param {String} functionName - The name of the function to execute. Can be namespaced (e.g, window.myFunc). 
 * @param {*} context - The context where the function should be trigger. For most cases, it should be `window`.
 * @returns {*} The output of the function
 */
function executeFunctionByName(functionName, context /*, args */) {
	var args = Array.prototype.slice.call(arguments, 2);
	var namespaces = functionName.split(".");
	var func = namespaces.pop();
	for (var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
	}
	return context[func].apply(context, args);
}

/** Default formatter for annotations
 * @param {ZoteroItem[]} annotations - The (raw) array of annotations to be formatted 
 * @returns An array of block objects, ready for import into Roam.
 */
function formatItemAnnotations(annotations){
	let annots = simplifyZoteroAnnotations(annotations);

	return annots.map(ann => {
		if(ann.type == "highlight"){
			let { comment, pageLabel, link_page, tags, text } = ann;
			let tagsString = tags.length > 0 ? " \n " + tags.map(t => "#[[" + t + "]]").join(" ") : "";
	
			return {
				string: "[[>]] " + text + ` ([p. ${pageLabel}](${link_page}))` + tagsString,
				children: comment ? [comment] : []
			};

		} else if(ann.type == "image"){
			// let { pageIndex, rects } = ann.position;
			// TODO: Can rect selections be extracted into an image ?
		}
	});
}

/** Default formatter for notes
 * @param {{ZoteroItem}[]]} notes - The (raw) array of notes to be formatted
 * @param {String} split_char - The string on which to split notes into blocks
 * @returns A flat array of strings, separated according to `split_char`, and ready for import into Roam.
 */
function formatItemNotes(notes, split_char){
	return splitNotes(notes, split_char)
		.flat(1)
		.map(b => parseNoteBlock(b))
		.filter(b => b.trim());
}

/** Converts an item into a given string format
 * @param {ZoteroItem} item - The item to convert 
 * @param {("inline"|"tag"|"pageref"|"citation"|"popover"|"zettlr"|"citekey")} format - The format to convert into 
 * @param {{accent_class: String}} config - Additional parameters 
 * @returns {String} The formatted reference
 */
function formatItemReference(item, format, {accent_class = "zr-accent-1"} = {}){
	const citekey = "@" + item.key;
	const pub_year = item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear() : "";
	const pub_summary = [item.meta.creatorSummary || "", pub_year ? `(${pub_year})` : ""].filter(Boolean).join(" ");

	switch(format){
	case "inline":
		return pub_summary;
	case "tag":
		return `#[[${citekey}]]`;
	case "pageref":
		return `[[${citekey}]]`;
	case "citation":
		return `[${pub_summary || item.key}]([[${citekey}]])`;
	case "popover":
		return `{{=: ${pub_summary || item.key} | {{embed: [[${citekey}]]}} }}`;
	case "zettlr":
		return [`<span class="${accent_class}">${pub_summary || item.key}</span>`, item.data.title].filter(Boolean).join(" ");
	case "citekey":
	default:
		return citekey;
	}
}

/** Formats an array of Zotero annotations into Roam blocks, with optional configuration
 * @param {ZoteroItem[]} annotations - The Zotero annotations to format
 * @param {{func: String, use:("raw"|"formatted")}} config - Additional settings 
 * @returns The formatted annotations
 */
function formatZoteroAnnotations(annotations, { func = null, use = "raw" } = {}){
	if(func){
		// If the user has provided a function, execute it with the desired input
		return executeFunctionByName(func, window, use == "raw" ? annotations : simplifyZoteroAnnotations(annotations));
	} else {
		return formatItemAnnotations(annotations);
	}
}

/** Formats an array of Zotero notes into Roam blocks, with optional configuration
 * @param {ZoteroItem[]} notes - The Zotero notes to format
 * @param {{func: String, split_char: String, use:("raw"|"text")}} config - Additional settings
 * @returns The formatted notes
 */
function formatZoteroNotes(notes, { func = null, split_char = "\n", use = "raw" } = {}){
	if(func){
		// If the user has provided a function, execute it with the desired input
		return executeFunctionByName(func, window, use == "raw" ? notes : splitNotes(notes, split_char));
	} else {
		// Otherwise use the default formatter
		return formatItemNotes(notes, split_char);
	}
}

/** Creates a local link to a specific Zotero item, which opens in the standalone app.
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {{format: ("markdown"|"target"), text?: String}} config - Additional settings
 * @returns A link to the item, either as a Markdown link or a URI
 */
function getLocalLink(item, {format = "markdown", text = "Local library"} = {}){
	let location = item.library.type == "group" ? `groups/${item.library.id}` : "library";
	let target = `zotero://select/${location}/items/${item.data.key}`;
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
 * @param {ZoteroItem} pdfItem - The targeted Zotero PDF item
 * @returns The link to the PDF
 */
function getPDFLink(pdfItem, as = "href"){
	let libLoc = pdfItem.library.type == "group" ? `groups/${pdfItem.library.id}` : "library";
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
 * @param {ZoteroItem} item - The targeted Zotero item 
 * @param {{format: ("markdown"|"target"), text?: String}} config - Additional settings 
 * @returns A link to the item, either as a Markdown link or a URL
 */
function getWebLink(item, {format = "markdown", text = "Web library"} = {}){
	let location = ((item.library.type == "user") ? "users" : "groups") + `/${item.library.id}`;
	let target = `https://www.zotero.org/${location}/items/${item.data.key}`;
	switch(format){
	case "markdown":
		return `[${text}](${target})`;
	case "target":
	default:
		return target;
	}
}

/** Checks if the contents of a NodeList have changed
 * From mauroc8 on SO: https://stackoverflow.com/questions/51958759/how-can-i-test-the-equality-of-two-nodelists
 * @param {NodeList} prev - The previous contents of the NodeList
 * @param {NodeList} current - The current contents of the NodeList
 * @returns {Boolean} `true` if the NodeList has changed ; `false` otherwise
 */
function hasNodeListChanged(prev, current){
	return (prev.length + current.length) != 0 && (prev.length !== current.length || prev.some((el, i) => el !== current[i]));
}

/** Identifies the children of a Zotero item within a given set of PDF and note entries
 * @param {String} itemKey - The Zotero key of the parent item
 * @param {String} location - The library location of the parent item
 * @param {{pdfs: ZoteroItem[], notes: ZoteroItem[]}} data - The items among which children are to be identified 
 * @returns 
 */
function identifyChildren(itemKey, location, {pdfs = [], notes = []} = {}){
	let pdfItems = pdfs.filter(p => p.data.parentItem == itemKey && (p.library.type + "s/" + p.library.id == location));
	let pdfKeys = pdfItems.map(p => p.key);
	let noteItems = notes.filter(n => ((n.data.itemType == "note" && n.data.parentItem == itemKey) || (n.data.itemType == "annotation" && pdfKeys.includes(n.data.parentItem))) && n.library.type + "s/" + n.library.id == location);

	return {
		pdfs: pdfItems,
		notes: noteItems
	};
}

/** Creates a dictionary from a String Array
 * @param {String[]} arr - The array from which to make the dictionary
 * @returns {Object<String,String[]>} An object where each entry is made up of a key (String ; a given letter or character, in lowercase) and the strings from the original array who begin with that letter or character (in any case).
 */
function makeDictionary(arr){
	return arr.reduce((dict, elem) => {
		let initial = elem.charAt(0).toLowerCase();
		if(dict[initial]){
			dict[initial].push(elem);
		} else {
			dict[initial] = [elem];
		}
		return dict;
	}, {});
}

/** Converts a date into a String format, in relation to the current date.
 * For dates that belong to today : `Today at HH:MM` ; for dates that belong to yesterday : `Yesterday at HH:MM`.
 * For any previous dates : `MMMM DD, YYYY` (DNP format).
 * @param {Date} date - The date to convert
 * @returns
 */
function makeDateFromAgo(date){
	let thisdate = date.constructor === Date ? date : new Date(date);
	// Vars
	let today = new Date();
	today.setHours(0,0,0);
	let yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	yesterday.setHours(0,0,0);

	if(thisdate > today){
		return `Today at ${makeTimestamp(thisdate)}`;
	} else if(thisdate > yesterday){
		return `Yesterday at ${makeTimestamp(thisdate)}`;
	} else {
		let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		let monthDay =`${months[thisdate.getMonth()]} ${makeOrdinal(thisdate.getDate())}`;
		let maybeYear = thisdate.getFullYear() != today.getFullYear() ? thisdate.getFullYear() : false;

		return [monthDay, maybeYear].filter(Boolean).join(" ");
	}
}

/** Converts a date into Roam DNP format
 * @param {Date|*} date - The date to parse and convert 
 * @param {{brackets: Boolean}} config - Additional parameters 
 * @returns 
 */
function makeDNP(date, {brackets = true} = {}){
	let thisdate = date.constructor === Date ? date : new Date(date);
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	let dateString = `${months[thisdate.getMonth()]} ${makeOrdinal(thisdate.getDate())}, ${thisdate.getFullYear()}`;
	if(brackets){
		return `[[${dateString}]]`;
	} else{
		return dateString;
	}
}

/** Converts a number into ordinal format
 * @param {Integer} i - The number to convert
 * @returns {String} The number in ordinal format
 */
function makeOrdinal(i) {
	let j = i % 10;
	if (j == 1 & i != 11) {
		return i + "st";
	} else if (j == 2 & i != 12) {
		return i + "nd";
	} else if (j == 3 & i != 13) {
		return i + "rd";
	} else {
		return i + "th";
	}
}

/** Creates a user-readable timestamp for a given date-time.
 * @param {Date|String} date - The date to convert 
 * @returns A timestamp in text format, HH:MM
 */
function makeTimestamp(date){
	let d = date.constructor === Date ? date : new Date(date);
	return `${d.getHours()}:${("0" + d.getMinutes()).slice(-2)}`;
}

/** Determines if two arrays have any strings in common
 * @param {String[]} arr1 - The first array to use 
 * @param {String[]} arr2 - The second array to use
 * @returns `true` if at least one string is present in both arrays - otherwise `false`
 */
function matchArrays(arr1, arr2){
	return arr1.some(el => arr2.includes(el));
}

/** Extracts a valid DOI from a string
 * @param {String} doi - The string to test 
 * @returns The DOI (starting with `10.`) if any - otherwise `false`
 */
function parseDOI(doi){
	if(!doi){
		return false;
	} else {
		// Clean up the DOI format if needed, to extract prefix + suffix only
		let formatCheck = doi.match(/10\.([0-9]+?)\/(.+)/g);
		if(formatCheck){
			return formatCheck[0].toLowerCase();
		} else {
			return false;
		}
	}
}
/** Default parser for cleaning up HTML tags in raw Zotero notes.
 * @param {String} block - The note block to be cleaned
 * @returns The clean, HTML-free contents of the block
 */
function parseNoteBlock(block){
	let cleanBlock = block;
	let formattingSpecs = {
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
		"</u>": ""
	};
	for(let prop in formattingSpecs){
		cleanBlock = cleanBlock.replaceAll(`${prop}`, `${formattingSpecs[prop]}`);
	}

	// HTML tags that might have attributes : p, div, span, headers
	let richTags = ["p", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6"];
	richTags.forEach(tag => {
		// eslint-disable-next-line no-useless-escape
		let tagRegex = new RegExp(`<\/?${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag> or </tag>, and the case with modifiers : <tag :modifier>
		cleanBlock = cleanBlock.replaceAll(tagRegex, tag.startsWith("h") ? "**" : "");
	});

	let linkRegex = /<a href="(.+?)">(.+?)<\/a>/g;
	cleanBlock = cleanBlock.replaceAll(linkRegex, "[$2]($1)");

	cleanBlock = cleanNewlines(cleanBlock);

	return cleanBlock;
}

/** Quantifies an ordinary English noun
 * @param {Integer} num - The quantity 
 * @param {String} string - The noun to quantify 
 * @param {String} suffix - An optional suffix for the noun, apposed immediately after the noun (without spacing).
 * @returns A properly pluralized string
 */
function pluralize(num, string, suffix = "") {
	return `${num == 0 ? "No" : num} ${string}${num == 1 ? "" : "s"}${suffix}`;
}

/** Converts a Roam Daily Note title into a JavaScript date
 * @param {String} string - Daily Note Page (DNP) title 
 * @param {{as_date: Boolean}} config - Additional settings 
 * @returns The corresponding date, either as a Date or an Array (YYYY,M,DD)
 */
function readDNP(string, { as_date = true } = {}){
	// eslint-disable-next-line no-unused-vars
	let [match, mm, dd, yy] = Array.from(string.matchAll(/(.+) ([0-9]+).{2}, ([0-9]{4})/g))[0];
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
	let parsedDate = [parseInt(yy), months.findIndex(month => month == mm) + 1, parseInt(dd)];
    
	return as_date ? new Date([...parsedDate]) : parsedDate;
}

/** Inclusive multi-field search engine, with optional configuration
 * @param {String} query - The query string to search 
 * @param {String|String[]} target - The text to be searched. Can be a String or a String Array.
 * @param {{any_case: Boolean, match: ("exact"|"partial"|"word"), search_compounds: Boolean, word_order: ("strict"|"loose")}} config - Additional configuration
 * @returns {Boolean} `true` if the query is matched in the target (if String) or any of its elements (if String Array) ; `false` otherwise.
 */
function searchEngine(query, target, { any_case = true, match = "partial", search_compounds = true, word_order = "strict"} = {}){
	if(target.constructor === String){
		return searchEngine_string(query, target, { any_case, match, search_compounds, word_order});
	} else if(target.constructor === Array){
		return target.some(el => searchEngine_string(query, el, { any_case, match, search_compounds, word_order}));
	} else {
		throw new Error(`Unexpected input type ${target.constructor} : target should be a String or an Array`);
	}
}

/** Inclusive search engine, with optional configuration
 * @param {String} string - The query string to search 
 * @param {String} text - The text to be searched
 * @param {{any_case: Boolean, match: ("exact"|"partial"|"word"), search_compounds: Boolean, word_order: ("strict"|"loose")}} config - Additional configuration
 * @returns {Boolean} `true` if the query is matched in the target string ; `false` otherwise.
 */
function searchEngine_string(str, text, {any_case = true, match = "partial", search_compounds = true , word_order = "strict"} = {}){
	let query = str;
	let target = text;

	// If search is case-insensitive, transform query & target to lowercase
	if(any_case == true){
		query = str.toLowerCase();
		target = text.toLowerCase();
	}

	// Is the query multi-word? Aka, has 1+ space(s) ?
	let queryWords = query.split(" ");
	let isHyphenated = queryWords.some(w => w.includes("-"));

	if(queryWords.length == 1){
		// Single-word query
		let searchString = query;
		if(isHyphenated && search_compounds == true){
			// Replace hyphen by inclusive match (hyphen, space, nothing)
			searchString = query.replace("-", "(?: |-)?");
		}
		// Then carry on with the search op
		if(match == "partial"){
			let searchReg = new RegExp(escapeRegExp(searchString), "g");
			return searchReg.test(target);
		} else if(match == "exact"){
			let searchReg = new RegExp("^" + escapeRegExp(searchString) + "$", "g");
			return searchReg.test(target);
		} else if(match == "word") {
			let searchReg = new RegExp("(?:\\W|^)" + escapeRegExp(searchString) + "(?:\\W|$)", "g");
			return searchReg.test(target);
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
				let searchArrayReg = searchArray.map(t => "(?:\\W|^)" + t + "(?:\\W|$)");
				return searchArrayReg.every(exp => {
					let regex = new RegExp(exp, "g");
					return regex.test(target);
				});
			} else {
				// Partial matching
				return searchArray.every(exp => {
					let regex = new RegExp(exp, "g");
					return regex.test(target);
				});
			}
		} else {
			if(match == "partial"){
				let searchReg = new RegExp(searchArray.join(" "), "g");
				return searchReg.test(target);
			} else if(match == "exact"){
				let searchReg = new RegExp("^" + searchArray.join(" ") + "$", "g");
				return searchReg.test(target);
			} else {
				let searchReg = new RegExp("(?:\\W|^)" + searchArray.join(" ") + "(?:\\W|$)", "g");
				return searchReg.test(target);
			}
		}
	}

}

function setupDarkTheme(use_dark = false){
	document.getElementsByTagName("body")[0].setAttribute("zr-dark-theme", (use_dark == true).toString());
}

/** Injects external scripts into the page
 * @param {{id: String, src: String}[]} deps - List of scripts to inject 
 */
function setupDependencies(deps){
	deps.forEach(dep => {
		let { id, src } = dep;
		try { 
			document.getElementById(id).remove(); 
		} catch(e){
			// Do nothing
		}
		let script = document.createElement("script");
		script.src = src;
		script.type = "application/javascript";
		script.async = true;
		document.getElementsByTagName("head")[0].appendChild(script);
	});
}
/** Injects DOM elements to be used as React portals by the extension
 * @param {String} slotID - The id to be given to the extension's icon's slot in the topbar 
 * @param {String} portalID - The id to be given to the extension's designated div portal for overlays etc.
 */
function setupPortals(slotID, portalID){
	// Topbar slot for the extension's icon
	let exists = document.getElementById(slotID);
	if(exists){
		try{
			ReactDOM.unmountComponentAtNode(exists);
			exists.remove();
		} catch(e){
			console.error(e);
		}
	}

	let roamSearchbar = document.querySelector(".rm-topbar .rm-find-or-create-wrapper");
	let extensionSlot = document.createElement("span");
	extensionSlot.id = slotID;
	roamSearchbar.insertAdjacentElement("afterend", extensionSlot);

	// Portal for the extension's overlays
	try{ 
		document.getElementById(portalID).remove(); 
	} catch(e){
		// Do nothing
	}
	let zrPortal = document.createElement("div");
	zrPortal.id = portalID;
	document.getElementById("app").appendChild(zrPortal);
}

/** Simplifies data structure for Zotero 6 annotations
 * @param {Object[]} annotations - The list of annotations to simplify
 * @returns {{
 * color: String,
 * comment: String,
 * dateAdded: String,
 * dateModified: String,
 * key: String,
 * library: String,
 * link_pdf: String,
 * link_page: String,
 * pageLabel: String,
 * parentItem: String,
 * position: Object,
 * raw: Object,
 * sortIndex: Number[],
 * tags: String[],
 * text: String|null,
 * type: ("highlight"|"image"),
 * version: Number
 * }[]}
 */
function simplifyZoteroAnnotations(annotations){
	return annotations.map(annot => {
		let { 
			annotationColor: color, 
			annotationComment: comment, 
			annotationPageLabel: pageLabel,
			annotationPosition,
			annotationSortIndex,
			annotationText: text,
			annotationType: type,
			dateAdded,
			dateModified,
			parentItem,
			tags
		} = annot.data;

		let library = annot.library.type + "s/" + annot.library.id;
		let libLoc = library.startsWith("groups/") ? library : "library";
		let position = JSON.parse(annotationPosition);
		let link_pdf = `zotero://open-pdf/${libLoc}/items/${parentItem}`;
		let link_page = link_pdf + `?page=${position.pageIndex + 1}`;

		return {
			color,
			comment,
			dateAdded,
			dateModified,
			key: annot.key,
			library,
			link_pdf,
			link_page,
			pageLabel,
			parentItem,
			position,
			raw: annot,
			sortIndex: annotationSortIndex.split("|").map(ind => Number(ind)),
			tags: tags.map(t => t.tag),
			text,
			type
		};
	});
}

function simplifyZoteroNotes(notes){
	return notes.map(nt => {
		let {
			dateAdded,
			dateModified,
			parentItem,
			note,
			tags
		} = nt.data;

		let library = nt.library.type + "s/" + nt.library.id;
		let libLoc = library.startsWith("groups/") ? library : "library";
		let link_note = `zotero://select/${libLoc}/items/${nt.key}`;

		return {
			dateAdded,
			dateModified,
			key: nt.key,
			library,
			link_note,
			note,
			parentItem,
			raw: nt,
			tags: tags.map(t => t.tag)
		};
	});
}

function sortCollectionChildren(parent, children, depth = 0){
	let parColl = parent;
	parColl.depth = depth;
	if(children.length > 0){
		let chldn = children.filter(ch => ch.data.parentCollection == parColl.key);
		// If the collection has children, recurse
		if(chldn){
			let collArray = [parColl];
			// Go through each child collection 1-by-1
			// If a child has children itself, the recursion should ensure everything gets added where it should
			for(let j = 0; j < chldn.length; j++){
				collArray.push(...sortCollectionChildren(chldn[j], children, depth + 1));
			}
			return collArray;
		} else {
			return [parColl];
		}
	} else {
		return [parColl];
	}
}

function sortCollections(arr){
	if(arr.length > 0){
		// Sort collections A-Z
		arr = [...arr].sort((a,b) => (a.data.name.toLowerCase() < b.data.name.toLowerCase() ? -1 : 1));
		let orderedArray = [];
		let topColls = arr.filter(cl => !cl.data.parentCollection);
		topColls.forEach((cl, i) => { topColls[i].depth = 0; });
		let childColls = arr.filter(cl => cl.data.parentCollection);
		for(let k = 0; k < topColls.length; k++){
			let chldn = childColls.filter(ch => ch.data.parentCollection == topColls[k].key);
			// If the collection has children, pass it to sortCollectionChildren to recursively process the nested collections
			if(chldn){
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
 * @param {Object[]} items - The list of elements to sort 
 * @param {String} sort - The key to sort elements on 
 * @returns {Object[]} The sorted array
 */
function sortElems(arr, sort){
	return arr.sort((a,b) => (a[`${sort}`].toLowerCase() < b[`${sort}`].toLowerCase() ? -1 : 1));
}

/** Splits Zotero notes on a given string
 * @param {Object[]} notes - The raw array of notes to split
 * @param {String} split_char - The string on which to split notes
 * @returns {String[][]} A nested array of strings, where each entry contains the splitting results for a given note
 */
function splitNotes(notes, split_char){
	return notes.map(n => n.data.note.split(split_char));
}

export {
	analyzeUserRequests,
	categorizeLibraryItems,
	cleanLibrary,
	cleanLibraryItem,
	cleanSemantic,
	compareItemsByYear,
	compareAnnotationIndices,
	copyToClipboard,
	escapeRegExp,
	executeFunctionByName,
	formatItemAnnotations,
	formatItemNotes,
	formatItemReference,
	formatZoteroAnnotations,
	formatZoteroNotes,
	getPDFLink,
	getLocalLink,
	getWebLink,
	hasNodeListChanged,
	identifyChildren,
	makeDateFromAgo,
	makeDictionary,
	makeDNP,
	makeTimestamp,
	matchArrays,
	parseDOI,
	pluralize,
	readDNP,
	searchEngine,
	setupDarkTheme,
	setupDependencies,
	setupPortals,
	simplifyZoteroAnnotations,
	simplifyZoteroNotes,
	sortCollections,
	sortElems
};