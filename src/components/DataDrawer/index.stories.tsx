import { ComponentProps } from "react";
import { Meta, StoryFn } from "@storybook/react";
import DataDrawer from ".";

import { items } from "Mocks";


type Props = ComponentProps<typeof DataDrawer>;

export default {
	component: DataDrawer,
	args: {
		isOpen: true,
		onClose: () => {},
		item: items[0]
	}
} as Meta<Props>;

const Template: StoryFn<Props> = (args) => <DataDrawer {...args} />;

export const Default = Template.bind({});