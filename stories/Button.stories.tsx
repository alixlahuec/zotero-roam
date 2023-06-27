import { ComponentProps } from "react";
import { Button, ButtonGroup, Tag } from "@blueprintjs/core";

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
	const renderVersions = (extraProps: Partial<Props> = {}) => {
		const styles = <>
			<Button {...args} {...extraProps} />
			<Button {...args} {...extraProps} active={true} />
			<Button {...args} {...extraProps} minimal={true} />
			<Button {...args} {...extraProps} active={true} minimal={true} />
			<Button {...args} {...extraProps} outlined={true} />
			<Button {...args} {...extraProps} aria-disabled={true} disabled={true} />
			<Button {...args} {...extraProps} aria-disabled={true} disabled={true} minimal={true} />
			<Button {...args} {...extraProps} loading={true} />
			<Button {...args} {...extraProps} loading={true} minimal={true} />
		</>;

		return <>
			<ButtonGroup>{styles}</ButtonGroup>
			<div>{styles}</div>
		</>;
	};

	return <>
		{renderVersions()}
		{renderVersions({ rightIcon: <Tag intent={args.intent}>3</Tag> })}
		{renderVersions({ rightIcon: "caret-down" })}
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