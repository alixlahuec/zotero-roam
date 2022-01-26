;(()=>{
    zoteroRoam.smartblocks = {
        commands: {
            'ZOTERORANDOMCITEKEY': {
                help: "Return one or more Zotero citekeys, with optional tag query",
                handler: (context) => (nb = '1', query='') => {
                    return zoteroRoam.data.items
                      .filter(it => !['attachment', 'note', 'annotation'].includes(it.data.itemType) && zoteroRoam.smartblocks.processQuery(query, it.data.tags.map(t => t.tag)))
                      .map(it => it.key)
                      .sort(() => 0.5 - Math.random())
                      .slice(0, Number(nb) || 1)
                }
            }
        },
        // Extension commands : utility functions
        processQuery(query, props){
            let components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(Boolean);
            if(components.includes("|")){
              return zoteroRoam.smartblocks.eval_or(components.filter(c => c != "|"), props);
            } else {
              return zoteroRoam.smartblocks.eval_and(components.filter(c => c!= "&"), props);
            }
        },

        eval_and(terms, props){
            let outcome = true;
            for(let i=0;i<terms.length && outcome == true;i++){
              outcome = zoteroRoam.smartblocks.eval_term(terms[i], props);
            }
            return outcome;
        },
          
        eval_or(terms, props){
            let outcome = false;
            for(let i=0;i<terms.length && outcome == false;i++){
              outcome = zoteroRoam.smartblocks.eval_term(terms[i], props);
            }
            return outcome;
        },

        eval_term(term, props){
            if(term.startsWith("(") && term.endsWith(")")){
              // If the term was a (grouping), strip the outer parentheses & send to processing
              let clean_str = term.slice(1, -1);
              return zoteroRoam.smartblocks.processQuery(clean_str, props);
            } else {
                if(term.startsWith("-")){
                    let clean_str = term.slice(1);
                    return !props.includes(clean_str);
                } else {
                    return props.includes(term);
                }
            }
        },
        registerCommands(){
            Object.keys(zoteroRoam.smartblocks.commands).forEach(k => {
                let {help, handler} = zoteroRoam.smartblocks.commands[`${k}`];
                window.roamjs?.extension?.smartblocks?.registerCommand({
                    text: k,
                    help: help,
                    handler: handler
                })
            });
        },
        // Extension-triggered Smartblocks
        async use_smartblock_metadata(config, context){
            let obj = config;
            obj.targetUid = context.uid;
            if(!obj.variables){ obj.variables = {} };
            Object.keys(context).forEach(k => {
                obj.variables[`${k}`] = context[`${k}`];
            });
            try {
                await window.roamjs.extension.smartblocks.triggerSmartblock(obj);
                return {
                    success: true
                }
            } catch(e){
                console.log(e);
                return {
                    success: false
                }
            }
        }
    };
})();