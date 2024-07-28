import { ComponentProps } from "react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";

import { Meta, StoryObj } from "@storybook/react";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import NotesImport from "Components/NotesImport";

import { importItemNotes } from "Mocks/roam";
import {
	sampleAnnotLaterPage,
	sampleAnnotPrevPage,
	items,
	sampleNote,
	sampleOlderNote
} from "Mocks";


type Props = ComponentProps<typeof NotesImport>;

export default {
	component: NotesImport,
	args: {
		closeDialog: fn(),
		item: items[0],
		notes: [sampleOlderNote, sampleAnnotLaterPage, sampleNote, sampleAnnotPrevPage],
		pageUID: "some_uid"
	},
	argTypes: {
		closeDialog: { action: true }
	},
	decorators: [
		(Story, context) => (
			<AuxiliaryDialog className="import-item-notes" isOpen={true} label="Import notes">
				<Story {...context} />
			</AuxiliaryDialog>
		)
	],
	parameters: {
		userSettings: {
			annotations: {},
			notes: {}
		}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	args: {
		notes: [sampleNote]
	},

	play: async ({ args, canvasElement, parameters }) => {
		const { userSettings } = parameters;
		const frame = within(canvasElement.parentElement!);

		await userEvent.click(frame.getByRole("button", { name: "Import notes 1" }));

		await waitFor(() => expect(importItemNotes).toHaveBeenCalled(), { timeout: 1000 });

		await expect(importItemNotes).toHaveBeenCalledWith(
			{ item: items[0], notes: [sampleNote] },
			"some_uid",
			userSettings.notes,
			userSettings.annotations
		);

		await expect(args.closeDialog).toHaveBeenCalled();
	}
};
