import { ChangeEventHandler, useCallback, useEffect, useMemo, useRef } from "react";
import { Button, Classes, Dialog, InputGroup, MenuDivider, MenuItem, Tag, UL } from "@blueprintjs/core";
import { MutationStatus } from "@tanstack/react-query";

import { useModifyTags } from "@clients/zotero";
import { useBool, useText } from "@hooks";

import { ZLibrary, ZTagSuggestion } from "Types/transforms";


type CustomInputProps = {
	handleChange: ChangeEventHandler<HTMLInputElement>,
	status: MutationStatus,
	value: string
};

function CustomInput({ handleChange, status, value }: CustomInputProps){
	const inputField = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputField?.current?.focus();
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


type MergeAsCustomProps = {
	disabled: boolean,
	library: ZLibrary,
	tags: string[]
};

function MergeAsCustom({ disabled, library, tags }: MergeAsCustomProps){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);
	const [value, onValueChange] = useText("");
	const { mutate, status } = useModifyTags();

	const triggerMerge = useCallback(() => {
		mutate({
			into: value,
			library,
			tags
		}, {
			onSuccess: () => closeDialog()
		});
	}, [closeDialog, library, mutate, tags, value]);

	return (
		<>
			<MenuItem
				disabled={disabled}
				htmlTitle="Choose custom value..."
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
					<CustomInput handleChange={onValueChange} status={status} value={value} />
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button disabled={value.length == 0} loading={status == "loading"} minimal={true} onClick={triggerMerge} text="OK" title="Confirm modification of tag(s)" />
					</div>
				</div>
			</Dialog>
		</>
	);
}


type MergeAsOptionsProps = {
	library: ZLibrary,
	options: ZTagSuggestion["use"]
};

function MergeAsOptions({ library, options }: MergeAsOptionsProps) {
	const { roam = [], zotero = [] } = options;
	const tagList = useMemo(() => [...roam, ...zotero], [roam, zotero]);
	const { mutate, status } = useModifyTags();

	const disableOptions = useMemo(() => ["error", "success", "loading"].includes(status), [status]);

	const triggerMerge = useCallback((value) => {
		mutate({
			into: value,
			library,
			tags: tagList
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


export default MergeAsOptions;
