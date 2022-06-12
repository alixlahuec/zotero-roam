import React from "react";
import * as Sentry from "@sentry/react";
import { node } from "prop-types";
import ErrorCallout from "./ErrorCallout";

const fallback = ({ error, resetError }) => {
	return <ErrorCallout buttonText="Reload" error={error} resetErrorBoundary={resetError} />;
};

function SentryBoundary({ children }){

	return <Sentry.Boundary fallback={(props) => fallback(props)} >
		{children}
	</Sentry.Boundary>;
}
SentryBoundary.propTypes = {
	children: node
};

export default SentryBoundary;