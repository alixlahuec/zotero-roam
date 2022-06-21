import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayOf, bool, func, shape, string } from "prop-types";
import { Button, Classes, Dialog, InputGroup, MenuDivider, MenuItem, Tag, UL } from "@blueprintjs/core";

import { useModifyTags } from "../../../api/write";

import * as customPropTypes from "../../../propTypes";

function CustomInput({ handleChange, status, value }){
	const inputField = useRef();

	useEffect(() => {
		inputField.current.focus();
	}, []);

	return <InputGroup
		disabled={status == "loading"}
		fill={true}
		inputRef={inputField}
		onChange={handleChange}
		placeholder="Enter a value"
		value={value}
	/>;
}
CustomInput.propTypes = {
	handleChange: func,
	status: string,
	value: string
};

function MergeAsCustom({ disabled, library, tags }){
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [value, setValue] = useState("");
	const { mutate, status } = useModifyTags();

	const openDialog = useCallback(() => setDialogOpen(true), []);
	const closeDialog = useCallback(() => setDialogOpen(false), []);

	const handleChange = useCallback((event) => {
		setValue(event.target.value);
	}, []);

	const triggerMerge = useCallback(() => {
		mutate({
			into: value,
			library,
			tags
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables),
			onSuccess: (_data, _variables, _context) => closeDialog()
		});
	}, [closeDialog, library, mutate, tags, value]);

	return (
		<>
			<MenuItem
				disabled={disabled}
				intent="primary"
				multiline={true}
				onClick={openDialog}
				shouldDismissPopover={false}
				text="Choose custom value..."
			/>
			<Dialog
				isOpen={isDialogOpen}
				lazy={true}
				onClose={closeDialog} >
				<div className={Classes.DIALOG_BODY}>
					The following tags will be merged :
					<UL>
						{tags.map(el => <li key={el}>{el}</li>)}
					</UL>
					<CustomInput handleChange={handleChange} status={status} value={value} />
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button disabled={value.length == 0} loading={status == "loading"} onClick={triggerMerge} text="OK" />
					</div>
				</div>
			</Dialog>
		</>
	);
}
MergeAsCustom.propTypes ={
	disabled: bool,
	library: customPropTypes.zoteroLibraryType,
	tags: arrayOf(string)
};

function MergeAsOptions({ library, options }) {
	const { roam = [], zotero = [] } = options;
	const tagList = useMemo(() => [...roam, ...zotero], [roam, zotero]);
	const { mutate, status } = useModifyTags();

	const disableOptions = useMemo(() => ["error", "success", "loading"].includes(status), [status]);

	const triggerMerge = useCallback((value) => {
		mutate({
			into: value,
			library,
			tags: tagList
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables)
		});
	}, [library, mutate, tagList]);

	return (
		<>
			{roam.map(el => (
				<MenuItem key={el} 
					disabled={disableOptions}
					labelElement={<Tag intent="success" minimal={true}>In Roam</Tag>}
					multiline={true}
					onClick={() => triggerMerge(el)}
					text={el} 
				/>))}
			{zotero.map(el => (
				<MenuItem key={el}
					disabled={disableOptions}
					multiline={true}
					onClick={() => triggerMerge(el)}
					text={el} 
				/>))}
			<MenuDivider />
			<MergeAsCustom disabled={["error", "success", "loading"].includes(status)} library={library} tags={tagList} />
		</>
	);
}
MergeAsOptions.propTypes = {
	library: customPropTypes.zoteroLibraryType,
	options: shape({
		roam: arrayOf(string),
		zotero: arrayOf(string)
	})
};

export default MergeAsOptions;
