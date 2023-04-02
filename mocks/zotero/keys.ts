import { rest } from "msw";
import { zotero } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks/types";


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

export const handleAPIKey = rest.get<never, Mocks.RequestParams.Permissions, Mocks.Responses.Permissions>(
	zotero("keys/:apikey"), 
	(req, res, ctx) => {
		const { apikey } = req.params;
		return res(
			ctx.json(Object.values(data).find(val => val.key == apikey)!)
		);
	}
);

export {
	data as apiKeys
};