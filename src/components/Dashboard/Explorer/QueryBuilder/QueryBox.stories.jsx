import React, { useState } from "react";
import QueryBox from "./QueryBox";

export default {
	component: QueryBox,
	args: {
		isFirstChild: true
	}
};

const Template = (args) => {
	const [termList, setTermList] = useState(args.terms);
	const handlers = {
		removeSelf: () => {},
		updateSelf: (val) => setTermList(val)
	};

	return <div style={{ maxWidth: "550px" }}>
		<QueryBox {...args} handlers={handlers} terms={termList} />
	</div>;
};

export const WithOR = Template.bind({});
WithOR.args = {
	isOnlyChild: true,
	useOR: true,
	terms: [
		{ property: "Abstract", relationship: "contains", value: "history" },
		{ property: "Title", relationship: "contains", value: "history" }
	]
};

export const WithAND = Template.bind({});
WithAND.args = {
	isOnlyChild: false,
	useOR: false,
	terms: [
		{ property: "Citekey", relationship: "exists", value: null },
		{ property: "Item added", relationship: "before", value: new Date([2022, 4, 1]) }
	]
};