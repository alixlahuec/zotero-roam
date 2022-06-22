import React from "react";
import SearchPanel from ".";
import { data as items } from "../../../mocks/zotero/items";

export default {
	component: SearchPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		status: "on",
		userSettings: {
			copy: {
				always: false,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false
			},
			shortcuts: {}
		}
	}
};

const Template = (args) => <SearchPanel {...args} />;

export const Default = Template.bind({});

export const WithRoamCitekey = Template.bind({});
WithRoamCitekey.args = {
	roamCitekeys: [
		["@" + items[0].key, "_some_uid_"]
	]
};