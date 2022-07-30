import React from "react";

import { Guide, Link } from ".";


export default {
	component: Guide
};

const Template = (args) => <Guide {...args} />;

export const Default = Template.bind({});
Default.args = {
	content: <>
		<p>This is an affordance meant to guide the user in using the extension and understanding its functioning and limitations.</p>
		<p>Content in guides should be short and provide helpful links to relevant resources, such as the <Link href="https://www.zotero.org/support/note_templates" text="Zotero API"/>.</p>
	</>,
	header: "This is a hint"
};