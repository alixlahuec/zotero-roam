import { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";
import { ErrorCallout } from ".";


type Props = ComponentProps<typeof ErrorCallout>;

export default {
	component: ErrorCallout
} as Meta<Props>;

const Template: Story<Props> = (args) => <ErrorCallout {...args} />;

export const Default = Template.bind({});
Default.args = {
	error: new Error("This is an error message")
};

export const WithButton = Template.bind({});
WithButton.args = {
	buttonText: "Reload",
	error: new Error("An error occurred. Please reload to fix."),
	resetErrorBoundary: () => {}
};