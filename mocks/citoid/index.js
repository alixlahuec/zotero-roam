import { rest } from "msw";

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

export const data = {
	"https://www.jmir.org/2021/9/e27283": {
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
			url: "https://www.jmir.org/2021/9/e27283"
		})
	}
};

export const handleCitoid = rest.get(
	"https://en.wikipedia.org/api/rest_v1/data/citation/zotero/:identifier",
	(req, res, ctx) => {
		const { identifier } = req.params;
		return res(
			ctx.json([data[decodeURIComponent(identifier)]])
		);
	}
);