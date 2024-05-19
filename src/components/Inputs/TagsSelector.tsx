import { memo, useCallback, useState } from "react";
import { MenuItem } from "@blueprintjs/core";
import { MultiSelect, MultiSelectProps } from "@blueprintjs/select";

import { getAllPages } from "@services/roam";
import { searchEngine } from "../../utils";
import { CustomClasses } from "../../constants";


type Tag = string;
type SelectorProps = MultiSelectProps<Tag>;


const MAX_RESULTS = 30;

const popoverProps: SelectorProps["popoverProps"] = {
	canEscapeKeyClose: false,
	className: "zr-input-tags",
	fill: true,
	minimal: true,
	popoverClassName: CustomClasses.POPOVER
};

const tagInputProps: SelectorProps["tagInputProps"] = {
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

const staticProps: Partial<SelectorProps> & Pick<SelectorProps, "itemRenderer" | "tagRenderer"> = {

	createNewItemFromQuery: (tag) => tag,

	createNewItemRenderer: (query, active, handleClick) => (
		<MenuItem aria-selected={active} htmlTitle={"Add tag, " + `'${query}'`} icon="small-plus" onClick={handleClick} text={query} />
	),

	itemRenderer: (item, itemProps) => {
		const { handleClick, modifiers: { active } } = itemProps;
		return <MenuItem aria-selected={active} key={item} onClick={handleClick} text={item} />;
	},

	itemListPredicate: (query, items) => {
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
	},

	tagRenderer: (tag) => tag

};


type OwnProps = {
	onRemove: (val: Tag) => void,
	onSelect: (val: Tag) => void,
	selectedTags: Tag[]
};

const TagsSelector = memo<OwnProps & Partial<SelectorProps>>(
	function TagsSelector(props) {
		const { selectedTags, onRemove, onSelect, ...extraProps } = props;
		const [roamPages] = useState(() => getAllPages()); // https://tkdodo.eu/blog/things-to-know-about-use-state

		const addTag = useCallback((tag: Tag, _event) => onSelect(tag), [onSelect]);
		const removeTag = useCallback((tag: Tag, _index) => onRemove(tag), [onRemove]);

		return (
			<MultiSelect<Tag>
				className={CustomClasses.TEXT_SMALL}
				createNewItemPosition="first"
				fill={true}
				initialContent={null}
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
				{...staticProps}
				{...extraProps}
			/>
		);
	}
);

export { TagsSelector };