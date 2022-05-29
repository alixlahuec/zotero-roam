import { 
	categorizeLibraryItems, 
	cleanAuthorLastName,
	cleanAuthorsNames, 
	cleanLibrary, 
	cleanSemantic, 
	identifyChildren } from "../../src/utils";

test("Categorizes Zotero items", () => {
	const items = [
		{data: {itemType: "journalArticle"}},
		{data: {itemType: "podcast"}},
		{data: {itemType: "note"}},
		{data: {itemType: "annotation"}},
		{data: {itemType: "attachment", contentType: "application/pdf"}},
		{data: {itemType: "attachment", contentType: "text/html"}},
		{data: {itemType: "attachment", contentType: "video/mp4"}}
	];
	expect(categorizeLibraryItems(items))
		.toEqual({
			items: [
				{data: {itemType: "journalArticle"}},
				{data: {itemType: "podcast"}}
			],
			notes: [
				{data: {itemType: "note"}},
				{data: {itemType: "annotation"}}
			],
			pdfs: [
				{data: {itemType: "attachment", contentType: "application/pdf"}}
			]
		});
});

test("Extracts authors' last names", () => {
	expect(cleanAuthorLastName("Serena Chen")).toBe("Chen");
	expect(cleanAuthorLastName("Bo-yeong Kim")).toBe("Kim");
	expect(cleanAuthorLastName("Tomas de Koon")).toBe("de Koon");
	expect(cleanAuthorLastName("Kelsey S. Dickson")).toBe("Dickson");
});

test("Formats authors names", () => {
	expect(cleanAuthorsNames([])).toBe("");
	expect(cleanAuthorsNames(["Dickson"])).toBe("Dickson");
	expect(cleanAuthorsNames(["Dickson", "Sklar"])).toBe("Dickson & Sklar");
	expect(cleanAuthorsNames(["Dickson", "Sklar", "Chen"])).toBe("Dickson, Sklar & Chen");
});

