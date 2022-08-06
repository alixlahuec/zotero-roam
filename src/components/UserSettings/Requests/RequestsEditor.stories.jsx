import React, { useState } from "react";
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

	await expect(canvas.queryByRole("textbox", { name: "Library" })).not.toBeInTheDocument();

	const validateButton = canvas.getByRole("button", { name: "OK" });

	await userEvent.click(validateButton);
	await expect(canvas.queryByRole("heading", { name: "Error" })).not.toBeInTheDocument();

	await userEvent.click(canvas.getByRole("button", { name: "Add request" }));

	const libTypeControl = canvas.queryByRole("button", { name: "users" });
	const libIDInput = canvas.queryByRole("textbox", { name: "Library" });
	const apikeyInput = canvas.queryByRole("textbox", { name: "API Key" });
	const libNameInput = canvas.queryByRole("textbox", { name: "Name" });

	await expect(libTypeControl).toBeInTheDocument();
	await expect(libIDInput).toBeInTheDocument();
	await expect(apikeyInput).toBeInTheDocument();
	await expect(libNameInput).toBeInTheDocument();

	await userEvent.click(validateButton);
	await expect(canvas.queryByRole("heading", { name: "Error" })).toBeInTheDocument();

	await userEvent.type(libIDInput, "12345");
	await expect(canvas.queryByRole("heading", { name: "Error" })).not.toBeInTheDocument();

	await userEvent.type(apikeyInput, "key");

	await userEvent.click(validateButton);

	await expect(args.closeDialog).toHaveBeenCalled();
};