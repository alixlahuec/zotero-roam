import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import NotesImport from "Components/NotesImport";

import { importItemNotes } from "Mocks/roam";
import { sampleAnnotLaterPage, sampleAnnotPrevPage } from "Mocks/zotero/annotations";
import { items } from "Mocks/zotero/items";
import { sampleNote, sampleOlderNote } from "Mocks/zotero/notes";


export default {
	component: NotesImport,
	args: {
		closeDialog: jest.fn(),
		item: items[0],
		notes: [sampleOlderNote, sampleAnnotLaterPage, sampleNote, sampleAnnotPrevPage],
		pageUID: null
	},
	argTypes: {
		closeDialog: { action: true }
	},
	parameters: {
		userSettings: {
			annotations: {},
			notes: {}
		}
	}
};

const Template = (args) => {
	return <AuxiliaryDialog className="import-item-notes" isOpen={true} label="Import notes">
		<NotesImport {...args} />
	</AuxiliaryDialog>;
};

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.args = {
	notes: [sampleNote]
};
WithInteractions.play = async({ args, canvasElement, parameters }) => {
	const { userSettings } = parameters;
	const frame = within(canvasElement.parentElement);

	await userEvent.click(frame.getByRole("button", { name: "Import notes 1" }));

	await waitFor(() => expect(importItemNotes).toHaveBeenCalled(), { timeout: 1000 });

	await expect(importItemNotes).toHaveBeenCalledWith(
		{ item: items[0], notes: [sampleNote] },
		null,
		userSettings.notes,
		userSettings.annotations
	);

	await expect(args.closeDialog).toHaveBeenCalled();
};