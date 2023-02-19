import { useEffect } from "react";
import ClearCacheButton from "Components/ClearCacheButton";


export default {
	component: ClearCacheButton,
	args: {
		returnValue: false
	}
};

const Template = (args) => {
	const { returnValue } = args;

	useEffect(() => {
		window.zoteroRoam = {
			isDataCached: () => {
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve(returnValue);
					}, 0);
				});
			}
		};
	}, [returnValue]);

	return <ClearCacheButton />;
};

export const NoData = Template.bind({});
NoData.args = {
	returnValue: false
};

export const WithData = Template.bind({});
WithData.args = {
	returnValue: true
};