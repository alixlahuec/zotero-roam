
import { func, instanceOf, string } from "prop-types";

import { Button, Callout } from "@blueprintjs/core";

function ErrorCallout({ buttonText = "Go back", error, resetErrorBoundary = null }) {

	return (
		<Callout intent="danger" title={error.name} >
			<p>{error.message}</p>
			{resetErrorBoundary != null && <Button intent="danger" onClick={resetErrorBoundary} outlined={true} text={buttonText} />}
		</Callout>
	);
}
ErrorCallout.propTypes = {
	buttonText: string,
	error: instanceOf(Error),
	resetErrorBoundary: func
};

export default ErrorCallout;
