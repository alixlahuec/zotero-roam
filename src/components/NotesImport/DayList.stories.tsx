import { ComponentProps, useCallback, useState } from "react";
import { userEvent, within, expect } from "@storybook/test";

import { Meta, StoryObj } from "@storybook/react";

import DayList from "Components/NotesImport/DayList";
import { ListWrapper } from "Components/DataList";

import { sampleNote, sampleOlderNote } from "Mocks";


type Props = ComponentProps<typeof DayList>;

export default {
	component: DayList,
	args: {
		date: "April 6th, 2022",
		notes: [sampleOlderNote, sampleNote]
	},
	decorators: [
		(Story, context) => {
			const [selectedKeys, setSelectedKeys] = useState(() => context.args.selectedKeys || []);
			const bulkCheck = useCallback(
				() => setSelectedKeys(context.args.notes.map((nt) => nt.data.key)),
				[context.args.notes]
			);
			const bulkUncheck = useCallback(() => setSelectedKeys([]), []);

			const toggleNoteSelection = useCallback(
				(key) => {
					if (!selectedKeys.includes(key)) {
						setSelectedKeys([...selectedKeys, key]);
					} else {
						setSelectedKeys(selectedKeys.filter((k) => k != key));
					}
				},
				[selectedKeys]
			);

			return (
				<ListWrapper>
					<Story {...context}
						args={{
							...context.args,
							itemSelectProps: { bulkCheck, bulkUncheck, toggleNoteSelection },
							selectedKeys
						}} />
				</ListWrapper>
			);
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(
			canvas.getAllByRole<HTMLInputElement>("checkbox").every((box) => !box.checked)
		).toBe(true);

		const dayCheckbox = canvas.getByRole("checkbox", { name: args.date });

		await userEvent.click(dayCheckbox);

		await expect(
			canvas.getAllByRole<HTMLInputElement>("checkbox").every((box) => box.checked)
		).toBe(true);

		await userEvent.click(dayCheckbox);

		await expect(
			canvas.getAllByRole<HTMLInputElement>("checkbox").every((box) => !box.checked)
		).toBe(true);
	}
};
