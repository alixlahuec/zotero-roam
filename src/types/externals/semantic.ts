export namespace SemanticScholarAPI {
	interface BasePaper {
		arxivId: string | null,
		authors: { authorId: string, name: string, url?: string }[],
		doi: string | false,
		paperId: string,
		title: string,
		url: string,
		venue: string,
		year: number
	}

	export interface Item extends BasePaper {
		abstract: string,
		citationVelocity: number,
		citations: RelatedPaper[],
		corpusId: number | null,
		/** @example ["Medicine"] */
		fieldsOfStudy: string[],
		influentialCitationCount: number,
		isOpenAccess: boolean,
		isPublisherLicensed: boolean,
		is_open_access: boolean,
		is_publisher_licensed: boolean,
		numCitedBy: number,
		numCiting: number,
		references: RelatedPaper[],
		s2FieldsOfStudy: { category: string, source: string }[],
		topics: []
	}

	export interface RelatedPaper extends BasePaper {
		intent: string[],
		isInfluential: boolean,
	}
}
