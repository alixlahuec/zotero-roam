import { zotero, makeItemMetadata } from "./common";
import { rest } from "msw";
import { libraries } from "./libraries";

const { userLibrary, groupLibrary } = libraries;

const data = [
	{
		...makeItemMetadata({
			citekey: "blochImplementingSocialInterventions2021",
			itemType: "journalArticle",
			key: "PPD648N6",
			library: userLibrary,
			title: "Implementing social interventions in primary care",
			data: {
				abstractNote: "KEY POINTS\n- Primary care–based social interventions offer an important means to mitigate threats to individual and community health posed by adverse social conditions.\n- Effective interventions include those that target individual-level determinants, connections with community resources, community-focused partnerships and structures within health teams that affect equity.\n- Accumulating evidence points to the positive impacts of social interventions on broad markers of health; however, most research in this area has focused on implementation and process measures, rather than outcomes.\n- Some interventions require large, interdisciplinary health care resources to implement, but many are accessible to small group practices or individual providers.",
				collections: [],
				creators: [
					{
						creatorType: "author", 
						firstName: "Gary", 
						lastName: "Bloch"
					},
					{
						creatorType: "author", 
						firstName: "Linda", 
						lastName: "Rozmovits"
					}
				],
				date: "2021-11-08",
				dateAdded: "2021-11-12T22:58:47Z",
				dateModified: "2021-11-12T23:12:25Z",
				DOI: "10.1503/cmaj.210229",
				publicationTitle: "CMAJ",
				url: "https://www.cmaj.ca/content/193/44/E1696"
			},
		}),
		meta: {
			creatorSummary: "Bloch and Rozmovits",
			numChildren: 0,
			parsedDate: "2021-11-08"
		}
	},
	{
		...makeItemMetadata({
			citekey: "pintoExploringDifferentMethods2021",
			itemType: "journalArticle",
			key: "D53X926C",
			library: groupLibrary,
			title: "Exploring different methods to evaluate the impact of basic income interventions: a systematic review",
			version: 17,
			data: {
				abstractNote: "Abstract \n             \n              Background \n              Persistent income inequality, the increase in precarious employment, the inadequacy of many welfare systems, and economic impact of the COVID-19 pandemic have increased interest in Basic Income (BI) interventions. Ensuring that social interventions, such as BI, are evaluated appropriately is key to ensuring their overall effectiveness. This systematic review therefore aims to report on available methods and domains of assessment, which have been used to evaluate BI interventions. These findings will assist in informing future program and research development and implementation. \n             \n             \n              Methods \n              Studies were identified through systematic searches of the indexed and grey literature (Databases included: Scopus, Embase, Medline, CINAHL, Web of Science, ProQuest databases, EBSCOhost Research Databases, and PsycINFO), hand-searching reference lists of included studies, and recommendations from experts. Citations were independently reviewed by two study team members. We included studies that reported on methods used to evaluate the impact of BI, incorporated primary data from an observational or experimental study, or were a protocol for a future BI study. We extracted information on the BI intervention, context and evaluation method. \n             \n             \n              Results \n              86 eligible articles reported on 10 distinct BI interventions from the last six decades. Workforce participation was the most common outcome of interest among BI evaluations in the 1960–1980 era. During the 2000s, studies of BI expanded to include outcomes related to health, educational attainment, housing and other key facets of life impacted by individuals’ income. Many BI interventions were tested in randomized controlled trials with data collected through surveys at multiple time points. \n             \n             \n              Conclusions \n              Over the last two decades, the assessment of the impact of BI interventions has evolved to include a wide array of outcomes. This shift in evaluation outcomes reflects the current hypothesis that investing in BI can result in lower spending on health and social care. Methods of evaluation ranged but emphasized the use of randomization, surveys, and existing data sources (i.e., administrative data). Our findings can inform future BI intervention studies and interventions by providing an overview of how previous BI interventions have been evaluated and commenting on the effectiveness of these methods. \n             \n             \n              Registration \n              This systematic review was registered with PROSPERO (CRD 42016051218).",
				creators: [
					{
						creatorType: "author", 
						firstName: "Andrew D.", 
						lastName: "Pinto"
					},
					{
						creatorType: "author", 
						firstName: "Melissa", 
						lastName: "Perri"
					},
					{
						creatorType: "author", 
						firstName: "Cheryl L.", 
						lastName: "Pedersen"
					},
					{
						creatorType: "author", 
						firstName: "Tatiana", 
						lastName: "Aratangy"
					},
					{
						creatorType: "author", 
						firstName: "Ayu Pinky", 
						lastName: "Hapsari"
					},
					{
						creatorType: "author", 
						firstName: "Stephen W.", 
						lastName: "Hwang"
					}
				],
				DOI: "10.1186/s12939-021-01479-2",
				date: "2021-12",
				dateAdded: "2021-06-20T03:08:30Z",
				dateModified: "2021-06-20T03:08:36Z",
				publicationTitle: "International Journal for Equity in Health",
				tags: [
					{ tag: "housing" }
				],
				url: "https://equityhealthj.biomedcentral.com/articles/10.1186/s12939-021-01479-2"
			},
		}),
		meta: {
			creatorSummary: "Pinto et al.",
			numChildren: 1,
			parsedDate: "2021-12"
		}
	}
];

export const findItems = ({ type, id, since }) => {
	return data.filter(item => item.library.type == type && item.library.id == id && item.version > since);
};

export const handleItems = [
	rest.get(
		zotero(":libraryType/:libraryID/items"),
		(req, res, ctx) => {
			const { libraryType, libraryID } = req.params;
			const since = req.url.searchParams.get("since");

			// Conditional mock for error response
			const enforcedError = req.url.searchParams.get("enforced-error");
			if(enforcedError){
				return res(
					ctx.status(Number(enforcedError))
				);
			}

			const { type, id, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`);

			const items = findItems({ type, id, since });

			return res(
				ctx.set("last-modified-version", version),
				ctx.set("total-results", Math.min(items.length, 100)), // We're not mocking for additional requests
				ctx.json(items)
			);
		}
	),
	rest.post(
		zotero(":libraryType/:libraryID/items"),
		(req, res, ctx) => {
			
			const { libraryType, libraryID } = req.params;
			const itemsData = JSON.parse(req.body);
			const library = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`);

			const output = itemsData.reduce((obj, item) => {
				const { key, version, ...rest } = item;
    
				if(!key){
					// We're not actually adding the item to the data, so no need to ensure keys are unique
					obj.success.push("__NO_UNIQUE_KEY__");
					obj.successful.push({
						...makeItemMetadata({
							library,
							version: library.version,
							...rest
						})
					});
				} else {
					const libraryCopy = data.find(it => it.library.type == library.type && it.library.id == library.id);
					if(version < libraryCopy.version){
						obj.failed.push(libraryCopy.data.key);
						obj.unchanged.push(libraryCopy);
					} else {
						obj.success.push(libraryCopy.data.key);
						obj.successful.push({
							...libraryCopy,
							data: {
								...rest
							}
						});
					}
				}
    
				return obj;
    
			}, {
				failed: [],
				success: [],
				successful: [],
				unchanged: []
			});
    
			for(let cat in output){
				output[cat] = Object.fromEntries(output[cat].map((el, i) => [i, el]));
			}

			return res(
				ctx.json(output)
			);
		}
	)
];

export {
	data as items
};