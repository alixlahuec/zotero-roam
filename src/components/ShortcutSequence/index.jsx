import React from "react";
import { string } from "prop-types";

import { Tag } from "@blueprintjs/core";

import "./index.css";


const ShortcutSequence = ({ action, text }) => <Tag className="zr-shortcut-sequence" htmlTitle={"Press " + text + " to " + action} minimal={true}>{text}</Tag>;
ShortcutSequence.propTypes = {
	action: string,
	text: string
};

export default ShortcutSequence;
