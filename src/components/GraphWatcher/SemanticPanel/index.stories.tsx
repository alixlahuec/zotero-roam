import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import SemanticPanel from ".";
import { cleanSemantic } from "../Menus/helpers";
import { parseDOI, transformDOIs } from "../../../utils";

import { items, semantics } from "Mocks";


type Props = ComponentProps<typeof SemanticPanel>;

const semanticItem = items.find((it) => it.key == "blochImplementingSocialInterventions2021")!;
const itemDOI = parseDOI(semanticItem.data.DOI) as string;
const { citations, references } = semantics[itemDOI];
const semanticData = {
	citations: transformDOIs(citations),
	references: transformDOIs(references)
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
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		await expect(canvas.queryByText("No results found")).not.toBeInTheDocument();

		const filterBtn = canvas.getByRole("button", { name: "Filter" });

		await userEvent.click(filterBtn);

		const filterOption = frame.getByTitle<HTMLButtonElement>("Highly Influential").parentElement!;

		await userEvent.click(filterOption);

		await expect(canvas.queryByText("No results found")).not.toBeInTheDocument();

		await userEvent.click(filterBtn);

		const doiFilterOption = frame.getByTitle<HTMLButtonElement>("Has DOI").parentElement!;

		await userEvent.click(doiFilterOption);

		const searchbar = canvasElement.querySelector<HTMLInputElement>(`#semantic-search--${args.show.type}`)!;

		await userEvent.type(searchbar, "some text");

		await expect(canvas.queryByText("No results found")).toBeInTheDocument();
	}
};
