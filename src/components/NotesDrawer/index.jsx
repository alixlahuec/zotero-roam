import React, { useContext, useMemo } from "react";
import { arrayOf, bool, func, object, string } from "prop-types";
import { Card, Drawer } from "@blueprintjs/core";

import { UserSettings } from "../App";
import { formatZoteroNotes } from "../../utils";
import "./index.css";

const NotesDrawer = React.memo(function NotesDrawer(props){
	const { isOpen, notes, onClose, title } = props;
	const { notes: notesSettings } = useContext(UserSettings);

	const cleanNotes = useMemo(() => {
		return formatZoteroNotes(notes, notesSettings);
	}, [notes, notesSettings]);

	return (
		<Drawer
			canEscapeKeyClose={false}
			canOutsideClickClose={true}
			className="zr-drawer--notes"
			isOpen={isOpen}
			lazy={false}
			onClose={onClose}
			size="40%"
			title={title} >
			{cleanNotes.map((n, i) => <Card key={i} className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>{n}</Card>)}
		</Drawer>
	);
});
NotesDrawer.propTypes = {
	isOpen: bool,
	notes: arrayOf(object),
	onClose: func,
	title: string
};

export default NotesDrawer;
