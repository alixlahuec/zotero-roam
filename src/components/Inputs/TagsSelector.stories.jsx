import { useCallback, useState } from "react";
import TagsSelector from "./TagsSelector";

import { userEvent, waitFor, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";


export default {
	component: TagsSelector,
	args: {
		selectedTags: ["history", "12th century"]
	}
};

const Template = (args) => {
	const [tags, setTags] = useState(args.selectedTags || []);
	const addTag = useCallback((tag) => setTags(prev => Array.from(new Set([...prev, tag]))), []);
	const removeTag = useCallback((tag) => setTags(prev => prev.filter(it => it != tag)), []);

	return <TagsSelector onRemove={removeTag} onSelect={addTag} selectedTags={tags} />;
};

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement);

	await userEvent.type(canvas.getByLabelText("Add tags from Roam"), "new tag");

	await waitFor(() => expect(
		frame.getAllByRole("menuitem").length
	).toBe(1));

	const createNewTagOption = frame.getByRole("menuitem");

	await expect(createNewTagOption.text).toBe("new tag");

	await userEvent.click(createNewTagOption);
};