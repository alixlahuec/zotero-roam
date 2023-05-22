import { ComponentProps } from "react";
import { Meta, StoryFn } from "@storybook/react";
import LibraryQueryList from "./LibraryQueryList";

import { useBool } from "../../hooks";
import { cleanLibrary } from "../../utils";
import { items } from "Mocks";


type Props = ComponentProps<typeof LibraryQueryList>;

// Provide one Roam citekey to have in-graph state in story
const cleanItems = cleanLibrary(items, new Map([["@blochImplementingSocialInterventions2021", "fp3_5grl"]]));

export default {
	component: LibraryQueryList,
	args: {
		handleClose: () => {},
		isOpen: true
	},
	parameters: {
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
} as Meta<Props>;

const Template: StoryFn<Props> = (args) => {
	const [qcActive, { toggle: toggleQC }] = useBool(false);

	return <LibraryQueryList {...args} quickCopyProps={{ isActive: qcActive, toggle: toggleQC }} items={cleanItems} />;
};

export const WithItems = Template.bind({});