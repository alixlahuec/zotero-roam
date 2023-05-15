import { useMemo } from "react";
import { TagsSelector } from "Components/Inputs";
import { RowCol, SettingsManager } from "Components/UserSettings";


const { Provider: WebImportProvider, useSettings: useWebImportSettings } = new SettingsManager<"webimport">();

function WebImportWidget(){
	const [
		{
			tags
		},
		setOpts
	] = useWebImportSettings();

	const handlers = useMemo(() => {
		function addTag(val) {
			setOpts(prevState => ({
				...prevState,
				tags: Array.from(new Set([...prevState.tags, val]))
			}));
		}

		function removeTag(val) {
			setOpts(prevState => ({
				...prevState,
				tags: prevState.tags.filter(v => v != val)
			}));
		}

		return {
			addTag,
			removeTag
		};
	}, [setOpts]);

	return <>
		<RowCol title="Tags" description="Select tags for which to show the import button">
			<TagsSelector onRemove={handlers.removeTag} onSelect={handlers.addTag} selectedTags={tags} />
		</RowCol>
	</>;
}

export {
	WebImportProvider,
	WebImportWidget,
	useWebImportSettings
};