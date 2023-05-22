import { ComponentProps, useState } from "react";
import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { Meta, StoryObj } from "@storybook/react";
import { TextField } from "./common";


type Props = ComponentProps<typeof TextField>;

export default {
	component: TextField,
	args: {
		description: "Some description",
		label: "Some label",
		title: "Some title"
	},
	decorators: [
		(Story, context) => {
			const { args } = context;
			const [val, setVal] = useState(() => args.value);
			return (
				<div className="zr-settings-panel">
					<Story {...context} value={val} onChange={setVal} />
				</div>
			);
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		value: "some value"
	}
};

const acceptOnlyShortStrings = (input: string) => input.length < 5;

export const WithValidation: StoryObj<Props> = {
	args: {
		validate: acceptOnlyShortStrings,
		value: "abc"
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const inputField = canvas.getByLabelText("Some label");

		await waitFor(() => expect(inputField).toHaveAttribute("aria-invalid", "false"));

		await userEvent.type(inputField, "too long");

		await waitFor(() => expect(inputField).toHaveAttribute("aria-invalid", "true"));
	}
};
