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
	}
};

const Template = (args) => {
	const [qcActive, setQCActive] = useState(false);
	const toggleQC = useCallback(() => setQCActive(prevState => !prevState), []);
	return <LibraryQueryList {...args} quickCopyProps={{ isActive: qcActive, toggle: toggleQC }} items={cleanItems} />;
};

export const WithItems = Template.bind({});