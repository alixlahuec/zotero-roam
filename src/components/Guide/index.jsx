import React from "react";
import { element } from "prop-types";
import { Icon } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

function Guide({ content }){
	return <Popover2 content={content} interactionKind="hover-target" minimal={true} >
		<Icon icon="help" minimal={true} />
	</Popover2>;
}
Guide.propTypes = {
	content: element
};

export default Guide;

