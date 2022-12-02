import { memo, useMemo } from "react";

import { Button, Classes, Collapse, Tag } from "@blueprintjs/core";

import { makeTimestamp } from "../../../../src/utils";
import useBool from "../../../../src/hooks/useBool";
import { ListItem } from "Components/DataList";

import * as customPropTypes from "../../../propTypes";
import "./index.css";


const LEVELS_MAPPING = {
	"error": "danger",
	"info": "primary",
	"warning": "warning"
};

const LogEntry = memo(function LogEntry({ log }){
	const [isContextOpen, { toggle: toggleContext }] = useBool(false);
	const hasContext = useMemo(() => JSON.stringify(log.context || {}) != "{}", [log.context]);

	return <ListItem className="zr-logger--entry" data-log-level={log.level}>
		<div className="zr-log--header">
			<div className={["zr-log--metadata", Classes.MONOSPACE_TEXT].join(" ")}>
				<span className="zr-log--timestamp">{makeTimestamp(log.timestamp)}</span>
				<Tag className="zr-log--level" intent={LEVELS_MAPPING[log.level]} minimal={true} >
					{log.level}
				</Tag>
				<Tag minimal={true}>{log.origin}</Tag>
			</div>
			<div className={["zr-log--summary", "zr-text-small"].join(" ")}>
				<span className={Classes.MONOSPACE_TEXT}>{log.message}</span>
				{hasContext && <Button className="zr-secondary" rightIcon={isContextOpen ? "chevron-up" : "chevron-down"} minimal={true} onClick={toggleContext} small={true} text={isContextOpen ? "Hide" : "View"} title="Show details" />}
			</div>
		</div>
		<div className="zr-log--details">
			{hasContext && <Collapse isOpen={isContextOpen}>
				<pre className={Classes.CODE_BLOCK}>{JSON.stringify(log.context, null, "  ")}</pre>
			</Collapse>}
		</div>
	</ListItem>;
});
LogEntry.propTypes = {
	log: customPropTypes.logEntry
};

export default LogEntry;