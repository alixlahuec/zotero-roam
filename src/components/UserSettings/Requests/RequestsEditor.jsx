import { any, arrayOf, func, number, shape } from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Classes, ControlGroup, FormGroup, H6, InputGroup, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import ErrorCallout from "Components/Errors/ErrorCallout";

import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "Components/Dashboard/Explorer/QueryBuilder/utils";
import { analyzeUserRequests } from "../../../setup";

import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";

import "./index.css";


const popoverProps = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom-right",
	popoverClassName: CustomClasses.POPOVER,
	targetProps: {
		title: "Select the type of library you want to use"
	}
};

function renderAsMenuItem(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item.value} onClick={handleClick} text={item.label} />;
}

const LIB_TYPE_OPTIONS = [
	{ label: "User library", value: "users" },
	{ label: "Group library", value: "groups" }
];

function DataRequestForm({ inputRef = null, pos, req, updateReq }){
	const { apikey, library: { type, id }, name } = req;

	const changeHandlers = useMemo(() => {
		function updateTextProp(prop, event){
			updateReq({
				...req,
				[prop]: event.target.value
			});
		}

		function updateLibraryParams(op, val){
			updateReq({
				...req,
				library: {
					...req.library,
					[op]: val
				}
			});
		}

		return {
			updateAPIKey: (event) => updateTextProp("apikey", event),
			updateLibraryType: (item) => updateLibraryParams("type", item.value),
			updateLibraryID: (event) => updateLibraryParams("id", event.target.value),
			updateName: (event) => updateTextProp("name", event)
		};
	}, [req, updateReq]);
    
	return <>
		<FormGroup label="Library" labelFor={"req-library" + pos}>
			<ControlGroup>
				<Select
					filterable={false}
					itemRenderer={renderAsMenuItem}
					items={LIB_TYPE_OPTIONS}
					onItemSelect={changeHandlers.updateLibraryType} 
					popoverProps={popoverProps} >
					<Button 
						active={true}
						className={CustomClasses.TEXT_SMALL} 
						icon={type == "users" ? "user" : "people"}
						intent="primary"
						minimal={true}
						rightIcon="caret-down"
						text={type} />
				</Select>
				<InputGroup className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")} id={"req-library" + pos} inputRef={inputRef} onChange={changeHandlers.updateLibraryID} placeholder="e.g, 123456" value={id} />
			</ControlGroup>
		</FormGroup>
		<FormGroup label="API Key" labelFor={"req-apikey" + pos}>
			<InputGroup className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")} id={"req-apikey" + pos} onChange={changeHandlers.updateAPIKey} placeholder="Zotero API key" value={apikey} />
		</FormGroup>
		<FormGroup label="Name" labelFor={"req-name" + pos}>
			<InputGroup className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")} id={"req-name" + pos} onChange={changeHandlers.updateName} placeholder="Nickname (optional)" value={name} />
		</FormGroup>
	</>;
}
DataRequestForm.propTypes = {
	inputRef: any,
	pos: number,
	req: customPropTypes.dataRequestType,
	updateReq: func
};

const defaultReq = {
	apikey: "",
	library: {
		type: "users",
		id: ""
	},
	name: ""
};

function NewRequest({ addReq, inputRef }){
	const [req, updateReq] = useState(defaultReq);

	const addToReqList = useCallback(() => {
		addReq(req);
		updateReq(defaultReq);
	}, [addReq, req]);

	return <div className="zr-data-request new">
		<ControlGroup>
			<DataRequestForm inputRef={inputRef} pos="new" req={req} updateReq={updateReq} />
			<Button className={[CustomClasses.TEXT_SMALL, Classes.FIXED]} intent="success" minimal={true} onClick={addToReqList} text="Add" title="Add the request" />
		</ControlGroup>
	</div>;
}
NewRequest.propTypes = {
	addReq: func,
	inputRef: any
};

function ExistingRequest({ handlers, pos, req }){
	const { removeReq, updateReq } = handlers;

	return <div className="zr-data-request existing" >
		<ControlGroup>
			<DataRequestForm pos={pos} req={req} updateReq={updateReq} />
			<Button className={Classes.FIXED} icon="remove" intent="danger" minimal={true} onClick={removeReq} title="Remove the request" />
		</ControlGroup>
	</div>;
}
ExistingRequest.propTypes = {
	handlers: shape({
		removeReq: func,
		updateReq: func
	}),
	pos: number,
	req: customPropTypes.dataRequestType
};

function RequestsEditor({ closeDialog, dataRequests = [], updateRequests }){
	const [reqList, setReqList] = useState(dataRequests);
	const [validationError, setValidationError] = useState(null);
	const newReqField = useRef();

	useEffect(() => {
		setValidationError(null);
	}, [reqList]);

	useEffect(() => {
		newReqField?.current?.focus();
	}, []);

	const addReq = useCallback((val) => {
		setReqList((prevState) => addElemToArray(
			prevState, 
			val
		));
	}, []);

	const makeHandlersForReq = useCallback((ind) => {
		return {
			removeReq: () => setReqList((prevState) => removeArrayElemAt(prevState, ind)),
			updateReq: (val) => setReqList((prevState) => updateArrayElemAt(prevState, ind, val))
		};
	}, []);

	const updateIfValid = useCallback(() => {
		try {
			const reqs = analyzeUserRequests(reqList);
			updateRequests(reqs);
			closeDialog();
		} catch(e){
			setValidationError(e);
		}
	}, [closeDialog, reqList, updateRequests]);

	return <>
		<div className={Classes.DIALOG_BODY}>
			{reqList.map((req, i) => <ExistingRequest key={i} pos={i} req={req} handlers={makeHandlersForReq(i)} />)}
			<H6>Add a new request</H6>
			<NewRequest addReq={addReq} inputRef={newReqField} />
			{validationError && <ErrorCallout error={validationError} />}
		</div>
		<div className={Classes.DIALOG_FOOTER}>
			<div className={Classes.DIALOG_FOOTER_ACTIONS}>
				<Button minimal={true} onClick={closeDialog} text="Cancel" />
				<Button intent="primary" minimal={true} onClick={updateIfValid} text="OK" />
			</div>
		</div>
	</>;
}
RequestsEditor.propTypes = {
	closeDialog: func,
	dataRequests: arrayOf(customPropTypes.dataRequestType),
	updateRequests: func
};

export default RequestsEditor;