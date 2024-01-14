import { Component, ReactNode } from "react";

import { ErrorCallout } from "./ErrorCallout";

import { cleanError } from "../../utils";


type OwnProps = {
	children?: ReactNode
};

type OwnState = {
	error: any | null,
	errorInfo: any | null
};

class ErrorBoundary extends Component<OwnProps, OwnState> {
	constructor(props: OwnProps) {
		super(props);
		this.state = { error: null, errorInfo: null };
	}

	componentDidCatch(error, errorInfo) {
		this.setState({
			error: error,
			errorInfo: errorInfo
		});
		window.zoteroRoam?.error?.({
			origin: "Interface",
			message: "Failed to render",
			context: {
				error: cleanError(error),
				errorInfo
			}
		});
	}
   
	// This will render this component wherever called
	render() {
		return this.state.error
			? <ErrorCallout error={this.state.error} />
			: this.props.children;
	}
}

export { ErrorBoundary };