const configLibrary = (type, id, name) => ({ 
	id,
	links: {
		alternate: {
			href: "https://www.zotero.org/" + name,
			type: "text/html"
		}
	},
	path: type + "s/" + id,
	type
});

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