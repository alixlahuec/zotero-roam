import { ComponentProps, useRef } from "react";
import { Meta, StoryObj } from "@storybook/react";

import { CitekeyContextMenu, useGetItems } from ".";
import { useRequestsSettings } from "Components/UserSettings";

import { items, samplePDF } from "Mocks";


type Props = ComponentProps<typeof CitekeyContextMenu>;

export default {
	component: CitekeyContextMenu,
	args: {
		coords: {
			left: 80,
			top: 80
		},
		isOpen: true,
		onClose: () => {}
	},
	decorators: [
		(Story, context) => {
			const [{ dataRequests }] = useRequestsSettings();
			const targetElement = useRef<HTMLElement>(null);
			const itemsMap = context.args.itemsMap || useGetItems(dataRequests);
			const citekey = "@" + items[0].key;

			return (
				<>
					<span data-link-title={citekey} data-link-uid="abcdef">
						<span ref={targetElement}>{citekey}</span>
					</span>
					<Story {...context} args={{ ...context.args, itemsMap, target: targetElement.current }} />
				</>
			);
		}
	],
	parameters: {
		a11y: {
			config: {
				rules: [
					{
						// Contrast check isn't needed against target element,
						// as it would be set by Roam and that environment isn't fully mocked here
						id: "color-contrast",
						selector: "*:not(span[data-link-uid] span)"
					}
				]
			}
		},
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			typemap: {}
		}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithPDFAttachment: StoryObj<Props> = {
	args: {
		itemsMap: new Map([[
			"@" + items[0].key,
			{
				citation: "",
				data: {
					children: {
						pdfs: [samplePDF],
						notes: []
					},
					location: "",
					raw: items[0],
					weblink: false,
					zotero: {
						local: "",
						web: ""
					}
				}
			}
		]])
	}
};
