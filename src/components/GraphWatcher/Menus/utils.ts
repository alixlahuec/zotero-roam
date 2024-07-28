import { findRoamPage, readDNP } from "@services/roam";
import { menuClasses, menuPrefix } from "../classes";


const dnpRegex = new RegExp(/(.+) ([0-9]+).{2}, ([0-9]{4})/);

const addPageMenus = () => {
	const newPages = Array.from(document.querySelectorAll<HTMLElement>("h1.rm-title-display"))
		.filter(page => !(page.parentElement?.querySelector(`[class*=${menuPrefix}]`)));
	for(const page of newPages) {
		const title = page.querySelector("span")?.innerText || page.innerText;
		const pageUID = findRoamPage(title);
		
		const menu = document.createElement("div");
		menu.setAttribute("data-title", title);
		if(pageUID) { menu.setAttribute("data-uid", pageUID); }

		switch(true){
		case (title.startsWith("@")):
			// (ref-citekey) : on-page menu
			menu.classList.add(menuClasses.citekey);
			menu.setAttribute("data-citekey", title.slice(1));
			break;
		case (dnpRegex.test(title)):
			// (DNP) : "XX items added"
			menu.classList.add(menuClasses.dnp);
			menu.setAttribute("data-dnp-date", JSON.stringify(readDNP(title, { as_date: false })));
			break;
		default:
			// (all other pages) : "XX abstracts", "YY tagged items"
			menu.classList.add(menuClasses.tag);
		}

		page.insertAdjacentElement("afterend", menu);
	}
};

const findPageMenus = () => {
	return {
		citekeyMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.citekey}]`)),
		dnpMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.dnp}]`)),
		tagMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.tag}]`))
	};
};

export {
	addPageMenus,
	findPageMenus
};
