import { formatItemAnnotations, simplifyZoteroAnnotations } from "../../src/utils";

const annot = {
	data: {
		annotationColor: "#5fb236",
		annotationComment: "This is an interesting passage, let's look into it further later.",
		annotationPageLabel: "25",
		annotationPosition: "{\"pageIndex\":24,\"rects\":[[203.6,431.053,546.865,441.6],[203.6,419.056,536.829,429.603],[203.6,407.059,566.448,417.606],[203.6,395.062,564.521,405.609],[203.6,383.065,265.699,393.612]]}",
		annotationSortIndex: "00024|001317|00350",
		annotationText: "Digital health literacy may have an impact on the use of digital health services such as virtual visits.",
		annotationType: "highlight",
		dateAdded: "2022-03-18T13:23:45Z",
		dateModified: "2022-04-02T02:00:35Z",
		itemType: "annotation",
		key: "A12BCDEF",
		parentItem: "P34QRSTU",
		relations: {},
		tags: [{tag: "Important"},{tag: "TODO"}],
		version: 1234
	},
	has_citekey: false,
	key: "A12BCDEF",
	library: {
		id: 98765,
		links: {alternate: {href: "https://www.zotero.org/some_user_name", type: "text/html"}},
		name: "some_user_name",
		type: "user"
	},
	links: {
		alternate: {href: "https://www.zotero.org/some_user_name/items/A12BCDEF", type: "text/html"},
		self: {href: "https://api.zotero.org/users/98765/items/A12BCDEF", type: "application/json"},
		up: {href: "https://api.zotero.org/users/98765/items/P34QRSTU", type: "application/json"}
	},
	meta: {},
	version: 1234
};
const simplifiedAnnot = simplifyZoteroAnnotations([annot])[0];

test("Simplifies annotations", () => {
	expect(simplifiedAnnot)
		.toEqual({
			color: annot.data.annotationColor,
			comment: annot.data.annotationComment,
			date_added: annot.data.dateAdded,
			date_modified: annot.data.dateModified,
			day_added: "March 18th, 2022",
			day_modified: "April 1st, 2022",
			key: annot.key,
			library: "users/98765",
			link_pdf: "zotero://open-pdf/library/items/P34QRSTU",
			link_page: "zotero://open-pdf/library/items/P34QRSTU?page=25",
			page_label: annot.data.annotationPageLabel,
			parent_item: annot.data.parentItem,
			position: {
				pageIndex: 24,
				rects: [
					[203.6,431.053,546.865,441.6],
					[203.6,419.056,536.829,429.603],
					[203.6,407.059,566.448,417.606],
					[203.6,395.062,564.521,405.609],
					[203.6,383.065,265.699,393.612]
				]
			},
			raw: annot,
			sortIndex: [24,1317,350],
			tags: ["Important", "TODO"],
			tags_string: "#[[Important]], #[[TODO]]",
			text: annot.data.annotationText,
			type: annot.data.annotationType
		});
});

test("Formats simplified annotations - default", () => {
	expect(formatItemAnnotations([annot]))
		.toEqual([
			{
				string: `[[>]] ${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
				children: [simplifiedAnnot.comment]
			}
		]);
});

test("Formats simplified annotations - group by day added", () => {
	expect(formatItemAnnotations([annot], { group_by: "day_added" }))
		.toEqual([
			{
				string: "[[March 18th, 2022]]",
				children: [
					{
						string: `[[>]] ${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
						children: [simplifiedAnnot.comment]
					}
				]
			}
		]);
});

test("Formats simplified annotations - no highlight prefix", () => {
	expect(formatItemAnnotations([annot], { highlight_prefix: "" }))
		.toEqual([
			{
				string: `${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
				children: [simplifiedAnnot.comment]
			}
		]);
});

test("Formats simplified annotations - no highlight suffix", () => {
	expect(formatItemAnnotations([annot], { highlight_suffix: "" }))
		.toEqual([
			{
				string: `[[>]] ${simplifiedAnnot.text}`,
				children: [simplifiedAnnot.comment]
			}
		]);
});