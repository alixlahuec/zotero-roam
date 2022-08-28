import { useEffect } from "react";
import ActionsMenu from "./ActionsMenu";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { useQueryClient } from "@tanstack/react-query";

const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary } = libraries;

export default {
	component: ActionsMenu,
	args: {
		library: { apikey: masterKey, path: userLibrary.path }
	}
};

const Template = (args) => {
	const client = useQueryClient();

	useEffect(() => {
		client.setQueryData(["tags", { apikey: masterKey, library: userLibrary.path }], {
			data: {},
			lastUpdated: userLibrary.version
		});

		return () => {
			client.clear();
		};
	}, [client]);

	return <ActionsMenu {...args} />;
};

export const Default = Template.bind({});
Default.args = {
	suggestion: {
		recommend: "history",
		type: "auto",
		use: {
			roam: ["history"],
			zotero: ["history", "HISTORY", "History"]
		}
	}
};
Default.play = async ({ canvasElement }) => {
	document.dispatchEvent = jest.fn();
	const expectedEvent = new CustomEvent("zotero-roam:tags-deleted", {
		bubbles: true,
		cancelable: true,
		detail: {
			args: {
				tags: ["history", "HISTORY", "History"]
			},
			error: null,
			library: userLibrary.path
		}
	});

	const canvas = within(canvasElement);
	await userEvent.click(canvas.getByText("Delete tag(s)"));

	await waitFor(() => expect(
		canvas.getByText(
			"Deleted"
		)
	).toBeInTheDocument(),
	{
		timeout: 3000
	});

	await expect(document.dispatchEvent).toHaveBeenCalled();
	await expect(document.dispatchEvent).toHaveBeenCalledWith(expectedEvent);
};