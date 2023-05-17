import { useCallback, useMemo } from "react";
import { Checkbox, Classes, H6 } from "@blueprintjs/core";
import NotesImportItem from "Components/NotesImport/Item";

import { ZItemAnnotation, ZItemNote } from "Types/transforms";


export type DayListProps = {
	date: string,
	itemSelectProps: {
		bulkCheck: (value: string[]) => void,
		bulkUncheck: (value: string[]) => void,
		toggleNoteSelection: (value: string) => void
	},
	notes: (ZItemAnnotation | ZItemNote)[],
	selectedKeys: string[]
};

function DayList({ date, itemSelectProps, notes, selectedKeys }: DayListProps) {
	const { bulkCheck, bulkUncheck, toggleNoteSelection } = itemSelectProps;
	const is_day_checked = useMemo(() => notes.every(nt => selectedKeys.includes(nt.data.key)), [notes, selectedKeys]);
	const has_single_child = notes.length == 1;
	const sorted_notes = useMemo(() => notes.sort((a,b) => new Date(a.data.dateAdded) > new Date(b.data.dateAdded) ? -1 : 1), [notes]);

	const handleCheckUncheck = useCallback(() => {
		const notesKeys = notes.map(nt => nt.data.key);

		if (is_day_checked) {
			bulkUncheck(notesKeys);
		} else {
			bulkCheck(notesKeys);
		}
	}, [is_day_checked, bulkCheck, bulkUncheck, notes]);

	return <li className="zr-notesimport-daylist">
		<Checkbox
			checked={is_day_checked}
			className="zr-notesimport-day"
			inline={false}
			labelElement={<H6>{date}</H6>}
			onChange={handleCheckUncheck} />
		<div>
			<ul className={Classes.LIST_UNSTYLED}>
				{sorted_notes.map(nt => <NotesImportItem key={nt.data.key} isSelected={selectedKeys.includes(nt.data.key)} isSingleChild={has_single_child} note={nt} onToggle={toggleNoteSelection} />)}
			</ul>
		</div>
	</li>;
}


export default DayList;