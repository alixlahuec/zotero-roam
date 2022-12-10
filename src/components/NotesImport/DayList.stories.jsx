import { useCallback, useState } from "react";
import DayList from "Components/NotesImport/DayList";
import { ListWrapper } from "Components/DataList";
import { sampleNote, sampleOlderNote } from "Mocks/zotero/notes";


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