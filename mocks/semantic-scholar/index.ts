import { rest } from "msw";
import { SemanticScholarItem } from "Types/externals/semantic";


const data: Record<string, SemanticScholarItem> = {
	"10.1503/cmaj.210229": {
		abstract: "CMAJ | November 8, 2021 | Volume 193 | Issue 44 © 2021 CMA Joule Inc. or its licensors M ost family physicians now report that they engage in some degree of social intervention in the management of patients.1 However, outside of community health centres, social interventions are still not a routine part of primary care practice and are not yet considered “standard of care.” Traditional primary care seldom included interventions such as social prescribing and health–legal partnerships until the early 1990s,2 and some practitioners still question whether social intervention is part of the primary care provider’s role.3 A small cadre of practition ers in high-income countries, including Canada, Australia, the United Kingdom and the United States, has been at the forefront of developing and evaluating interventions into social risks to health, which has led to a few social interventions being widely adopted, with positive impacts on broad markers of health. Producing high-quality, clinically actionable research on social interventions in primary care is challenging. The effects of living with social pressures such as poverty, racism or trauma are difficult to evaluate over the duration of a typical study using trad itional markers of change in physical or mental health. For this reason, the literature on social interventions in primary care often focuses on process rather than outcome measures, and on self-reported indicators of health and well-being.31 Despite these limitations, the literature points to a positive general impact on health of social interventions. We discuss accumulated evidence (Box 1) on social interventions and provide an overview of common primary care–based interventions (Table 1), highlighting their strengths, limitations and feasibility of implementation in different practice settings. We discuss levels of practice resources that would facilitate their implementation, and also suggest those interventions that could be led by an external community partner, which may provide an alternate avenue for less well-resourced practices. Although the incorporation of new interventions may seem daunting, especially to community-based health care providers without an interdisciplinary team, we have been involved in change processes with practices of all sizes to incorporate social interventions.",
		arxivId: null,
		authors: [
			{
				authorId: "4534327",
				name: "Gary Bloch",
				url: "https://www.semanticscholar.org/author/4534327"
			},
			{
				authorId: "144502037",
				name: "L. Rozmovits",
				url: "https://www.semanticscholar.org/author/144502037"
			}
		],
		citationVelocity: 0,
		citations: [
			{
				arxivId: null,
				authors: [
					{
						authorId: "40589003", 
						name: "Margae Knox"
					}, 
					{
						authorId: "2168469519", 
						name: "Emily E Esteban"
					},
					{
						authorId: "2064818309", 
						name: "Elizabeth A Hernandez"
					},
					{
						authorId: "2058909364", 
						name: "M. Fleming"
					},
					{
						authorId: "2168458761", 
						name: "Nadia Safaeinilli"
					},
					{
						authorId: "3034212", 
						name: "Amanda L. Brewster"
					}
				],
				doi: "10.1136/bmjoq-2021-001807",
				intent: [],
				isInfluential: false,
				paperId: "c3a1a1c6875a03b4d32fd0a36f54840aa6ba4fb7",
				title: "Defining case management success: a qualitative study of case manager perspectives from a large-scale health and social needs support program",
				url: "https://www.semanticscholar.org/paper/c3a1a1c6875a03b4d32fd0a36f54840aa6ba4fb7",
				venue: "BMJ open quality",
				year: 2022
			}
		],
		corpusId: 243834202,
		doi: "10.1503/cmaj.210229",
		fieldsOfStudy: ["Medicine"],
		influentialCitationCount: 0,
		isOpenAccess: false,
		isPublisherLicensed: true,
		is_open_access: false,
		is_publisher_licensed: true,
		numCitedBy: 1,
		numCiting: 76,
		paperId: "de2f7fccff399072a81f18407547e0163bc95448",
		references: [
			{
				arxivId: null,
				authors: [
					{
						authorId: "3805349", 
						name: "L. Solberg"
					}
				],
				doi: "10.1370/afm.1918",
				intent: [],
				isInfluential: false,
				paperId: "447a7aa39d71dda859564dc12326a43b66488c76",
				title: "Theory vs Practice: Should Primary Care Practice Take on Social Determinants of Health Now? No.",
				url: "https://www.semanticscholar.org/paper/447a7aa39d71dda859564dc12326a43b66488c76",
				venue: "The Annals of Family Medicine",
				year: 2016
			},
			{
				arxivId: null,
				authors: [
					{
						authorId: "5709429", 
						name: "L. Fagnan"
					}
				],
				doi: "10.3122/jabfm.2017.01.160355",
				intent: [],
				isInfluential: false,
				paperId: "da834ae1504204c6e14e4bcf8811c4ca250d4ada",
				title: "Moving Upstream—Health Extension and Primary Care",
				url: "https://www.semanticscholar.org/paper/da834ae1504204c6e14e4bcf8811c4ca250d4ada",
				venue: "The Journal of the American Board of Family Medicine",
				year: 2017
			},
			{
				arxivId: null,
				authors: [
					{
						authorId: "4730239", 
						name: "A. Andermann"
					}
				],
				doi: "10.1186/s40985-018-0094-7",
				intent: [],
				isInfluential: false,
				paperId: "f090bb04877612278bd614b951a8d753eb6b8b5b",
				title: "Screening for social determinants of health in clinical care: moving from the margins to the mainstream",
				url: "https://www.semanticscholar.org/paper/f090bb04877612278bd614b951a8d753eb6b8b5b",
				venue: "Public Health Reviews",
				year: 2018
			},
			{
				arxivId: "arXiv:1501.00001",
				authors: [
					{
						authorId: "123456",
						name: "Jane Doe"
					}
				],
				doi: false,
				intent: ["background"],
				isInfluential: true,
				paperId: "__some_paper_id__",
				title: "DOI-less paper: an influential work",
				url: "",
				venue: "Nature",
				year: 2013
			}
		],
		s2FieldsOfStudy: [
			{ category: "Medicine", source: "external" },
			{ category: "Medicine", source: "s2-fos-model" },
			{ category: "Political Science", source: "s2-fos-model" }
		],
		title: "Implementing social interventions in primary care",
		topics: [],
		url: "https://www.semanticscholar.org/paper/de2f7fccff399072a81f18407547e0163bc95448",
		venue: "Canadian Medical Association Journal",
		year: 2021
	}
};

export const handleSemantic = rest.get(
	"https://api.semanticscholar.org/v1/paper/:pub/:index",
	(req, res, ctx) => {
		const { pub, index } = req.params;
		const doi = [pub, index].join("/");
		return res(
			ctx.json(data[doi])
		);
	}
);

export {
	data as semantics
};