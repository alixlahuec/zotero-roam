import { ComponentProps, useState } from "react"
import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import { QueryFilter } from "@hooks";

import ExplorerQueryList from "."
import { Classes } from "@blueprintjs/core";


type Props = ComponentProps<typeof ExplorerQueryList>;

type Item = {
	id: number,
	roam: boolean,
	title: string
};

const filters: QueryFilter<Item>[] = [
	{
		label: "Library entry exists",
		value: "inLibrary",
		presets: [
			{ label: "Yes", value: "true" },
			{ label: "No", value: "false" },
		],
		evaluate: (query, item) => {
			const boolCheck = query == "true" ? true : false;
			return Boolean(item.roam) === boolCheck;
		}
	},
	{
		label: "Roam page exists",
		value: "inRoam",
		presets: [
			{ label: "Yes", value: "true" },
			{ label: "No", value: "false" },
		],
		evaluate: (query, item) => {
			const boolCheck = query == "true" ? true : false;
			return Boolean(item.roam) === boolCheck;
		}
	}
];

export default {
	component: ExplorerQueryList,
	args: {
		filters
	},
	decorators: [
		(Story, context) => {
			const [query, setQuery] = useState(() => context.args.query);
			return <Story {...context} args={{...context.args, onQueryChange: setQuery, query }} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		query: ""
	}
};

export const WithPartialOperatorQuery: StoryObj<Props> = {
	args: {
		query: filters[0].value.slice(0, 2)
	}
};

export const WithSelectedOperatorQuery: StoryObj<Props> = {
	args: {
		query: filters[0].value + ":"
	}
};

export const WithQualifiedQuery: StoryObj<Props> = {
	args: {
		query: filters[0].value + ":" + filters[0].presets[0].value
	}
};

export const WithInteractions: StoryObj<Props> = {
	args: {
		query: ""
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const searchbar = canvas.getByTestId("explorer-searchbar");

		await userEvent.click(searchbar);
		await waitFor(() =>
			expect(canvas.getAllByTestId("explorer-suggestion"))
				.toHaveLength(filters.length)
		);

		searchbar.blur();
		await expect(canvas.queryByTestId("explorer-suggestion")).not.toBeInTheDocument();

		await userEvent.click(searchbar);
		await userEvent.type(searchbar, filters[0].value + ":");
		await userEvent.keyboard("{ArrowDown}");

		const suggestions = canvas.getAllByTestId("explorer-suggestion");
		expect(suggestions[0]).toHaveAttribute("aria-selected", "true");
	}
};