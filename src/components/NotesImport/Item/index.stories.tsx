import { ComponentProps } from "react";
import { Classes } from "@blueprintjs/core";
import { Meta, StoryObj } from "@storybook/react";

import NotesImportItem from "Components/NotesImport/Item";

import { useBool } from "@hooks";

import { sampleAnnot, sampleNote } from "Mocks";


type Props = ComponentProps<typeof NotesImportItem>;

export default {
	component: NotesImportItem,
	decorators: [
		(Story, context) => {
			const [isSelected, { toggle }] = useBool(context.args.isSelected || false);
			return (
				<ul className={Classes.LIST_UNSTYLED}>
					<Story {...context} args={{ ...context.args, isSelected, onToggle: toggle }} />
				</ul>
			);
		}
	]
} as Meta<Props>;

export const Annotation: StoryObj<Props> = {
	args: {
		note: sampleAnnot
	}
};

export const Note: StoryObj<Props> = {
	args: {
		note: sampleNote
	}
};
