import { ComponentProps, useReducer } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";


import QueryEntry from "./QueryEntry";
import { QueryProperty } from "../types";


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

export const WithInteractions: StoryObj<Props> = {
	args: {
		term: {
			property: "Abstract",
			relationship: "contains",
			value: ""
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		const getPropertySelect = () => canvas.getByTitle("Select a property to query");
		const getRelationshipSelect = () => canvas.getByTitle("Select a relationship to test for the property");

		const selectProperty = async (property: QueryProperty) => {
			await userEvent.click(getPropertySelect());
			await userEvent.click(frame.getByText(property));
		};

		const selectRelationship = async (relationship) => {
			await userEvent.click(getRelationshipSelect());
			await userEvent.click(frame.getByText(relationship));
		};

		// Value change
		await userEvent.type(canvas.getByPlaceholderText<HTMLInputElement>("Enter text"), "history");

		// Property change - same input type
		await selectProperty("Title");
		await expect(canvas.getByPlaceholderText<HTMLInputElement>("Enter text").value).toBe("history");

		// Property change - different input type, null
		await selectProperty("DOI");
		await expect(getRelationshipSelect().innerText).toBe("exists");

		// Property change - different input type, text
		await selectProperty("Abstract");
		await expect(getRelationshipSelect().innerText).toBe("exists");

		// Relationship change
		await selectRelationship("contains");
		await expect(canvas.getByPlaceholderText<HTMLInputElement>("Enter text").value).toBe("");
	}
};