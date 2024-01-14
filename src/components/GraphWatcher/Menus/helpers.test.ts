import { cleanSemantic, compareItemsByYear, getAuthorLastName, makeAuthorsSummary } from "./helpers";
import { semantics } from "Mocks";


describe("cleanSemantic", () => {
	it("simplifies SemanticScholar item metadata", () => {
		const { citations, references } = Object.values(semantics)[0];
		expect(cleanSemantic({ items: [], notes: [], pdfs: [] }, { citations, references }, new Map()))
			.toEqual({
				citations: [
					{
						authors: "Knox et al.",
						authorsLastNames: ["Knox", "Esteban", "Hernandez", "Fleming", "Safaeinilli", "Brewster"],
						authorsString: "Knox Esteban Hernandez Fleming Safaeinilli Brewster",
						doi: "10.1136/bmjoq-2021-001807",
						intent: [],
						isInfluential: false,
						inGraph: false,
						inLibrary: false,
						links: {
							"semantic-scholar": "https://www.semanticscholar.org/paper/c3a1a1c6875a03b4d32fd0a36f54840aa6ba4fb7",
							"connected-papers": "https://www.connectedpapers.com/api/redirect/doi/10.1136/bmjoq-2021-001807",
							"google-scholar": "https://scholar.google.com/scholar?q=10.1136/bmjoq-2021-001807"
						},
						meta: "BMJ open quality",
						title: "Defining case management success: a qualitative study of case manager perspectives from a large-scale health and social needs support program",
						url: "https://www.semanticscholar.org/paper/c3a1a1c6875a03b4d32fd0a36f54840aa6ba4fb7",
						year: "2022",
						_type: "citing",
						_multiField: "Knox Esteban Hernandez Fleming Safaeinilli Brewster 2022 Defining case management success: a qualitative study of case manager perspectives from a large-scale health and social needs support program"
					}
				],
				references: [
					{
						authors: "Solberg",
						authorsLastNames: ["Solberg"],
						authorsString: "Solberg",
						doi: "10.1370/afm.1918",
						intent: [],
						isInfluential: false,
						inGraph: false,
						inLibrary: false,
						links: {
							"semantic-scholar": "https://www.semanticscholar.org/paper/447a7aa39d71dda859564dc12326a43b66488c76",
							"connected-papers": "https://www.connectedpapers.com/api/redirect/doi/10.1370/afm.1918",
							"google-scholar": "https://scholar.google.com/scholar?q=10.1370/afm.1918"
						},
						meta: "The Annals of Family Medicine",
						title: "Theory vs Practice: Should Primary Care Practice Take on Social Determinants of Health Now? No.",
						url: "https://www.semanticscholar.org/paper/447a7aa39d71dda859564dc12326a43b66488c76",
						year: "2016",
						_type: "cited",
						_multiField: "Solberg 2016 Theory vs Practice: Should Primary Care Practice Take on Social Determinants of Health Now? No."
					},
					{
						authors: "Fagnan",
						authorsLastNames: ["Fagnan"],
						authorsString: "Fagnan",
						doi: "10.3122/jabfm.2017.01.160355",
						intent: [],
						isInfluential: false,
						inGraph: false,
						inLibrary: false,
						links: {
							"semantic-scholar": "https://www.semanticscholar.org/paper/da834ae1504204c6e14e4bcf8811c4ca250d4ada",
							"connected-papers": "https://www.connectedpapers.com/api/redirect/doi/10.3122/jabfm.2017.01.160355",
							"google-scholar": "https://scholar.google.com/scholar?q=10.3122/jabfm.2017.01.160355"
						},
						meta: "The Journal of the American Board of Family Medicine",
						title: "Moving Upstream—Health Extension and Primary Care",
						url: "https://www.semanticscholar.org/paper/da834ae1504204c6e14e4bcf8811c4ca250d4ada",
						year: "2017",
						_type: "cited",
						_multiField: "Fagnan 2017 Moving Upstream—Health Extension and Primary Care"
					},
					{
						authors: "Andermann",
						authorsLastNames: ["Andermann"],
						authorsString: "Andermann",
						doi: "10.1186/s40985-018-0094-7",
						intent: [],
						isInfluential: false,
						inGraph: false,
						inLibrary: false,
						links: {
							"semantic-scholar": "https://www.semanticscholar.org/paper/f090bb04877612278bd614b951a8d753eb6b8b5b",
							"connected-papers": "https://www.connectedpapers.com/api/redirect/doi/10.1186/s40985-018-0094-7",
							"google-scholar": "https://scholar.google.com/scholar?q=10.1186/s40985-018-0094-7"
						},
						meta: "Public Health Reviews",
						title: "Screening for social determinants of health in clinical care: moving from the margins to the mainstream",
						url: "https://www.semanticscholar.org/paper/f090bb04877612278bd614b951a8d753eb6b8b5b",
						year: "2018",
						_type: "cited",
						_multiField: "Andermann 2018 Screening for social determinants of health in clinical care: moving from the margins to the mainstream"
					},
					{
						authors: "Doe",
						authorsLastNames: ["Doe"],
						authorsString: "Doe",
						doi: false,
						intent: ["background"],
						isInfluential: true,
						inGraph: false,
						inLibrary: false,
						links: {
							"arxiv": "https://arxiv.org/abs/arXiv:1501.00001",
							"semantic-scholar": "https://www.semanticscholar.org/paper/__some_paper_id__",
							"connected-papers": "https://www.connectedpapers.com/search?q=" + encodeURIComponent("DOI-less paper: an influential work"),
							"google-scholar": "https://scholar.google.com/scholar?q=" + encodeURIComponent("DOI-less paper: an influential work")
						},
						meta: "Nature",
						title: "DOI-less paper: an influential work",
						url: "",
						year: "2013",
						_type: "cited",
						_multiField: "Doe 2013 DOI-less paper: an influential work"
					}
				],
				backlinks: []
			});
	});
});

