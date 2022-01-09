import axios from 'axios';
import axiosRetry from 'axios-retry';
import { useQueries, useQuery, useQueryClient } from 'react-query';
import { parseDOI } from './utils';
import './typedefs';

const zoteroClient = axios.create({
    baseURL: "https://api.zotero.org/",
    headers: {
        'Zotero-API-Version': 3
    }
});
axiosRetry(zoteroClient, {
    retries: 2,
    retryCondition: (error) => {
        if(error.response){
            let { status } = error.response;
            if(status == 429 || status >= 500){
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    },
    retryDelay: (retryCount, error) => {
        if(error.response){
            let { headers } = error.response;
            if(headers['backoff']){
                return headers['backoff'] * 1000;
            } else if(headers['retry-after']){
                return headers['retry-after'] * 1000;
            } else {
                return retryCount * 1000;
            }
        } else {
            return retryCount * 1000;
        }
    }
});

const semanticClient = axios.create({
    baseURL: 'https://api.semanticscholar.org/v1/paper/',
    params: {
        'include_unknown_references': 'true'
    }
});
axiosRetry(semanticClient, {
    retries: 3
});

const citoidClient = axios.create({
    baseURL: 'https://en.wikipedia.org/api/rest_v1/data/citation/zotero'
})
axiosRetry(citoidClient, {
    retries: 3
})

/** Uses item React queries for specific data requests. By default, `staleTime = 1 min` and `refetchInterval = 1 min`.
 * @param {{apikey: String, dataURI: String, params: String, name: String}[]} reqs - The targeted data requests
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The item React queries that correspond to the data requests
 */
const queryItems = (reqs, opts = {}) => {
    // Defaults for this query
    let { staleTime = 1000 * 60, refetchInterval = 1000 * 60, ...rest} = opts;
    // Factory
    const client = useQueryClient();
    let queriesDefs = reqs.map((req) => {
        let { params, ...identifiers } = req;
        let queryKey = ['items', {...identifiers}];
        let { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
        return {
            queryKey: queryKey,
            queryFn: (queryKey) => fetchItems({ ...req, since }, { match }),
            staleTime,
            refetchInterval,
            ...rest
        }
    })
    return useQueries(queriesDefs);
}

/** Uses permission React queries for specific API keys. By default, `staleTime = 1 hour` and `refetchInterval = 1 hour`.
 * @param {String[]} keys - The targeted Zotero API keys 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The permission React queries that correspond to the API keys
 */
const queryPermissions = (keys, opts = {}) => {
    // Defaults for this query
    let { staleTime = 1000 * 60 * 60, refetchInterval = 1000 * 60 * 60, ...rest } = opts;
    // Factory
    let queriesDefs = keys.map((apikey) => {
        let queryKey = ['permissions', { apikey }];
        return {
            queryKey: queryKey,
            queryFn: (queryKey) => fetchPermissions(apikey),
            staleTime,
            refetchInterval,
            ...rest
        }
    });
    return useQueries(queriesDefs);
}

/** Uses tag React queries for specific libraries. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link queryItems}.
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The tag React queries that correspond to the libraries
 */
const queryTags = (libraries, opts = {}) => {
    // Defaults for this query
    let { staleTime = 1000 * 60 * 3, ...rest } = opts;
    // Factory
    let queriesDefs = libraries.map((library) => {
        let { path, apikey } = library;
        let queryKey = ['tags', { library: path, apikey }];
        return {
            queryKey: queryKey,
            queryFn: (queryKey) => fetchTags(library),
            staleTime,
            ...rest
        }
    });
    return useQueries(queriesDefs);
}

/** Uses collection React queries for specific libraries. By default, `staleTime = 5 min` and `refetchInterval = 5 min`.
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The collection React queries that correspond to the libraries
 */
const queryCollections = (libraries, opts = {}) => {
    // Defaults for this query
    let { staleTime = 1000 * 60 * 5, refetchInterval = 1000 * 60 * 5, ...rest} = opts;
    // Factory
    const client = useQueryClient();
    let queriesDefs = libraries.map((lib) => {
        let { path, apikey } = lib;
        let queryKey = ['collections', { library: path, apikey }];
        let { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
        return {
            queryKey: queryKey,
            queryFn: (queryKey) => fetchCollections(lib, since, { match }),
            staleTime,
            refetchInterval,
            ...rest
        }
    });
    return useQueries(queriesDefs);
}

/** Uses a React query to retrieve Semantic Scholar citation data for a specific DOI. By default, `cacheTime = Infinity`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 * @param {String} doi - The targeted DOI 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React query that correspond to the DOI's Semantic Scholar data
 */
const querySemantic = (doi, opts = {}) => {
    // Defaults for this query
    let { cacheTime = Infinity, ...rest } = opts;
    // Factory
    let queryKey = ['semantic', { doi }];
    return useQuery({
        queryKey,
        queryFn: (queryKey) => fetchSemantic(doi),
        cacheTime,
        ...rest
    });
}

/** Uses a React query to retrieve Wikipedia metadata for a specific URL. By default, `cacheTime = Infinity`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 * @param {String} query - The targeted URL 
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The React query that corresponds to the URL's Wikipedia metadata
 */
const queryCitoid = (query, opts = {}) => {
    // Defaults for this query
    let { cacheTime = Infinity, ...rest } = opts;
    // Factory
    let queryKey = ['citoid', { query }];
    return useQuery({
        queryKey,
        queryFn: (queryKey) => fetchCitoid(query),
        cacheTime,
        ...rest
    });
}

// UTILS

/** Extracts pinned citekeys from a dataset
 * @param {ZoteroItem[]} arr - The dataset of Zotero items to scan
 * @returns {Object[]} The processed dataset : each item gains a `has_citekey` property, and its `key` property is assigned its citekey 
 */
function extractCitekeys(arr){
    return arr.map(item => {
        item.has_citekey = false;
        if(typeof(item.data.extra) !== 'undefined'){
            if(item.data.extra.includes('Citation Key: ')){
                item.key = item.data.extra.match('Citation Key: (.+)')[1];
                item.has_citekey = true;
            }
        }
        return item;
    });
}

/** Compares two datasets and merges the changes. As the match is done on the `data.key` property, both items and collections can be matched.
 *  For items, merging involves an additional step to extract citekeys.
 * @param {{modified: ZoteroItem[]|ZoteroCollection[], deleted: ZoteroItem[]|ZoteroCollection[]}} update - The newer dataset
 * @param {Object[]} arr - The older dataset
 * @param {{with_citekey?: Boolean}} config - Additional parameters 
 * @returns {Object[]} - The merged dataset
 */
function matchWithCurrentData(update, arr, { with_citekey = false } = {}) {
    let oldData = arr || [];
    let { modified = [], deleted = [] } = update;

    // Remove deleted items
    if(deleted.length > 0){
        oldData = oldData.filter(item => !deleted.includes(item.data.key));
    }
    // If the data has citekeys, transform before pushing
    if(with_citekey){
        modified = extractCitekeys(modified);
    }

    // Update datastore
    if(modified.length == 0){
        return oldData;
    } else if(oldData.length == 0){
        return modified;
    } else {
        let [...datastore] = arr;
        modified.forEach(item => {
            let duplicateIndex = datastore.findIndex(i => i.data.key == item.data.key);
            if(duplicateIndex == -1){
                datastore.push(item);
            } else {
                datastore[duplicateIndex] = item;
            }
        });
        return datastore;
    }
}

/** Retrieves additional data from the Zotero API, when the original results are greater than the limit of n = 100.
 *  A minimum of parameters are required so that the function can be used for all data types.
 * @param {{dataURI: String, apikey: String, since?: Integer, params?: String}} req - The parameters of the request 
 * @param {Integer} totalResults - The total number of results indicated by the original response 
 * @returns {Promise<Object[]>} The additional results to the original request
 */
async function fetchAdditionalData(req, totalResults) {
    let { dataURI, apikey, params = '', since = null } = req;
    let nbExtraCalls = Math.ceil((totalResults / 100) - 1);
    let apiCalls = [];

    for(let i=1; i <= nbExtraCalls; i++){
        let reqParams = new URLSearchParams(params);
        if(since){
            reqParams.set('since', since);
        }
        reqParams.set('start', 100*i);
        reqParams.set('limit', 100);
        apiCalls.push(zoteroClient.get(`${dataURI}?${reqParams.toString()}`, { headers: { 'Zotero-API-Key': apikey } }));
    }

    return Promise.all(apiCalls)
    .then(([...responses]) => {
        return responses.map(res => res.data).flat(1);
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

/** Requests data from the Zotero API, based on a specific data URI
 * @param {{dataURI: String, apikey: String, params: String, since?: Integer, library: String}} req - The parameters of the request 
 * @param {{match: Object[]}} config - Additional parameters
 * @returns {Promise<{data: Object[], lastUpdated: Integer}>}
 */
async function fetchItems(req, { match = [] } = {}) {
    let { dataURI, apikey, params, since = 0, library } = req;
    let paramsQuery = new URLSearchParams(params);
    paramsQuery.set('since', since);
    paramsQuery.set('start', 0);
    paramsQuery.set('limit', 100);

    return await zoteroClient.get(`${dataURI}?${paramsQuery.toString()}`, { headers: { 'Zotero-API-Key': apikey } })
    .then(async (response) => {
        let { data: modified, headers } = response;
        let { 'last-modified-version': lastUpdated, 'total-results': totalResults } = headers;
        totalResults = Number(totalResults);
        if(totalResults > 100){
            let additional = await fetchAdditionalData({ dataURI, apikey, params, since }, totalResults);
            modified.push(...additional);
        }

        let deleted = [];
        // DO NOT request deleted items since X if since = 0 (aka, initial data request)
        // It's a waste of a call
        if(since > 0 && modified.length > 0){
            // Retrieve deleted items, if any
            deleted = await fetchDeleted({ apikey, path: library }, since);

            // Refetch tags data
            const client = useQueryClient();
            let tagsQueryKey = ['tags', { library: library, apikey: apikey }];
            let { lastUpdated: latest_tags_version } = client.getQueryData(tagsQueryKey) || {}; // TODO: Check if getQueryData needs exact matching - if not, remove the apikey portion of line above
            if(Number(latest_tags_version) < Number(lastUpdated)){
                client.refetchQueries(tagsQueryKey);
            }
        }

        return {
            data: matchWithCurrentData({ modified, deleted: deleted.items }, match, { with_citekey: true }),
            lastUpdated: Number(lastUpdated)
        };
    })
    .catch((error) => {
        return Promise.reject(error);
    });
}

/** Requests data from the `/keys` endpoint of the Zotero API
 * @param {String} apikey - The targeted API key
 * @returns {Promise<ZoteroKey>} The API key's permissions
 */
async function fetchPermissions(apikey) {
    return await zoteroClient.get(`keys/${apikey}`, { headers: { 'Zotero-API-Key': apikey } })
    .then((response) => {
        return response.data;
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

/** Requests data from the `/[library]/tags` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @returns {Promise<{data: Object[], lastUpdated: Integer}>} The library's tags
 */
async function fetchTags(library) {
    const { apikey, path } = library;
    return await zoteroClient.get(`${path}/tags?limit=100`, { headers: { 'Zotero-API-Key': apikey } })
    .then(async (response) => {
        let { data, headers } = response;
        let { 'last-modified-version': lastUpdated, 'total-results': totalResults } = headers;
        totalResults = Number(totalResults);
        if(totalResults > 100){
            let additional = await fetchAdditionalData({ dataURI: `${path}/tags`, apikey}, totalResults);
            data.push(...additional);
        }

        return { 
            data, 
            lastUpdated: Number(lastUpdated)
        };
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

/** Requests data from the `/[library]/collections` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {Integer} since - A library version
 * @param {{match: Object[]}} config - Additional parameters
 * @returns {Promise<{data: ZoteroCollection[], lastUpdated: Integer}>} Collections created or modified in Zotero since the specified version
 */
async function fetchCollections(library, since = 0, { match = [] } = {}) {
    const { apikey, path } = library;
    return await zoteroClient.get(`${path}/collections?since=${since}`, { headers: { 'Zotero-API-Key': apikey } })
    .then(async (response) => {
        let { data: modified, headers } = response;
        let { 'last-modified-version': lastUpdated, 'total-results': totalResults } = headers;
        totalResults = Number(totalResults);
        if(totalResults > 100){
            let additional = await fetchAdditionalData({ dataURI: `${path}/collections`, apikey, since}, totalResults);
            modified.push(...additional);
        }

        let deleted = [];
        // DO NOT request deleted items since X if since = 0 (aka, initial data request)
        // It's a waste of a call
        if(since > 0 && modified.length > 0){
            deleted = await fetchDeleted(...library, since);
        }

        return {
            data: matchWithCurrentData({ modified, deleted: deleted.collections }, match),
            lastUpdated: Number(lastUpdated)
        };
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

/** Requests data from the `/[library]/deleted` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {Integer} since - A library version
 * @returns {Promise<Object>} Elements deleted from Zotero since the specified version
 */
async function fetchDeleted(library, since) {
    const { apikey, path } = library;
    return await zoteroClient.get(`${path}/deleted?since=${since}`, { headers: { 'Zotero-API-Key': apikey } })
    .then((response) => {
        return response.data;
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param {String} doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns {Promise<{doi: String, citations: Object[], references: Object[]}>} Citation data for the item
**/
async function fetchSemantic(doi) {
    return await semanticClient.get(`${doi}`)
    .then((response) => {
        let { citations, references } = response.data;
        // Select & transform citations with valid DOIs
        citations = citations
        .map(cit => {
            let { doi, ...rest } = cit;
            return {
                doi: parseDOI(doi),
                ...rest
            }
        })
        .filter(cit => cit.doi);
        // Select & transform references with valid DOIs
        references = references
        .map(ref => {
            let { doi, ...rest } = ref;
            return {
                doi: parseDOI(doi),
                ...rest
            }
        })
        .filter(ref => ref.doi);
        
        return { doi, citations, references };
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

/** Requests data from the `/data/citation/zotero` endpoint of the Wikipedia API
 * @param {String} query - The URL for which to request Zotero metadata
 * @returns {Promise<Object>} The Zotero metadata for the URL
 */
async function fetchCitoid(query) {
    return await citoidClient.get(encodeURIComponent(query))
    .then((response) => {
        return response.data[0];
    })
    .catch((error) => {
        return Promise.reject(error);
    })
}

// -----------------

export {
    queryItems,
    queryPermissions,
    queryTags,
    queryCollections,
    querySemantic,
    queryCitoid
};