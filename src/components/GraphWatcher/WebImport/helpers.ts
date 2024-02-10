import { webimportClass } from "../classes";


const findWebimportDivs = () => {
	return Array.from(document.querySelectorAll(`[class="${webimportClass}"]`));
};


/** Determines if two arrays have any elements in common
 * @param arr1 - The first array to use 
 * @param arr2 - The second array to use
 * @returns `true` if at least one elements is present in both arrays - otherwise `false`
 */
function matchArrays(arr1: any[], arr2: any[]) {
	return arr1.some(el => arr2.includes(el));
}


const setWebimportDivs = (tags: string[]) => {
	// Old blocks - are they still valid ?
	findWebimportDivs()
		.filter(b => !matchArrays(tags, JSON.parse(b.parentElement?.getAttribute("data-page-links") || "[]")))
		.forEach(b => b.remove());

	// New blocks
	const newTrigBlocks = Array.from(document.querySelectorAll(".rm-block:not(.rm-block--ghost)"))
		.filter(b => !b.querySelector(`[class=${webimportClass}]`) && matchArrays(tags, JSON.parse(b.getAttribute("data-page-links") || "[]")));
    
	const elem = document.createElement("span");
	elem.classList.add(webimportClass);

	newTrigBlocks.forEach(b => b.insertAdjacentElement("afterbegin", elem.cloneNode(true) as Element));
};

export { findWebimportDivs, matchArrays, setWebimportDivs };