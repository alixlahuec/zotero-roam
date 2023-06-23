import { ComponentProps } from "react";
import { Button, ButtonGroup } from "@blueprintjs/core";

import { Meta, StoryObj } from "@storybook/react";
import { CustomClasses } from "../src/constants";


type Props = ComponentProps<typeof Button>;

export default {
	component: Button,
	args: {
		style: { margin: "10px" },
		text: "Button text",
		title: "Button text"
	}
} as Meta<Props>;

const Template: StoryObj<Props>["render"] = (args) => {
	return <>
		<ButtonGroup>
			<Button {...args} />
			<Button {...args} active={true} />
			<Button {...args} minimal={true} />
			<Button {...args} outlined={true} />
			<Button {...args} aria-disabled={true} disabled={true} />
			<Button {...args} aria-disabled={true} disabled={true} minimal={true} />
			<Button {...args} loading={true} />
			<Button {...args} loading={true} minimal={true} />
		</ButtonGroup>
		<div>
			<Button {...args} />
			<Button {...args} active={true} />
			<Button {...args} minimal={true} />
			<Button {...args} outlined={true} />
			<Button {...args} aria-disabled={true} disabled={true} />
			<Button {...args} aria-disabled={true} disabled={true} minimal={true} />
			<Button {...args} loading={true} />
			<Button {...args} loading={true} minimal={true} />
		</div>
	</>;
};

export const Auxiliary: StoryObj<Props> = {
	args: {
		className: CustomClasses.TEXT_AUXILIARY
	},
	render: Template
};

export const Secondary: StoryObj<Props> = {
	args: {
		className: CustomClasses.TEXT_SECONDARY
	},
	render: Template
};

export const Primary: StoryObj<Props> = {
	args: {
		intent: "primary"
	},
	render: Template
};

export const Warning: StoryObj<Props> = {
	args: {
		intent: "warning"
	},
	render: Template
};

export const Success: StoryObj<Props> = {
	args: {
		intent: "success"
	},
	render: Template
};

export const Danger: StoryObj<Props> = {
	args: {
		intent: "danger"
	},
	render: Template
};