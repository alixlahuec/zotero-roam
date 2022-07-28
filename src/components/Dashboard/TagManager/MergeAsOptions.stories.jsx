import React from "react";
import { Menu } from "@blueprintjs/core";
import MergeAsOptions from "./MergeAsOptions";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

const { keyWithFullAccess: { key: masterKey }} = apiKeys;
const { userLibrary } = libraries;

export default {
	component: MergeAsOptions,
	args: {
		library: { apikey: masterKey, path: userLibrary.path }
	}
};

const Template = (args) => <Menu><MergeAsOptions {...args} /></Menu>;

export const Default = Template.bind({});
Default.args = {
	options: {
		roam: ["healthcare"],
		zotero: ["HEALTHCARE", "Healthcare", "health care"]
	}
};
Default.play = async({ args, canvasElement }) => {
	const into = "healthcare";

	document.dispatchEvent = jest.fn();
	const expectedEvent = new CustomEvent("zotero-roam:tags-modified", {
		bubbles: true,
		cancelable: true,
		detail: {
			data: {
				successful: [],
				failed: []
			},
			error: null,
			into,
			library: userLibrary.path,
			tags: [...args.options.roam, ...args.options.zotero]
		}
	});

	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement);

	await userEvent.click(canvas.getByRole("menuitem", { name: "Choose custom value..." }));

	const inputBar = frame.getByPlaceholderText("Enter a value");

	await expect(inputBar).toHaveFocus();

	await userEvent.type(inputBar, into);

	await userEvent.click(frame.getByRole("button", { name: "OK" }));

	await waitFor(() => expect(
		document.dispatchEvent
	).toHaveBeenCalled(), 
	{ 
		timeout: 3000 
	});

	await expect(document.dispatchEvent).toHaveBeenCalledWith(expectedEvent);
};