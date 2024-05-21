import { expect as sbExpect } from "@storybook/test";
import { Query } from "@tanstack/react-query";
import { PersistedClient } from "@tanstack/query-persist-client-core";
import { act, render } from "@testing-library/react";
import "fake-indexeddb/auto";
import { mock } from "vitest-mock-extended";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, TYPEMAP_DEFAULT } from "../../src/constants";
import ZoteroRoam from "../../src/api";
import IDBDatabaseService from "@services/idb";
import { Roam } from "@services/roam";
import { analyzeUserRequests, createPersisterWithIDB, initialize, setupDarkTheme, setupInitialSettings, setupPortals, shouldQueryBePersisted, unmountExtensionIfExists, validateShortcuts } from "../../src/setup";

import { apiKeys, libraries } from "Mocks";
import { UserDataRequest } from "Types/extension";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { id: userLibID, path: userPath }, groupLibrary: { id: groupLibID, path: groupPath } } = libraries;

beforeEach(() => {
	window.zoteroRoam = mock<ZoteroRoam>();
});

describe("Parsing user data requests", () => {
	it("passes if an empty array of requests is provided", () => {
		expect(analyzeUserRequests([]))
			.toEqual({
				apiKeys: [],
				dataRequests: [],
				libraries: []
			});
	});
	
	it("throws if none of the requests has an API key", () => {
		const reqs = [
			{ dataURI: "users/12345/items" },
			{ dataURI: "groups/98765/items/top" }
		];

		expect(() => analyzeUserRequests(reqs))
			.toThrow("At least one data request must be assigned an API key. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
	});
	
	it("throws if any of the requests is missing a data URI", () => {
		const reqs = [
			{ dataURI: "users/12345/items" },
			{ apikey: "XXXXXXXXXX" }
		];

		// @ts-expect-error "Test expects incomplete input"
		expect(() => analyzeUserRequests(reqs))
			.toThrow("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});
	
	it("throws if any of the requests has an incorrect data URI", () => {
		const reqs = [
			{ dataURI: "users/12345/items" },
			{ dataURI: "groups/some_group_name/items", apikey: "XXXXXXXXXX" }
		];

		expect(() => analyzeUserRequests(reqs))
			.toThrow("An incorrect data URI was provided for a request : groups/some_group_name/items. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials");
	});

	it("throws if any of the requests has an incorrect library ID", () => {
		const reqs = [
			{ library: { type: "users", id: "username" }, apikey: "XXXXXXXXXX" },
			{ library: { type: "groups", id: "123456" } }
		];

		expect(() => analyzeUserRequests(reqs as UserDataRequest[]))
			.toThrow("A library ID is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});

	it("throws if any of the requests has an incorrect library type", () => {
		const reqs = [
			{ library: { type: "libraryname", id: "12345" }, apikey: "XXXXXXXXXX" },
			{ library: { type: "groups", id: "98765" } }
		];

		// @ts-expect-error "Tests bad input"
		expect(() => analyzeUserRequests(reqs))
			.toThrow("A library type is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
	});

	it("throws if the same library is provided twice", () => {
		const reqs = [
			{ library: { type: "users", id: "123456" }, apikey: "XXXXXXXXXX" },
			{ library: { type: "users", id: "123456" }, apikey: "XXXXXXXXXX", name: "duplicate lib" }
		];

		expect(() => analyzeUserRequests(reqs as UserDataRequest[]))
			.toThrow("The same library was provided twice: users/123456.");
	});

	/* This is needed to support manual install via roam/js when the user has specified their dataRequests as an Object */
	it("accepts an Object as input", () => {
		const reqs = {
			apikey: "XXXXXXXXXX",
			dataURI: "users/12345/items"
		};

		const expected = {
			dataRequests: [
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } }
			],
			apiKeys: ["XXXXXXXXXX"],
			libraries: [
				{ path: "users/12345", apikey: "XXXXXXXXXX" }
			]
		};

		expect(analyzeUserRequests(reqs))
			.toEqual(expected);
	});
	
	it("returns proper configuration when given correct input", () => {
		const reqs = [
			{ dataURI: "users/12345/items", name: "My personal library" },
			{ dataURI: "groups/98765/items/top", apikey: "XXXXXXXXXX" }
		];

		const expected = {
			dataRequests: [
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "My personal library", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } },
				{ dataURI: "groups/98765/items/top", apikey: "XXXXXXXXXX", name: "", library: { id: "98765", path: "groups/98765", type: "groups", uri: "items/top" } }
			],
			apiKeys: ["XXXXXXXXXX"],
			libraries: [
				{ path: "users/12345", apikey: "XXXXXXXXXX" },
				{ path: "groups/98765", apikey: "XXXXXXXXXX" }
			]
		};

		expect(analyzeUserRequests(reqs))
			.toEqual(expected);

	});

	it("returns proper configuration when given correct input (from library)", () => {
		const reqs = [
			{ library: { type: "users", id: "12345" }, name: "My personal library" },
			{ library: { type: "groups", id: "98765" }, apikey: "XXXXXXXXXX" }
		];

		const expected = {
			dataRequests: [
				{ dataURI: "users/12345/items", apikey: "XXXXXXXXXX", name: "My personal library", library: { id: "12345", path: "users/12345", type: "users", uri: "items" } },
				{ dataURI: "groups/98765/items", apikey: "XXXXXXXXXX", name: "", library: { id: "98765", path: "groups/98765", type: "groups", uri: "items" } }
			],
			apiKeys: ["XXXXXXXXXX"],
			libraries: [
				{ path: "users/12345", apikey: "XXXXXXXXXX" },
				{ path: "groups/98765", apikey: "XXXXXXXXXX" }
			]
		};

		expect(analyzeUserRequests(reqs as UserDataRequest[]))
			.toEqual(expected);

	});
});

describe("Parsing mock data requests", () => {
	it("should be a valid configuration", () => {
		const reqs = [
			{ dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
			{ dataURI: groupPath + "/items", apikey: "", name: "My group library" }
		];
		expect(analyzeUserRequests(reqs))
			.toEqual({
				apiKeys: [masterKey],
				dataRequests: [
					{ 
						apikey: masterKey, 
						dataURI: userPath + "/items", 
						library: {
							id: String(userLibID),
							path: userPath,
							type: "users",
							uri: "items"
						}, 
						name: "My user library" },
					{ 
						apikey: masterKey, 
						dataURI: groupPath + "/items", 
						library: {
							id: String(groupLibID),
							path: groupPath,
							type: "groups",
							uri: "items"
						}, 
						name: "My group library" }
				],
				libraries: [
					{ apikey: masterKey, path: userPath },
					{ apikey: masterKey, path: groupPath }
				]
			});
	});
});

describe("Parsing initial user settings", () => {
	const defaults = {
		annotations: {
			func: "",
			group_by: false,
			template_comment: "{{comment}}",
			template_highlight: "[[>]] {{highlight}} ([p. {{page_label}}]({{link_page}})) {{tags_string}}",
			use: "default",
			__with: "formatted"
		},
		autocomplete: {
			display_char: "",
			display_use: "preset",
			display: "citekey",
			format_char: "",
			format_use: "preset",
			format: "citation",
			trigger: ""
		},
		copy: {
			always: false,
			overrideKey: "shiftKey",
			preset: "citekey",
			template: "@{{key}}",
			useAsDefault: "preset",
			useQuickCopy: false
		},
		metadata: {
			func: "",
			smartblock: {
				param: "srcUid",
				paramValue: ""
			},
			use: "default"
		},
		notes: {
			func: "",
			nest_char: "",
			nest_position: "top",
			nest_preset: "[[Notes]]",
			nest_use: "preset",
			split_char: "",
			split_preset: "\n",
			split_use: "preset",
			use: "default",
			__with: "text"
		},
		other: {
			autoload: false,
			cacheEnabled: false,
			darkTheme: false,
			render_inline: false
		},
		pageMenu: {
			defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
			trigger: "default"
		},
		sciteBadge: {
			layout: "horizontal",
			showLabels: false,
			showZero: true,
			small: false,
			tooltipPlacement: "auto",
			tooltipSlide: 0
		},
		shortcuts: {
			"copyDefault": "",
			"copyCitation": "",
			"copyCitekey": "",
			"copyPageRef": "",
			"copyTag": "",
			"focusSearchBar": "",
			"goToItemPage": "",
			"importMetadata": "",
			"toggleDashboard": "",
			"toggleNotes": "alt+N",
			"toggleSearchPanel": "alt+E",
			"toggleSettingsPanel": "",
			"toggleQuickCopy": ""
		},
		typemap: TYPEMAP_DEFAULT,
		webimport: {
			tags: []
		}
	};

	it("should return defaults if given no settings", () => {
		expect(JSON.stringify(setupInitialSettings({})))
			.toEqual(JSON.stringify(defaults));
	});
});

describe("Parsing user shortcuts", () => {
	const cases = [
		[{}, {}],
		[{ "copyDefault": "alt+E" }, { "copyDefault": "alt+E" }],
		[{ "toggleDashboard": "alt+ +" }, {}],
		[{ "goToItemPage": "" }, { "goToItemPage": "" }]
	] as const;
	test.each(cases)(
		"%# - %s",
		(input, expectation) => {
			expect(validateShortcuts(input))
				.toEqual(expectation);
		}
	);
});

describe("Creating IndexedDB persister", () => {

	const mockClient: PersistedClient = {
		timestamp: 0,
		buster: "",
		clientState: {
			mutations: [],
			queries: []
		}
	};

	test("persist, restore, delete client", async () => {
		const idbService = new IDBDatabaseService();
		const persister = createPersisterWithIDB(idbService);

		let cachedClient = await persister.restoreClient();
		expect(cachedClient).toBeUndefined();

		await persister.persistClient(mockClient);
		cachedClient = await persister.restoreClient();
		expect(cachedClient).toMatchObject<PersistedClient>(mockClient);

		await persister.removeClient();
		cachedClient = await persister.restoreClient();
		expect(cachedClient).toBeUndefined();
	});

	test("persist errors are raised", async () => {
		const idbService = new IDBDatabaseService();
		const persister = createPersisterWithIDB(idbService);

		await idbService.deleteSelf();

		await expect(() => persister.restoreClient())
			.rejects
			.toThrow();
		expect(window.zoteroRoam.error).toHaveBeenCalledTimes(1);

		await expect(() => persister.removeClient())
			.rejects
			.toThrow();
		expect(window.zoteroRoam.error).toHaveBeenCalledTimes(2);

		await expect(() => persister.persistClient(mockClient))
			.rejects
			.toThrow();
		expect(window.zoteroRoam.error).toHaveBeenCalledTimes(3);

		expect(window.zoteroRoam.error).toHaveBeenNthCalledWith(1, expect.objectContaining({ origin: "Database", message: "Failed to restore query client" }));
		expect(window.zoteroRoam.error).toHaveBeenNthCalledWith(2, expect.objectContaining({ origin: "Database", message: "Failed to remove query client" }));
		expect(window.zoteroRoam.error).toHaveBeenNthCalledWith(3, expect.objectContaining({ origin: "Database", message: "Failed to persist query client" }));

	});

});

describe("Filtering queries for persistence", () => {
	const cases = [
		[{ queryKey: "permissions/XXXXXX", state: { status: "success" } }, false],
		[{ queryKey: ["permissions", { apikey: "XXXXXX" }], state: { status: "success" } }, false],
		[{ queryKey: ["tags", { library: "users/123456" }], state: { status: "error" } }, false],
		[{ queryKey: ["collections", { library: "users/123456" }], state: { status: "success" } }, true],
		[{ queryKey: ["items", { library: "users/123456" }], state: { status: "success" } }, true],
		[{ queryKey: ["tags", { library: "users/123456" }], state: { status: "success" } }, true]
	] as const;

	test.each(cases)(
		"%#",
		(query, is_allowed) => {
			const mockQuery = mock<Query<any,any,any,any>>(query);
			expect(shouldQueryBePersisted(mockQuery)).toBe(is_allowed);
		}
	);
});

describe("Initial configuration", () => {

	test("Roam Depot - no requests set", () => {
		const mockExtensionAPI = mock<Roam.ExtensionAPI>({
			settings: {
				get: vi.fn((_key: string) => undefined),
				set: vi.fn((_key, _val) => { })
			}
		});

		expect(initialize({
			context: "roam/depot",
			extensionAPI: mockExtensionAPI
		})).toEqual({
			requests: {
				dataRequests: [],
				apiKeys: [],
				libraries: []
			},
			settings: setupInitialSettings({})
		});
	});

	test("Roam Depot - requests are provided", () => {
		const requests = {
			apiKeys: ["abc"],
			dataRequests: [],
			libraries: []
		};

		const mockExtensionAPI = mock<Roam.ExtensionAPI>({
			settings: {
				get: vi.fn((key: string) => {
					if (key == "requests") {
						return requests as any;
					} else {
						return undefined;
					}
				}),
				set: vi.fn((_key, _val) => { })
			}
		});

		expect(initialize({
			context: "roam/depot",
			extensionAPI: mockExtensionAPI
		})).toEqual({
			requests,
			settings: setupInitialSettings({})
		});
	});

	test("RoamJS", () => {
		expect(initialize({
			context: "roam/js",
			manualSettings: { dataRequests: [] }
		}))
			.toEqual({
				requests: analyzeUserRequests([]),
				settings: setupInitialSettings({})
			});
	});

});

describe("Theme setter", () => {
	const testWrapper = document.createElement("div");
	const cases = [true, false];

	// eslint-disable-next-line vitest/expect-expect
	test.each(cases)(
		"use_dark_theme = %s",
		(use_dark_theme) => {
			const { queryByTestId } = render(
				<div data-testid="theme-target"></div>,
				{ container: document.body.appendChild(testWrapper) }
			);

			act(() => setupDarkTheme(use_dark_theme));

			sbExpect(document.body)
				.toHaveAttribute("zr-dark-theme", `${use_dark_theme}`);
			sbExpect(queryByTestId("theme-target"))
				.not.toHaveAttribute("zr-dark-theme");
		}
	);
});

describe("Portals setup", () => {

	const testWrapper = document.createElement("div");

	describe("Extension slot", () => {
		const cases = [true, false];

		test.each(cases)(
			"Topbar exists: %s",
			(topbar_exists) => {
				const className = topbar_exists
					? ".rm-topbar .rm-find-or-create-wrapper"
					: "";
				const { container, queryByTestId } = render(
					<div className={className} data-testid="test-element"></div>,
					{ container: document.body.appendChild(testWrapper) }
				);

				act(() => setupPortals());

				expect(container.querySelector(`#${EXTENSION_SLOT_ID}`))
					.toBe(topbar_exists
						? queryByTestId("test-element")!.nextSibling
						: null);

			}
		);
	});

	describe("Portals container", () => {
		const cases = [true, false];

		test.each(cases)(
			"App exists: %s",
			(app_exists) => {
				const id = app_exists ? "app" : "some-id";
				const { container, queryByTestId } = render(
					<div id={id} data-testid={id}></div>,
					{ container: document.body.appendChild(testWrapper) }
				);

				act(() => setupPortals());

				expect(container.querySelector(`#${EXTENSION_PORTAL_ID}`))
					.toBe(app_exists
						? queryByTestId(id)?.firstChild
						: null);
			}
		);
	});
});

describe("Teardown", () => {

	// eslint-disable-next-line vitest/expect-expect
	test("Extension slot", () => {
		const extensionSlot = document.createElement("span");
		extensionSlot.id = EXTENSION_SLOT_ID;

		document.body.appendChild(extensionSlot);

		sbExpect(extensionSlot).toBeInTheDocument();

		unmountExtensionIfExists();

		sbExpect(extensionSlot).not.toBeInTheDocument();
	});

	// eslint-disable-next-line vitest/expect-expect
	test("Portals container", () => {
		const extensionPortal = document.createElement("div");
		extensionPortal.id = EXTENSION_PORTAL_ID;

		document.body.appendChild(extensionPortal);

		sbExpect(extensionPortal).toBeInTheDocument();

		unmountExtensionIfExists();

		sbExpect(extensionPortal).not.toBeInTheDocument();

	});

});