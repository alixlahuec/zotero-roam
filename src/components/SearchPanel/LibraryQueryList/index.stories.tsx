import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import LibraryQueryList from ".";

import { useBool } from "@hooks";

import { cleanLibrary } from "../helpers";

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
	decorators: [
		(Story, context) => {
			const [qcActive, { toggle: toggleQC }] = useBool(false);

			return <Story {...context}
				args={{
					...context.args,
					quickCopyProps: { isActive: qcActive, toggle: toggleQC },
					items: cleanItems
				}} />;
		}
	],
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

export const WithItems: StoryObj<Props> = {};
