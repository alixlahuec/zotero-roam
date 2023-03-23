import { arrayOf, func, string , shape } from "prop-types";
import { useCallback , useMemo } from "react";

import { Button, Classes, Tag } from "@blueprintjs/core";

import { ListWrapper, Toolbar } from "Components/DataList";
import { ErrorBoundary } from "Components/Errors";
import { useAnnotationsSettings, useNotesSettings } from "Components/UserSettings";
import DayList from "./DayList";

import { importItemNotes } from "Roam";
import { makeDNP } from "../../../src/utils";
import { useMulti } from "../../../src/hooks";

import { CustomClasses } from "../../../src/constants";
import * as customPropTypes from "../../propTypes";
import "./index.css";


function NotesList({ notes, selectedKeys, selectProps }){
	const { setSelectedKeys, toggleNoteSelection } = selectProps;
	const grouped_notes = useMemo(() => {
		const day_dict = notes
			.sort((a, b) => new Date(a.data.dateAdded) > new Date(b.data.dateAdded) ? -1 : 1)
			.reduce((dict, elem) => {
				const ymd = new Date(elem.data.dateAdded).toLocaleDateString("en-CA");
				if (dict[ymd]) {
					dict[ymd].push(elem);
				} else {
					dict[ymd] = [elem];
				}
				return dict;
			}, {});
		return Object.keys(day_dict)
			.sort((a, b) => new Date(a.split("-")) > new Date(b.split("-")) ? -1 : 1)
			.map(date => ({
				date: makeDNP(date, { brackets: false }),
				notes: day_dict[date]
			}));
	}, [notes]);

	const bulkCheck = useCallback((keys) => {
		const toAdd = keys.filter(k => !selectedKeys.includes(k));
		setSelectedKeys([...selectedKeys, ...toAdd]);
	}, [selectedKeys, setSelectedKeys]);

	const bulkUncheck = useCallback((keys) => {
		setSelectedKeys(selectedKeys.filter(k => !keys.includes(k)));
	}, [selectedKeys, setSelectedKeys]);

	const itemSelectProps = useMemo(() => ({
		bulkCheck,
		bulkUncheck,
		toggleNoteSelection
	}), [bulkCheck, bulkUncheck, toggleNoteSelection]);

	return <ListWrapper>
		{grouped_notes.map(entry => <DayList key={entry.date} date={entry.date} notes={entry.notes} itemSelectProps={itemSelectProps} selectedKeys={selectedKeys} />)}
	</ListWrapper>;
}
NotesList.propTypes = {
	notes: arrayOf(customPropTypes.zoteroItemType),
	selectedKeys: arrayOf(string),
	selectProps: shape({
		setSelectedKeys: func,
		toggleNoteSelection: func
	})
};

function NotesImport({ closeDialog, item, notes, pageUID }){
	const [annotationsSettings] = useAnnotationsSettings();
	const [notesSettings] = useNotesSettings();

	const [selectedKeys, { set, toggle }] = useMulti({
		start: () => notes.map(nt => nt.data.key)
	});

	const handleToggleAll = useCallback(() => {
		if(selectedKeys.length == 0){
			set(notes.map(nt => nt.data.key));
		} else {
			set([]);
		}
	}, [notes, selectedKeys, set]);

	const triggerImport = useCallback(async() => {
		const selectedNotes = notes.filter(nt => selectedKeys.includes(nt.data.key));
		try {
			await importItemNotes({ item, notes: selectedNotes }, pageUID, notesSettings, annotationsSettings);
			closeDialog();
		} catch(e){
			//
		}
	}, [annotationsSettings, closeDialog, item, notes, notesSettings, pageUID, selectedKeys]);

	const selectProps = useMemo(() => ({
		setSelectedKeys: set,
		toggleNoteSelection: toggle
	}), [set, toggle]);

	return <div className={Classes.DIALOG_BODY} >
		<ErrorBoundary>
			<Toolbar>
				<Button className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_SECONDARY].join(" ")} minimal={true} onClick={handleToggleAll} >
					{selectedKeys.length == 0 ? "Select all" : "Unselect all"}
				</Button>
				<Button active={true} disabled={selectedKeys.length == 0} intent="success" minimal={true} onClick={triggerImport} rightIcon={<Tag intent="success">{selectedKeys.length}</Tag>} text="Import notes" />
			</Toolbar>
			<div className="zr-notesimport--datalist">
				<NotesList notes={notes} selectedKeys={selectedKeys} selectProps={selectProps} />
			</div>
		</ErrorBoundary>
	</div>;
}
NotesImport.propTypes = {
	closeDialog: func,
	item: customPropTypes.zoteroItemType,
	notes: arrayOf(customPropTypes.zoteroItemType),
	pageUID: string
};

export default NotesImport;