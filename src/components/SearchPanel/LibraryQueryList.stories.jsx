import React, { useCallback, useMemo, useState } from "react";
import LibraryQueryList from "./LibraryQueryList";
import { items } from "./items.json";
import { cleanLibrary } from "../../utils";

// Provide one Roam citekey to have in-graph state in story
const cleanItems = cleanLibrary(items, new Map([["@scottQuantitativeMeasurementOrganizational2003", "fp3_5grl"]]));

export default {
	component: LibraryQueryList,
	args: {
		handleClose: () => {},
		isOpen: true,
		userSettings: {
			copy: {
				always: false,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false
			},
			shortcuts: {
				// Disable shortcuts for stories
			}
		}
	},
	parameters: {
		a11y: {
			config: {
				rules: [
					{
						// Contrast check always returns incomplete for QuickCopy toggle
						// This is due to background being provided by the sibling `input` element
						id: "color-contrast",
						selector: "*:not(label.zr-quick-copy)"
					}
				]
			}
		}
	}
};

const Template = (args) => {
	const [qcActive, setQCActive] = useState(false);
	const toggleQC = useCallback(() => setQCActive(prevState => !prevState), []);
	const quickCopyProps = useMemo(() => {
		return {
			isActive: qcActive,
			toggle: toggleQC
		};
	}, [qcActive, toggleQC]);
	return <LibraryQueryList {...args} quickCopyProps={quickCopyProps} items={cleanItems} />;
};

export const WithItems = Template.bind({});