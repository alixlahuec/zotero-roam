const MENU_TYPES = ["citekey", "dnp", "tag"] as const;
export const menuPrefix = "zr-page-menu--";
export const menuClasses = MENU_TYPES.reduce<Record<string, any>>((obj, elem) => {
	obj[elem] = menuPrefix + elem;
	return obj;
}, {}) as { [i in "citekey" | "dnp" | "tag"]: string };

const showPrefix = "zr-page-menu-show--";
export const showClasses = ["references", "citations", "backlinks"].reduce((obj, elem) => {
	obj[elem] = showPrefix + elem;
	return obj;
}, {});

export const webimportClass = "zr-webimport-div";
