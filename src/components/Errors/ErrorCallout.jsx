import React from "react";
import { error, func } from "prop-types";
import { Button, Callout } from "@blueprintjs/core";

function ErrorCallout({ error, resetErrorBoundary = null }) {

	return (
		<Callout
			intent="danger"
			icon="warning"
			title={error.name}
		>
			{error.message}
			{resetErrorBoundary != null && <Button onClick={resetErrorBoundary} text="Go back" />}
		</Callout>
	);
}
ErrorCallout.propTypes = {
	error: error,
	resetErrorBoundary: func
};

export default ErrorCallout;
