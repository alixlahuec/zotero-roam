import React from "react";
import { error, func, string } from "prop-types";
import { Button, Callout } from "@blueprintjs/core";

function ErrorCallout({ buttonText = "Go back", error, resetErrorBoundary = null }) {

	return (
		<Callout intent="danger" icon="warning" title={error.name} >
			{error.message}
			{resetErrorBoundary != null && <Button onClick={resetErrorBoundary} text={buttonText} />}
		</Callout>
	);
}
ErrorCallout.propTypes = {
	buttonText: string,
	error: error,
	resetErrorBoundary: func
};

export default ErrorCallout;
