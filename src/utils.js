import ReactDOM from 'react-dom';
import './typedefs';

function analyzeUserRequests(reqs){
    if(reqs.length == 0){
        throw new Error('At least one data request must be specified for the extension to function.');
    } else {
        let fallbackAPIKey = reqs.find(req => req.apikey).apikey;
        if(!fallbackAPIKey){
            throw new Error('At least one data request must be assigned an API key.');
        } else {
            const dataRequests = reqs.map((req, i) => {
                let { dataURI, apikey = fallbackAPIKey, params = '', name = `${i}`} = req;
                let library = dataURI.match(/(users|groups)\/(.+?)\//g)[0].slice(0,-1)

                if(!dataURI){
                    throw new Error('Each data request must be assigned a data URI.');
                }

                return { dataURI, apikey, params, name, library };
            });

            const apiKeys = Array.from(new Set(dataRequests.map(req => req.apikey)));
            const libraries = dataRequests.reduce((arr, req) => {
                let { library: path, apikey} = req;
                let has_lib = arr.find(lib => lib.path == path);
                if(!has_lib){
                    arr.push({ path, apikey });
                }
                return arr;
            }, []);

            return {
                dataRequests,
                apiKeys,
                libraries
            }
        }
    }
}

/** Copies a portion of text to the user's clipboard
 * @param {String} text - The text to copy 
 * @returns {{success: Boolean|null}} The outcome of the operation
 */
function copyToClipboard(text){
    if(navigator.clipboard){
        navigator.clipboard.writeText(text)
        .then((response) => {
            return {
                success: true
            }
        })
        .catch((error) => {
            console.error(error);
            return {
                success: false
            }
        })
    } else {
        return {
            success: null
        }
    }
}

/** Creates a local link to a specific Zotero item, which opens in the standalone app.
 * @param {ZoteroItem|Object} item - The targeted Zotero item
 * @param {{format: String, text: String}} config - Additional settings
 * @returns A link to the item, either as a Markdown link or a URI
 */
function getLocalLink(item, {format = "markdown", text = "Local library"} = {}){
    let location = item.library.type == "group" ? `groups/${item.library.id}` : `library`;
    let target = `zotero://select/${location}/items/${item.data.key}`;
    switch(format){
        case "markdown":
            return `[${text}](${target})`;
        case "target":
        default:
            return target;
    }
}

/** Creates a web link to a specific Zotero item, which opens in the browser.
 * @param {ZoteroItem|Object} item - The targeted Zotero item 
 * @param {{format: String, text: String}} config - Additional settings 
 * @returns A link to the item, either as a Markdown link or a URL
 */
function getWebLink(item, {format = "markdown", text = "Web library"} = {}){
    let location = ((item.library.type == "user") ? "users" : "groups") + `/${item.library.id}`;
    let target = `https://www.zotero.org/${location}/items/${item.data.key}`;
    switch(format){
        case "markdown":
            return `[${text}](${target})`;
        case "target":
        default:
            return target;
    }
}

/** Creates a user-readable timestamp for a given date-time.
 * @param {Date|String} date - The date to convert 
 * @returns A timestamp in text format, HH:MM
 */
function makeTimestamp(date){
    let d = date.constructor === Date ? date : new Date(date);
    return `${d.getHours()}:${('0' + d.getMinutes()).slice(-2)}`;
}

/** Determines if two arrays have any strings in common
 * @param {String[]} arr1 - The first array to use 
 * @param {String[]} arr2 - The second array to use
 * @returns `true` if at least one string is present in both arrays - otherwise `false`
 */
function matchArrays(arr1, arr2){
    return arr1.some(el => arr2.includes(el));
}

/** Extracts a valid DOI from a string
 * @param {String} doi - The string to test 
 * @returns The DOI (starting with `10.`) if any - otherwise `false`
 */
function parseDOI(doi){
    if(!doi){
      return false;
    } else {
      // Clean up the DOI format if needed, to extract prefix + suffix only
        let formatCheck = doi.match(/10\.([0-9]+?)\/(.+)/g);
        if(formatCheck){
            return formatCheck[0].toLowerCase();
        } else {
            return false;
        }
    }
}

/** Quantifies an ordinary English noun
 * @param {Integer} num - The quantity 
 * @param {String} string - The noun to quantify 
 * @param {String} suffix - An optional suffix for the noun
 * @returns A properly pluralized string
 */
function pluralize(num, string, suffix = "") {
    return `${num == 0 ? "No" : num} ${string}${num == 1 ? "" : "s"}${suffix}`;
}

/** Converts a Roam Daily Note title into a JavaScript date
 * @param {String} string - Daily Note Page (DNP) title 
 * @param {{as_date: Boolean}} config - Additional settings 
 * @returns The corresponding date, either as a Date or an Array (YYYY,M,DD)
 */
function readDNP(string, { as_date = true } = {}){
    let [match, mm, dd, yy] = Array.from(string.matchAll(/(.+) ([0-9]+).{2}, ([0-9]{4})/g))[0];
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let parsedDate = [parseInt(yy), months.findIndex(month => month == mm) + 1, parseInt(dd)];
    
    return as_date ? new Date([...parsedDate]) : parsedDate;
}

/** Injects external scripts into the page
 * @param {{id: String, src: String}[]} deps - List of scripts to inject 
 */
function setupDependencies(deps){
    deps.forEach(dep => {
        let { id, src } = dep;
        try { document.getElementById(id).remove() } catch(e){ };
        let script = document.createElement('script');
        script.src = src;
        script.type = 'application/javascript';
        script.async = true;
        document.getElementsByTagName('head')[0].appendChild(script);
    })
}
/** Injects DOM elements to be used as React portals by the extension
 * @param {String} slotID - The id to be given to the extension's icon's slot in the topbar 
 * @param {String} portalID - The id to be given to the extension's designated div portal for overlays etc.
 */
function setupPortals(slotID, portalID){
    // Topbar slot for the extension's icon
    let exists = document.getElementById(slotID);
    if(exists){
        try{
            ReactDOM.unmountComponentAtNode(exists);
            exists.remove()
        } catch(e){
            console.error(e);
        }
    }

    let roamSearchbar = document.querySelector('.rm-topbar .rm-find-or-create-wrapper');
    let extensionSlot = document.createElement('span');
    extensionSlot.id = slotID;
    roamSearchbar.insertAdjacentElement('afterend', extensionSlot);

    // Portal for the extension's overlays
    try{ document.getElementById(portalID).remove() } catch(e){ };
    let zrPortal = document.createElement('div');
    zrPortal.id = portalID;
    document.getElementById('app').appendChild(zrPortal);
}

/** Sorts an array of Zotero items by publication year then alphabetically
 * @param {ZoteroItem[]|Object[]} arr - The items to sort
 * @returns {ZoteroItem[]|Object[]} The array, sorted by `meta.parsedDate` then `meta.creatorSummary`
 */
function sortItemsByYear(arr) {
    let [...papers] = arr;
    return papers.sort((a,b) => {
        if(!a.meta.parsedDate){
            if(!b.meta.parsedDate){
                return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
            } else {
                return 1;
            }
        } else {
            if(!b.meta.parsedDate){
                return -1;
            } else {
                let date_diff = new Date(a.meta.parsedDate).getUTCFullYear() - new Date(b.meta.parsedDate).getUTCFullYear();
                if(date_diff < 0){
                    return -1;
                } else if(date_diff == 0){
                    return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
                } else {
                    return 1;
                }
            }
        }
    });
}

export {
    analyzeUserRequests,
    copyToClipboard,
    getLocalLink,
    getWebLink,
    makeTimestamp,
    matchArrays,
    parseDOI,
    pluralize,
    readDNP,
    setupDependencies,
    setupPortals,
    sortItemsByYear
}