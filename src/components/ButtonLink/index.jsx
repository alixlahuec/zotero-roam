import React from "react";
import PropTypes from "prop-types";
import { Classes, Icon } from "@blueprintjs/core";

function ButtonLink(props) {
	const { icon = null, iconProps = {}, text = null, textProps = {}, href, linkClass = [], ...otherProps } = props;
	let extraClasses = linkClass.constructor === Array ? linkClass : [linkClass];

	return (
		<a role="button" className={[Classes.BUTTON, ...extraClasses].join(" ")}
			target="_blank" href={href} rel="noreferrer"
			{...otherProps}>
			{icon ? <Icon icon={icon} {...iconProps} /> : null}
			{text ? <span className={Classes.BUTTON_TEXT} {...textProps}>{text}</span> : null}
		</a>
	);
}
ButtonLink.propTypes = {
	icon: PropTypes.string,
	iconProps: PropTypes.object,
	text: PropTypes.string,
	textProps: PropTypes.object,
	href: PropTypes.string,
	linkClass: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
};

export default ButtonLink;