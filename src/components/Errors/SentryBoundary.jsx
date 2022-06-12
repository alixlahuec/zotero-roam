import React from "react";
import * as Sentry from "@sentry/react";
import { node } from "prop-types";

import ErrorCallout from "./ErrorCallout";

function SentryBoundary(props){
	return <Sentry.Boundary fallback={({ error, resetError }) => (
		<ErrorCallout buttonText="Reload" error={error} resetErrorBoundary={resetError} />
	)}>
		{props.children}
	</Sentry.Boundary>;
}
SentryBoundary.propTypes = {
	children: node
};

export default SentryBoundary;