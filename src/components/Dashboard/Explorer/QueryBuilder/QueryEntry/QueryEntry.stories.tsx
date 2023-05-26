import { ComponentProps, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import QueryEntry from "./QueryEntry";


type Props = ComponentProps<typeof QueryEntry>;

export default {
	component: QueryEntry,
	args: {
		term: {
			property: "Abstract",
			relationship: "contains",
			value: "some text"
		}
	},
	decorators: [
		(Story, context) => {
			const [term, setTerm] = useState(context.args.term);
			const handlers = {
				removeSelf: () => {},
				updateSelf: (val) => setTerm(val)
			};

			return <Story {...context} args={{ ...context.args, handlers, term }} />;
		}
	]
} as Meta<Props>;

export const OnlyChild: StoryObj<Props> = {
	args: {
		isFirstChild: true,
		isOnlyChild: true,
		useOR: true
	} };

export const MiddleChild: StoryObj<Props> = {
	args: {
		isFirstChild: false,
		isOnlyChild: false,
		useOR: false
	}
};