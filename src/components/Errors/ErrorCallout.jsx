import React from "react";
import { error, func } from "prop-types";
import { Button, Callout } from "@blueprintjs/core";

function ErrorCallout({ error, reset = null }) {

	return (
		<Callout
			intent="danger"
			icon="warning"
			title={error.name}
		>
			{error.message}
			{reset != null && <Button onClick={reset} text="Go back" />}
		</Callout>
	);
}
ErrorCallout.propTypes = {
	error: error,
	reset: func
};

export default ErrorCallout;
