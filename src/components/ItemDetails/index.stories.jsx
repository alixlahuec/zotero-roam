import ItemDetails from ".";
import zrToaster from "../ExtensionToaster";

import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { cleanLibraryItem } from "../../utils";
import { items } from "Mocks/zotero/items";


export default {
	component: ItemDetails,
	args: {
		onClose: () => {},
		item: cleanLibraryItem(
			items.find(it => it.key == "pintoExploringDifferentMethods2021"),
			[],
			[],
			new Map([]))
	},
	parameters: {
		userSettings: {
			annotations: {},
			copy: {},
			metadata: {},
			notes: {},
			shortcuts: {
				"copyDefault": "alt+D",
				"copyCitation": "alt+C+T",
				"copyCitekey": "alt+C+K",
				"copyPageRef": "alt+P",
				"copyTag": "alt+T",
				"goToItemPage": "alt+G",
				"importMetadata": "alt+M",
				"toggleNotes": "alt+N",
			},
			typemap: {}
		}
	}
};

const Template = (args) => <ItemDetails {...args} />;

export const Default = Template.bind({});

export const ShowCopyOptions = Template.bind({});
ShowCopyOptions.play = async({ args, canvasElement }) => {
	const showToasterFn = jest.spyOn(zrToaster, "show");
	const canvas = within(canvasElement);
	const copyMenu = canvas.getByText("Copy reference");

	await userEvent.hover(copyMenu);

	await waitFor(() => expect(canvas.getByText(`#[[@${args.item.key}]]`))
		.toBeDefined());
    
	await userEvent.click(canvas.getByText(`#[[@${args.item.key}]]`));

	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());
};

export const WithCopyHotkeys = Template.bind({});
WithCopyHotkeys.play = async() => {
	const showToasterFn = jest.spyOn(zrToaster, "show");

	await userEvent.keyboard("{Alt>}D{/Alt}");

	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());
    
	await userEvent.keyboard("{Alt>}C>T/{/Alt}");

	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());
    
	await userEvent.keyboard("{Alt>}C>K{/Alt}");

	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());

	await userEvent.keyboard("{Alt>}P{/Alt}");

	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());

	await userEvent.keyboard("{Alt>}T{/Alt}");

	await waitFor(() => expect(showToasterFn)
		.toHaveBeenCalled());
};