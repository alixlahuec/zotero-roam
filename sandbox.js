/* istanbul ignore file */
import { QueryClient } from "@tanstack/react-query";

import { sampleAnnot, sampleImageAnnot } from "./mocks/zotero/annotations";
import { apiKeys } from "./mocks/zotero/keys";
import { findCollections } from "./mocks/zotero/collections";
import { findItems } from "./mocks/zotero/items";
import { libraries } from "./mocks/zotero/libraries";
import { sampleNote } from "./mocks/zotero/notes";
import { samplePDF } from "./mocks/zotero/pdfs";

import ZoteroRoam from "./src/extension";
import { initialize } from "./src/setup";
import { simplifyZoteroAnnotations } from "./src/utils";


const { keyWithFullAccess: masterKey } = apiKeys;
const { userLibrary } = libraries;

/**
 * Creates a public API instance for sandbox environments (e.g Observable). Data is accessed via cache, and any methods that involve live API calls are overwritten.
 */
class ZoteroRoamSandbox extends ZoteroRoam {
	constructor({ annotations = {}, metadata = {} }){
		const INSTALL_CONTEXT = "sandbox";

		const { requests, settings } = initialize(INSTALL_CONTEXT, {
			manualSettings: {
				dataRequests: [
					{ 
						apikey: masterKey,
						library: {
							type: userLibrary.type + "s",
							id: userLibrary.id
						}
					}
				],
				annotations: {
					func: "customAnnotsFunction",
					use: "function",
					...annotations
				},
				metadata: {
					func: "customFunction",
					use: "function",
					...metadata
				}
			}
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					cacheTime: Infinity,
					staleTime: Infinity
				}
			}
		});

		queryClient.setQueryData(
			["items", { apikey: masterKey, dataURI: userLibrary.path + "/items", library: userLibrary.path }],
			(_prev) => ({
				data: [
					...findItems({ type: userLibrary.type, id: userLibrary.id, since: 0 }),
					sampleAnnot,
					sampleImageAnnot,
					sampleNote,
					samplePDF
				],
				lastUpdated: userLibrary.version
			})
		);

		queryClient.setQueryData(
			["collections", { library: userLibrary.path }],
			(_prev) => ({
				data: findCollections(userLibrary.type, userLibrary.id, 0),
				lastUpdated: userLibrary.version
			})
		);

		super({ queryClient, requests, settings });
	}

	updateLibraries(){
		throw new Error("Updating the libraries used in the sandbox is not allowed.");
	}

	getBibEntries(){
		throw new Error("Generating bibliographic information is not available in the sandbox.");
	}

	getItemCitation(){
		throw new Error("Generating citation information is not available in the sandbox.");
	}

	getTags(){
		throw new Error("Retrieving data on library tags is not allowed in the sandbox.");
	}
}

/** Wraps contents of a block object inside of a `<li>` tag.
 * @param {{string: String, text: String, children?: Array}} object - The block object to process
 * @returns
 */
function blockObjectToHTML(object){
	let objectHTML = "";
	
	if(typeof(object.string) === "undefined"){
		throw new Error("All blocks passed as an Object must have a string property");
	} else {
		objectHTML = objectHTML + `<li>${object.string}`;
		
		if(typeof(object.children) !== "undefined"){
			if(object.children.length > 0){
				objectHTML = objectHTML + arrayToHTML(object.children);
			}
		}
		objectHTML = objectHTML + " </li>";
	}
	return objectHTML;
}

/** Generates HTML list from metadata blocks.
 * @param {(String|{string: String, text: String, children?: Array})[]} arr - The list of metadata blocks
 * @returns 
 */
function arrayToHTML(arr){
	let renderedHTML = "<ul>";
	arr.forEach((el) => {
		if(el.constructor === Object){
			renderedHTML = renderedHTML + blockObjectToHTML(el);
		} else if(el.constructor === String) {
			renderedHTML = renderedHTML + `<li>${el} </li>`;
		} else {
			throw new Error("All array items should be of type String or Object");
		}
	});
	renderedHTML = renderedHTML + "</ul>";
	return renderedHTML;
}

export {
	arrayToHTML,
	simplifyZoteroAnnotations,
	ZoteroRoamSandbox
};