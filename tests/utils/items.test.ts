import { mock } from "jest-mock-extended";
import { 
	categorizeLibraryItems, 
	getAuthorLastName,
	makeAuthorsSummary, 
	cleanLibrary, 
	cleanSemantic, 
	identifyChildren } from "../../src/utils";

import { items, libraries, semantics } from "Mocks";
import { ZItem, ZItemAnnotation, ZItemAttachment, ZItemNote } from "Types/transforms";


const { userLibrary } = libraries;

test("Categorizes Zotero items", () => {
	const testItems = ([
		{ data: { itemType: "journalArticle" } },
		{ data: { itemType: "podcast" } },
		{ data: { itemType: "note" } },
		{ data: { itemType: "annotation" } },
		{ data: { itemType: "attachment", contentType: "application/pdf" } },
		{ data: { itemType: "attachment", contentType: "text/html" } },
		{ data: { itemType: "attachment", contentType: "video/mp4" } }
	] as const).map(it => mock<ZItem>(it));
	expect(categorizeLibraryItems(testItems))
		.toEqual({
			items: [
				{ data: { itemType: "journalArticle" } },
				{ data: { itemType: "podcast" } }
			],
			notes: [
				{ data: { itemType: "note" } },
				{ data: { itemType: "annotation" } }
			],
			pdfs: [
				{ data: { itemType: "attachment", contentType: "application/pdf" } }
			]
		});
});

describe("Extracting authors' last names", () => {
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

describe("Formatting authorship data", () => {
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

test("Simplifies Zotero item metadata", () => {
	expect(cleanLibrary([items[0]], new Map()))
		.toEqual([{
			abstract: items[0].data.abstractNote,
			authors: "Bloch and Rozmovits",
			authorsFull: ["Gary Bloch", "Linda Rozmovits"],
			authorsLastNames: ["Bloch", "Rozmovits"],
			authorsRoles: ["author", "author"],
			children: {
				pdfs: [],
				notes: []
			},
			createdByUser: null,
			inGraph: false,
			itemKey: items[0].data.key,
			itemType: items[0].data.itemType,
			key: "blochImplementingSocialInterventions2021",
			location: userLibrary.path,
			meta: "Bloch and Rozmovits (2021)",
			publication: "CMAJ",
			tags: [],
			title: "Implementing social interventions in primary care",
			weblink: {
				href: "https://www.cmaj.ca/content/193/44/E1696",
				title: "https://www.cmaj.ca/content/193/44/E1696"
			},
			year: "2021",
			zotero: {
				local: "zotero://select/library/items/" + items[0].data.key,
				web: "https://www.zotero.org/" + userLibrary.path + "/items/" + items[0].data.key
			},
			raw: items[0],
			_multiField: items[0].data.abstractNote + " Gary Bloch Linda Rozmovits 2021 Implementing social interventions in primary care blochImplementingSocialInterventions2021"
		}]);
});

test("Simplifies SemanticScholar item metadata", () => {
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

test("Identifies the children of a Zotero item", () => {
	const pdfs = ([
		{ data: { parentItem: "A12BCDEF" }, key: "P34QRSTU", library: { type: "user", id: 98765 } },
		{ data: { parentItem: "A12BCDEF" }, key: "XY456ABC", library: { type: "user", id: 98765 } },
		{ data: { parentItem: "E23AVTF" }, key: "PCL41TRX", library: { type: "user", id: 98765 } }
	] as const).map(it => mock<ZItemAttachment>(it));

	const notes = ([
		{ data: { itemType: "note", parentItem: "A12BCDEF" }, key: "child_note", library: { type: "user", id: 98765 } },
		{ data: { itemType: "note", parentItem: "JLP19FRG" }, key: "other_note", library: { type: "user", id: 98765 } },
		{ data: { itemType: "annotation", parentItem: "P34QRSTU" }, key: "child_annotation", library: { type: "user", id: 98765 } },
		{ data: { itemType: "annotation", parentItem: "YTL3I9BN" }, key: "other_annotation", library: { type: "user", id: 98765 } }
	] as const).map(it => mock<(ZItemNote | ZItemAnnotation)>(it));

	expect(identifyChildren("A12BCDEF", "users/98765", { pdfs, notes }))
		.toMatchObject({
			pdfs: [
				{ key: "P34QRSTU" },
				{ key: "XY456ABC" }
			],
			notes: [
				{ key: "child_note" },
				{ key: "child_annotation" }
			]
		});
});
