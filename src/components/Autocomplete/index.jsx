import React, { useCallback, useContext, useEffect, useMemo } from "react";
import Tribute from "tributejs";

import { formatItemReference, escapeRegExp } from "../../utils";
import { useQuery_Items } from "../../api/queries";

import { ExtensionContext, UserSettings } from "../App";
import "./index.css";

const tributeClass = "zr-tribute";
const tributeSelectedClass = "zr-tribute--selected";
const tributeItemDetailsClass = "zr-tribute--item-details";

const tributeConfig = {
	selectClass: tributeSelectedClass,
	containerClass: tributeClass,
	lookup: "display",
	menuShowMinLength: 1,
	menuItemLimit: 25,
	menuItemTemplate: (item) => {
		let { itemType, display } = item.original;
		return `
        <span data-item-type="${itemType}"></span>
        <span class="${tributeItemDetailsClass}">${display}</span>
        `;
	},
	noMatchTemplate: function () {
		return "<span style:\"visibility: hidden;\"></span>";
	},
	requireLeadingSpace: true,
	selectTemplate: (item) => {
		return item.original.value;
	},
	searchOpts: {
		skip: true
	}
};

/** Custom hook to retrieve library items and return them in a convenient format for the Tribute, sorted by last-modified
 * @param {Object[]} reqs - The data requests to use to retrieve items 
 * @param {("inline"|"tag"|"pageref"|"citation"|"popover"|"zettlr"|"citekey")} format - The format the item should be pasted as
 * @param {("inline"|"tag"|"pageref"|"citation"|"popover"|"zettlr"|"citekey")} display - The format the item should be displayed in 
 * @returns {{key: String, itemType: String, source: ("zotero"), value: String, display: String}[]} The array of Tribute entries
 */
const useGetItems = (reqs, format = "citekey", display = "citekey") => {
	const itemQueries = useQuery_Items(reqs, { 
		select: (datastore) => {
			return datastore.data
				? datastore.data
					.filter(item => !["attachment", "note", "annotation"].includes(item.data.itemType))
					.sort((a,b) => a.data.dateModified > b.data.dateModified ? -1 : 1)
					.map(item => {
						return {
							key: item.key,
							itemType: item.data.itemType,
							source: "zotero",
							value: formatItemReference(item, format, {accent_class: "zr-accent-1"}) || item.key,
							display: formatItemReference(item, display, {accent_class: "zr-accent-1"}) || item.key
						};
					})
				: [];
		},
		notifyOnChangeProps: ["data"] 
	});
	const data = itemQueries.map(q => q.data || []).flat(1);
    
	return data;
};

const Autocomplete = React.memo(function Autocomplete() {
	const { dataRequests } = useContext(ExtensionContext);
	const { autocomplete: { trigger, display = "citekey", format = "citation" } } = useContext(UserSettings);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const formattedLib = useGetItems(dataRequests, format, display) || [];
	
	const tributeFactory = useMemo(() => {
		return {
			trigger,
			...tributeConfig,
			values: (text,cb) => {
				cb(formattedLib.filter(item => item[tributeConfig.lookup].toLowerCase().includes(text.toLowerCase())));
			}
		};
	}, [formattedLib, trigger]);

	// Detect if a block is currently being edited
	const checkEditingMode = useCallback(() => {
		let textArea = document.querySelector("textarea.rm-block-input");
		if (!textArea || textArea.getAttribute("zotero-tribute") != null) return;

		document.querySelectorAll(`.${tributeClass}`).forEach(d=>d.remove());

		textArea.setAttribute("zotero-tribute", "active");

		var tribute = new Tribute(tributeFactory);
		tribute.attach(textArea);

		textArea.addEventListener("tribute-replaced", (e) => {
			let item = e.detail.item;
			if(item.original.source == "zotero"){
				let textArea = document.querySelector("textarea.rm-block-input");
				let triggerString = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
				let triggerPos = e.detail.context.mentionPosition;

				let replacement = e.detail.item.original.value;
				let blockContents = e.target.defaultValue;

				let escapedTrigger = escapeRegExp(triggerString);
				let triggerRegex = new RegExp(escapedTrigger, "g");
				let newText = blockContents.replaceAll(triggerRegex, (match, pos) => (pos == triggerPos) ? replacement : match );

				var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
				setValue.call(textArea, newText);

				var ev = new Event("input", { bubbles: true });
				textArea.dispatchEvent(ev); 
			}
		});
	}, [tributeFactory]);

	useEffect(() => {
		const editingObserver = new MutationObserver(checkEditingMode);
		editingObserver.observe(document, { childList: true, subtree: true});

		return () => {
			editingObserver.disconnect();
			try { document.querySelector(`.${tributeClass}`).remove(); } 
			catch(e){
				// Do nothing
			}
		};
	}, [checkEditingMode]);

	return null;
});

export default Autocomplete;
