import React from "react";
import Dashboard from ".";

export default {
	component: Dashboard,
	args: {
		isOpen: true,
		onClose: () => {},
		userSettings: {
			annotations: {},
			autocomplete: {},
			copy: {},
			metadata: {},
			notes: {},
			pageMenu: {
				defaults: [],
				trigger: () => true
			},
			render_inline: true,
			sciteBadge: {},
			shortcuts: {},
			typemap: {}
		}
	}
};

const Template = (args) => <Dashboard {...args} />;

export const Default = Template.bind({});