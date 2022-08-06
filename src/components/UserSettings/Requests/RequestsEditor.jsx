import React, { useCallback, useEffect, useMemo, useState } from "react";
import { arrayOf, func, number, shape } from "prop-types";

import { Button, Classes, ControlGroup, FormGroup, InputGroup, MenuItem } from "@blueprintjs/core";
import ErrorCallout from "../../Errors/ErrorCallout";
import { Select2 } from "@blueprintjs/select";

import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "../../Dashboard/Explorer/QueryBuilder/utils";
import { analyzeUserRequests } from "../../../setup";

import "./index.css";
import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";


const popoverProps = {
	canEscapeKeyClose: false,
	minimal: true,
	placement: "bottom",
	popoverClassName: CustomClasses.POPOVER
};

function renderAsMenuItem(item, itemProps) {
	const { handleClick/*, modifiers: { active }*/ } = itemProps;

	return <MenuItem key={item.value} onClick={handleClick} text={item.label} />;
}

const LIB_TYPE_OPTIONS = [
	{ label: "User library", value: "users" },
	{ label: "Group library", value: "groups" }
];

function RequestInput({ handlers, pos, req }){
	const { apikey = "", library: { type = "users", id = "" }, name = "" } = req;
	const { removeReq, updateReq } = handlers;

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
			updateLibraryType: (val) => updateLibraryParams("type", val),
			updateLibraryID: (event) => updateLibraryParams("id", event.target.value),
			updateName: (event) => updateTextProp("name", event)
		};
	}, [req, updateReq]);

	const menuProps = {
		title: "Select the type of library you want to use"
	};

	const popoverTargetProps = {
		style: { textAlign: "right" },
		title: "Select the type of library you want to use"
	};


	return <div className="zr-data-request" >
		<ControlGroup>
			<FormGroup label="Library" labelFor={"req-library" + pos}>
				<ControlGroup>
					<Select2 
						filterable={false}
						itemRenderer={renderAsMenuItem}
						items={LIB_TYPE_OPTIONS} 
						menuProps={menuProps}
						onItemSelect={changeHandlers.updateLibraryType} 
						placement="bottom-right"
						popoverProps={popoverProps}
						popoverTargetProps={popoverTargetProps} >
						<Button 
							active={true}
							className={CustomClasses.TEXT_SMALL} 
							icon={type == "users" ? "user" : "people"}
							intent="primary"
							minimal={true}
							rightIcon="caret-down"
							text={type} />
					</Select2>
					<InputGroup className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")} id={"req-library" + pos} onChange={changeHandlers.updateLibraryID} placeholder="e.g, 123456" value={id} />
				</ControlGroup>
			</FormGroup>
			<FormGroup label="API Key" labelFor={"req-apikey" + pos}>
				<InputGroup className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")} id={"req-apikey" + pos} onChange={changeHandlers.updateAPIKey} placeholder="Zotero API key" value={apikey} />
			</FormGroup>
			<FormGroup label="Name" labelFor={"req-name" + pos}>
				<InputGroup className={["zr-text-input", CustomClasses.TEXT_SMALL].join(" ")} id={"req-name" + pos} onChange={changeHandlers.updateName} placeholder="Nickname (optional)" value={name} />
			</FormGroup>
			<Button className={Classes.FIXED} icon="remove" intent="danger" minimal={true} onClick={removeReq} title="Remove the request" />
		</ControlGroup>
	</div>;
}
RequestInput.propTypes = {
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

	useEffect(() => {
		setValidationError(null);
	}, [reqList]);

	const addReq = useCallback(() => {
		setReqList((prevState) => addElemToArray(
			prevState, 
			{
				apikey: "",
				library: {
					id: "",
					type: "users"
				},
				name: ""
			}
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
			{reqList.map((req, i) => <RequestInput key={i} pos={i} req={req} handlers={makeHandlersForReq(i)} />)}
			<Button className={CustomClasses.TEXT_SMALL} intent="warning" minimal={true} onClick={addReq} rightIcon="add" text="Add request" />
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