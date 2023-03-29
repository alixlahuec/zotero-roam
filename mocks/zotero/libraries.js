const configLibrary = (type, id, name) => {
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

/** @constant {Record<string, ZLibraryMock>} */
const data = {
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