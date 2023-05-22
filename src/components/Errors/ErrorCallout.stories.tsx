import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { ErrorCallout } from ".";


type Props = ComponentProps<typeof ErrorCallout>;

export default {
	component: ErrorCallout
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		error: new Error("This is an error message")
	}
};

export const WithButton: StoryObj<Props> = {
	args: {
		buttonText: "Reload",
		error: new Error("An error occurred. Please reload to fix."),
		resetErrorBoundary: () => {}
	}
};
