import { 
	formatItemReference,
	getLocalLink, 
	getPDFLink, 
	getWebLink, 
	makeDateFromAgo,
	makeDictionary, 
	makeDNP, 
	makeTimestamp, 
	parseDOI, 
	pluralize, 
	readDNP } from "../../src/utils";

const date = new Date([2022, 1, 1]);
const offset = date.getTimezoneOffset();

// Date & Time

test("Default DNP", () => {
	const numbers = [1, 2, 3, 4, 11, 12, 15, 26, 27, 28, 29];
	const ordinals = ["1st", "2nd", "3rd", "4th", "11th", "12th", "15th", "26th", "27th", "28th", "29th"];

	expect(numbers.map(nb => makeDNP(new Date([2022, 1, nb]))))
		.toEqual(ordinals.map(ord => `[[January ${ord}, 2022]]`));
});

test("DNP without brackets", () => {
	expect(makeDNP(date, { brackets: false })).toBe("January 1st, 2022");
});

test("DNP with timezone", () => {
	const datetz = new Date("2022-01-01T12:00:00Z");
    
	expect(makeDNP(offset < 0
		? new Date(datetz.setHours(24, offset))
		: offset > 0
			? new Date(datetz.setHours(0, -offset))
			: datetz))
		.toBe(offset < 0 
			? "[[January 2nd, 2022]]" 
			: offset > 0 
				? "[[December 31st, 2021]]" 
				: "[[January 1st, 2022]]");
});

test("Default DNP Date", () => {
	const dnp = "January 1st, 2022";
	expect(readDNP(dnp)).toEqual(new Date([2022, 1, 1]));
});

test("Default DNP Date as an array", () => {
	const dnp = "January 1st, 2022";
	expect(readDNP(dnp, { as_date: false })).toEqual([2022, 1, 1]);
});

test("Default timestamp", () => {
	const this_date = new Date([2022, 1, 1]);
	expect(makeTimestamp(new Date(this_date.setHours(12, 23)))).toBe("12:23");
});

test("Timestamp with single digits for minutes", () => {
	const this_date = new Date([2022, 1, 1]);
	expect(makeTimestamp(new Date(this_date.setHours(8, 9)))).toBe("8:09");
});

test("Date from ago", () => {
	const today = new Date();
	today.setHours(1, 9);
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	yesterday.setHours(3, 12);
	const this_year = new Date([today.getFullYear(),1,1]);
	const earlier = new Date([2021, 8, 3]);

	expect(makeDateFromAgo(today)).toBe("Today at 1:09");
	expect(makeDateFromAgo(yesterday)).toBe("Yesterday at 3:12");
	expect(makeDateFromAgo(this_year)).toBe("Jan 1st");
	expect(makeDateFromAgo(earlier)).toBe("Aug 3rd 2021");
});

// DOIs

test("Default DOI", () => {
	const doi = "10.1080/1756073X.2021.1957075";
	expect(parseDOI(doi)).toBe("10.1080/1756073x.2021.1957075");
});

test("DOI with full URL", () => {
	const doi = "https://doi.org/10.1080/1756073X.2021.1957075";
	expect(parseDOI(doi)).toBe("10.1080/1756073x.2021.1957075");
});

test("DOI with incorrect format", () => {
	const doi = "https://example.com/v10.alpha/release";
	expect(parseDOI(doi)).toBe(false);
});

test("DOI not defined", () => {
	const doi = "";
	expect(parseDOI(doi)).toBe(false);
});

// Zotero links

test("Default Zotero local link", () => {
	const item = {data: {key: "A12BCDEF"}, library: {type: "user", id: 12345}};
	expect(getLocalLink(item)).toBe("[Local library](zotero://select/library/items/A12BCDEF)");
});

test("Default Zotero web link", () => {
	const item = {data: {key: "A12BCDEF"}, library: {type: "user", id: 12345}};
	expect(getWebLink(item)).toBe("[Web library](https://www.zotero.org/users/12345/items/A12BCDEF)");
});

test("Zotero local link as target", () => {
	const item = {data: {key: "A12BCDEF"}, library: {type: "user", id: 12345}};
	expect(getLocalLink(item, {format: "target"})).toBe("zotero://select/library/items/A12BCDEF");
});

test("Zotero local link from group library", () => {
	const item = {data: {key: "A12BCDEF"}, library: {type: "group", id: 12345}};
	expect(getLocalLink(item, {format: "target"})).toBe("zotero://select/groups/12345/items/A12BCDEF");
});

test("Zotero web link as target", () => {
	const item = {data: {key: "A12BCDEF"}, library: {type: "user", id: 12345}};
	expect(getWebLink(item, {format: "target"})).toBe("https://www.zotero.org/users/12345/items/A12BCDEF");
});

test("Default PDF link", () => {
	const pdfItem = {
		data: {filename: "Scott et al (2003).pdf", key: "A12BCDEF", linkMode: "linked_file", title: "Organizational Culture"},
		library: {id: 12345, type: "user"}
	};
	expect(getPDFLink(pdfItem)).toBe("zotero://open-pdf/library/items/A12BCDEF");
});

test("PDF link as Markdown", () => {
	const pdfItem = {
		data: {filename: "Scott et al (2003).pdf", key: "A12BCDEF", linkMode: "linked_file", title: "Organizational Culture"},
		library: {id: 12345, type: "user"}
	};
	expect(getPDFLink(pdfItem, "markdown")).toBe("[Scott et al (2003).pdf](zotero://open-pdf/library/items/A12BCDEF)");
});

// Other

test("Formats Zotero item reference", () => {
	const item = {data:{title: "The Quantitative Measurement of Organizational Culture in Health Care: A Review of the Available Instruments"}, key: "scottOrganizationalCulture2003", meta: {creatorSummary: "Scott et al", parsedDate: "2003"}};
	
	expect(formatItemReference(item, "inline")).toBe("Scott et al (2003)");
	expect(formatItemReference(item, "citation")).toBe("[Scott et al (2003)]([[@scottOrganizationalCulture2003]])");
	expect(formatItemReference(item, "citekey")).toBe("@scottOrganizationalCulture2003");
	expect(formatItemReference(item, "pageref")).toBe("[[@scottOrganizationalCulture2003]]");
	expect(formatItemReference(item, "popover")).toBe("{{=: Scott et al (2003) | {{embed: [[@scottOrganizationalCulture2003]]}} }}");
	expect(formatItemReference(item, "tag")).toBe("#[[@scottOrganizationalCulture2003]]");
	expect(formatItemReference(item, "zettlr")).toBe("<span class=\"zr-accent-1\">Scott et al (2003)</span> The Quantitative Measurement of Organizational Culture in Health Care: A Review of the Available Instruments");
});

test("Pluralizes tokens", () => {
	expect(pluralize(1, "item", "")).toBe("1 item");
	expect(pluralize(3, "item", "")).toBe("3 items");
	expect(pluralize(1, "item", " added")).toBe("1 item added");
	expect(pluralize(3, "item", " added")).toBe("3 items added");
});

test("Creates dictionary from string Array", () => {
	const arr = ["amble", "bereft", "cedar", "Arbiter", "Beforehand", "Callously", "*Important*", "12th century"];
	expect(makeDictionary(arr)).toEqual({
		"*": ["*Important*"],
		"1": ["12th century"],
		"a": ["amble", "Arbiter"],
		"b": ["bereft", "Beforehand"],
		"c": ["cedar", "Callously"]
	});
});