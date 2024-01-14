import { ComponentProps, useEffect, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import WebImportFactory from ".";

import { findWebimportDivs, setWebimportDivs } from "./helpers";
import { blockWithAliasedLink, blockWithHrefLink } from "../fixtures";


const triggerTags = ["import"];

type Props = ComponentProps<typeof WebImportFactory>;

export default {
	component: WebImportFactory,
	decorators: [
		(Story, context) => {
			const { parameters: { Component } } = context;
			const [divs, setDivs] = useState<Element[]>([]);

			useEffect(() => {
				setWebimportDivs(triggerTags);
				setDivs(() => findWebimportDivs());
			}, []);

			return <>
				<Component />
				<Story {...context} args={{ ...context.args, divs }} />
			</>;
		}
	]
} as Meta<Props>;


export const TaggedBlockWithAliasedLink: StoryObj<Props> = {
	parameters: {
		Component: () => blockWithAliasedLink(triggerTags)
	}
};

export const TaggedBlockWithHrefLink: StoryObj<Props> = {
	parameters: {
		Component: () => blockWithHrefLink(triggerTags)
	}
};

export const UntaggedBlockWithAliasedLink: StoryObj<Props> = {
	parameters: {
		Component: () => blockWithAliasedLink([])
	}
};
export const UntaggedBlockWithHrefLink: StoryObj<Props> = {
	parameters: {
		Component: () => blockWithHrefLink([])
	}
};