test("Simplifies Zotero item metadata", () => {
	const item = {
		"key": "X42A7DEE",
		"version": 1,
		"library": {
			"type": "user",
			"id": 475425,
			"name": "Z public library",
			"links": {
				"alternate": {
					"href": "https://www.zotero.org/z_public_library",
					"type": "text/html"
				}
			}
		},
		"links": {
			"self": {
				"href": "https://api.zotero.org/users/475425/items/X42A7DEE",
				"type": "application/json"
			},
			"alternate": {
				"href": "https://www.zotero.org/z_public_library/items/X42A7DEE",
				"type": "text/html"
			}
		},
		"meta": {
			"creatorSummary": "Institute of Physics (Great Britain)",
			"parsedDate": "1993-00-00",
			"numChildren": 0
		},
		"data": {
			"key": "X42A7DEE",
			"version": 1,
			"itemType": "book",
			"title": "Electron Microscopy and Analysis 1993: Proceedings of the Institute of Physics Electron Microscopy and Analysis Group Conference, University of Liverpool, 14-17 September1993",
			"creators": [
				{
					"creatorType": "author",
					"name": "Institute of Physics (Great Britain)"
				},
				{
					"creatorType": "contributor",
					"firstName": "A. J",
					"lastName": "Craven"
				},
				{
					"creatorType": "contributor",
					"name": "Institute of Materials (Great Britain)"
				},
				{
					"creatorType": "contributor",
					"name": "Royal Microscopical Society (Great Britain)"
				},
				{
					"creatorType": "contributor",
					"name": "University of Liverpool"
				}
			],
			"abstractNote": "",
			"series": "Institute of Physics conference series",
			"seriesNumber": "no. 138",
			"volume": "",
			"numberOfVolumes": "",
			"edition": "",
			"place": "Bristol, UK",
			"publisher": "Institute of Physics Pub",
			"date": "1993",
			"numPages": "546",
			"language": "",
			"ISBN": "0750303212",
			"shortTitle": "Electron Microscopy and Analysis 1993",
			"url": "",
			"accessDate": "",
			"archive": "",
			"archiveLocation": "",
			"libraryCatalog": "cat.cisti-icist.nrc-cnrc.gc.ca Library Catalog",
			"callNumber": "QC1 I584 v. 138",
			"rights": "",
			"extra": "",
			"dateAdded": "2011-01-13T03:37:29Z",
			"dateModified": "2011-01-13T03:37:29Z",
			"tags": [
				{
					"tag": "Analysis",
					"type": 1
				},
				{
					"tag": "Congresses",
					"type": 1
				},
				{
					"tag": "Electron microscopy",
					"type": 1
				},
				{
					"tag": "Materials",
					"type": 1
				},
				{
					"tag": "Microscopy",
					"type": 1
				}
			],
			"collections": [
				"BX9965IJ",
				"9KH9TNSJ"
			],
			"relations": {
				"owl:sameAs": "http://zotero.org/groups/36222/items/E6IGUT5Z"
			}
		}
	};

	expect(cleanLibrary([item], new Map()))
		.toEqual([{
			abstract: "",
			authors: "Institute of Physics (Great Britain)",
			authorsFull: ["Institute of Physics (Great Britain)", "A. J Craven", "Institute of Materials (Great Britain)", "Royal Microscopical Society (Great Britain)", "University of Liverpool"],
			authorsLastNames: ["Institute of Physics (Great Britain)", "Craven", "Institute of Materials (Great Britain)", "Royal Microscopical Society (Great Britain)", "University of Liverpool"],
			authorsRoles: ["author", "contributor", "contributor", "contributor", "contributor"],
			children: {
				pdfs: [],
				notes: []
			},
			createdByUser: null,
			inGraph: false,
			itemKey: "X42A7DEE",
			itemType: "book",
			key: "X42A7DEE",
			location: "users/475425",
			meta: "Institute of Physics (Great Britain)",
			publication: "",
			tags: ["Analysis", "Congresses", "Electron microscopy", "Materials", "Microscopy"],
			title: "Electron Microscopy and Analysis 1993: Proceedings of the Institute of Physics Electron Microscopy and Analysis Group Conference, University of Liverpool, 14-17 September1993",
			weblink: false,
			year: "",
			zotero: {
				local: "zotero://select/library/items/X42A7DEE",
				web: "https://www.zotero.org/users/475425/items/X42A7DEE"
			},
			raw: item,
			_multiField: "Institute of Physics (Great Britain) A. J Craven Institute of Materials (Great Britain) Royal Microscopical Society (Great Britain) University of Liverpool Electron Microscopy and Analysis 1993: Proceedings of the Institute of Physics Electron Microscopy and Analysis Group Conference, University of Liverpool, 14-17 September1993 #Analysis, #Congresses, #Electron microscopy, #Materials, #Microscopy X42A7DEE"
		}]);
});

