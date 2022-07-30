import React, { useEffect} from "react";
import { useQueryClient } from "@tanstack/react-query";
import CitekeyMenu from "./CitekeyMenu";

import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { items } from "Mocks/zotero/items";
import { sampleNote } from "Mocks/zotero/notes";
import { semantics } from "Mocks/semantic-scholar";
import { parseSemanticDOIs } from "../../../api/utils";
import { parseDOI } from "../../../utils";
import { sleep } from "../../../../.storybook/utils";

export default {
	component: CitekeyMenu,
	args: {
		item: items.find(it => it.key == "blochImplementingSocialInterventions2021"),
		itemList: {
			items,
			pdfs: [],
			notes: [sampleNote]
		}
	},
    parameters: {
        userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			pageMenu: {
				defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
				trigger: (title) => title.length > 3 || false
			},
			sciteBadge: {},
			shortcuts: {},
			typemap: {}
		}
    }
};

const Template = (args) => {
	const client = useQueryClient();

	useEffect(() => {
		const doi = parseDOI(args.item.data.DOI);
		const { citations, references } = semantics[doi];
		client.setQueryData(["semantic", { doi }], {
			doi,
			citations: parseSemanticDOIs(citations),
			references: parseSemanticDOIs(references)
		});

		return () => {
			client.clear();
		};
	}, [client, args.item]);

	return <CitekeyMenu {...args} />;
};

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ args, canvasElement }) => {
	const canvas = within(canvasElement);

	await sleep(2000);

	const refButton = await canvas.findByRole("menuitem", { name: "Show references" });

	await userEvent.click(refButton);

	await waitFor(async() => expect(await canvas.findByRole("dialog", { name: "Works related to @" + args.item.key }))
		.toBeInTheDocument()
	);
    
	await userEvent.click(canvas.getAllByText("Add to Zotero")[0]);

	await waitFor(() => expect(canvas.getByText("Send to Zotero")));
};