import { Mocks } from "Mocks";


const configLibrary = (type: Mocks.Library["type"], id: number, name: string, version: number): Mocks.Library => {
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
		type,
		username: (type == "users" ? name : undefined),
		version
	};
};

const data = {
	"userLibrary": configLibrary("users", 123456, "username", 4310),
	"groupLibrary": configLibrary("groups", 456789, "group-library", 1598)
};

export {
	data as libraries
};