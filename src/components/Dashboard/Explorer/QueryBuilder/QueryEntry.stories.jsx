import { useState } from "react";
import QueryEntry from "./QueryEntry";

export default {
	component: QueryEntry,
	args: {
		term: {
			property: "Abstract",
			relationship: "contains",
			value: "some text"
		}
	}
};

const Template = (args) => {
	const [term, setTerm] = useState(args.term);
	const handlers = {
		removeSelf: () => {},
		updateSelf: (val) => setTerm(val)
	};

	return <QueryEntry {...args} handlers={handlers} term={term} />;
};

export const OnlyChild = Template.bind({});
OnlyChild.args = {
	isFirstChild: true,
	isOnlyChild: true,
	useOR: true
};

export const MiddleChild = Template.bind({});
MiddleChild.args = {
	isFirstChild: false,
	isOnlyChild: false,
	useOR: false
};