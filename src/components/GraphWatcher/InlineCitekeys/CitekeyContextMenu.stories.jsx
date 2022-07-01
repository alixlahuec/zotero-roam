import React, { useContext, useRef } from "react";
import { ExtensionContext } from "../../App";
import { items } from "../../../../mocks/zotero/items";
import { CitekeyContextMenu, useGetItems } from ".";

export default {
	component: CitekeyContextMenu,
	args: {
		coords: {
			left: 80,
			top: 80
		},
		isOpen: true,
		onClose: () => {},
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			typemap: {}
		}
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
		}
	}
};

const Template = (args) => {
	const { dataRequests } = useContext(ExtensionContext);
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