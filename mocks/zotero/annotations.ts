import { makeEntityLinks, makeLibraryMetadata } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks";


const { userLibrary } = libraries;

type MakeAnnotArgs = {
	data: Partial<Mocks.Annotation["data"]>,
	key: string,
	library: Mocks.Library,
	parentItem: string,
	version: number
};
const makeAnnot = ({ key, library, parentItem, version, data }: MakeAnnotArgs): Mocks.Annotation => {
	return {
		data: {
			annotationColor: "#5fb236",
			annotationComment: "",
			annotationPageLabel: "25",
			annotationPosition: "{\"pageIndex\":24,\"rects\":[[203.6,431.053,546.865,441.6],[203.6,419.056,536.829,429.603],[203.6,407.059,566.448,417.606],[203.6,395.062,564.521,405.609],[203.6,383.065,265.699,393.612]]}",
			annotationSortIndex: "00024|001317|00350",
			annotationText: "",
			annotationType: "highlight",
			dateAdded: "2022-03-18T13:00:00Z",
			dateModified: "2022-04-02T02:00:00Z",
			itemType: "annotation",
			key,
			parentItem,
			relations: {},
			tags: [],
			version,
			...data
		},
		key,
		links: makeEntityLinks({ key, library, parentItem }),
		library: makeLibraryMetadata(library),
		meta: {},
		version,
		has_citekey: false
	};
};

export const sampleImageAnnot = makeAnnot({
	key: "X76XTRT",
	library: userLibrary,
	parentItem: "Z90BMEE",
	version: 1222,
	data: {
		annotationComment: "Good figure to dissect",
		annotationText: "",
		annotationType: "image",
		tags: [{ tag: "TODO" }]
	}
});

export const sampleAnnot = makeAnnot({
	key: "A12BCDEF",
	library: userLibrary,
	parentItem: "P34QRSTU",
	version: 1234,
	data: {
		annotationComment: "This is an interesting passage, let's look into it further later.",
		annotationText: "Digital health literacy may have an impact on the use of digital health services such as virtual visits.",
		annotationType: "highlight",
		tags: [{ tag: "Important" },{ tag: "TODO" }]
	}
});

export const sampleAnnotPrevPage = makeAnnot({
	key: "__PREV_PAGE_ANNOT__",
	library: userLibrary,
	parentItem: "__SOME_PARENT__",
	version: 1279,
	data: {
		annotationComment: "This is a comment from a previous page",
		annotationSortIndex: "00001|00002|00003",
		annotationText: "some previous page's text",
		annotationType: "highlight"
	}
});

export const sampleAnnotLaterPage = makeAnnot({
	key: "__LATER_PAGE_ANNOT__",
	library: userLibrary,
	parentItem: "__SOME_PARENT__",
	version: 1280,
	data: {
		annotationComment: "This is a comment from a later page",
		annotationSortIndex: "00004|00005|00006",
		annotationText: "some later page's text",
		annotationType: "highlight"
	}
});