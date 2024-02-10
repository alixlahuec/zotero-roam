import { Meta, StoryObj } from "@storybook/react";
import ClearCacheButton from "Components/ClearCacheButton";
import ZoteroRoam from "../../api";


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

export const NoData: StoryObj = {
	parameters: {
		returnDataIsCached: false
	}
};

export const WithData: StoryObj = {
	parameters: {
		returnDataIsCached: true
	}
};
