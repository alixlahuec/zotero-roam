import { Meta, Story } from "@storybook/react";
import { mock } from "jest-mock-extended";

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

			window.zoteroRoam = mock<ZoteroRoam>({
				isDataCached: () => {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(returnDataIsCached);
						}, 0);
					});
				}
			});

			return <Story />;
		}
	]
} as Meta;

const Template: Story = () => <ClearCacheButton />;

export const NoData = Template.bind({});
NoData.parameters = {
	returnDataIsCached: false
};

export const WithData = Template.bind({});
WithData.parameters = {
	returnDataIsCached: true
};