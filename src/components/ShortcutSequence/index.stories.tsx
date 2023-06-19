import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import ShortcutSequence from ".";


type Props = ComponentProps<typeof ShortcutSequence>;

export default { 
	component: ShortcutSequence
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		action: "do something",
		text: "alt+Q"
	}
};
