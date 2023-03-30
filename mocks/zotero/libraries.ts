import { ZLibraryMock } from "Mocks/types";
import { ZoteroAPI } from "Types/externals";


const configLibrary = (type: ZoteroAPI.LibraryTypeURI, id: number, name: string) => {
	const path = [type, id].join("/");
	return {
		id,
		links: {
			alternate: {
				href: "https://www.zotero.org/" + (type == "users" ? name : path),
				type: "text/html"
			}
		},
		name,
		path,
		type
	};
};

const data: Record<string, ZLibraryMock> = {
	"userLibrary": {
		...configLibrary("users", 123456, "username"),
		username: "username",
		version: 4310
	},
	"groupLibrary": {
		...configLibrary("groups", 456789, "group-library"),
		version: 1598
	}
};

export {
	data as libraries
};