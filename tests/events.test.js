import zrToaster from "Components/ExtensionToaster";
import { emitCustomEvent, metadataAdded, notesAdded, tagsDeleted, tagsModified, writeFinished } from "../src/events";


const showToasterFn = jest.spyOn(zrToaster, "show");
beforeEach(() => {
	window.zoteroRoam = {
		error: jest.fn(),
		info: jest.fn(),
		warn: jest.fn()
	};
});

describe("Event emitter warns about unrecognized event names", () => {
	beforeEach(() => {
		window.zoteroRoam = {
			warn: jest.fn()
		};
	});

	test("The warn method is called, if defined", () => {
		emitCustomEvent("unrecognized-event-name");
		expect(window.zoteroRoam.warn).toHaveBeenCalled();
	});
});

describe("metadataAdded", () => {
	const base = {
		args: {
			blocks: [],
			uid: "SOME_UID"
		},
		page: { new: true, title: "@someCitekey", uid: "SOME_UID" },
		raw: {
			item: {},
			notes: [],
			pdfs: []
		}
	};

	test("hook behavior on error", () => {
		const error = new Error("Some error");
		metadataAdded({ detail: { ...base, error } });
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Metadata import failed for @someCitekey",
			context: {
				...base,
				error: "Some error"
			},
			showToaster: true
		});
	});

	test("hook behavior on success", () => {
		const success = { data: [] };
		metadataAdded({ detail: { ...base, success } });
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "Metadata added to @someCitekey"
		});
	});

	test("hook fallback", () => {
		metadataAdded({ detail: base });
		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "Metadata import had uncertain outcome",
			context: base
		});
	});
});

describe("notesAdded", () => {
	const base = {
		args: {
			blocks: [],
			uid: "SOME_UID"
		},
		page: { new: true, title: "@someCitekey", uid: "SOME_UID" },
		raw: {
			item: {},
			notes: [{}]
		}
	};

	test("hook behavior on error", () => {
		const error = new Error("Some error");
		notesAdded({ detail: { ...base, error } });
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Notes import failed for @someCitekey",
			context: {
				...base,
				error: "Some error"
			},
			showToaster: true
		});
	});

	test("hook behavior on success", () => {
		const success = { data: [] };
		notesAdded({ detail: { ...base, success } });
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "Notes added to @someCitekey (1)"
		});
	});

	test("hook fallback", () => {
		notesAdded({ detail: base });
		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "Notes import had uncertain outcome",
			context: base
		});
	});
});

describe("tagsDeleted", () => {
	const base = {
		args: { tags: [{}, {}] },
		data: {},
		library: "users/123456"
	};

	test("hook behavior on error", () => {
		const error = new Error("Some error");
		tagsDeleted({ detail: { ...base, error } });
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Tag deletion failed",
			context: {
				...base,
				error: "Some error"
			},
			showToaster: true
		});
	});

	test("hook behavior on success", () => {
		tagsDeleted({ detail: base });
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "2 tags deleted from users/123456"
		});
	});
});

describe("tagsModified", () => {
	const base = {
		args: {
			into: "HOUSING",
			tags: ["housing", "Housing"]
		},
		data: {
			failed: [],
			successful: []
		},
		library: "users/123456"
	};

	test("hook behavior on error", () => {
		const error = new Error("Some error");
		tagsModified({ detail: { ...base, error } });
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Tag modification failed",
			context: {
				...base,
				error: "Some error"
			},
			showToaster: true
		});
	});

	test("hook behavior on partial success", () => {
		const data = {
			failed: ["SOME_KEY"],
			successful: [{ data: { successful: { "ANOTHER_KEY": {} }, failed: {} } }]
		};
		tagsModified({ detail: { ...base, data } });
		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "",
			detail: "1 item modified in users/123456, with some problems. \n Check the extension's logs for more details.",
			context: {
				...base,
				data,
				error: undefined
			},
			showToaster: true
		});
	});

	test("hook behavior on full success", () => {
		const data = {
			failed: [],
			successful: [{ data: { successful: { "ANOTHER_KEY": {} }, failed: {} } }]
		};
		tagsModified({ detail: { ...base, data } });
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "1 item successfully modified in users/123456."
		});
	});
});

describe("writeFinished", () => {
	const base = {
		args: {
			collections: [],
			items: [{}],
			tags: []
		},
		data: {
			successful: [],
			failed: []
		},
		library: "users/123456"
	};

	test("hook behavior on error", () => {
		const error = new Error("Some error");
		writeFinished({ detail: { ...base, error } });
		expect(window.zoteroRoam.error).toHaveBeenCalledWith({
			origin: "API",
			message: "Error sending data to Zotero",
			context: {
				...base,
				error: "Some error"
			},
			showToaster: true
		});
	});

	test("hook behavior on partial success", () => {
		const data = {
			failed: ["SOME_KEY"],
			successful: [{ data: { successful: { "ANOTHER_KEY": {} }, failed: {} } }]
		};
		writeFinished({ detail: { ...base, data } });
		expect(window.zoteroRoam.warn).toHaveBeenCalledWith({
			origin: "API",
			message: "Unsuccessful when sending data to Zotero",
			detail: "1 item added to users/123456, with some problems. \n Check the extension's logs for more details.",
			context: {
				...base,
				data,
				error: undefined
			},
			showToaster: true
		});
	});

	test("hook behavior on full success", () => {
		const data = {
			failed: [],
			successful: [{ data: { successful: { "SOME_KEY": {} }, failed: {} } }]
		};
		writeFinished({ detail: { ...base, data } });
		expect(showToasterFn).toHaveBeenCalledWith({
			intent: "success",
			message: "1 item added to users/123456."
		});
	});
});