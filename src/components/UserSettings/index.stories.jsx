
import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { SettingsDialog } from ".";

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
				func: "",
				group_by: false,
				template_comment: "{{comment}}",
				template_highlight: "[[>]] {{highlight}} ([p. {{page_label}}]({{link_page}})) {{tags_string}}",
				use: "default",
				__with: "raw"
			},
			autocomplete: {
				trigger: "@",
				display_char: "",
				display_use: "preset",
				display: "citekey",
				format_char: "",
				format_use: "preset",
				format: "citekey"
			},
			copy: {
				always: false,
				overrideKey: "altKey",
				preset: "citekey",
				template: "@{{key}}",
				useAsDefault: "preset",
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
				nest_char: "",
				nest_position: "top",
				nest_preset: "[[Notes]]",
				nest_use: "preset",
				split_char: "",
				split_preset: "\n",
				split_use: "preset",
				use: "default",
				__with: "raw"
			},
			other: {
				autoload: true,
				cacheEnabled: false,
				darkTheme: false,
				render_inline: true
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
WithInteractions.parameters = {
	chromatic: {
		disableSnapshot: true
	}
};
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
    

	const qcOverrideKey = canvas.getByTitle("Select an override key for Quick Copy");

	await expect(qcOverrideKey.innerText)
		.toBe(OVERRIDE_KEY_OPTIONS.find(op => op.value == userSettings.copy.overrideKey).label);

	await userEvent.click(qcOverrideKey);

	const overrideMenu = frame.getByRole("list", { name: "Select an override key for Quick Copy" });

	await expect(overrideMenu).toBeInTheDocument();
    
	const overrideOptions = within(overrideMenu).getAllByRole("listitem");

	await expect(overrideOptions.length)
		.toBe(OVERRIDE_KEY_OPTIONS.length);
    
	await userEvent.click(within(overrideMenu).getByTitle("Shift"));

	await expect(qcOverrideKey.innerText)
		.toBe("Shift");

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
