import React from "react";
import ShortcutSequence from ".";

export default { 
	component: ShortcutSequence,
};

const Template = (args) => <ShortcutSequence {...args} />;

export const Default = Template.bind({});
Default.args = {
	action: "do something",
	text: "alt+Q"
};
