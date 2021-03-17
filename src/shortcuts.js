;(()=>{
    zoteroRoam.shortcuts = {
        actions: {
            closeSearchPanel: {
                defaultShortcut: {'Escape': true},
                execute(){
                    if (zoteroRoam.interface.search.visible){
                        zoteroRoam.interface.toggleSearchOverlay("hide");
                    }
                }
            },
            toggleSearchPanel: {
                defaultShortcut: {altKey: true, 'q': true},
                execute(){
                    let cmd = zoteroRoam.interface.search.visible ? "hide" : "show";
                    zoteroRoam.interface.toggleSearchOverlay(cmd);
                }
            },
            toggleQuickCopy: {
                defaultShortcut: [],
                execute(){
                    document.getElementById("zotero-quick-copy-mode").click();
                }
            },
            importMetadata: {
                defaultShortcut: [],
                execute(){
                    let addItemMetadataButton = document.querySelector("button.item-add-metadata");
                    if(addItemMetadataButton !== null){
                        addItemMetadataButton.click();
                    }
                }
            },
            focusSearchBar: {
                defaultShortcut: [],
                execute(){
                    if(zoteroRoam.interface.search.visible){
                        zoteroRoam.interface.search.input.focus();
                    }
                }
            },
            goToItemPage: {
                defaultShortcut: [],
                execute(){
                    let goToPageButton = document.querySelector("button.item-go-to-page");
                    let pageURL = `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${goToPageButton.dataset.uid}`;
                    if(goToPageButton !== null && goToPageButton.disabled == false){
                        window.location.href = pageURL;
                        zoteroRoam.interface.toggleSearchOverlay("hide");
                    }
                }
            },
            copyCitekey: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="citekey"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyCitation: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="citation"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyTag: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="tag"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyPageRef: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="page-reference"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            }
        },

        sequences: {},

        getSequences(action){
            let shortcuts = zoteroRoam.config.shortcuts.filter(sh => sh.action == action);
            if(shortcuts.length == 0){
                return false;
            } else {
                let arraySequences = shortcuts.map(sh => {
                    let activeKeys = []; 
                    for(key in sh.template){
                        if(sh.template[key] == true){
                            let cleanKey = (key.endsWith("Key")) ? key.slice(0,-3) : key;
                            activeKeys.push(cleanKey);
                        };
                    } 
                    return activeKeys;
                });
                return arraySequences.map(seq => seq.join("-")).join(" or ");
            }
        },

        generateSequences(){
            for(action in zoteroRoam.shortcuts.actions){
                let shortcutSequences = zoteroRoam.shortcuts.getSequences(action);
                if(shortcutSequences){
                    zoteroRoam.shortcuts.sequences[action] = shortcutSequences;
                }
            }
        },

        makeSequenceText(action, pre = "", post = ""){
            return `${pre}<span class="zotero-roam-sequence">${zoteroRoam.shortcuts.sequences[action]}</span>`;
        },

        setup(){
            let defaultTemplates = {};
            Object.keys(zoteroRoam.shortcuts.actions).forEach(action => {
                defaultTemplates[action] = zoteroRoam.shortcuts.actions[action].defaultShortcut;
            });

            let templates = {};
            if(zoteroRoam.config.userSettings.shortcuts){
                Object.keys(zoteroRoam.shortcuts.actions).forEach(action => {
                    let { [action] : temp = defaultTemplates[action] } = zoteroRoam.config.userSettings.shortcuts;
                    templates[action] = temp;
                });
            } else{
                templates = defaultTemplates;
            }

            let shortcutObjects = [];
            for(k in templates){
                if(templates[k].constructor === Object){ 
                    shortcutObjects.push({ action: k, template: templates[k]});
                } else if(templates[k].constructor === Array){
                    templates[k].forEach(tem => {
                        shortcutObjects.push({ action: k, template: tem});
                    })
                }
            }
            shortcutObjects.forEach(obj => {
                zoteroRoam.config.shortcuts.push(new zoteroRoam.Shortcut(obj));
            });
        },

        setupSequences(){
            zoteroRoam.shortcuts.generateSequences();

            // Search Panel : toggle, close
            let toggleSeqText = (zoteroRoam.shortcuts.sequences["toggleSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleSearchPanel", pre = "Toggle search panel with ") : "";
            let closeSeqText = (zoteroRoam.shortcuts.sequences["closeSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("closeSearchPanel", pre = "Exit with ") : "";
            if(toggleSeqText.length > 0 | closeSeqText.length > 0){
                let spanSeqs = document.createElement('span');
                spanSeqs.style = `font-style:italic;`;
                spanSeqs.innerHTML = `${[toggleSeqText, closeSeqText].filter(Boolean).join(" / ")}  `;
                let searchHeader = document.querySelector('.zotero-search-overlay .bp3-dialog-header');
                searchHeader.insertBefore(spanSeqs, zoteroRoam.interface.search.closeButton);
            };
            // Quick Copy : toggle
            let qcText = (zoteroRoam.shortcuts.sequences["toggleQuickCopy"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleQuickCopy", pre = " ") : "";
            if(qcText.length > 0){
                let searchHeader = document.querySelector('.zotero-search-overlay .bp3-dialog-header');
                searchHeader.querySelector(".bp3-control.bp3-switch").innerHTML += qcText;
            };
            // Import metadata => in rendering of selected item
            // Focus searchbar
            let focusSearchBarText = (zoteroRoam.shortcuts.sequences["focusSearchBar"]) ? zoteroRoam.shortcuts.makeSequenceText("focusSearchBar") : "";
            if(focusSearchBarText.length > 0){
                let spanSeq = document.createElement('span');
                spanSeq.classList.add("bp3-input-action");
                spanSeq.style = `height:30px;padding:5px;`;
                spanSeq.innerHTML = `${focusSearchBarText}`;
                zoteroRoam.interface.search.input.closest('.bp3-input-group').appendChild(spanSeq);
            }
            // Go to item page => in rendering of selected item
        },

        verify(e){
            let keyName = e.key;
            let keyPressed = (e.type == "keydown") ? true : false;
            let specialKeys = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
            // Update all the watchers
            zoteroRoam.config.shortcuts = zoteroRoam.config.shortcuts.map(sh => {
                let {action, template, watcher} = sh;
                // Update status of special keys
                specialKeys.forEach(k => { watcher[k] = e[k] });
                // If the key is part of the shortcut template, update its real-time status (true = pressed, false = not pressed)
                if(template.hasOwnProperty(keyName) | template.hasOwnProperty(keyName.toLowerCase())){
                    let watchedName = (template.hasOwnProperty(keyName)) ? keyName : keyName.toLowerCase();
                    watcher[watchedName] = keyPressed };
                return {
                    action: action,
                    template: template,
                    watcher: watcher
                };
            });
            // Once all the watchers have been updated, compare the watchers against the templates & decide whether an action should be triggered
            // Note that if two shortcuts are somehow triggered in the same combination of keys, they'll be processed in order of declaration
            zoteroRoam.config.shortcuts.forEach(sh => {
                if(JSON.stringify(sh.watcher) === JSON.stringify(sh.template)){
                    zoteroRoam.shortcuts.actions[`${sh.action}`].execute();
                }
            });
        }
    }
})();
