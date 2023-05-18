export enum ShowTypeRelated {
	ADDED_ON = "added_on",
	WITH_ABSTRACT = "with_abstract",
	WITH_TAG = "with_tag"
}

export enum ShowTypeSemantic {
	CITATIONS = "is_citation",
	REFERENCES = "is_reference"
}

export type ShowPropertiesBase = {
	title: string
}

export type ShowPropertiesRelated = ShowPropertiesBase & {
	type: ShowTypeRelated
}

export type ShowPropertiesSemantic = ShowPropertiesBase & {
	type: ShowTypeSemantic
}