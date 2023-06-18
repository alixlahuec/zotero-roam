import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import NotesDrawer from ".";
import { sampleAnnot, sampleAnnotLaterPage, sampleNote, sampleOlderNote } from "Mocks/zotero";


type Props = ComponentProps<typeof NotesDrawer>;

export default {
	component: NotesDrawer,
	args: {
		isOpen: true,
		onClose: () => {}
	},
	parameters: {
		userSettings: {
			notes: {
				nest_char: "",
				nest_position: "top",
				nest_preset: "[[Notes]]",
				nest_use: "preset",
				split_char: "",
				split_preset: "</p>",
				split_use: "preset",
				__with: "text"
			}
		}
	}
} as Meta<Props>;

export const NotesOnly: StoryObj<Props> = {
	args: {
		notes: [sampleNote, sampleOlderNote]
	}
};

export const AnnotsOnly: StoryObj<Props> = {
	args: {
		notes: [sampleAnnot, sampleAnnotLaterPage]
	}
};

export const NotesAndAnnots: StoryObj<Props> = {
	args: {
		notes: [sampleNote, sampleOlderNote, sampleAnnot, sampleAnnotLaterPage]
	}
};
