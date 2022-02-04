import { webimportClass } from "../classes";
import { matchArrays } from "../../../utils";

const addWebimportDivs = (tags) => {
	let trigBlocks = Array.from(document.querySelectorAll(".rm-block:not(.rm-block--ghost)"))
		.filter(b => !b.querySelector(`[class=${webimportClass}]`) && matchArrays(tags, JSON.parse(b.getAttribute("data-page-links"))));
    
	let elem = document.createElement("span");
	elem.classList.add(webimportClass);

	trigBlocks.forEach(b => b.insertAdjacentElement("afterbegin", elem.cloneNode(true)));
};

const findWebimportDivs = () => {
	return document.querySelectorAll(`[class=${webimportClass}]`);
};

export { addWebimportDivs, findWebimportDivs };
