import React from "react";
import { ErrorBoundary } from "@sentry/react";
import { array, node, object, oneOfType, string } from "prop-types";

import ErrorCallout from "./ErrorCallout";

function SentryBoundary(props){
	const { feature = null, extra = null } = props;
	return <ErrorBoundary 
		beforeCapture={(scope, _error, _componentStack) => {
			if(feature){
				scope.setTag("feature", feature);
			}
			if(extra){
				scope.setExtras({...extra});
			}
		}}
		fallback={({ error, resetError }) => (
			<ErrorCallout buttonText="Reload" error={error} resetErrorBoundary={resetError} />
		)}>
		{props.children}
	</ErrorBoundary>;
}
SentryBoundary.propTypes = {
	children: node,
	extra: oneOfType([array, object]),
	feature: string,
};

export default SentryBoundary;