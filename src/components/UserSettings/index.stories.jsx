import { SettingsDialog } from ".";

import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";

import { OVERRIDE_KEY_OPTIONS } from "./Copy";


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
				use: "default",
				__with: "raw"
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
				use: "default"
			},
			notes: {
				func: "",
				split_char: "\n",
				use: "default",
				__with: "raw"
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

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement, parameters }) => {
	const { userSettings } = parameters;
	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement);


	await expect(canvas.getByText("Settings for zoteroRoam"))
		.toBeInTheDocument();


	const autoloadSwitch = canvas.getByRole("switch", { name: "Toggle 'autoload' setting" });

	await expect(autoloadSwitch.checked)
		.toBe(userSettings.other.autoload);

	await userEvent.click(autoloadSwitch);

	await expect(autoloadSwitch.checked)
		.toBe(!userSettings.other.autoload);

    
	const autocompleteTrigger = canvas.getByTitle("Enter a trigger for the 'autocomplete' feature");

	await expect(autocompleteTrigger.value)
		.toBe(userSettings.autocomplete.trigger);
    
	await userEvent.clear(autocompleteTrigger);
	await userEvent.type(autocompleteTrigger, ";;");

	await expect(autocompleteTrigger.value)
		.toBe(";;");
    

	const qcOverrideKey = canvas.getByRole("combobox", { name: "Select an override key for Quick Copy" });

	await expect(qcOverrideKey.innerText)
		.toBe(OVERRIDE_KEY_OPTIONS.find(op => op.value == userSettings.copy.overrideKey).label);

	await userEvent.click(qcOverrideKey);

	const overrideMenu = frame.getByRole("listbox", { name: "selectable options" });

	await expect(overrideMenu.title)
		.toBe("Select an override key for Quick Copy");
    
	const overrideOptions = within(overrideMenu).getAllByRole("menuitem");

	await expect(overrideOptions.length)
		.toBe(OVERRIDE_KEY_OPTIONS.length);
    
	await userEvent.click(overrideOptions[overrideOptions.length - 1]);

	await expect(qcOverrideKey.innerText)
		.toBe(OVERRIDE_KEY_OPTIONS[OVERRIDE_KEY_OPTIONS.length - 1].label);

};

export const NoRequests = Template.bind({});
NoRequests.parameters = {
	userSettings: {
		requests: {
			apiKeys: [],
			dataRequests: [],
			libraries: []
		}
	}
};
