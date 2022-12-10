import { Classes } from "@blueprintjs/core";

import NotesImportItem from "Components/NotesImport/Item";
import useBool from "../../../hooks/useBool";

import { sampleNote } from "Mocks/zotero/notes";
import { sampleAnnot } from "Mocks/zotero/annotations";


export default {
	component: NotesImportItem
};

const Template = (args) => {
	const [isSelected, { toggle }] = useBool(args.isSelected || false);

	return <ul className={Classes.LIST_UNSTYLED}>
		<NotesImportItem {...args} isSelected={isSelected} onToggle={toggle} />
	</ul>;
};

export const Annotation = Template.bind({});
Annotation.args = {
	note: sampleAnnot
};

export const Note = Template.bind({});
Note.args = {
	note: sampleNote
};