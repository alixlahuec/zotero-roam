import React from "react";
import { element } from "prop-types";
import { Icon } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import "./index.css";

function Guide({ content }){
	return <Popover2 className="zr-guide-popover--target" content={content} interactionKind="hover-target" popoverClassName={["zr-popover", "zr-guide-popover"].join(" ")} >
		<Icon icon="help" size={14} />
	</Popover2>;
}
Guide.propTypes = {
	content: element
};

export default Guide;

