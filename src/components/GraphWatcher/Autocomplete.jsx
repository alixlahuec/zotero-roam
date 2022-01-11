import React, { useCallback, useEffect } from 'react';
import Tribute from "tributejs";

import { formatItemReference, escapeRegExp } from "../../utils";
import { queryItems } from "../../queries";

const tributeClass = 'zotero-roam-tribute';

const tributeConfig = {
    selectClass: 'zotero-roam-tribute-selected',
    containerClass: tributeClass,
    lookup: 'display',
    menuItemLimit: 15,
    menuItemTemplate: (item) => {
        return item.original.display;
    },
    requireLeadingSpace: true,
    selectTemplate: (item) => {
        return item.original.value;
    },
    searchOpts: {
        skip: true
    }
}

const getItems = (reqs, format = "citekey", display = "citekey") => {
    const itemQueries = queryItems(reqs, { 
        select: (datastore) => {
            return datastore.data
            .filter(item => !['attachment', 'note', 'annotation'].includes(item.data.itemType))
            .map(item => {
                return {
                    key: item.key,
                    source: "zotero",
                    value: formatItemReference(item, format) || item.key,
                    display: formatItemReference(item, display) || item.key
                }
            })
        },
        notifyOnChangeProps: ['data'] 
    });
    const data = itemQueries.map(q => q.data || []).flat(1);
    
    // For debugging
    console.log(data);

    return data;
}

const Autocomplete = React.memo(props => {
    const { config, dataRequests } = props;
    const { trigger, display = "citekey", format = "citation" } = config;

    const formattedLib = getItems(dataRequests, format, display);
    const tributeFactory = {
        trigger,
        ...tributeConfig,
        values: (text,cb) => {
            cb(formattedLib.filter(item => item[tributeConfig.lookup].toLowerCase().includes(text.toLowerCase())))
        }
    }

    // Detect if a block is currently being edited
    const checkEditingMode = useCallback(() => {
        let textArea = document.querySelector("textarea.rm-block-input");
        if (!textArea || textArea.getAttribute("zotero-tribute") != null) return;

        document.querySelectorAll(`.${tributeClass}`).forEach(d=>d.remove());

        textArea.setAttribute("zotero-tribute", "active");

        var tribute = new Tribute(tributeFactory);
        tribute.attach(textArea);

        textArea.addEventListener('tribute-replaced', (e) => {
            let item = e.detail.item;
            if(item.original.source == "zotero"){
                let textArea = document.querySelector('textarea.rm-block-input');
                let triggerString = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
                let triggerPos = e.detail.context.mentionPosition;

                let replacement = e.detail.item.original.value;
                let blockContents = e.target.defaultValue;

                let escapedTrigger = escapeRegExp(triggerString);
                let triggerRegex = new RegExp(escapedTrigger, 'g');
                let newText = blockContents.replaceAll(triggerRegex, (match, pos) => (pos == triggerPos) ? replacement : match );

                var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setValue.call(textArea, newText);

                var ev = new Event('input', { bubbles: true });
                textArea.dispatchEvent(ev); 
            }
        });
    }, [tributeFactory]);

    useEffect(() => {
        const editingObserver = new MutationObserver(checkEditingMode);
        editingObserver.observe(document, { childList: true, subtree: true});

        return () => {
            editingObserver.disconnect();
        }
    }, [checkEditingMode]);

    return null;
})

export default Autocomplete;