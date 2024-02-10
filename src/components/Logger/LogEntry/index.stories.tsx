import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { ListWrapper } from "Components/DataList";

import LogEntry from ".";
import { ZoteroRoamLog } from "../../../api/logging";


type Props = ComponentProps<typeof LogEntry>;

export default {
	component: LogEntry,
	decorators: [
		(Story, context) => {
			const { args, parameters } = context;
			const log = new ZoteroRoamLog(...parameters.logArgs);

			return (
				<ListWrapper>
					<Story {...context} args={{ ...args, log }} />
				</ListWrapper>
			);
		}
	]
} as Meta<Props>;


export const Error: StoryObj<Props> = {
	parameters: {
		logArgs: [
			{
				origin: "API",
				message: "Failed to fetch",
				detail: "404 Error - Not Found",
				context: {
					dataURI: "users/123456/items",
					error: {
						message: "Some error message"
					}
				}
			},
			"error"
		]
	}
};

export const Warning: StoryObj<Props> = {
	parameters: {
		logArgs: [
			{
				origin: "Shortcuts",
				message: "Hotkey combo is not valid",
				context: {
					combo: "alt++"
				}
			},
			"warning"
		]
	}
};

export const Info: StoryObj<Props> = {
	parameters: {
		logArgs: [
			{
				origin: "Setup",
				message: "Extension initialized from roam/js",
				context: {}
			},
			"info"
		]
	}
};
