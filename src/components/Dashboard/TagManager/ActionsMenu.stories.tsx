import { ComponentProps, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { expect, fn, Mock, userEvent, waitFor, within } from "@storybook/test";


import { Meta, StoryObj } from "@storybook/react";
import ActionsMenu from "./ActionsMenu";

import { apiKeys, libraries } from "Mocks";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary } = libraries;

type Props = ComponentProps<typeof ActionsMenu>;

export default {
	component: ActionsMenu,
	args: {
		library: { apikey: masterKey, path: userLibrary.path }
	},
	decorators: [
		(Story, context) => {
			const client = useQueryClient();
			
			useEffect(() => {
				client.setQueryData(["tags", { library: userLibrary.path }], {
					data: {},
					lastUpdated: userLibrary.version
				});

				return () => {
					client.clear();
				};
			}, [client]);

			return <Story {...context} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		suggestion: {
			recommend: "history",
			type: "auto",
			use: {
				roam: ["history"],
				zotero: ["history", "HISTORY", "History"]
			}
		}
	},
	play: async ({ canvasElement }) => {
		document.dispatchEvent = fn();

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
		await expect((document.dispatchEvent as Mock).mock.calls[0][0].detail)
			.toEqual({
				args: {
					tags: ["history", "history", "HISTORY", "History"]
				},
				error: null,
				library: userLibrary.path,
				_type: "tags-deleted"
			});
	}
};
