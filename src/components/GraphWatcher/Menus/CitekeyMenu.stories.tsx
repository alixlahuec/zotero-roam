import { ComponentProps, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within, expect } from "@storybook/test";

import CitekeyMenu from "./CitekeyMenu";
import { parseDOI, transformDOIs } from "../../../utils";
import { sleep } from "../../../../.storybook/utils";
import { items, sampleNote, samplePDF, semantics } from "Mocks";


type Props = ComponentProps<typeof CitekeyMenu>;

export default {
	component: CitekeyMenu,
	args: {
		item: items.find((it) => it.key == "blochImplementingSocialInterventions2021"),
		itemList: {
			items,
			pdfs: [samplePDF],
			notes: [sampleNote]
		}
	},
	decorators: [
		(Story, context) => {
			const { args } = context;
			const client = useQueryClient();

			useEffect(() => {
				const doi = parseDOI(args.item.data.DOI) as string;
				const { citations, references } = semantics[doi];
				client.setQueryData(["semantic", { doi }], {
					doi,
					citations: transformDOIs(citations),
					references: transformDOIs(references)
				});

				return () => {
					client.clear();
				};
			}, [client, args.item]);

			return <Story {...context} />;
		}
	],
	parameters: {
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			pageMenu: {
				defaults: [
					"addMetadata",
					"importNotes",
					"viewItemInfo",
					"openZoteroLocal",
					"openZoteroWeb",
					"pdfLinks",
					"sciteBadge",
					"connectedPapers",
					"semanticScholar",
					"googleScholar",
					"citingPapers"
				],
				trigger: "default"
			},
			sciteBadge: {},
			shortcuts: {},
			typemap: {}
		}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		await sleep(2000);

		const refButton = await canvas.findByRole("menuitem", { name: "Show references" });

		await userEvent.click(refButton);

		await waitFor(async () => expect(await canvas.findByRole("dialog", { name: "Works related to @" + args.item.key }))
			.toBeInTheDocument()
		);

		await userEvent.click(canvas.getAllByText("Add to Zotero")[0]);

		await waitFor(() => expect(canvas.getByText("Send to Zotero")));
	}
};
