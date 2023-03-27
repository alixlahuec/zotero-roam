import { useMemo } from "react";
import { RoamTagsInput, SettingsManager } from "Components/UserSettings";


const { Provider: WebImportProvider, useSettings: useWebImportSettings } = new SettingsManager();

function WebImportWidget(){
	const [
		{
			tags
		},
		setOpts
	] = useWebImportSettings();

	const handlers = useMemo(() => {
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateTags: (val) => updateSingleValue("tags", val)
		};
	}, [setOpts]);

	return <>
		<RoamTagsInput description="Select tags for which to show the import button" onChange={handlers.updateTags} title="Tags" value={tags} />
	</>;
}

export {
	WebImportProvider,
	WebImportWidget,
	useWebImportSettings
};