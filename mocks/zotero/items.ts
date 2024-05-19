import { http, HttpResponse } from "msw";
import { makeItemMetadata, zotero } from "./common";
import { libraries } from "./libraries";
import { citoids, semanticIdentifier, Mocks } from "Mocks";
import { ObjValues } from "Types/helpers";


const { userLibrary, groupLibrary } = libraries;

const data: Mocks.ItemTop[] = [
	{
		...makeItemMetadata({
			citekey: "blochImplementingSocialInterventions2021",
			itemType: "journalArticle",
			key: "PPD648N6",
			library: userLibrary,
			title: "Implementing social interventions in primary care",
			data: {
				abstractNote: "KEY POINTS\n- Primary care–based social interventions offer an important means to mitigate threats to individual and community health posed by adverse social conditions.\n- Effective interventions include those that target individual-level determinants, connections with community resources, community-focused partnerships and structures within health teams that affect equity.\n- Accumulating evidence points to the positive impacts of social interventions on broad markers of health; however, most research in this area has focused on implementation and process measures, rather than outcomes.\n- Some interventions require large, interdisciplinary health care resources to implement, but many are accessible to small group practices or individual providers.",
				collections: ["ABCDEF"],
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
			}
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
			}
		}),
		meta: {
			creatorSummary: "Pinto et al.",
			numChildren: 1,
			parsedDate: "2021-12"
		}
	},
	{
		...makeItemMetadata({
			citekey: "solbergTheoryPracticePrimary2016",
			itemType: citoids[semanticIdentifier].itemType,
			key: "_SEMANTIC_ITEM_",
			library: userLibrary,
			title: citoids[semanticIdentifier].title,
			version: 333,
			data: {
				abstractNote: citoids[semanticIdentifier].abstractNote,
				creators: citoids[semanticIdentifier].creators,
				date: citoids[semanticIdentifier].date,
				DOI: citoids[semanticIdentifier].DOI,
				publicationTitle: citoids[semanticIdentifier].publicationTitle,
				relations: {
					"dc:relation": userLibrary.path + "/items/" + "PPD648N6"
				},
				tags: citoids[semanticIdentifier].tags,
				url: citoids[semanticIdentifier].url
			}
		}),
		meta: {
			creatorSummary: "Solberg",
			numChildren: 0,
			parsedDate: citoids[semanticIdentifier].date
		}
	}
];

const makeBibEntry = ({ citekey, biblatex }: { citekey: string, biblatex: string }): Mocks.Bib => {
	const item = data.find(it => it.key == citekey)!;
	const { data: { key }, library, links, meta, version } = item;
	return {
		biblatex,
		key,
		library,
		links,
		meta,
		version
	};
};

const bibEntries = {
	"blochImplementingSocialInterventions2021": makeBibEntry({
		citekey: "blochImplementingSocialInterventions2021",
		biblatex: "\n@article{blochImplementingSocialInterventions2021,\n\ttitle = {Implementing social interventions in primary care},\n\tvolume = {193},\n\trights = {© 2021 {CMA} Joule Inc. or its licensors. This is an Open Access article distributed in accordance with the terms of the Creative Commons Attribution ({CC} {BY}-{NC}-{ND} 4.0) licence, which permits use, distribution and reproduction in any medium, provided that the original publication is properly cited, the use is noncommercial (i.e., research or educational use), and no modifications or adaptations are made. See: https://creativecommons.org/licenses/by-nc-nd/4.0/},\n\tissn = {0820-3946, 1488-2329},\n\turl = {https://www.cmaj.ca/content/193/44/E1696},\n\tdoi = {10.1503/cmaj.210229},\n\tabstract = {{KEY} {POINTS}\n- Primary care–based social interventions offer an important means to mitigate threats to individual and community health posed by adverse social conditions.\n- Effective interventions include those that target individual-level determinants, connections with community resources, community-focused partnerships and structures within health teams that affect equity.\n- Accumulating evidence points to the positive impacts of social interventions on broad markers of health; however, most research in this area has focused on implementation and process measures, rather than outcomes.\n- Some interventions require large, interdisciplinary health care resources to implement, but many are accessible to small group practices or individual providers.},\n\tpages = {E1696--E1701},\n\tnumber = {44},\n\tjournaltitle = {{CMAJ}},\n\tauthor = {Bloch, Gary and Rozmovits, Linda},\n\turldate = {2021-11-12},\n\tdate = {2021-11-08},\n\tlangid = {english},\n\tpmid = {34750179},\n\tkeywords = {primary care, social prescribing},\n}"
	}),
	"pintoExploringDifferentMethods2021": makeBibEntry({
		citekey: "pintoExploringDifferentMethods2021",
		biblatex: "\n@article{pintoExploringDifferentMethods2021,\n\ttitle = {Exploring different methods to evaluate the impact of basic income interventions: a systematic review},\n\tvolume = {20},\n\tissn = {1475-9276},\n\turl = {https://equityhealthj.biomedcentral.com/articles/10.1186/s12939-021-01479-2},\n\tdoi = {10.1186/s12939-021-01479-2},\n\tshorttitle = {Exploring different methods to evaluate the impact of basic income interventions},\n\tabstract = {Abstract \n             \n              Background \n              Persistent income inequality, the increase in precarious employment, the inadequacy of many welfare systems, and economic impact of the {COVID}-19 pandemic have increased interest in Basic Income ({BI}) interventions. Ensuring that social interventions, such as {BI}, are evaluated appropriately is key to ensuring their overall effectiveness. This systematic review therefore aims to report on available methods and domains of assessment, which have been used to evaluate {BI} interventions. These findings will assist in informing future program and research development and implementation. \n             \n             \n              Methods \n              Studies were identified through systematic searches of the indexed and grey literature (Databases included: Scopus, Embase, Medline, {CINAHL}, Web of Science, {ProQuest} databases, {EBSCOhost} Research Databases, and {PsycINFO}), hand-searching reference lists of included studies, and recommendations from experts. Citations were independently reviewed by two study team members. We included studies that reported on methods used to evaluate the impact of {BI}, incorporated primary data from an observational or experimental study, or were a protocol for a future {BI} study. We extracted information on the {BI} intervention, context and evaluation method. \n             \n             \n              Results \n              86 eligible articles reported on 10 distinct {BI} interventions from the last six decades. Workforce participation was the most common outcome of interest among {BI} evaluations in the 1960–1980 era. During the 2000s, studies of {BI} expanded to include outcomes related to health, educational attainment, housing and other key facets of life impacted by individuals’ income. Many {BI} interventions were tested in randomized controlled trials with data collected through surveys at multiple time points. \n             \n             \n              Conclusions \n              Over the last two decades, the assessment of the impact of {BI} interventions has evolved to include a wide array of outcomes. This shift in evaluation outcomes reflects the current hypothesis that investing in {BI} can result in lower spending on health and social care. Methods of evaluation ranged but emphasized the use of randomization, surveys, and existing data sources (i.e., administrative data). Our findings can inform future {BI} intervention studies and interventions by providing an overview of how previous {BI} interventions have been evaluated and commenting on the effectiveness of these methods. \n             \n             \n              Registration \n              This systematic review was registered with {PROSPERO} ({CRD} 42016051218).},\n\tpages = {142},\n\tnumber = {1},\n\tjournaltitle = {International Journal for Equity in Health},\n\tshortjournal = {Int J Equity Health},\n\tauthor = {Pinto, Andrew D. and Perri, Melissa and Pedersen, Cheryl L. and Aratangy, Tatiana and Hapsari, Ayu Pinky and Hwang, Stephen W.},\n\turldate = {2021-06-20},\n\tdate = {2021-12},\n\tlangid = {english},\n}"
	})
};

