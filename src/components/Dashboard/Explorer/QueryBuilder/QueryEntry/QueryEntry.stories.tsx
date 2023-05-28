import { ComponentProps, useReducer } from "react";
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
			const [term, dispatch] = useReducer((_state, action) => {
				switch (action.type) {
				case "updateSelf":
					return action.value;
				case "removeSelf":
				default:
					return;
				}
			}, context.args.term);

			return <Story {...context} args={{ ...context.args, dispatch, term }} />;
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