export interface ZLibraryMock {
	id: number,
	links: {
		alternate: { href: string, type: string }
	},
	name: string,
	path: string,
	type: "user" | "group",
	username?: string,
	version: number
}

const configLibrary = (type: "user"|"group", id: number, name: string) => {
	const path = type + "s/" + id;
	return {
		id,
		links: {
			alternate: {
				href: "https://www.zotero.org/" + (type == "user" ? name : path),
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
		...configLibrary("user", 123456, "username"),
		username: "username",
		version: 4310
	},
	"groupLibrary": {
		...configLibrary("group", 456789, "group-library"),
		version: 1598
	}
};

export {
	data as libraries
};