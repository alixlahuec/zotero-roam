import React from "react";
import { element } from "prop-types";
import { Icon } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import "./index.css";

function Guide({ content }){
	return <Popover2 className="zr-guide-popover" content={content} interactionKind="hover-target" popoverClassName="zr-popover" >
		<Icon icon="help" size={12} />
	</Popover2>;
}
Guide.propTypes = {
	content: element
};

export default Guide;

