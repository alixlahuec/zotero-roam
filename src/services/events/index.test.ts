import { vi } from "vitest";
import { mock } from "vitest-mock-extended";
import zrToaster from "Components/ExtensionToaster";
import ZoteroRoam from "../../api";

import { metadataAdded, notesAdded, tagsDeleted, tagsModified, writeFinished } from ".";
import { Events } from "./types";

import { DEFAULT_TOAST_TIMEOUT } from "../../constants";
import { ZItemTop } from "Types/transforms";


const showToasterFn = vi.spyOn(zrToaster, "show");
beforeEach(() => {
	window.zoteroRoam = mock<ZoteroRoam>();
});

describe("metadataAdded", () => {
	const mockEvent = (eventDetails: Partial<Events.MetadataAdded> = {}) => mock<CustomEvent<Events.MetadataAdded>>({
		detail: {
			page: { title: "@someCitekey" },
			...eventDetails
		}
	});

	test("hook behavior on error", () => {
		metadataAdded(mockEvent({ error: new Error("Some error") }));

		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Metadata import failed for @someCitekey",
			context: expect.objectContaining({
				error: "Some error"
			}),
			showToaster: true
		});
	});

	test("hook behavior on success", () => {
		metadataAdded(mockEvent({ error: null, success: true }));

		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "Metadata added to @someCitekey",
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	});

	test("hook fallback", () => {
		const evt = mockEvent({ error: null, success: null });
		metadataAdded(evt);

		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "Metadata import had uncertain outcome",
			context: evt.detail
		});
	});
});

describe("notesAdded", () => {
	const mockEvent = (eventDetails: Partial<Events.NotesAdded> = {}) => mock<CustomEvent<Events.NotesAdded>>({
		detail: {
			page: { title: "@someCitekey" },
			...eventDetails
		}
	});

	test("hook behavior on error", () => {
		notesAdded(mockEvent({ error: new Error("Some error") }));

		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Notes import failed for @someCitekey",
			context: expect.objectContaining({
				error: "Some error"
			}),
			showToaster: true
		});
	});

	test("hook behavior on success", () => {
		notesAdded(mockEvent({ error: null, success: true, raw: { item: mock<ZItemTop>(), notes: [] } }));

		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "Notes added to @someCitekey (0)",
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	});

	test("hook fallback", () => {
		const evt = mockEvent({ error: null, success: null });
		notesAdded(evt);

		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "Notes import had uncertain outcome",
			context: evt.detail
		});
	});
});

describe("tagsDeleted", () => {
	const mockEvent = (eventDetails: Partial<Events.TagsDeleted> = {}) => mock<CustomEvent<Events.TagsDeleted>>({
		detail: {
			library: "users/123456",
			...eventDetails
		}
	});

	test("hook behavior on error", () => {
		tagsDeleted(mockEvent({ error: new Error("Some error") }));
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Tag deletion failed",
			context: expect.objectContaining({
				error: "Some error"
			}),
			showToaster: true
		});
	});

	test("hook behavior on success", () => {
		const evt = mockEvent({ args: { tags: ["some tag", "another tag"] }, error: null });
		tagsDeleted(evt);
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "2 tags deleted from users/123456",
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	});
});

describe("tagsModified", () => {
	const mockEvent = (eventDetails: Partial<Events.TagsModified> = {}) => mock<CustomEvent<Events.TagsModified>>({
		detail: {
			library: "users/123456",
			...eventDetails
		}
	});

	test("hook behavior on error", () => {
		tagsModified(mockEvent({ error: new Error("Some error") }));
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Tag modification failed",
			context: expect.objectContaining({
				error: "Some error"
			}),
			showToaster: true
		});
	});

	test("hook behavior on partial success", () => {
		const data = {
			failed: ["SOME_KEY"],
			successful: [{
				successful: { "ANOTHER_KEY": {} },
				failed: {},
				unchanged: {},
				success: {}
			}]
		};
		tagsModified(mockEvent({ data }));
		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "",
			detail: "1 item modified in users/123456, with some problems. \n Check the extension's logs for more details.",
			context: expect.objectContaining({
				data
			}),
			showToaster: true
		});
	});

	test("hook behavior on full success", () => {
		const data = {
			failed: [],
			successful: [{
				successful: { "ANOTHER_KEY": {} },
				failed: {},
				unchanged: {},
				success: {} }]
		};
		tagsModified(mockEvent({ data }));
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "1 item successfully modified in users/123456.",
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	});
});

describe("writeFinished", () => {
	const mockEvent = (eventDetails: Partial<Events.Write> = {}) => mock<CustomEvent<Events.Write>>({
		detail: {
			library: "users/123456",
			...eventDetails
		}
	});

	test("hook behavior on error", () => {
		writeFinished(mockEvent({ error: new Error("Some error") }));
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Error sending data to Zotero",
			context: expect.objectContaining({
				error: "Some error"
			}),
			showToaster: true
		});
	});

	test("hook behavior on partial success", () => {
		const data = {
			failed: ["SOME_KEY"],
			successful: [{
				successful: { "ANOTHER_KEY": {} },
				failed: {},
				unchanged: {},
				success: {}
			}]
		};
		writeFinished(mockEvent({ data }));
		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "Unsuccessful when sending data to Zotero",
			detail: "1 item added to users/123456, with some problems. \n Check the extension's logs for more details.",
			context: expect.objectContaining({
				data
			}),
			showToaster: true
		});
	});

	test("hook behavior on full success", () => {
		const data = {
			failed: [],
			successful: [{
				successful: { "SOME_KEY": {} },
				failed: {},
				unchanged: {},
				success: {}
			}]
		};
		writeFinished(mockEvent({ data }));
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "1 item added to users/123456.",
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	});
});