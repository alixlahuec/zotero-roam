import React from "react";
import WebImportPanel from "./WebImportPanel";

window.roamAlphaAPI = {
	q: () => ([
		"history",
		"read",
		"TODO"
	])
};

export default {
	component: WebImportPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		userSettings: {
			typemap: {}
		}
	}
};

const Template = (args) => <WebImportPanel {...args} />;

export const WithValidLink = Template.bind({});
WithValidLink.args = {
	urls: ["https://www.jmir.org/2021/9/e27283"]
};