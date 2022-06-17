import React, { useRef } from "react";
import { CitekeyContextMenu } from ".";
import sampleItem from "./item.json"; // TODO: add children to item for story

const citekey = "@" + sampleItem.data.raw.key;
const itemsMap = new Map([[citekey, sampleItem]]);

export default {
	component: CitekeyContextMenu,
	args: {
		coords: {
			left: 80,
			top: 80
		},
		isOpen: true,
		itemsMap,
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
	const targetElement = useRef();
	
	return <>
		<span data-link-title={citekey} data-link-uid="abcdef">
			<span ref={targetElement}>{citekey}</span>
		</span>
		<CitekeyContextMenu {...args} target={targetElement.current} />
	</>;
};

export const Default = Template.bind({});