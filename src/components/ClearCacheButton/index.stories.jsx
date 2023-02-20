import { useEffect } from "react";
import ClearCacheButton from "Components/ClearCacheButton";


export default {
	component: ClearCacheButton,
	parameters: {
		chromatic: { delay: 500 },
		returnDataIsCached: false
	},
	decorators: [
		(Story, context) => {
			const { parameters: { returnDataIsCached } } = context;

			useEffect(() => {
				window.zoteroRoam = {
					isDataCached: () => {
						return new Promise((resolve) => {
							setTimeout(() => {
								resolve(returnDataIsCached);
							}, 800);
						});
					}
				};
			}, [returnDataIsCached]);

			return <Story />;
		}
	]
};

const Template = () => <ClearCacheButton />;

export const NoData = Template.bind({});
NoData.parameters = {
	returnDataIsCached: false
};

export const WithData = Template.bind({});
WithData.parameters = {
	returnDataIsCached: true
};