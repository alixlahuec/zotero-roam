
import { Button, ButtonProps, Callout } from "@blueprintjs/core";


type Args = {
	buttonText?: string,
	error: Error,
	resetErrorBoundary?: ButtonProps["onClick"]
};

function ErrorCallout({ buttonText = "Go back", error, resetErrorBoundary = undefined }: Args): JSX.Element {

	return (
		<Callout intent="danger" title={error.name} >
			<p>{error.message}</p>
			{resetErrorBoundary !== undefined && <Button intent="danger" onClick={resetErrorBoundary} outlined={true} text={buttonText} />}
		</Callout>
	);
}

export { ErrorCallout };
