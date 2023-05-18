import { ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";

import { Backlinks } from "./CitekeyMenu";
import { cleanSemanticItem } from "../../../utils";

import { citoids, semanticIdentifier, items, semantics } from "Mocks";
import { SEnrichedItemTypeEnum } from "Types/transforms";


type Props = ComponentProps<typeof Backlinks>;

const semanticCitoid = citoids[semanticIdentifier];
const semanticEntry = Object.values(semantics)[0].references.find(ref => ref.title == semanticCitoid.title)!;
const semanticItem = items.find(it => it.data.title == semanticCitoid.title)!;

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
} as Meta<Props>;

const Template: Story<Props> = (args) => <Backlinks {...args} />;

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
			_type: SEnrichedItemTypeEnum.CITED
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
			_type: SEnrichedItemTypeEnum.CITING
		}
	]
};