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
			if(headers["backoff"]){
				return headers["backoff"] * 1000;
			} else if(headers["retry-after"]){
				return headers["retry-after"] * 1000;
			} else {
				return retryCount * 1000;
			}
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
axiosRetry(citoidClient, {
	retries: 2,
	retryCondition: (error) => {
		if(error.response){
			let { status } = error.response;
			if(status == 404){
				return false;
			} else {
				return true;
			}
		} else {
			return true;
		}
	}
});

export {
	zoteroClient,
	semanticClient,
	citoidClient
};