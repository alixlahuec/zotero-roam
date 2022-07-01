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