test("Simplifies SemanticScholar item metadata", () => {
	const semantic = {
		citations: [
			{
				arxivId: null,
				authors: [
					{authorId: "1745379", name: "Kelsey S. Dickson"},
					{authorId: "8203031", name: "M. Sklar"},
					{authorId: "2136449585", name: "Serena Chen"},
					{authorId: "83992086", name: "Bo-yeong Kim"}
				],
				doi: "10.1186/s12913-022-07748-2",
				intent: [],
				isInfluential: false,
				paperId: "05f634ed8569c49f347870397a4791425c238267",
				title: "Characterization of multilevel influences of mental health care transitions: a comparative case study analysis",
				url: "https://www.semanticscholar.org/paper/05f634ed8569c49f347870397a4791425c238267",
				venue: "BMC Health Services Research",
				year: 2022
			}
		],
		references: [
			{
				arxivId: null,
				authors: [
					{authorId: "3029609", name: "J. Ormel"},
					{authorId: "2556648", name: "A. Oerlemans"},
					{authorId: "144166950", name: "D. Raven"},
					{authorId: "5394184", name: "O. Laceulle"},
					{authorId: "38686825", name: "C. Hartman"},
					{authorId: "2890242", name: "R. Veenstra"},
					{authorId: "3058144", name: "F. Verhulst"},
					{authorId: "4722145", name: "W. Vollebergh"},
					{authorId: "5645154", name: "J. Rosmalen"},
					{authorId: "3900129", name: "S. Reijneveld"},
					{authorId: "145408508", name: "A. Oldehinkel"}
				],
				doi: "10.1017/S0033291716003445",
				intent: [],
				isInfluential: false,
				paperId: "00723c630a38ef43228dd0eb9a8b357ee76445b6",
				title: "Functional outcomes of child and adolescent mental disorders. Current disorder most important but psychiatric history matters as well",
				url: "https://www.semanticscholar.org/paper/00723c630a38ef43228dd0eb9a8b357ee76445b6",
				venue: "Psychological Medicine",
				year: 2017
			}
		]
	};
	expect(cleanSemantic([], semantic, new Map()))
		.toEqual({
			citations: [
				{   
					authors: "Dickson et al.",
					authorsLastNames: ["Dickson", "Sklar", "Chen", "Kim"],
					authorsString: "Dickson Sklar Chen Kim",
					doi: "10.1186/s12913-022-07748-2",
					intent: [],
					isInfluential: false,
					inGraph: false, 
					inLibrary: false,
					links: {
						"semantic-scholar": "https://www.semanticscholar.org/paper/05f634ed8569c49f347870397a4791425c238267",
						"connected-papers": "https://www.connectedpapers.com/api/redirect/doi/10.1186/s12913-022-07748-2",
						"google-scholar": "https://scholar.google.com/scholar?q=10.1186/s12913-022-07748-2"
					},
					meta: "BMC Health Services Research",
					title: "Characterization of multilevel influences of mental health care transitions: a comparative case study analysis",
					url: "https://www.semanticscholar.org/paper/05f634ed8569c49f347870397a4791425c238267",
					year: "2022",
					_type: "citing",
					_multiField: "Dickson Sklar Chen Kim 2022 Characterization of multilevel influences of mental health care transitions: a comparative case study analysis"
				}
			],
			references: [
				{
					authors: "Ormel et al.",
					authorsLastNames: ["Ormel", "Oerlemans", "Raven", "Laceulle", "Hartman", "Veenstra", "Verhulst", "Vollebergh", "Rosmalen", "Reijneveld", "Oldehinkel"],
					authorsString: "Ormel Oerlemans Raven Laceulle Hartman Veenstra Verhulst Vollebergh Rosmalen Reijneveld Oldehinkel",
					doi: "10.1017/s0033291716003445",
					intent: [],
					isInfluential: false,
					inGraph: false,
					inLibrary: false,
					links: {
						"semantic-scholar": "https://www.semanticscholar.org/paper/00723c630a38ef43228dd0eb9a8b357ee76445b6",
						"connected-papers": "https://www.connectedpapers.com/api/redirect/doi/10.1017/S0033291716003445",
						"google-scholar": "https://scholar.google.com/scholar?q=10.1017/S0033291716003445"
					},
					meta: "Psychological Medicine",
					title: "Functional outcomes of child and adolescent mental disorders. Current disorder most important but psychiatric history matters as well",
					url: "https://www.semanticscholar.org/paper/00723c630a38ef43228dd0eb9a8b357ee76445b6",
					year: "2017",
					_type: "cited",
					_multiField: "Ormel Oerlemans Raven Laceulle Hartman Veenstra Verhulst Vollebergh Rosmalen Reijneveld Oldehinkel 2017 Functional outcomes of child and adolescent mental disorders. Current disorder most important but psychiatric history matters as well"
				}
			],
			backlinks: []
		});
});

test("Identifies the children of a Zotero item", () => {
	const pdfs = [
		{data: {parentItem: "A12BCDEF"}, key: "P34QRSTU", library: {type: "user", id: 98765}},
		{data: {parentItem: "A12BCDEF"}, key: "XY456ABC", library: {type: "user", id: 98765}},
		{data: {parentItem: "E23AVTF"}, key: "PCL41TRX", library: {type: "user", id: 98765}}
	];
	const notes = [
		{data: {itemType: "note", parentItem: "A12BCDEF"}, key: "child_note", library: {type: "user", id: 98765}},
		{data: {itemType: "note", parentItem: "JLP19FRG"}, key: "other_note", library: {type: "user", id: 98765}},
		{data: {itemType: "annotation", parentItem: "P34QRSTU"}, key: "child_annotation", library: {type: "user", id: 98765}},
		{data: {itemType: "annotation", parentItem: "YTL3I9BN"}, key: "other_annotation", library: {type: "user", id: 98765}}
	];

	expect(identifyChildren("A12BCDEF", "users/98765", { pdfs, notes }))
		.toMatchObject({
			pdfs: [
				{key: "P34QRSTU"},
				{key: "XY456ABC"}
			],
			notes: [
				{key: "child_note"},
				{key: "child_annotation"}
			]
		});
});