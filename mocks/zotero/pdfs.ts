import { ZLibraryMock } from "Mocks/types";
import { ZoteroAPI } from "Types/externals";
import { makeEntityLinks, makeLibraryMetadata } from "./common";
import { libraries } from "./libraries";


const { userLibrary } = libraries;

/**
 * 
 * @param {{
 * key: string,
 * library: ZLibraryMock,
 * numChildren: number,
 * parentItem: string,
 * title: string,
 * version: number,
 * data: Partial<ZoteroAPI.ItemAttachment["data"]>
 * }} config 
 * @returns {ZoteroAPI.ItemAttachment}
 */
type MakePDFArgs = {
	key: string,
	library: ZLibraryMock,
	numChildren?: number,
	parentItem: string | false,
	title: string,
	version: number,
	data?: Partial<ZoteroAPI.ItemAttachment["data"]>
};
const makePDF = ({ key, library, numChildren = 0, parentItem, title, version, data = {} }: MakePDFArgs) => ({
	key,
	data: {
		accessDate: "",
		charset: "",
		contentType: "application/pdf",
		dateAdded: "2022-01-01T23:00:00Z",
		dateModified: "2022-03-04T11:00:00Z",
		itemType: "attachment",
		key,
		linkMode: "linked_file",
		note: "",
		parentItem,
		path: "attachments:" + title,
		relations: {},
		tags: [],
		title,
		url: "",
		version,
		...data
	},
	library: makeLibraryMetadata(library),
	links: makeEntityLinks({ key, library, parentItem }),
	meta: {
		numChildren
	},
	version
});

export const samplePDF = makePDF({
	key: "P34QRSTU",
	library: userLibrary,
	numChildren: 1,
	parentItem: "PPD648N6",
	title: "Bloch_Rozmovits_2021_Implementing social interventions in primary care.pdf",
	version: 18
});