import { useCallback, useState, ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";

import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { TagsSelector } from ".";


type Props = ComponentProps<typeof TagsSelector>;

export default {
	component: TagsSelector,
	args: {
		selectedTags: ["history", "12th century"]
	}
} as Meta<Props>;

const Template: Story<Props> = (args) => {
	const [tags, setTags] = useState(args.selectedTags || []);
	const addTag = useCallback((tag) => setTags(prev => Array.from(new Set([...prev, tag]))), []);
	const removeTag = useCallback((tag) => setTags(prev => prev.filter(it => it != tag)), []);

	return <TagsSelector onRemove={removeTag} onSelect={addTag} selectedTags={tags} />;
};

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement!);

	await userEvent.type(canvas.getByLabelText("Add tags from Roam"), "new tag");

	const createNewTagOption = frame.getByTitle("Add tag, 'new tag'");

	await expect(createNewTagOption).toBeInTheDocument();

	await userEvent.click(createNewTagOption);
};