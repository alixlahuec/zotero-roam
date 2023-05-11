import { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";
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

const Template: Story<Props> = (args) => <DataDrawer {...args} />;

export const Default = Template.bind({});