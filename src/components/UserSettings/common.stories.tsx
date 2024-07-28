import { ComponentProps, useState } from "react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

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
			const [value, setValue] = useState(() => context.args.value);
			return (
				<div className="zr-settings-panel">
					<Story {...context} args={{ ...context.args, value, onChange: setValue }} />
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
