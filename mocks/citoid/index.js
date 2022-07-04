import { rest } from "msw";

/* istanbul ignore next */
const addSampleMetadata = () => ({
	key: "XRT92",
	version: 0
});

const addCitoidMetadata = ({ creators, date, itemType, tags = [], title, url, ...rest }) => ({
	...addSampleMetadata,
	creators,
	date,
	itemType,
	tags,
	title,
	url,
	...rest
});

const addCreator = ([firstName, lastName, role = "author"]) => ({
	firstName,
	lastName,
	role
});

export const goodIdentifier = "https://www.jmir.org/2021/9/e27283";
export const badIdentifier = "https://projects.iq.harvard.edu/files/harvarduxgroup/files/ux-research-guide-sample-questions-for-user-interviews.pdf";
export const semanticIdentifier = "https://doi.org/10.1370/afm.1918";

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
	},
	[badIdentifier]: {
		status: 500,
		method: "get",
		type: "https://mediawiki.org/wiki/HyperSwitch/errors/unknown_error",
		uri: "/en.wikipedia.org/v1/data/citation/zotero/https%3A%2F%2Fprojects.iq.harvard.edu%2Ffiles%2Fharvarduxgroup%2Ffiles%2Fux-research-guide-sample-questions-for-user-interviews.pdf"
	},
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
				{"tag":"primary healthcare","type":1},
				{"tag":"social determinants of health","type":1},
				{"tag":"professional burnout","type":1},
				{"tag":"healthcare delivery","type":1},
				{"tag":"physician’s roles","type":1}
			],
			title: "Theory vs Practice: Should Primary Care Practice Take on Social Determinants of Health Now? No.",
			rights: "© 2016 Annals of Family Medicine, Inc.",
			url: "https://www.annfammed.org/content/14/2/102",
			volume: "14"
		})
	}
};

export const handleCitoid = rest.get(
	"https://en.wikipedia.org/api/rest_v1/data/citation/zotero/:identifier",
	(req, res, ctx) => {
		const { identifier } = req.params;
		const { status = 200, ...output } = data[decodeURIComponent(identifier)];
		return res(
			ctx.status(status),
			ctx.json([output])
		);
	}
);

export {
	data as citoids
};