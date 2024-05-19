import { Dispatch, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Classes, ControlGroup, FormGroup, H6, InputGroup, MenuItem } from "@blueprintjs/core";
import { Select, SelectProps } from "@blueprintjs/select";
import { Placement } from "@blueprintjs/popover2";

import { ErrorCallout } from "Components/Errors";

import { ZoteroAPI } from "@clients/zotero";
import { ArrayAction, useArrayReducer } from "@hooks";

import { CustomClasses } from "../../../constants";
import { analyzeUserRequests } from "../../../setup";
import { DataRequest, UserDataRequest, UserRequests } from "Types/extension";
import "./_index.sass";


type LibraryOption = { label: string, value: ZoteroAPI.LibraryTypeURI };

type LibrarySelectorProps = SelectProps<LibraryOption>;

const librarySelectStaticProps: Partial<LibrarySelectorProps> & Pick<LibrarySelectorProps, "itemRenderer"> = {
	itemRenderer: (item, itemProps) => {
		const { handleClick/*, modifiers: { active }*/ } = itemProps;

		return <MenuItem key={item.value} onClick={handleClick} text={item.label} />;
	},
	popoverProps: {
		canEscapeKeyClose: false,
		minimal: true,
		placement: "bottom-right" as Placement,
		popoverClassName: CustomClasses.POPOVER,
		targetProps: {
			title: "Select the type of library you want to use"
		}
	}
};

const LIB_TYPE_OPTIONS: LibraryOption[] = [
	{ label: "User library", value: "users" },
	{ label: "Group library", value: "groups" }
];


type DataRequestFormProps = {
	inputRef?: RefObject<HTMLInputElement>,
	pos: number | "new",
	req: UserDataRequest,
	updateReq: (value: UserDataRequest) => void
};

function DataRequestForm({ inputRef = undefined, pos, req, updateReq }: DataRequestFormProps){
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
					items={LIB_TYPE_OPTIONS}
					onItemSelect={changeHandlers.updateLibraryType} 
					{...librarySelectStaticProps} >
					<Button 
						active={true}
						className={CustomClasses.TEXT_SMALL} 
						icon={type == "users" ? "user" : "people"}
						intent="primary"
						minimal={true}
						rightIcon="caret-down"
						text={type} />
				</Select>
				<InputGroup className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT, CustomClasses.TEXT_SMALL].join(" ")} id={"req-library" + pos} inputRef={inputRef} onChange={changeHandlers.updateLibraryID} placeholder="e.g, 123456" value={id} />
			</ControlGroup>
		</FormGroup>
		<FormGroup label="API Key" labelFor={"req-apikey" + pos}>
			<InputGroup className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT, CustomClasses.TEXT_SMALL].join(" ")} id={"req-apikey" + pos} onChange={changeHandlers.updateAPIKey} placeholder="Zotero API key" value={apikey} />
		</FormGroup>
		<FormGroup label="Name" labelFor={"req-name" + pos}>
			<InputGroup className={[CustomClasses.INPUT_BOX, CustomClasses.INPUT_TEXT, CustomClasses.TEXT_SMALL].join(" ")} id={"req-name" + pos} onChange={changeHandlers.updateName} placeholder="Nickname (optional)" value={name} />
		</FormGroup>
	</>;
}


const DEFAULT_REQ: UserDataRequest = {
	apikey: "",
	library: {
		type: "users",
		id: ""
	},
	name: ""
};

type NewRequestProps = {
	dispatch: Dispatch<ArrayAction<UserDataRequest>>,
	inputRef?: RefObject<HTMLInputElement>
};

function NewRequest({ dispatch, inputRef }: NewRequestProps){
	const [req, updateReq] = useState(DEFAULT_REQ);

	const addToReqList = useCallback(() => {
		dispatch({ type: "add", value: req });
		updateReq(DEFAULT_REQ);
	}, [dispatch, req]);

	return <div className="zr-data-request new">
		<ControlGroup>
			<DataRequestForm inputRef={inputRef} pos="new" req={req} updateReq={updateReq} />
			<Button className={[CustomClasses.TEXT_SMALL, Classes.FIXED].join(" ")} intent="success" minimal={true} onClick={addToReqList} text="Add" title="Add the request" />
		</ControlGroup>
	</div>;
}


type RequestAction =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: UserDataRequest };

type ExistingRequestProps = {
	dispatch: Dispatch<RequestAction>,
	pos: number,
	req: UserDataRequest
};

function ExistingRequest({ dispatch, pos, req }: ExistingRequestProps) {
	return <div className="zr-data-request existing" >
		<ControlGroup>
			<DataRequestForm pos={pos} req={req}
				updateReq={(value) => dispatch({ type: "updateSelf", value })} />
			<Button className={Classes.FIXED}
				icon="remove"
				intent="danger"
				minimal={true}
				onClick={() => dispatch({ type: "removeSelf" })}
				title="Remove the request" />
		</ControlGroup>
	</div>;
}


type RequestsEditorProps = {
	closeDialog: () => void,
	dataRequests: DataRequest[],
	updateRequests: (value: UserRequests) => void
};

function RequestsEditor({ closeDialog, dataRequests = [], updateRequests }: RequestsEditorProps) {
	const [reqList, dispatch] = useArrayReducer<DataRequest | UserDataRequest>(dataRequests);
	const [validationError, setValidationError] = useState(null);
	const newReqField = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setValidationError(null);
	}, [reqList]);

	useEffect(() => {
		newReqField?.current?.focus();
	}, []);

	const requestDispatch = useCallback((index, action) => {
		switch (action.type) {
		case "removeSelf":
			return dispatch({ type: "remove", index });
		case "updateSelf":
			return dispatch({ type: "update", index, value: action.value });
		default:
			return;
		}
	}, [dispatch]);

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
			{reqList.map((req, i) => <ExistingRequest key={i} pos={i} req={req} dispatch={(action) => requestDispatch(i, action)} />)}
			<H6>Add a new request</H6>
			<NewRequest dispatch={dispatch} inputRef={newReqField} />
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


export default RequestsEditor;