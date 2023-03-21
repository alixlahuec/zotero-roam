export interface ZLibraryMock {
	id: number,
	links: {
		alternate: { href: string, type: string }
	},
	name: string,
	path: string,
	type: "users" | "groups",
	username?: string,
	version: number
}