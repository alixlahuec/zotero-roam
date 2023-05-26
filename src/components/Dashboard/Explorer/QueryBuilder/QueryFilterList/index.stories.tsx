import { ComponentProps, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";

import QueryFilterList from ".";
import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "../utils";


type Props = ComponentProps<typeof QueryFilterList>;

export default {
	component: QueryFilterList,
	args: {
		useOR: false
	},
	decorators: [
		(Story, context) => {
			const [terms, setTerms] = useState(context.args.terms);

			const handlers = {
				addTerm: (val) => setTerms(prev => addElemToArray(prev, [val])),
				removeTerm: (index) => setTerms(prev => removeArrayElemAt(prev, index)),
				updateTerm: (index, val) => setTerms(prev => updateArrayElemAt(prev, index, val))
			};

			return <Story {...context} args={{ ...context.args, handlers, terms }} />;
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