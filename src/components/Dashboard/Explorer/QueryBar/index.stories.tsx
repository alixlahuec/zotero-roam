import { ComponentProps, useCallback, useState } from "react"
import { Meta, StoryObj } from "@storybook/react";

import { Filter } from "@hooks";

import ExplorerQueryList from "."


type Props = ComponentProps<typeof ExplorerQueryList>;

type Item = {
	id: number,
	roam: boolean,
	title: string
};

const filters: Filter<Item>[] = [
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