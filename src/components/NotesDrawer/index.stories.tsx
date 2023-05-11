import { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";
import NotesDrawer from ".";
import { sampleAnnot, sampleAnnotLaterPage, sampleNote, sampleOlderNote } from "Mocks/zotero";


type Props = ComponentProps<typeof NotesDrawer>;

export default {
	component: NotesDrawer,
	args: {
		isOpen: true,
		onClose: () => {},
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

const Template: Story<Props> = (args) => <NotesDrawer {...args} />;

export const NotesOnly = Template.bind({});
NotesOnly.args = {
	notes: [sampleNote, sampleOlderNote]
};

export const AnnotsOnly = Template.bind({});
AnnotsOnly.args = {
	notes: [sampleAnnot, sampleAnnotLaterPage]
};

export const NotesAndAnnots = Template.bind({});
NotesAndAnnots.args = {
	notes: [sampleNote, sampleOlderNote, sampleAnnot, sampleAnnotLaterPage]
};