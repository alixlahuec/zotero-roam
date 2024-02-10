/* istanbul ignore file */
import { QueryClient } from "@tanstack/react-query";

import ZoteroRoam from "./src/api";
import { initialize } from "./src/setup";
import { simplifyZoteroAnnotations } from "./src/utils";
import { apiKeys, findCollections, findItems, libraries, sampleAnnot, sampleImageAnnot, sampleNote, samplePDF } from "Mocks";
import { RImportableBlock, RImportableElement } from "Types/transforms";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary } = libraries;

/**
 * Creates a public API instance for sandbox environments (e.g Observable). Data is accessed via cache, and any methods that involve live API calls are overwritten.
 */
class ZoteroRoamSandbox extends ZoteroRoam {
	constructor({ annotations = {}, metadata = {} }){
		const INSTALL_CONTEXT = "sandbox";

		const { requests, settings } = initialize({
			context: INSTALL_CONTEXT,
			manualSettings: {
				dataRequests: [
					{ 
						apikey: masterKey,
						library: {
							type: userLibrary.type,
							id: `${userLibrary.id}`
						}
					}
				],
				// @ts-ignore
				annotations: {
					func: "customAnnotsFunction",
					use: "function",
					...annotations
				},
				// @ts-ignore
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
			["items", { dataURI: userLibrary.path + "/items", library: userLibrary.path }],
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

	// @ts-ignore
	getBibEntries(){
		throw new Error("Generating bibliographic information is not available in the sandbox.");
	}

	// @ts-ignore
	getItemCitation(){
		throw new Error("Generating citation information is not available in the sandbox.");
	}

	// @ts-ignore
	getTags(){
		throw new Error("Retrieving data on library tags is not allowed in the sandbox.");
	}
}

/** Wraps contents of a block object inside of a `<li>` tag. */
function blockObjectToHTML(object: RImportableBlock): string{
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

/** Generates HTML list from metadata blocks. */
function arrayToHTML(arr: RImportableElement[]): string{
	let renderedHTML = "<ul>";
	arr.forEach((el) => {
		if(typeof(el) == "object"){
			renderedHTML = renderedHTML + blockObjectToHTML(el);
		} else if(typeof(el) == "string") {
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