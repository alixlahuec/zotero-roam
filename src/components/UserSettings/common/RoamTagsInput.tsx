import { FC, ReactNode, useCallback } from "react";

import { TagsSelector } from "Components/Inputs";
import { RowCol } from ".";

import { CustomClasses } from "../../../constants";


type OwnProps = {
	description?: ReactNode | null,
	onChange: (val: string[]) => void,
	title?: ReactNode | null,
	value: string[]
};
const RoamTagsInput: FC<OwnProps> = (props) => {
	const { description = null, onChange, title = null, value } = props;

	const selectTag = useCallback((val) => {
		onChange(Array.from(new Set([...value, val])));
	}, [onChange, value]);

	const removeTag = useCallback((val) => {
		onChange(value.filter(v => v != val));
	}, [onChange, value]);

	return <RowCol title={title} description={description} >
		<TagsSelector className={CustomClasses.TEXT_SMALL} onRemove={removeTag} onSelect={selectTag} selectedTags={value} />
	</RowCol>;
};

export { RoamTagsInput };