import { expect } from "@storybook/jest";
import { userEvent, within } from "@storybook/testing-library";

import SemanticPanel from ".";

import { cleanSemantic } from "../Menus/helpers";
import { parseDOI } from "../../../utils";
import { parseSemanticDOIs } from "../../../api/semantic";

import { items, semantics } from "Mocks";



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
		items: cleanSemantic({ items: [], notes: [], pdfs: [] }, semanticData, new Map()),
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
WithInteractions.play = async({ args, canvasElement }) => {
	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement);

	await expect(canvas.queryByText("No results found")).not.toBeInTheDocument();

	const filterBtn = canvas.getByRole("button", { name: "Filter" });

	await userEvent.click(filterBtn);

	const filterOption = frame.getByTitle("Highly Influential").parentElement;

	await userEvent.click(filterOption);

	await expect(canvas.queryByText("No results found")).not.toBeInTheDocument();

	await userEvent.click(filterBtn);

	const doiFilterOption = frame.getByTitle("Has DOI").parentElement;

	await userEvent.click(doiFilterOption);

	const searchbar = canvasElement.querySelector(`#semantic-search--${args.show.type}`);

	await userEvent.type(searchbar, "some text");

	await expect(canvas.queryByText("No results found")).toBeInTheDocument();

};