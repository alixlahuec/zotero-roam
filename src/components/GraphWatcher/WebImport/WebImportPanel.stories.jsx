import React from "react";
import WebImportPanel from "./WebImportPanel";
import { badIdentifier, goodIdentifier } from "Mocks/citoid";

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
	urls: [goodIdentifier]
};

export const WithInvalidLink = Template.bind({});
WithInvalidLink.args = {
	urls: [badIdentifier]
};

export const WithMixedLinks = Template.bind({});
WithMixedLinks.args = {
	urls: [badIdentifier, goodIdentifier]
};