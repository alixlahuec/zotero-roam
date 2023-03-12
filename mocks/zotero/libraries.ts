export interface ZLibraryMock {
	id: number,
	links: {
		alternate: { href: string, type: string }
	},
	name: string,
	path: string,
	type: "users" | "groups",
	username?: string,
	version: number
}

const configLibrary = (type: "users"|"groups", id: number, name: string) => {
	const path = type + "/" + id;
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