describe("compareItemsByYear", () => {
	it("sorts Zotero items by publication year & creators", () => {
		const a = { meta: { creatorSummary: "Smith et al.", parsedDate: "" } };
		const b = { meta: { creatorSummary: "Scott et al.", parsedDate: "" } };
		const c = { meta: { creatorSummary: "Smith et al.", parsedDate: "2022-01-01" } };
		const d = { meta: { creatorSummary: "Tikki and Noald", parsedDate: "2021-01-01" } };
		const e = { meta: { creatorSummary: "Chen and Talmanes", parsedDate: "2021" } };

		expect([
			[a, b].sort(compareItemsByYear),
			[a, c].sort(compareItemsByYear),
			[c, a].sort(compareItemsByYear),
			[b, c].sort(compareItemsByYear),
			[c, d].sort(compareItemsByYear),
			[d, c].sort(compareItemsByYear),
			[d, e].sort(compareItemsByYear)
		])
			.toEqual([
				[b, a],
				[c, a],
				[c, a],
				[c, b],
				[d, c],
				[d, c],
				[e, d]
			]);
	});
});

describe("getAuthorLastName", () => {
	it("extracts from single names", () => {
		expect(getAuthorLastName("WHO")).toBe("WHO");
	});
	it("extracts from simple names", () => {
		expect(getAuthorLastName("Serena Chen")).toBe("Chen");
	});

	it("extracts from names with hyphen", () => {
		expect(getAuthorLastName("Bo-yeong Kim")).toBe("Kim");
	});

	it("extracts from names with particle", () => {
		expect(getAuthorLastName("Tomas de Koon")).toBe("de Koon");
	});

	it("extracts from names with middle name", () => {
		expect(getAuthorLastName("Kelsey S. Dickson")).toBe("Dickson");
	});
});

describe("makeAuthorsSummary", () => {
	it("returns an empty string when given an empty input", () => {
		expect(makeAuthorsSummary([])).toBe("");
	});

	it("formats correctly with 1 author", () => {
		expect(makeAuthorsSummary(["Dickson"])).toBe("Dickson");
	});

	it("formats correctly with 2 authors", () => {
		expect(makeAuthorsSummary(["Dickson", "Sklar"])).toBe("Dickson & Sklar");
	});

	it("formats correctly with 3 authors", () => {
		expect(makeAuthorsSummary(["Dickson", "Sklar", "Chen"])).toBe("Dickson, Sklar & Chen");
	});

	it("formats correctly with 4+ authors", () => {
		expect(makeAuthorsSummary(["Dickson", "Chen", "de Koon", "Sklar"])).toBe("Dickson et al.");
	});
});