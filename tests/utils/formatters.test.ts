import { mock } from "vitest-mock-extended";
import { 
	formatItemReference,
	getLocalLink, 
	getPDFLink, 
	getWebLink,
	makeDateFromAgo, 
	makeDictionary, 
	makeTimestamp, 
	parseDOI, 
	pluralize, 
	transformDOIs
} from "../../src/utils";

import { CustomClasses } from "../../src/constants";
import { ZItemAttachment, ZItemTop } from "Types/transforms";


// Date & Time

describe("Creating timestamps", () => {
	it("formats with 24-hour clock", () => {
		const this_date = new Date(2022, 0, 1);
		expect(makeTimestamp(new Date(this_date.setHours(13, 23)))).toBe("13:23");
	});
	
	it("formats correctly with single digits for minutes", () => {
		const this_date = new Date(2022, 0, 1);
		expect(makeTimestamp(new Date(this_date.setHours(8, 9)))).toBe("8:09");
	});
});

describe("Creating from-ago dates", () => {
	it("identifies dates from today", () => {
		const today = new Date();
		today.setHours(1, 9);
		expect(makeDateFromAgo(today)).toBe("Today at 1:09");
	});

	it("identifies dates from yesterday", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(3, 12);
		expect(makeDateFromAgo(yesterday)).toBe("Yesterday at 3:12");
	});

	it("identifies dates from earlier in the year", () => {
		const today = new Date();
		const this_year = new Date(today.getFullYear(),0,1);
		expect(makeDateFromAgo(this_year)).toBe("Jan 1st");
	});

	it("identifies dates from previous years", () => {
		const earlier = new Date(2021, 7, 3);
		expect(makeDateFromAgo(earlier)).toBe("Aug 3rd 2021");
	});
});

// DOIs

describe("Parsing DOIs", () => {
	it("converts DOI to lowercase", () => {
		const doi = "10.1080/1756073X.2021.1957075";
		expect(parseDOI(doi)).toBe("10.1080/1756073x.2021.1957075");
	});
	
	it("parses DOI from full URL", () => {
		const doi = "https://doi.org/10.1080/1756073X.2021.1957075";
		expect(parseDOI(doi)).toBe("10.1080/1756073x.2021.1957075");
	});
	
	it("rejects DOI with incorrect format", () => {
		const doi = "https://example.com/v10.alpha/release";
		expect(parseDOI(doi)).toBe(false);
	});
	
	it("rejects empty string", () => {
		const doi = "";
		expect(parseDOI(doi)).toBe(false);
	});
});

test("Transforming DOIs", () => {
	const testItems = [
		{ doi: null },
		{ doi: "invalid.DOI" },
		{ doi: "10.1186/S40985-018-0094-7" },
		{ doi: "10.1370/afm.1918" }
	];

	expect(transformDOIs(testItems))
		.toEqual([
			{ doi: false },
			{ doi: false },
			{ doi: "10.1186/s40985-018-0094-7" },
			{ doi: "10.1370/afm.1918" }
		]);
});

// Zotero links

describe("Making Zotero local link", () => {
	it("creates Markdown link by default", () => {
		const item = mock<ZItemTop>({ data: { key: "A12BCDEF" }, library: { type: "user", id: 12345 } });
		expect(getLocalLink(item)).toBe("[Local library](zotero://select/library/items/A12BCDEF)");
	});

	it("correctly generates the target URL", () => {
		const item = mock<ZItemTop>({ data: { key: "A12BCDEF" }, library: { type: "user", id: 12345 } });
		expect(getLocalLink(item, { format: "target" })).toBe("zotero://select/library/items/A12BCDEF");
	});

	it("correctly generates the target URL for an item in a group library", () => {
		const item = mock<ZItemTop>({ data: { key: "A12BCDEF" }, library: { type: "group", id: 12345 } });
		expect(getLocalLink(item, { format: "target" })).toBe("zotero://select/groups/12345/items/A12BCDEF");
	});
	
});

describe("Making Zotero web link", () => {
	const userLibrary = mock<ZItemTop["library"]>({ type: "user", id: 12345, name: "myname" });
	const groupLibrary = mock<ZItemTop["library"]>({ type: "group", id: 56789, name: "mygroupname" });
	const itemKey = "A12BCDEF";

	const expectedUserUrl = "https://www.zotero.org/myname/items/A12BCDEF";
	const expectedGroupUrl = "https://www.zotero.org/groups/56789/mygroupname/items/A12BCDEF";

	it("creates Markdown link by default", () => {
		const item = mock<ZItemTop>({ data: { key: itemKey }, library: userLibrary });
		expect(getWebLink(item)).toBe(`[Web library](${expectedUserUrl})`);
	});

	it("correctly generates the target URL for user libraries", () => {
		const item = mock<ZItemTop>({ data: { key: itemKey }, library: userLibrary });
		expect(getWebLink(item, { format: "target" })).toBe(expectedUserUrl);
	});

	it("correctly generates the target URL for group libraries", () => {
		const item = mock<ZItemTop>({ data: { key: itemKey }, library: groupLibrary });
		expect(getWebLink(item, { format: "target" })).toBe(expectedGroupUrl);
	});
});

