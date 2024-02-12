import { ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import { Meta, StoryObj } from "@storybook/react";

import ItemDetails from ".";
import { cleanLibraryItem } from "../../utils";

import { items } from "Mocks";
import { SettingsShortcuts } from "Types/extension";


type Props = ComponentProps<typeof ItemDetails>;

const sampleShortcuts: SettingsShortcuts = {
	copyDefault: "alt+D",
	copyCitation: "alt+C+T",
	copyCitekey: "alt+C+K",
	copyPageRef: "alt+P",
	copyTag: "alt+T",
	goToItemPage: "alt+G",
	importMetadata: "alt+M",
	toggleNotes: "alt+N"
};

export default {
	component: ItemDetails,
	args: {
		onClose: () => {},
		item: cleanLibraryItem(items.find((it) => it.key == "pintoExploringDifferentMethods2021")!, [], [], new Map([]))
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
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const ShowCopyOptions: StoryObj<Props> = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const copyMenu = canvas.getByText("Copy reference");

		await userEvent.hover(copyMenu);

		await waitFor(() => expect(canvas.getByText(`#[[@${args.item.key}]]`)).toBeDefined());

		await userEvent.click(canvas.getByText(`#[[@${args.item.key}]]`));
	}
};

export const WithCopyHotkeys: StoryObj<Props> = {
	play: async () => {
		await userEvent.keyboard("{Alt>}D{/Alt}");

		await userEvent.keyboard("{Alt>}C>T/{/Alt}");

		await userEvent.keyboard("{Alt>}C>K{/Alt}");

		await userEvent.keyboard("{Alt>}P{/Alt}");

		await userEvent.keyboard("{Alt>}T{/Alt}");
	}
};

export const WithInvalidHotkey: StoryObj<Props> = {
	parameters: {
		userSettings: {
			annotations: {},
			copy: {},
			metadata: {},
			notes: {},
			shortcuts: {
				...sampleShortcuts,
				importMetadata: "alt+ +"
			},
			typemap: {}
		}
	}
};
