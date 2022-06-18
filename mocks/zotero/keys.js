import { zotero } from "./common";
import { rest } from "msw";

import { data as libraries } from "./libraries";

const { userLibrary, groupLibrary } = libraries;
const addUserInfo = () => ({ userID: userLibrary.id, username: userLibrary.username, displayName: "" });

export const data = {
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
	},
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
	}
};

export const handleAPIKey = rest.get(
	zotero("keys/:apikey"), 
	(req, res, ctx) => {
		const { apikey } = req.params;
		return res(
			ctx.json(Object.values(data).find(val => val.key == apikey))
		);
	}
);