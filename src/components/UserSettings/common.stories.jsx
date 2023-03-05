import { useState } from "react";
import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { TextField } from "./common";


export default {
	component: TextField,
	args: {
		description: "Some description",
		label: "Some label",
		title: "Some title"
	}
};

const Template = (args) => {
	const [val, setVal] = useState(() => args.value);
	return <div className="zr-settings-panel">
		<TextField {...args} value={val} onChange={setVal} />
	</div>;
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