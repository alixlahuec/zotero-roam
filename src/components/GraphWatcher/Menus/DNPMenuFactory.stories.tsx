import { ComponentProps, useEffect, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { DNPMenuFactory } from ".";
import { addPageMenus, findPageMenus } from "./utils";
import { DnpLogWithItems, DnpLogWithoutItems, DnpPageWithItems, DnpPageWithoutItems, DnpPreviewWithItems } from "../fixtures";


type Props = ComponentProps<typeof DNPMenuFactory>;

export default {
	component: DNPMenuFactory,
	decorators: [
		(Story, context) => {
			const { parameters: { Component } } = context;
			const [menus, setMenus] = useState<Element[]>([]);

			useEffect(() => {
				addPageMenus();
				const { dnpMenus } = findPageMenus();
				setMenus(dnpMenus);
			}, []);

			return <>
				<Component />
				<Story {...context} args={{ ...context.args, menus }} />
			</>;
		}
	]
} as Meta<Props>;

export const WithDNPLogWithItems: StoryObj<Props> = {
	parameters: {
		Component: DnpLogWithItems
	}
};

export const WithDNPLogWithoutItems: StoryObj<Props> = {
	parameters: {
		Component: DnpLogWithoutItems
	}
};

export const WithDNPPageWithItems: StoryObj<Props> = {
	parameters: {
		Component: DnpPageWithItems
	}
};

export const WithDNPPageWithoutItems: StoryObj<Props> = {
	parameters: {
		Component: DnpPageWithoutItems
	}
};

export const WithDNPLogPreview: StoryObj<Props> = {
	parameters: {
		Component: DnpPreviewWithItems
	}
};