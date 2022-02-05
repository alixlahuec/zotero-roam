import { webimportClass } from "../classes";
import { matchArrays } from "../../../utils";

const findWebimportDivs = () => {
	return Array.from(document.querySelectorAll(`[class=${webimportClass}]`));
};

const setWebimportDivs = (tags) => {
	// Old blocks - are they still valid ?
	findWebimportDivs()
		.filter(b => !matchArrays(tags, JSON.parse(b.parentElement.getAttribute("data-page-links"))))
		.forEach(b => b.remove());

	// New blocks
	let newTrigBlocks = Array.from(document.querySelectorAll(".rm-block:not(.rm-block--ghost)"))
		.filter(b => !b.querySelector(`[class=${webimportClass}]`) && matchArrays(tags, JSON.parse(b.getAttribute("data-page-links"))));
    
	let elem = document.createElement("span");
	elem.classList.add(webimportClass);

	newTrigBlocks.forEach(b => b.insertAdjacentElement("afterbegin", elem.cloneNode(true)));
};

export { findWebimportDivs, setWebimportDivs };
