import { expect } from "@storybook/jest";
import { userEvent, within } from "@storybook/testing-library";

import SemanticPanel from "Components/GraphWatcher/SemanticPanel";

import { cleanSemantic, parseDOI } from "../../../utils";
import { parseSemanticDOIs } from "../../../api/utils";

import { semantics } from "Mocks/semantic-scholar";
import { items } from "Mocks/zotero/items";


const semanticItem = items.find(it => it.key == "blochImplementingSocialInterventions2021");
const itemDOI = parseDOI(semanticItem.data.DOI);
const { citations, references } = semantics[itemDOI];
const semanticData = {
	citations: parseSemanticDOIs(citations),
	references: parseSemanticDOIs(references)
};
export default {
	component: SemanticPanel,
	args: {
		isOpen: true,
		items: cleanSemantic([], semanticData, new Map()),
		onClose: () => {},
		show: {
			title: "@" + semanticItem.key,
			type: "is_reference"
		}
	},
	argTypes: {
		onClose: { action: true }
	}
};

const Template = (args) => <SemanticPanel {...args} />;

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement);

	await expect(canvas.queryByText("No results found")).not.toBeInTheDocument();

	const filterBtn = canvas.getByRole("button", { name: "Filter" });

	await userEvent.click(filterBtn);

	const filterOption = frame.getByTitle("Highly Influential").parentElement;

	await userEvent.click(filterOption);

	await expect(canvas.queryByText("No results found")).toBeInTheDocument();

	await userEvent.click(filterBtn);

	const doiFilterOption = frame.getByTitle("Has DOI").parentElement;

	await userEvent.click(doiFilterOption);

	const searchbar = canvas.getByPlaceholderText("Search items");

	await userEvent.type(searchbar, "some text");

};