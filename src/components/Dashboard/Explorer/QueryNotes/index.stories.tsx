import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import QueryNotes from ".";

import { sampleAnnot, sampleImageAnnot, sampleNote, sampleOlderNote } from "Mocks";

import "../_index.sass";


type Props = ComponentProps<typeof QueryNotes>;

export default {
	component: QueryNotes,
	args: {
		itemList: {
			items: [],
			notes: [sampleAnnot, sampleImageAnnot, sampleNote, sampleOlderNote],
			pdfs: []
		}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {};