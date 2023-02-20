import { useEffect } from "react";
import ClearCacheButton from "Components/ClearCacheButton";


export default {
	component: ClearCacheButton,
	parameters: {
		returnValue: false
	},
	decorators: [
		(Story, context) => {
			const { parameters: { returnValue } } = context;

			useEffect(() => {
				window.zoteroRoam = {
					isDataCached: () => {
						return new Promise((resolve) => {
							setTimeout(() => {
								resolve(returnValue);
							}, 800);
						});
					}
				};
			}, [returnValue]);

			return <Story />;
		}
	]
};

const Template = () => <ClearCacheButton />;

export const NoData = Template.bind({});
NoData.parameters = {
	returnValue: false
};

export const WithData = Template.bind({});
WithData.parameters = {
	returnValue: true
};