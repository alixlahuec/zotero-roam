import { ComponentProps, useEffect, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { TagMenuFactory } from ".";
import { addPageMenus, findPageMenus } from "./utils";
import { NormalPageWithoutTaggingContent, NormalPageWithTaggingContent } from "../fixtures";


type Props = ComponentProps<typeof TagMenuFactory>;

export default {
	component: TagMenuFactory,
	decorators: [
		(Story, context) => {
			const { parameters: { Component } } = context;
			const [menus, setMenus] = useState<Element[]>([]);

			useEffect(() => {
				addPageMenus();
				const { tagMenus } = findPageMenus();
				setMenus(tagMenus);
			}, []);

			return <>
				<Component />
				<Story {...context} args={{ ...context.args, menus }} />
			</>;
		}
	]
} as Meta<Props>;


export const WithPageWithTaggingContent: StoryObj<Props> = {
	parameters: {
		Component: NormalPageWithTaggingContent
	}
};

export const WithPageWithoutTaggingContent: StoryObj<Props> = {
	parameters: {
		Component: NormalPageWithoutTaggingContent
	}
};