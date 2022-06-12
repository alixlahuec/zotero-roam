import React from "react";
import { ErrorBoundary } from "@sentry/react";
import { node } from "prop-types";

import ErrorCallout from "./ErrorCallout";

function SentryBoundary(props){
	return <ErrorBoundary fallback={({ error, resetError }) => (
		<ErrorCallout buttonText="Reload" error={error} resetErrorBoundary={resetError} />
	)}>
		{props.children}
	</ErrorBoundary>;
}
SentryBoundary.propTypes = {
	children: node
};

export default SentryBoundary;