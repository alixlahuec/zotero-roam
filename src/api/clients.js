import axios from "axios";
import axiosRetry from "axios-retry";


const zoteroClient = axios.create({
	baseURL: "https://api.zotero.org/",
	headers: {
		"Zotero-API-Version": 3
	}
});
axiosRetry(zoteroClient, {
	retries: 2,
	retryCondition: (error) => {
		/* istanbul ignore else */
		if(error.response){
			const { status } = error.response;
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
		/* istanbul ignore else */
		if(error.response){
			const { headers } = error.response;
			return (headers.backoff || headers["retry-after"] || retryCount) * 1000;
		} else {
			return retryCount * 3000;
		}
	}
});

const semanticClient = axios.create({
	baseURL: "https://api.semanticscholar.org/v1/paper/",
	params: {
		"include_unknown_references": "true"
	}
});
axiosRetry(semanticClient, {
	retries: 3
});

const citoidClient = axios.create({
	baseURL: "https://en.wikipedia.org/api/rest_v1/data/citation/zotero"
});

export {
	zoteroClient,
	semanticClient,
	citoidClient
};