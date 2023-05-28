import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import QueryFilterList from ".";
import { useArrayReducer } from "../../../../../hooks";
import { QueryTermListRecursive } from "../types";


type Props = ComponentProps<typeof QueryFilterList>;

export default {
	component: QueryFilterList,
	args: {
		useOR: false
	},
	decorators: [
		(Story, context) => {
			const [terms, dispatch] = useArrayReducer<QueryTermListRecursive[]>([]);
			return <Story {...context} args={{ ...context.args, dispatch, terms }} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		terms: [
			[
				[{ property: "Citekey", relationship: "exists", value: null }],
				[{ property: "Item added", relationship: "before", value: new Date(2022, 3, 1) }]
			],
			[
				[{ property: "Abstract", relationship: "contains", value: "history" }],
				[{ property: "Title", relationship: "contains", value: "history" }]
			]
		]
	}
};