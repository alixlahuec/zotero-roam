import ClearCacheButton from "Components/ClearCacheButton";


window.zoteroRoam = {
	isDataCached: () => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(false);
			}, 800);
		});
	}
};

export default {
	component: ClearCacheButton,
};

const Template = () => <ClearCacheButton />;

export const NoData = Template.bind({});