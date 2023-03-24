import { node } from "prop-types";
import { Component } from "react";

import ErrorCallout from "./ErrorCallout";

import { cleanErrorIfAxios } from "../../utils";


class ErrorBoundary extends Component {
	constructor(props) {
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
				error: cleanErrorIfAxios(error),
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
ErrorBoundary.propTypes = {
	children: node
};

export { ErrorBoundary };