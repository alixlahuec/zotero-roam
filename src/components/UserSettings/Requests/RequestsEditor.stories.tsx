import { ComponentProps, useState } from "react";
import { expect, fn, userEvent, within } from "@storybook/test";

import { Meta, StoryObj } from "@storybook/react";

import RequestsEditor from "./RequestsEditor";
import { analyzeUserRequests } from "../../../setup";
import { apiKeys, libraries } from "Mocks/zotero";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath } } = libraries;

type Props = ComponentProps<typeof RequestsEditor>;

export default {
	component: RequestsEditor,
	args: {
		closeDialog: fn()
	},
	argTypes: {
		closeDialog: { action: true }
	},
	decorators: [
		(Story, context) => {
			const { dataRequests } = context.args;
			const [requests, setRequests] = useState(() => analyzeUserRequests(dataRequests));
			return <Story {...context}
				args={{
					...context.args,
					dataRequests: requests.dataRequests,
					updateRequests: setRequests
				}} />;
		}
	]
} as Meta<Props>;

const defaultReqs = [
	{ dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
	{ dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
];

export const Default: StoryObj<Props> = {
	args: {
		dataRequests: analyzeUserRequests(defaultReqs).dataRequests
	}
};

export const NoRequests: StoryObj<Props> = {
	args: {
		dataRequests: []
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		const existingLibs = canvasElement.querySelectorAll(".zr-data-request.existing");
		const newLibForm = within(canvasElement.querySelector(".zr-data-request.new")!);

		await expect(existingLibs.length).toBe(0);
		await expect(newLibForm.getByRole("textbox", { name: "Library" })).toHaveFocus();

		const validateButton = canvas.getAllByRole("button", { name: "OK" })[0];

		// Validation on empty req list shouldn't display an error
		await userEvent.click(validateButton);
		await expect(canvas.queryByRole("heading", { name: "Error" })).not.toBeInTheDocument();

		const addReqToListButton = newLibForm.getByRole("button", { name: "Add" });

		// Validation with empty req should display an error
		await userEvent.click(addReqToListButton);
		await userEvent.click(validateButton);
		await expect(canvas.queryByRole("heading", { name: "Error" })).toBeInTheDocument();

		const firstLibForm = within(canvasElement.querySelector(".zr-data-request.existing")!);
		// const libTypeControl = firstLibForm.getByRole("button", { name: "users" });
		const libIDInput = firstLibForm.getByRole("textbox", { name: "Library" });
		const apikeyInput = firstLibForm.getByRole("textbox", { name: "API Key" });
		// const libNameInput = firstLibForm.getByRole("textbox", { name: "Name" });

		// Change in any of the inputs should make the error callout disappear
		await userEvent.type(libIDInput, "12345");
		await expect(canvas.queryByRole("heading", { name: "Error" })).not.toBeInTheDocument();

		// Validation on valid req should pass, and cause the dialog to be closed
		await userEvent.type(apikeyInput, "key");
		await userEvent.click(validateButton);
		await expect(canvas.queryByRole("heading", { name: "Error" })).not.toBeInTheDocument();
		await expect(args.closeDialog).toHaveBeenCalled();
	}
};
