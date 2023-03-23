import { useRef } from "react";

import { CitekeyContextMenu, useGetItems } from ".";
import { useRequestsSettings } from "Components/UserSettings";

import { items } from "Mocks/zotero/items";


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
};

const Template = (args) => {
	const [{ dataRequests }] = useRequestsSettings();
	const targetElement = useRef();
	const itemsMap = useGetItems(dataRequests);
	const citekey = "@" + items[0].key;
	
	return <>
		<span data-link-title={citekey} data-link-uid="abcdef">
			<span ref={targetElement}>{citekey}</span>
		</span>
		<CitekeyContextMenu {...args} itemsMap={itemsMap} target={targetElement.current} />
	</>;
};

export const Default = Template.bind({});