import SearchPanel from ".";

import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import zrToaster from "../ExtensionToaster";

import { items } from "Mocks/zotero/items";


export default {
	component: SearchPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		status: "on"
	},
	parameters: {
		userSettings: {
			copy: {
				always: true,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false
			},
			shortcuts: {
				copyDefault: "",
				importMetadata: ""
			}
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

export const WithLookup = Template.bind({});
WithLookup.play = async ({ canvasElement }) => {
	const canvas = within(canvasElement);
	const showToasterFn = jest.spyOn(zrToaster, "show");

	await userEvent.type(canvas.getByPlaceholderText("Search in abstract, title, authors (last names), year, tags, or citekey"), items[0].key);

	await waitFor(() => expect(
		canvas.getAllByRole(
			"menuitem"
		).length
	)
		.toBe(1));

	const resultItem = canvas.getByRole("menuitem");

	await userEvent.click(resultItem);

	await waitFor(() => expect(
		canvas.getByText(items[0].data.title)
	)
		.toBeInTheDocument());
    
	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());
};