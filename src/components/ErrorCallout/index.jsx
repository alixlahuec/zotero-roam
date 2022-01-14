import React from "react";
import PropTypes from "prop-types";
import { Callout } from "@blueprintjs/core";

function ErrorCallout(props) {
	const { error } = props;

	return (
		<Callout
			intent="danger"
			icon="warning"
			title={error.name}
		>
			{error.message}
		</Callout>
	);
}
ErrorCallout.propTypes = {
	error: PropTypes.error
};

export default ErrorCallout;
