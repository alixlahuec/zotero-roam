import { useCallback, useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";


import { TagsSelector } from ".";


type Props = ComponentProps<typeof TagsSelector>;

export default {
	component: TagsSelector,
	args: {
		selectedTags: ["history", "12th century"]
	},
	decorators: [
		(Story, context) => {
			const { args } = context;
			const [tags, setTags] = useState(args.selectedTags || []);
			const addTag = useCallback((tag) => setTags((prev) => Array.from(new Set([...prev, tag]))), []);
			const removeTag = useCallback((tag) => setTags((prev) => prev.filter((it) => it != tag)), []);

			return <Story {...context} args={{ ...context.args, onRemove: removeTag, onSelect: addTag, selectedTags: tags }} />;
		}
	]
} as Meta<Props>;

export const WithInteractions: StoryObj<Props> = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		await userEvent.type(canvas.getByLabelText("Add tags from Roam"), "new tag");

		const createNewTagOption = frame.getByTitle("Add tag, 'new tag'");

		await expect(createNewTagOption).toBeInTheDocument();

		await userEvent.click(createNewTagOption);
	}
};
