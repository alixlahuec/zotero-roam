import { Meta, StoryFn } from "@storybook/react";

import ClearCacheButton from "Components/ClearCacheButton";
import ZoteroRoam from "../../extension";


export default {
	component: ClearCacheButton,
	parameters: {
		chromatic: { delay: 500 },
		returnDataIsCached: false
	},
	decorators: [
		(Story, context) => {
			const { parameters: { returnDataIsCached } } = context;

			window.zoteroRoam = {
				isDataCached: () => {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(returnDataIsCached);
						}, 0);
					});
				}
			} as ZoteroRoam;

			return <Story />;
		}
	]
} as Meta;

const Template: StoryFn = () => <ClearCacheButton />;

export const NoData = Template.bind({});
NoData.parameters = {
	returnDataIsCached: false
};

export const WithData = Template.bind({});
WithData.parameters = {
	returnDataIsCached: true
};