import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import ItemDetails from ".";

import { cleanLibraryItem } from "../../utils";
import { items } from "Mocks";


const sampleShortcuts = {
	"copyDefault": "alt+D",
	"copyCitation": "alt+C+T",
	"copyCitekey": "alt+C+K",
	"copyPageRef": "alt+P",
	"copyTag": "alt+T",
	"goToItemPage": "alt+G",
	"importMetadata": "alt+M",
	"toggleNotes": "alt+N",
};

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
			shortcuts: sampleShortcuts,
			typemap: {}
		}
	}
};

const Template = (args) => <ItemDetails {...args} />;

export const Default = Template.bind({});

export const ShowCopyOptions = Template.bind({});
ShowCopyOptions.play = async({ args, canvasElement }) => {
	const canvas = within(canvasElement);
	const copyMenu = canvas.getByText("Copy reference");

	await userEvent.hover(copyMenu);

	await waitFor(() => expect(canvas.getByText(`#[[@${args.item.key}]]`))
		.toBeDefined());
    
	await userEvent.click(canvas.getByText(`#[[@${args.item.key}]]`));

};

export const WithCopyHotkeys = Template.bind({});
WithCopyHotkeys.play = async() => {
	await userEvent.keyboard("{Alt>}D{/Alt}");
    
	await userEvent.keyboard("{Alt>}C>T/{/Alt}");
    
	await userEvent.keyboard("{Alt>}C>K{/Alt}");

	await userEvent.keyboard("{Alt>}P{/Alt}");

	await userEvent.keyboard("{Alt>}T{/Alt}");

};

export const WithInvalidHotkey = Template.bind({});
WithInvalidHotkey.parameters = {
	userSettings: {
		annotations: {},
		copy: {},
		metadata: {},
		notes: {},
		shortcuts: {
			...sampleShortcuts,
			"importMetadata": "alt+ +"
		},
		typemap: {}
	}
};
