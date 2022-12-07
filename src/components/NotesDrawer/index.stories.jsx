import NotesDrawer from ".";


const note1 = {
	data: {
		dateAdded: "2022-01-01T12:00:00Z",
		dateModified: "2022-01-01T12:00:00Z",
		itemType: "note",
		parentItem: "ABCDEF",
		note: "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum quam odio, tempus at quam nec, porttitor lobortis purus. Nam non viverra sem. Cras consequat massa eu erat vestibulum rhoncus.</p>\n<ul><li>Some element</li>\n<li>Another element</li></ul>\n<p>Mauris consectetur purus ac venenatis elementum. Sed tortor ex, vehicula in lacinia in, eleifend vel tellus. Ut posuere est nec tortor aliquet placerat. Suspendisse nec condimentum dolor, vel ultrices purus. Nulla efficitur id sapien quis consectetur. Donec enim felis, tincidunt in dui vitae, consectetur pharetra arcu.</p>",
		tags: []
	},
	key: "JKLMN",
	library: {
		id: 12345,
		type: "user"
	}
};

const note2 = {
	data: {
		dateAdded: "2022-01-01T12:00:00Z",
		dateModified: "2022-01-01T12:00:00Z",
		itemType: "note",
		parentItem: "PQRST",
		note: "<blockquote>consectetur adipiscing elit</blockquote>",
		tags: [{ tag: "latin" }]
	},
	key: "STUVW",
	library: {
		id: 56789,
		type: "group"
	}
};

const annot1 = {
	"key": "JQ47EB9W",
	"library": {
		"type": "user",
		"id": 5959244
	},
	"data": {
		"key": "JQ47EB9W",
		"parentItem": "SZCPNNQI",
		"itemType": "annotation",
		"annotationType": "highlight",
		"annotationText": "A virtual visit is an electronic exchange whereby 1 or more health care providers delivers health care services to a patient in a second location using videoconferencing, secure messaging, or audio digital tools (e.g., telephone).",
		"annotationComment": "",
		"annotationColor": "#ffd400",
		"annotationPageLabel": "5",
		"annotationSortIndex": "00004|001103|00405",
		"annotationPosition": "{\"pageIndex\":4,\"rects\":[[203.6,375.813,547.447,386.36],[203.6,363.816,537.425,374.363],[203.6,351.819,397.456,362.366]]}",
		"tags": [],
		"dateAdded": "2022-03-18T13:12:23Z",
		"dateModified": "2022-03-18T13:12:23Z"
	}
};

const annot2 = {
	"key": "ETMYR9QI",
	"library": {
		"type": "user",
		"id": 5959244,
	},
	"data": {
		"key": "ETMYR9QI",
		"parentItem": "SZCPNNQI",
		"itemType": "annotation",
		"annotationType": "image",
		"annotationComment": "Check the data source for this figure",
		"annotationColor": "#ffd400",
		"annotationPageLabel": "6",
		"annotationSortIndex": "00005|001509|00420",
		"annotationPosition": "{\"pageIndex\":5,\"rects\":[[200.83299999999997,345.83333841959643,454.99999999999994,371.167]]}",
		"tags": [],
		"dateAdded": "2022-03-31T11:47:39Z",
		"dateModified": "2022-03-31T11:48:01Z"
	}
};

export default {
	component: NotesDrawer,
	args: {
		isOpen: true,
		onClose: () => {},
	},
	parameters: {
		userSettings: {
			notes: {
				nest_char: "",
				nest_position: "top",
				nest_preset: "[[Notes]]",
				nest_use: "preset",
				split_char: "",
				split_preset: "</p>",
				split_use: "preset",
				__with: "text"
			}
		}
	}
};

const Template = (args) => <NotesDrawer {...args} />;

export const NotesOnly = Template.bind({});
NotesOnly.args = {
	notes: [note1, note2]
};

export const AnnotsOnly = Template.bind({});
AnnotsOnly.args = {
	notes: [annot1, annot2]
};

export const NotesAndAnnots = Template.bind({});
NotesAndAnnots.args = {
	notes: [note1, note2, annot1, annot2]
};