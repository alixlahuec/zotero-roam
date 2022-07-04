import React from "react";
import ItemDetails from ".";

import { items } from "../../../mocks/zotero/items";
import { cleanLibraryItem } from "../../utils";

export default {
	component: ItemDetails,
	args: {
		onClose: () => {},
		item: cleanLibraryItem(
			items.find(it => it.key == "pintoExploringDifferentMethods2021"),
			[],
			[],
			new Map([])),
		userSettings: {
			annotations: {},
			copy: {},
			metadata: {},
			notes: {},
			shortcuts: {
				"copyDefault": false,
				"copyCitation": false,
				"copyCitekey": false,
				"copyPageRef": false,
				"copyTag": false,
				"goToItemPage": false,
				"importMetadata": false,
				"toggleNotes": "alt+N",
			},
			typemap: {}
		}
	}
};

const Template = (args) => <ItemDetails {...args} />;

export const Default = Template.bind({});