import React from "react";
import CitekeyMenu from "./CitekeyMenu";

import { expect } from "@storybook/jest";
import { userEvent, within } from "@storybook/testing-library";
import { waitFor } from "@storybook/testing-library";

import { items } from "../../../../mocks/zotero/items";
import { sampleNote } from "../../../../mocks/zotero/notes";

export default {
	component: CitekeyMenu,
	args: {
		item: items.find(it => it.key == "blochImplementingSocialInterventions2021"),
		itemList: {
			items,
			pdfs: [],
			notes: [sampleNote]
		},
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			pageMenu: {
				defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
				trigger: (title) => title.length > 3 || false
			},
			sciteBadge: {},
			typemap: {}
		}
	}
};

const Template = (args) => <CitekeyMenu {...args} />;

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ args, canvasElement }) => {
	const canvas = within(canvasElement);

	const refButton = await canvas.findByRole("menuitem", { name: "Show references" });

	await userEvent.click(refButton);

	await waitFor(async() => expect(await canvas.findByRole("dialog", { name: "@" + args.item.key }))
		.toBeInTheDocument(),
	{
		timeout: 6000
	});
    
	await userEvent.click(canvas.getAllByText("Add to Zotero")[0]);

	await waitFor(() => expect(canvas.getByText("Send to Zotero")));
};