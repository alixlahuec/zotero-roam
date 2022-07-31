import React from "react";
import { SettingsDialog } from ".";

export default {
	component: SettingsDialog,
	args: {
		isOpen: true,
		onClose: () => {}
	},
	parameters: {
		userSettings: {
			annotations: {
				comment_prefix: "",
				comment_suffix: "",
				func: "",
				group_by: false,
				highlight_prefix: "[[>]]",
				highlight_suffix: "([p. {{page_label}}]({{link_page}})) {{tags_string}}",
				use: "raw"
			},
			autocomplete: {
				trigger: "@",
				display: "citekey",
				format: "citekey"
			},
			copy: {
				always: false,
				defaultFormat: "citekey",
				overrideKey: "altKey",
				useQuickCopy: false
			},
			metadata: {
				func: "",
				smartblock: {
					param: "srcUid",
					paramValue: "ABC123F"
				},
				use: "function"
			},
			notes: {
				func: "",
				split_char: "\n",
				use: "raw"
			},
			other: {
				autoload: true,
				darkTheme: false,
				render_inline: true,
				shareErrors: true
			},
			pageMenu: {
				defaults: [],
				trigger: true
			},
			webimport: {
				tags: []
			}
		}
	}
};

const Template = (args) => <SettingsDialog {...args} />;

export const Default = Template.bind({});