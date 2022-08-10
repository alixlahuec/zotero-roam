import { useState } from "react";
import QueryFilterList from "./QueryFilterList";

import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "./utils";

export default {
	component: QueryFilterList,
	args: {
		useOR: false
	}
};

const Template = (args) => {
	const [terms, setTerms] = useState(args.terms);

	const handlers = {
		addTerm: (val) => setTerms(prev => addElemToArray(prev, [val])),
		removeTerm: (index) => setTerms(prev => removeArrayElemAt(prev, index)),
		updateTerm: (index, val) => setTerms(prev => updateArrayElemAt(prev, index, val))
	};

	return <QueryFilterList {...args} handlers={handlers} terms={terms} />;
};

export const Default = Template.bind({});
Default.args = {
	terms: [
		[
			[{ property: "Citekey", relationship: "exists", value: null }],
			[{ property: "Item added", relationship: "before", value: new Date([2022, 4, 1]) }]
		],
		[
			[{ property: "Abstract", relationship: "contains", value: "history" }],
			[{ property: "Title", relationship: "contains", value: "history" }]
		]
	]
};