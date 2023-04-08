import { ListWrapper } from "Components/DataList";
import LogEntry from ".";

import { ZoteroRoamLog } from "../../../extension";


export default {
	component: LogEntry
};

const Template = (args) => {
	const { __log_props, __log_level } = args;
	const log = new ZoteroRoamLog(__log_props, __log_level);

	return <ListWrapper>
		<LogEntry {...args} log={log} />
	</ListWrapper>;
};

export const Error = Template.bind({});
Error.args = {
	__log_props: {
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
	__log_level: "error"
};

export const Warning = Template.bind({});
Warning.args = {
	__log_props: {
		origin: "Shortcuts",
		message: "Hotkey combo is not valid",
		context: {
			combo: "alt++"
		}
	},
	__log_level: "warning"
};

export const Info = Template.bind({});
Info.args = {
	__log_props: {
		origin: "Setup",
		message: "Extension initialized from roam/js",
		context: {}
	},
	__log_level: "info"
};