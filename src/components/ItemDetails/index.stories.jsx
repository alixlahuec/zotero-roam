import { userEvent, waitFor, within } from "@storybook/testing-library";
import { expect, jest } from "@storybook/jest";
import React from "react";
import ItemDetails from ".";

import zrToaster from "../ExtensionToaster";
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

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const showToasterFn = jest.spyOn(zrToaster, "show");
	const copyMenu = canvas.getByText("Copy reference");

	await userEvent.hover(copyMenu);

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