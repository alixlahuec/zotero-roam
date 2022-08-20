import { useState } from "react";

import { analyzeUserRequests } from "../../../setup";

import RequestsEditor from "./RequestsEditor";

import { expect, jest } from "@storybook/jest";
import { userEvent, within } from "@storybook/testing-library";


export default {
	component: RequestsEditor,
	args: {
		closeDialog: jest.fn()
	},
	argTypes: {
		closeDialog: { action: true }
	}
};

const Template = (args) => {
	const { dataRequests, ...rest } = args;
	const [requests, setRequests] = useState(() => analyzeUserRequests(dataRequests));
	return <RequestsEditor {...rest} dataRequests={requests.dataRequests} updateRequests={setRequests} />;
};

export const Default = Template.bind({});
Default.args = {
	dataRequests: [
		{ library: { type: "users", id: "12345" } },
		{ library: { type: "groups", id: "54321" }, name: "My group library", apikey: "ABCD1234" }
	]
};

export const NoRequests = Template.bind({});
NoRequests.args = {
	dataRequests: []
};
NoRequests.play = async({ args, canvasElement }) => {
	const canvas = within(canvasElement);

	const existingLibs = canvasElement.querySelectorAll(".zr-data-request.existing");
	const newLibForm = within(canvasElement.querySelector(".zr-data-request.new"));

	await expect(existingLibs.length).toBe(0);
	await expect(newLibForm.getByRole("textbox", { name: "Library" }))
		.toHaveFocus();

	const validateButton = canvas.getAllByRole("button", { name: "OK" })[0];

	// Validation on empty req list shouldn't display an error
	await userEvent.click(validateButton);
	await expect(canvas.queryByRole("heading", { name: "Error" })).not.toBeInTheDocument();

	const addReqToListButton = newLibForm.getByRole("button", { name: "Add" });

	// Validation with empty req should display an error
	await userEvent.click(addReqToListButton);
	await userEvent.click(validateButton);
	await expect(canvas.queryByRole("heading", { name: "Error" })).toBeInTheDocument();

	const firstLibForm = within(canvasElement.querySelector(".zr-data-request.existing"));
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

};