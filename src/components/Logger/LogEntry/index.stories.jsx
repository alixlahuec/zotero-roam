import { ListWrapper } from "Components/DataList";
import LogEntry from ".";

import { ZoteroRoamLog } from "../../../../src/extension";


export default {
	component: LogEntry
};

const Template = (args) => {
	return <ListWrapper>
		<LogEntry {...args} />
	</ListWrapper>;
};

export const Error = Template.bind({});
Error.args = {
	log: new ZoteroRoamLog({
		origin: "API",
		message: "Failed to fetch",
		context: {
			dataURI: "users/123456/items",
			error: "Some error message"
		}
	}, "error")
};

export const Warning = Template.bind({});
Warning.args = {
	log: new ZoteroRoamLog({
		origin: "Shortcuts",
		message: "Hotkey combo is not valid",
		context: {
			combo: "alt++"
		}
	}, "warning")
};

export const Info = Template.bind({});
Info.args = {
	log: new ZoteroRoamLog({
		origin: "Setup",
		message: "Extension initialized from roam/js",
		context: {}
	}, "info")
};