describe("Making PDF links", () => {
	it("creates target link by default", () => {
		const pdfItem = mock<ZItemAttachment>({
			data: { filename: "Scott et al (2003).pdf", key: "A12BCDEF", linkMode: "linked_file", title: "Organizational Culture" },
			library: { id: 12345, type: "user" }
		});
		expect(getPDFLink(pdfItem)).toBe("zotero://open-pdf/library/items/A12BCDEF");
	});
	
	it("correctly generates Markdown link", () => {
		const pdfItem = mock<ZItemAttachment>({
			data: { filename: "Scott et al (2003).pdf", key: "A12BCDEF", linkMode: "linked_file", title: "Organizational Culture" },
			library: { id: 12345, type: "user" }
		});
		expect(getPDFLink(pdfItem, "markdown")).toBe("[Scott et al (2003).pdf](zotero://open-pdf/library/items/A12BCDEF)");
	});
    
	it("has fallback defaults", () => {
		const unknownModeItem = mock<ZItemAttachment>({
			data: { filename: "Scott et al (2003).pdf", key: "A12BCDEF", linkMode: "unknown mode", title: "Organizational Culture", url: "https://example.com" },
			library: { id: 12345, type: "user" }
		});
		expect(getPDFLink(unknownModeItem, "markdown")).toBe("[Organizational Culture](https://example.com)");
	});
});

// Other

describe("Formatting Zotero item references", () => {
	const item = mock<ZItemTop>({ data: { title: "The Quantitative Measurement of Organizational Culture in Health Care: A Review of the Available Instruments" }, key: "scottOrganizationalCulture2003", meta: { creatorSummary: "Scott et al", parsedDate: "2003" } });

	it("formats as inline reference", () => {
		expect(formatItemReference(item, "inline")).toBe("Scott et al (2003)");
	});

	it("formats as citation", () => {
		expect(formatItemReference(item, "citation")).toBe("[Scott et al (2003)]([[@scottOrganizationalCulture2003]])");
	});

	it("formats as citekey", () => {
		expect(formatItemReference(item, "citekey")).toBe("@scottOrganizationalCulture2003");
	});

	it("formats as key", () => {
		expect(formatItemReference(item, "key")).toBe("scottOrganizationalCulture2003");
	});

	it("formats as page reference", () => {
		expect(formatItemReference(item, "pageref")).toBe("[[@scottOrganizationalCulture2003]]");
	});

	it("formats as popover", () => {
		expect(formatItemReference(item, "popover")).toBe("{{=: Scott et al (2003) | {{embed: [[@scottOrganizationalCulture2003]]}} }}");
	});

	it("formats as tag", () => {
		expect(formatItemReference(item, "tag")).toBe("#[[@scottOrganizationalCulture2003]]");
	});

	it("formats as Zettlr-like reference", () => {
		expect(formatItemReference(item, "zettlr")).toBe(`<span class="${CustomClasses.TEXT_ACCENT_1}">Scott et al (2003)</span> The Quantitative Measurement of Organizational Culture in Health Care: A Review of the Available Instruments`);
	});

	it("formats with a custom template", () => {
		expect(formatItemReference(item, "<b>{{citekey}}</b>")).toBe("<b>@scottOrganizationalCulture2003</b>");
	});

	it("uses the citekey format as fallback", () => {
		// @ts-expect-error "Test expects bad input"
		expect(formatItemReference(item, false)).toBe("@scottOrganizationalCulture2003");
	});
});

test("Pluralizes tokens", () => {
	expect(pluralize(1, "item", "")).toBe("1 item");
	expect(pluralize(3, "item", "")).toBe("3 items");
	expect(pluralize(1, "item", " added")).toBe("1 item added");
	expect(pluralize(3, "item", " added")).toBe("3 items added");
});

describe("Creating a dictionary", () => {
	test("Creates dictionary from string Array", () => {
		const arr = ["amble", "bereft", "cedar", "Arbiter", "Beforehand", "Callously", "*Important*", "12th century", "🔥"];
		expect(makeDictionary(arr)).toEqual({
			"*": ["*Important*"],
			"1": ["12th century"],
			"a": ["amble", "Arbiter"],
			"b": ["bereft", "Beforehand"],
			"c": ["cedar", "Callously"],
			"\uD83D": ["🔥"]
		});
	});

	test("Bad inputs are detected", () => {
		const arr = [{ some: "prop" }];
		// @ts-expect-error Test checks for bad input handling
		expect(() => makeDictionary(arr))
			.toThrow("Could not add {\"some\":\"prop\"} to dictionary");
	});
});
