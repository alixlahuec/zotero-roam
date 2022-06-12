import React from "react";
import ShortcutSequence from ".";

export default { 
	component: ShortcutSequence,
};

const Template = (args) => <ShortcutSequence {...args} />;

export const Default = Template.bind({});
Default.args = {
	text: "alt+Q"
};
