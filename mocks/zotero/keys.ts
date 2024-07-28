import { http, HttpResponse } from "msw";
import { zotero } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks";


const { userLibrary, groupLibrary } = libraries;
const addUserInfo = () => ({ userID: userLibrary.id, username: userLibrary.username, displayName: "" });

const data = {
	keyWithFullAccess: {
		...addUserInfo(),
		key: "ABCD1234EFG",
		access: {
			user: {
				library: true,
				files: true,
				notes: true,
				write: true
			},
			groups: {
				[groupLibrary.id]: {
					library: true,
					write: true
				}
			}
		}
	} as Mocks.Responses.Permissions,
	keyWithNoGroupAccess: {
		...addUserInfo(),
		key: "EFGH5678IJK",
		access: {
			user: {
				library: true,
				files: true,
				notes: true,
				write: true
			},
			groups: {
				all: {
					library: false,
					write: false
				}
			}
		}
	} as Mocks.Responses.Permissions
};

export const handleAPIKey = http.get<Mocks.RequestParams.Permissions, never, Mocks.Responses.Permissions>(
	zotero("keys/:apikey"), 
	({ params }) => {
		const { apikey } = params;
		return HttpResponse.json(Object.values(data).find(val => val.key == apikey)!);
	}
);

export {
	data as apiKeys
};