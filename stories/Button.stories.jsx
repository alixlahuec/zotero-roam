import React from "react";
import { Button, ButtonGroup } from "@blueprintjs/core";

import { CustomClasses } from "../src/constants";

export default {
	component: Button,
	args: {
		style: { margin: "10px" },
		text: "Button text",
		title: "Button text"
	}
};

const Template = (args) => {
	const { className, intent, style, text, title, ...appearance } = args;
	const buttonProps = { className, intent, style, text, title };
    
	return <>
		<ButtonGroup {...appearance}>
			<Button minimal={true} {...buttonProps} />
			<Button outlined={true} {...buttonProps} />
			<Button aria-disabled={true} disabled={true} {...buttonProps} />
			<Button loading={true} {...buttonProps} />
			<Button loading={true} minimal={true} {...buttonProps} />
		</ButtonGroup>
		<div>
			<Button minimal={true} {...args} />
			<Button outlined={true} {...args} />
			<Button aria-disabled={true} disabled={true} {...args} />
			<Button loading={true} {...args} />
			<Button loading={true} minimal={true} {...args} />
		</div>
	</>;
};

export const Auxiliary = Template.bind({});
Auxiliary.args = {
	className: CustomClasses.TEXT_AUXILIARY
};

export const Secondary = Template.bind({});
Secondary.args = {
	className: CustomClasses.TEXT_SECONDARY
};

export const Primary = Template.bind({});
Primary.args = {
	intent: "primary"
};

export const Warning = Template.bind({});
Warning.args = {
	intent: "warning"
};

export const Success = Template.bind({});
Success.args = {
	intent: "success"
};

export const Danger = Template.bind({});
Danger.args = {
	intent: "danger"
};