export const findBibEntry = ({ type, id, key }: Pick<Mocks.Library, "type" | "id"> & { key: string }) => {
	return Object.values<Mocks.Bib>(bibEntries).find(entry => entry.key == key && entry.library.type + "s" == type && entry.library.id == id);
};

export const findItems = ({ type, id, since }: Pick<Mocks.Library, "type" | "id"> & { since: number }) => {
	return data.filter(item => item.library.type + "s" == type && item.library.id == id && item.version > since);
};

export const handleItems = [
	http.get<Mocks.RequestParams.Items, never, Mocks.Responses.ItemsGet>(
		zotero(":libraryType/:libraryID/items"),
		({ request, params }) => {
			const { libraryType, libraryID } = params;
			const url = new URL(request.url);
			const since = url.searchParams.get("since");
			const include = url.searchParams.get("include") || "json";

			// Otherwise create success response
			const { type, id, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`)!;

			// Bibliography entries
			if (include == "biblatex") {
				const keyList = url.searchParams.get("itemKey")!.split(",");
				const bibs = keyList.map(key => findBibEntry({ type, id, key })!);
				return HttpResponse.json(bibs);
			}

			// Items JSON
			const items = findItems({ type, id, since: Number(since) });
			return HttpResponse.json(
				items,
				{
					headers: {
						"last-modified-version": `${version}`,
						// We're not mocking for additional requests
						"total-results": `${Math.min(items.length, 100)}`
					}
				}
			);
		}
	),
	http.post<Mocks.RequestParams.Items, Mocks.RequestBody.ItemsPost, Mocks.Responses.ItemsPost>(
		zotero(":libraryType/:libraryID/items"),
		async ({ request, params }) => {
			
			const { libraryType, libraryID } = params;
			const itemsData = await request.json();

			const library = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`)!;

			type TReduce = {
				[k in keyof Mocks.Responses.ItemsPost]: ObjValues<Mocks.Responses.ItemsPost[k]>[]
			};
			const output = itemsData.reduce<TReduce>((obj, item) => {
				const { key = "__NO_UNIQUE_KEY__", version = library.version, ...props } = item;
    
				if (!key) {
					// We're not actually adding the item to the data, so no need to ensure keys are unique
					obj.success.push("__NO_UNIQUE_KEY__");
					obj.successful.push({
						...makeItemMetadata({
							key,
							itemType: props.itemType,
							library,
							title: props.title,
							version: library.version,
							data: props
						}),
						meta: {
							creatorSummary: "",
							numChildren: 0,
							parsedDate: ""
						}
					});
				} else {
					const libraryCopy = data.find(it => it.library.type + "s" == library.type && it.library.id == library.id)!;
					if (version < libraryCopy.version) {
						obj.failed.push(libraryCopy.data.key);
						obj.unchanged.push(libraryCopy.data.key);
					} else {
						obj.success.push(libraryCopy.data.key);
						obj.successful.push({
							...libraryCopy,
							data: {
								...libraryCopy.data,
								key,
								version,
								...props
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

			const restructuredOutput: Mocks.Responses.ItemsPost = { failed: {}, success: {}, successful: {}, unchanged: {} };

			Object.keys(output).forEach(cat => {
				restructuredOutput[cat] = Object.fromEntries(output[cat].map((el, i) => [i, el]));
			});

			return HttpResponse.json(restructuredOutput);
		}
	)
];

export {
	bibEntries as entries,
	data as items
};