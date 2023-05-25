import { ConfigOptions } from "axe-playwright/dist/types";


export const A11Y_RULES: ConfigOptions["rules"] = [
	{
		id: "color-contrast",
		// axe-playwright currently generates inconsistent results for color contrast.
		// Mark violations for review rather than triggering a fail
		reviewOnFail: true,
		// Contrast check always returns incomplete for QuickCopy toggle,
		// which is due to background being provided by the sibling `input` element.
		selector: "*:not(label.zr-quick-copy)"
	},
	{
		id: "aria-progressbar-name",
		// The loading state for Blueprint's Button doesn't provide a title to the spinner.
		// This currently cannot be configured
		selector: "[role=\"progressbar\"]:not(.bp3-button-spinner):not(.bp3-spinner)"
	},
	{
		id: "aria-allowed-attr",
		// Blueprint's Tag sets an aria-labelledby attribute to the span wrapper,
		// which is incorrect for <span> elements without a valid aria-role.
		// This currently cannot be configured
		selector: "*:not(.bp3-tag)"
	},
	{
		id: "image-alt",
		// Scite's logo doesn't provide alt text, resulting in a violation
		selector: "img:not([src=\"https://cdn.scite.ai/assets/images/logo.svg\"])"
	},
	{
		id: "aria-hidden-focus",
		// Blueprint's Button component adds an aria-hidden attribute to its child Icon,
		// which is incorrect because the Icon is focusable.
		// This currently cannot be configured
		selector: "[aria-hidden=\"true\"]:not(.bp3-icon)"
	},
	{
		id: "aria-required-children",
		// Blueprint's Tabs component allows arbitrary children,
		// which doesn't enforce restrictions on their `role`
		selector: "[role]:not(.bp3-tab-list)"
	}
];