import { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";
import ShortcutSequence from ".";


type Props = ComponentProps<typeof ShortcutSequence>;

export default { 
	component: ShortcutSequence,
} as Meta<Props>;

const Template: Story<Props> = (args) => <ShortcutSequence {...args} />;

export const Default = Template.bind({});
Default.args = {
	action: "do something",
	text: "alt+Q"
};
