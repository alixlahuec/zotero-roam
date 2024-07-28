import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import LogItem from ".";

import { createLogItem } from "../utils";
import { ListWrapper } from "Components/DataList";
import { items } from "Mocks/zotero";


type Props = ComponentProps<typeof LogItem>;

export default {
	component: LogItem,
	args: {
		allAbstractsShown: true,
		onClose: () => {}
	},
	decorators: [
		(Story, context) => (
			<div className="zr-recentitems--datalist" >
				<ListWrapper>
					<Story {...context} />
				</ListWrapper>
			</div>
		)
	]
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