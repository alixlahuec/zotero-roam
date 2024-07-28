import { http, HttpResponse } from "msw";
import { Mocks } from "Mocks";


/* istanbul ignore next */
const addSampleMetadata = () => ({
	key: "XRT92",
	version: 0
});

const addCitoidMetadata = ({ creators, date, itemType, tags = [], title, url, ...props }: Partial<Mocks.Responses.CitoidSuccess[number]>) => ({
	...addSampleMetadata,
	creators,
	date,
	itemType,
	tags,
	title,
	url,
	...props
});

const addCreator = (
	[firstName, lastName, creatorType = "author"]: [string, string, Mocks.CreatorType?]
): Mocks.Creator => ({
	firstName,
	lastName,
	creatorType
});

export const goodIdentifier = "https://www.jmir.org/2021/9/e27283";
export const badIdentifier = "https://projects.iq.harvard.edu/files/harvarduxgroup/files/ux-research-guide-sample-questions-for-user-interviews.pdf";
export const semanticIdentifier = "https://doi.org/10.1370/afm.1918";
export const semanticNotAddedIdentifier = "https://doi.org/10.3122/jabfm.2017.01.160355";

const data = {
	[goodIdentifier]: {
		...addCitoidMetadata({
			abstractNote: "Chloe for COVID-19",
			creators: [
				addCreator(["Sophia", "Siedlikowski"]),
				addCreator(["Louis-Philippe", "Noël"]),
				addCreator(["Stephanie Anne", "Moynihan"]),
				addCreator(["Marc", "Robin"])
			],
			date: "",
			itemType: "journalArticle",
			publicationTitle: "Journal of Medical Internet Research",
			title: "Chloe for COVID-19: Evolution of an Intelligent Conversational Agent to Address Infodemic Management Needs During the COVID-19 Pandemic",
			url: goodIdentifier
		})
	} as Mocks.Responses.CitoidSuccess[number],
	[badIdentifier]: {
		status: 500,
		method: "get",
		type: "https://mediawiki.org/wiki/HyperSwitch/errors/unknown_error",
		uri: "/en.wikipedia.org/v1/data/citation/zotero/https%3A%2F%2Fprojects.iq.harvard.edu%2Ffiles%2Fharvarduxgroup%2Ffiles%2Fux-research-guide-sample-questions-for-user-interviews.pdf"
	} as Mocks.Responses.CitoidError,
	[semanticIdentifier]: {
		...addCitoidMetadata({
			abstractNote: "Recently, the recognition that medical care may contribute less to overall health than other aspects of people’s lives do has led policy makers, academics, and even some physicians to argue that clinicians should make screening and action on the social determinants of health their responsibility.",
			creators: [
				addCreator(["Leif I.", "Solberg"])
			],
			date: "2016-03-01",
			DOI: "10.1370/afm.1918",
			extra: "PMID: 26951583",
			ISSN: "1544-1709, 1544-1717",
			issue: "2",
			itemType: "journalArticle",
			pages: "102–103",
			publicationTitle: "The Annals of Family Medicine",
			shortTitle: "Theory vs Practice",
			tags: [
				{ "tag": "primary healthcare","type": 1 },
				{ "tag": "social determinants of health","type": 1 },
				{ "tag": "professional burnout","type": 1 },
				{ "tag": "healthcare delivery","type": 1 },
				{ "tag": "physician’s roles","type": 1 }
			],
			title: "Theory vs Practice: Should Primary Care Practice Take on Social Determinants of Health Now? No.",
			rights: "© 2016 Annals of Family Medicine, Inc.",
			url: "https://www.annfammed.org/content/14/2/102",
			volume: "14"
		})
	} as Mocks.Responses.CitoidSuccess[number],
	[semanticNotAddedIdentifier]: {
		...addCitoidMetadata({
			abstractNote: "<p>Health extension programs represent an opportunity for practice-based research networks (PBRNs) and primary care practices to develop collaborations reaching beyond the clinic walls to address the upstream social determinants of health and engage in community-based research. The Health Extension Regional Officers (HEROs) program at the University of New Mexico described in this issue of the <i>JABFM</i> is an innovative model with a bidirectional approach to linking academic health centers to community-based practices and organizations. Health extension programs are local, influenced by history, relationships, and support. Oregon9s health extension workforce represents a diverse group that includes practice facilitators, community health workers, and Cooperative Extension agents. PBRNs are measuring success in terms of collaboration across a spectrum of health activities. The Oregon Rural Practice-based Research Network uses a “Four Pillars” model of community engagement, practice transformation, research, and education to involve researchers, health policy experts, educators, and health extension workers to improve community health.</p>",
			creators: [
				addCreator(["Lyle J.", "Fagnan"])
			],
			date: "2017-01",
			DOI: "10.3122/jabfm.2017.01.160355",
			ISSN: "1557-2625, 1558-7118",
			issue: "1",
			itemType: "journalArticle",
			pages: "10-12",
			publicationTitle: "The Journal of the American Board of Family\n                Medicine",
			title: "Moving Upstream—Health Extension and Primary Care",
			url: "https://doi.org/10.3122/jabfm.2017.01.160355",
			volume: "30"
		})
	} as Mocks.Responses.CitoidSuccess[number]
};

export const handleCitoid = http.get<Mocks.RequestParams.Citoid, never, Mocks.Responses.Citoid>(
	"https://en.wikipedia.org/api/rest_v1/data/citation/zotero/:identifier",
	({ params }) => {
		const { identifier } = params;
		const output = data[decodeURIComponent(`${identifier}`)];
		return HttpResponse.json([output], { status: output.status || 200 });
	}
);

export {
	data as citoids
};