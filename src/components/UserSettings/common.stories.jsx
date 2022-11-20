import { useState } from "react";
import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { TextField } from "./common";


export default {
	component: TextField,
	args: {
		label: "Some label"
	}
};

const Template = (args) => {
	const [val, setVal] = useState(() => args.value);
	return <TextField {...args} value={val} onChange={setVal} />;
};

export const Default = Template.bind({});
Default.args = {
	value: "some value"
};

const acceptOnlyShortStrings = (input) => input.length < 5;
export const WithValidation = Template.bind({});
WithValidation.args = {
	validate: acceptOnlyShortStrings,
	value: "abc"
};
WithValidation.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const inputField = canvas.getByLabelText("Some label");

	await waitFor(() => expect(inputField)
		.toHaveAttribute("aria-invalid", "false"));

	await userEvent.type(inputField, "too long");

	await waitFor(() => expect(inputField)
		.toHaveAttribute("aria-invalid", "true"));
};