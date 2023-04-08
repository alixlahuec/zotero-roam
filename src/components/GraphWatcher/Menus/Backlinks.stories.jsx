import { Backlinks } from "./CitekeyMenu";
import { cleanSemanticItem } from "../../../utils";

import { citoids, semanticIdentifier, items, semantics } from "Mocks";


const semanticCitoid = citoids[semanticIdentifier];
const semanticEntry = Object.values(semantics)[0].references.find(ref => ref.title == semanticCitoid.title);
const semanticItem = items.find(it => it.data.title == semanticCitoid.title);

export default {
	component: Backlinks,
	args: {
		isOpen: true,
		origin: "2016"
	},
	parameters: {
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			typemap: {}
		}
	}
};

const Template = (args) => <Backlinks {...args} />;

export const Default = Template.bind({});
Default.args = {
	items: [
		{
			...cleanSemanticItem(semanticEntry),
			inGraph: false,
			inLibrary: {
				children: {
					pdfs: [],
					notes: []
				},
				raw: semanticItem
			},
			_type: "cited"
		},
		{
			...cleanSemanticItem(semanticEntry),
			inGraph: false,
			inLibrary: {
				children: {
					pdfs: [],
					notes: []
				},
				raw: semanticItem
			},
			_type: "citing"
		}
	]
};