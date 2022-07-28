import React from "react";
import { bool, node, string } from "prop-types";
import { AnchorButton } from "@blueprintjs/core";

function ButtonLink(props) {
	const { children = null, href, minimal = true, ...otherProps } = props;
	
	return (
		<AnchorButton href={href} minimal={minimal} rel="noreferrer" target="_blank" {...otherProps}>
			{children}
		</AnchorButton>
	);
}
ButtonLink.propTypes = {
	children: node,
	href: string,
	minimal: bool
};

export default ButtonLink;