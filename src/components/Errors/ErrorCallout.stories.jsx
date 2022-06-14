import React from "react";
import ErrorCallout from "./ErrorCallout";

export default {
	component: ErrorCallout
};

const Template = (args) => <ErrorCallout {...args} />;

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