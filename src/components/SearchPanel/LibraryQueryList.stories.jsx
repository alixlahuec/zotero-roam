import React, { useCallback, useMemo, useState } from "react";
import LibraryQueryList from "./LibraryQueryList";
import { cleanLibrary } from "../../utils";

import { items } from "../../../mocks/zotero/items";

// Provide one Roam citekey to have in-graph state in story
const cleanItems = cleanLibrary(items, new Map([["@blochImplementingSocialInterventions2021", "fp3_5grl"]]));

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