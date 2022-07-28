import React from "react";
import DataDrawer from ".";

import { items } from "Mocks/zotero/items";

export default {
	component: DataDrawer,
	args: {
		isOpen: true,
		onClose: () => {},
		item: items[0]
	}
};

const Template = (args) => <DataDrawer {...args} />;

export const Default = Template.bind({});