import { cleanErrorIfAxios } from "../utils";
import { zoteroClient } from "./clients";

import { ZoteroDeleted } from "Types/externals/zotero";
import { ZLibrary } from "Types/common";


/** Requests data from the `/[library]/deleted` endpoint of the Zotero API
 * @param library - The targeted Zotero library
 * @param since - A library version
 * @returns Elements deleted from Zotero since the specified version
 */
async function fetchDeleted(library: ZLibrary, since: number) {
	const { apikey, path } = library;

	let response: unknown;

	try {
		const { data } = await zoteroClient.get<ZoteroDeleted>(
			`${path}/deleted`,
			{
				headers: { "Zotero-API-Key": apikey },
				params: { since }
			}
		);
		response = data;

		return data;
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch deleted data",
			context: {
				error: cleanErrorIfAxios(error),
				response
			}
		});
		return Promise.reject(error);
	}
}

export {
	fetchDeleted
};