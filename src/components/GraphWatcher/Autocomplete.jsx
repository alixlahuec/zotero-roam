import React, { useEffect } from 'react';
import Tribute from "tributejs";

import { escapeRegExp } from "../../utils";
import { getItems } from "../../queries";

const tributeConfig = {
    selectClass: 'zotero-roam-tribute-selected',
    containerClass: 'zotero-roam-tribute',
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

const Autocomplete = React.memo(props => {
    const { config } = props;
    useEffect(() => {
        const editingObserver = new MutationObserver(checkEditingMode);
        editingObserver.observe(document, { childList: true, subtree: true});

        return () => {
            editingObserver.disconnect();
        }
    }, [config]);

    // Detect if a block is currently being edited
    const checkEditingMode = useCallback(() => {
        const { trigger, display = "citekey", format = "citation" } = config;
        const values = (text, cb) => {
            let formattedLib = getItems(format, display);
            cb(formattedLib.filter(item => item[tributeConfig.lookup].toLowerCase().includes(text.toLowerCase())));
        }

        let textArea = document.querySelector("textarea.rm-block-input");
        if (!textArea || textArea.getAttribute("zotero-tribute") != null) return;

        document.querySelectorAll('.zotero-roam-tribute').forEach(d=>d.remove());

        textArea.setAttribute("zotero-tribute", "active");

        var tribute = new Tribute({trigger, values, ...tributeConfig});
        tribute.attach(textArea);

        textArea.addEventListener('tribute-replaced', (e) => {
            let item = e.detail.item;
            if(item.original.source == "zotero"){
                let textArea = document.querySelector('textarea.rm-block-input');
                let trigger = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
                let triggerPos = e.detail.context.mentionPosition;

                let replacement = e.detail.item.original.value;
                let blockContents = e.target.defaultValue;

                let escapedTrigger = escapeRegExp(trigger);
                let triggerRegex = new RegExp(escapedTrigger, 'g');
                let newText = blockContents.replaceAll(triggerRegex, (match, pos) => (pos == triggerPos) ? replacement : match );

                var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setValue.call(textArea, newText);

                var ev = new Event('input', { bubbles: true });
                textArea.dispatchEvent(ev); 
            }
        });
    }, [config]);
})

export default Autocomplete;