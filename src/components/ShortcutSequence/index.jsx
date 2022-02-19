import React from "react";
import { string } from "prop-types";
import { Tag } from "@blueprintjs/core";

import "./index.css";

function ShortcutSequence({ text }){
	return (
		<Tag className="zr-shortcut-sequence" minimal={true}>
			{text}
		</Tag>
	);
}
ShortcutSequence.propTypes = {
	text: string
};

export default ShortcutSequence;
