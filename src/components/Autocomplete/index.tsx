/* istanbul ignore file */
import { memo, useCallback, useEffect, useMemo } from "react";
import Tribute, { TributeCollection } from "tributejs";

import { useAutocompleteSettings, useRequestsSettings } from "Components/UserSettings";

import { useItems } from "@clients/zotero";
import { Queries } from "@services/react-query";
import { TributeJS } from "@services/tribute";
import { escapeRegExp, formatItemReference } from "../../utils";

import { CustomClasses } from "../../constants";
import { DataRequest, ZItemReferenceFormat } from "Types/extension";
import { isZItemTop } from "Types/transforms";
import "./_index.sass";


type Option = {
	display: string,
	itemType: string,
	key: string,
	source: "zotero",
	value: string
};

const LOOKUP_KEY: keyof Option = "display";

const tributeConfig: TributeCollection<Option> = {
	selectClass: CustomClasses.TRIBUTE_SELECTED,
	containerClass: CustomClasses.TRIBUTE,
	lookup: LOOKUP_KEY,
	menuShowMinLength: 1,
	// @ts-ignore Property is missing from types in latest release, but exists on TributeCollection
	// See https://github.com/zurb/tribute/pull/447 (merged but unreleased)
	menuItemLimit: 25,
	menuItemTemplate: (item) => {
		const { itemType, display } = item.original;
		return `
        <span data-item-type="${itemType}"></span>
        <span class="${CustomClasses.TRIBUTE_DETAILS}">${display}</span>
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
		pre: "<span>",
		post: "</span>",
		skip: true
	}
};

/** Custom hook to retrieve library items and return them in a convenient format for the Tribute, sorted by last-modified
 * @returns The array of Tribute entries
 */
const useGetItems = (
	/** The targeted data requests  */
	reqs: DataRequest[],
	/** The format the item should be pasted as */
	format: ZItemReferenceFormat | string = "citekey",
	/** The format the item should be displayed in */
	display: ZItemReferenceFormat | string = "citekey"
): Option[] => {
	const select = useCallback((datastore: Queries.Data.Items) => {
		return datastore.data
			? datastore.data
				.filter(isZItemTop)
				.sort((a, b) => a.data.dateModified > b.data.dateModified ? -1 : 1)
				.map(item => {
					return {
						key: item.key,
						itemType: item.data.itemType,
						source: "zotero",
						value: formatItemReference(item, format, { accent_class: CustomClasses.TEXT_ACCENT_1 }) || item.key,
						display: formatItemReference(item, display, { accent_class: CustomClasses.TEXT_ACCENT_1 }) || item.key
					} as Option;
				})
			: [];
	}, [display, format]);

	const itemQueries = useItems(reqs, { 
		select,
		notifyOnChangeProps: ["data"] 
	});

	const data = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);
    
	return data;
};

const Autocomplete = memo(function Autocomplete() {
	const [{ dataRequests }] = useRequestsSettings();
	const [{ trigger, display_char, display_use = "preset", display = "citekey", format_char, format_use = "preset", format = "citation" }] = useAutocompleteSettings();

	const display_as = useMemo(() => (display_use == "preset") ? display : display_char, [display, display_char, display_use]);
	const format_as = useMemo(() => (format_use == "preset") ? format : format_char, [format, format_char, format_use]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const formattedLib = useGetItems(dataRequests, format_as, display_as) || [];

	const tributeFactory = useMemo<TributeCollection<Option>>(() => {
		return {
			trigger,
			...tributeConfig,
			values: (text,cb) => {
				cb(formattedLib.filter(item => item[LOOKUP_KEY].toLowerCase().includes(text.toLowerCase())));
			}
		};
	}, [formattedLib, trigger]);

	// Detect if a block is currently being edited
	const checkEditingMode = useCallback(() => {
		const textArea = document.querySelector("textarea.rm-block-input");
		if (!textArea || textArea.getAttribute("zotero-tribute") != null) {return;}

		document.querySelectorAll(`.${CustomClasses.TRIBUTE}`).forEach(d => d.remove());

		textArea.setAttribute("zotero-tribute", "active");

		// TODO: extract code below into a service

		const tribute = new Tribute(tributeFactory);
		tribute.attach(textArea);

		textArea.addEventListener("tribute-replaced", (e: CustomEvent<TributeJS.Events.TributeReplaced>) => {
			const item = e.detail.item;
			if(item.original.source == "zotero"){
				const triggerString = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
				const triggerPos = e.detail.context.mentionPosition;

				const replacement = e.detail.item.original.value;
				const blockContents = (e.target as HTMLTextAreaElement).defaultValue;

				const escapedTrigger = escapeRegExp(triggerString);
				const triggerRegex = new RegExp(escapedTrigger, "g");
				const newText = blockContents.replaceAll(triggerRegex, (match, pos) => (pos == triggerPos) ? replacement : match );

				const setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set;
				setValue!.call(textArea, newText);

				const ev = new Event("input", { bubbles: true });
				textArea.dispatchEvent(ev); 
			}
		});
	}, [tributeFactory]);

	useEffect(() => {
		const editingObserver = new MutationObserver(checkEditingMode);
		editingObserver.observe(document, { childList: true, subtree: true });

		return () => {
			editingObserver.disconnect();
			try { document.querySelector(`.${CustomClasses.TRIBUTE}`)!.remove(); } 
			catch(e){
				// Do nothing
			}
		};
	}, [checkEditingMode]);

	return null;
});

export default Autocomplete;
