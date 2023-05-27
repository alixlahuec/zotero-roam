import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import LogItem from "./LogItem";

import { createLogItem } from "./utils";
import { items } from "Mocks/zotero";


type Props = ComponentProps<typeof LogItem>;

export default {
	component: LogItem,
	args: {
		allAbstractsShown: true,
		onClose: () => {}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		item: createLogItem(
			items[0],
			{
				edited: new Date(2021, 3, 6),
				inGraph: false,
				notes: [],
				pdfs: []
			}
		)
	}
};