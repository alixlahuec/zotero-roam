import { memo, useCallback, useState } from "react";
import { MenuItem, TagInputProps } from "@blueprintjs/core";
import { IListItemsProps, MultiSelect, MultiSelectProps } from "@blueprintjs/select";

import { getAllPages } from "Roam";
import { searchEngine } from "../../utils";

import { CustomClasses } from "../../constants";


const MAX_RESULTS = 30;

const popoverProps = {
	canEscapeKeyClose: false,
	className: "zr-input-tags",
	fill: true,
	matchTargetWidth: true,
	minimal: true,
	popoverClassName: CustomClasses.POPOVER
};

const tagInputProps: Partial<TagInputProps> = {
	inputProps: {
		"aria-label": "Add tags from Roam",
		placeholder: "Add tag",
		title: "Add tags from Roam"
	},
	leftIcon: "tag",
	tagProps: {
		minimal: true
	}
};

type Tag = string;

type ListProps = IListItemsProps<Tag>;

const createNewItemFromQuery: ListProps["createNewItemFromQuery"] = (tag) => tag;

const createNewItemRenderer: ListProps["createNewItemRenderer"] = (query, active, handleClick) => {
	return <MenuItem aria-selected={active} htmlTitle={"Add tag, " + `'${query}'`} icon="small-plus" onClick={handleClick} text={query} />;
};

const itemRenderer: ListProps["itemRenderer"] = (item, itemProps) => {
	const { handleClick, modifiers: { active } } = itemProps;
	return <MenuItem aria-selected={active} key={item} onClick={handleClick} text={item} />;
};

const itemListPredicate: ListProps["itemListPredicate"] = (query, items) => {
	return items.filter(item => searchEngine(
		query,
		item, {
			any_case: true,
			match: "partial",
			search_compounds: true,
			word_order: "loose"
		}))
		.sort((a, b) => a.length < b.length ? -1 : 1)
		.slice(0, MAX_RESULTS);
};

const tagRenderer = (tag: Tag) => tag;


type OwnProps = {
	onRemove: (val: Tag) => void,
	onSelect: (val: Tag) => void,
	selectedTags: Tag[]
};
const TagsSelector = memo<OwnProps & Partial<MultiSelectProps<Tag>>>(function TagsSelector(props) {
	const { selectedTags, onRemove, onSelect, ...extraProps } = props;
	const [roamPages,] = useState(() => getAllPages()); // https://tkdodo.eu/blog/things-to-know-about-use-state

	const addTag = useCallback<ListProps["onItemSelect"]>((tag, _event) => {
		onSelect(tag);
	}, [onSelect]);

	const removeTag = useCallback<NonNullable<MultiSelectProps<Tag>["onRemove"]>>((tag, _index) => {
		onRemove(tag);
	}, [onRemove]);

	return (
		<MultiSelect
			createNewItemFromQuery={createNewItemFromQuery}
			createNewItemPosition="first"
			createNewItemRenderer={createNewItemRenderer}
			fill={true}
			initialContent={null}
			itemListPredicate={itemListPredicate}
			itemRenderer={itemRenderer}
			items={roamPages}
			onItemSelect={addTag}
			onRemove={removeTag}
			openOnKeyDown={true}
			placeholder="Add tags from Roam"
			popoverProps={popoverProps}
			resetOnQuery={true}
			resetOnSelect={true}
			selectedItems={selectedTags}
			tagInputProps={tagInputProps}
			tagRenderer={tagRenderer}
			{...extraProps}
		/>
	);
});

export { TagsSelector };
