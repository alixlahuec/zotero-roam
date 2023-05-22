import { ComponentProps } from "react";
import { Classes } from "@blueprintjs/core";
import { Meta, StoryFn } from "@storybook/react";

import NotesImportItem from "Components/NotesImport/Item";
import { useBool } from "../../../hooks";
import { sampleAnnot, sampleNote } from "Mocks";


type Props = ComponentProps<typeof NotesImportItem>;

export default {
	component: NotesImportItem
} as Meta<Props>;

const Template: StoryFn<Props> = (args) => {
	const [isSelected, { toggle }] = useBool(args.isSelected || false);

	return <ul className={Classes.LIST_UNSTYLED}>
		<NotesImportItem {...args} isSelected={isSelected} onToggle={toggle} />
	</ul>;
};

export const Annotation = Template.bind({});
Annotation.args = {
	note: sampleAnnot
};

export const Note = Template.bind({});
Note.args = {
	note: sampleNote
};