interface SemanticScholarBase {
	arxivId: string | null,
	authors: { authorId: string, name: string, url?: string }[],
	doi: string | false,
	paperId: string,
	title: string,
	url: string,
	venue: string,
	year: number
}

export interface SemanticScholarItem extends SemanticScholarBase {
	abstract: string,
	citationVelocity: number,
	citations: SemanticScholarRelatedEntry[],
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
	references: SemanticScholarRelatedEntry[],
	s2FieldsOfStudy: { category: string, source: string }[],
	topics: []
}

export interface SemanticScholarRelatedEntry extends SemanticScholarBase {
	intent: string[],
	isInfluential: boolean,
}