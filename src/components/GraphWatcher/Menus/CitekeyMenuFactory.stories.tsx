import { ComponentProps, useEffect, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { CitekeyMenuFactory } from ".";
import { addPageMenus, findPageMenus } from "./utils";
import { CitekeyPageInvalid, CitekeyPageValid } from "../fixtures";


type Props = ComponentProps<typeof CitekeyMenuFactory>;

export default {
	component: CitekeyMenuFactory,
	decorators: [
		(Story, context) => {
			const { parameters: { Component } } = context;
			const [menus, setMenus] = useState<Element[]>([]);

			useEffect(() => {
				addPageMenus();
				const { citekeyMenus } = findPageMenus();
				setMenus(citekeyMenus);
			}, []);

			return <>
				<Component />
				<Story {...context} args={{ ...context.args, menus }} />
			</>;
		}
	]
} as Meta<Props>;

export const WithValidCitekey: StoryObj<Props> = {
	parameters: {
		Component: CitekeyPageValid
	}
};

export const WithInvalidCitekey: StoryObj<Props> = {
	parameters: {
		Component: CitekeyPageInvalid
	}
};