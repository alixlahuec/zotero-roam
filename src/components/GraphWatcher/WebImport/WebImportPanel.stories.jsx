import React from "react";
import WebImportPanel from "./WebImportPanel";

import { badIdentifier, goodIdentifier, citoids } from "Mocks/citoid";
import { libraries } from "Mocks/zotero/libraries";

import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

const { userLibrary } = libraries;

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

export const WithInteractions = Template.bind({});
WithInteractions.args = {
	urls: [goodIdentifier]
};
WithInteractions.play = async({ args, canvasElement }) => {
	const items = args.urls.map(id => citoids[id]);

	document.dispatchEvent = jest.fn();
	const expectedEvent = new CustomEvent("zotero-roam:write", {
		bubbles: true,
		cancelable: true,
		detail: {
			collections: [],
			data: {
				successful: [],
				failed: []
			},
			error: null,
			items,
			library: userLibrary.path,
			tags: []
		}
	});

	const canvas = within(canvasElement);

	await waitFor(() => expect(
		canvas.getByRole("listitem", { name: args.urls[0] })
	).toBeInTheDocument(),
	{
		timeout: 3000
	});

	const firstCitoid = await canvas.findByRole("listitem", { name: args.urls[0], queryFallbacks: true });
	const citoidCheckbox = within(firstCitoid).getByRole("checkbox").nextSibling;

	await userEvent.click(citoidCheckbox);

	const importButton = canvas.getByRole("button", { name: "Send to Zotero" });

	await userEvent.click(importButton);

	await waitFor(() => expect(
		document.dispatchEvent
	).toHaveBeenCalled(), 
	{ 
		timeout: 3000 
	});

	await expect(document.dispatchEvent).toHaveBeenCalledWith(expectedEvent);
};