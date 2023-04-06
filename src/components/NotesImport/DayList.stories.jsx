import { useCallback, useState } from "react";
import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";

import DayList from "Components/NotesImport/DayList";
import { ListWrapper } from "Components/DataList";

import { sampleNote, sampleOlderNote } from "Mocks";


export default {
	component: DayList,
	args: {
		date: "April 6th, 2022",
		notes: [sampleOlderNote, sampleNote]
	}
};

const Template = (args) => {
	const [selectedKeys, setSelectedKeys] = useState(() => args.selectedKeys || []);
	const bulkCheck = useCallback(() => setSelectedKeys(args.notes.map(nt => nt.data.key)), [args.notes]);
	const bulkUncheck = useCallback(() => setSelectedKeys([]), []);

	const toggleNoteSelection = useCallback((key) => {
		if(!selectedKeys.includes(key)){
			setSelectedKeys([...selectedKeys, key]);
		} else {
			setSelectedKeys(selectedKeys.filter(k => k != key));
		}
	}, [selectedKeys]);

	return <ListWrapper>
		<DayList {...args} itemSelectProps={{ bulkCheck, bulkUncheck, toggleNoteSelection }} selectedKeys={selectedKeys} />
	</ListWrapper>;
};

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ args, canvasElement }) => {
	const canvas = within(canvasElement);

	await expect(canvas.getAllByRole("checkbox").every(box => !box.checked)).toBe(true);

	const dayCheckbox = canvas.getByRole("checkbox", { name: args.date });

	await userEvent.click(dayCheckbox);

	await expect(canvas.getAllByRole("checkbox").every(box => box.checked)).toBe(true);

	await userEvent.click(dayCheckbox);

	await expect(canvas.getAllByRole("checkbox").every(box => !box.checked)).toBe(true);
};