
export const menuPrefix = "zr-page-menu--";
export const menuClasses = ["citekey", "dnp", "tag"].reduce((obj, elem) => {
	obj[elem] = menuPrefix + elem;
	return obj;
}, {});

const showPrefix = "zr-page-menu-show--";
export const showClasses = ["references", "citations", "backlinks"].reduce((obj, elem) => {
	obj[elem] = showPrefix + elem;
	return obj;
}, {});
