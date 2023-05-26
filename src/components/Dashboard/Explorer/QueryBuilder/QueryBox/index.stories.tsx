import { ComponentProps, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import QueryBox from ".";


type Props = ComponentProps<typeof QueryBox>;

export default {
	component: QueryBox,
	args: {
		isFirstChild: true
	},
	decorators: [
		(Story, context) => {
			const [termList, setTermList] = useState(context.args.terms);
			const handlers = {
				removeSelf: () => {},
				updateSelf: (val) => setTermList(val)
			};

			return <div style={{ maxWidth: "550px" }}>
				<Story {...context} args={{ ...context.args, handlers, terms: termList }} />
			</div>;
		}
	]
} as Meta<Props>;

export const WithOR: StoryObj<Props> = {
	args: {
		isOnlyChild: true,
		useOR: true,
		terms: [
			{ property: "Abstract", relationship: "contains", value: "history" },
			{ property: "Title", relationship: "contains", value: "history" }
		]
	}
};

export const WithAND: StoryObj<Props> = {
	args: {
		isOnlyChild: false,
		useOR: false,
		terms: [
			{ property: "Citekey", relationship: "exists", value: null },
			{ property: "Item added", relationship: "before", value: new Date(2022, 3, 1) }
		]
	}
};