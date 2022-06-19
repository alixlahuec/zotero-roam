const configLibrary = (type, id, name) => {
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

export const data = {
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