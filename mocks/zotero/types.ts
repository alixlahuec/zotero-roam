import { ZoteroAPI } from "../../src/types/externals";


export interface ZLibraryMock {
	id: number,
	links: {
		alternate: { href: string, type: string }
	},
	name: string,
	path: string,
	type: ZoteroAPI.LibraryTypeURI,
	username?: string,
	version: number
}