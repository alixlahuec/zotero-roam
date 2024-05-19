import { memo, useMemo } from "react";
import { Button, Classes, Collapse, Tag } from "@blueprintjs/core";

import { ListItem } from "Components/DataList";

import { ZoteroRoamLog } from "../../../api/logging";
import { useBool } from "@hooks";

import { CustomClasses } from "../../../constants";
import { makeTimestamp } from "../../../utils";
import "./_index.sass";


type OwnProps = {
	log: ZoteroRoamLog
};

const LogEntry = memo<OwnProps>(function LogEntry({ log }){
	const [isContextOpen, { toggle: toggleContext }] = useBool(false);
	const hasContext = useMemo(() => JSON.stringify(log.context || {}) != "{}", [log.context]);

	return <ListItem className="zr-logger--entry" data-log-level={log.level}>
		<div className="zr-log--header">
			<div className={["zr-log--metadata", Classes.MONOSPACE_TEXT].join(" ")}>
				<span className="zr-log--timestamp">{makeTimestamp(log.timestamp)}</span>
				<Tag className="zr-log--level" intent={log.intent} minimal={true} >
					{log.level}
				</Tag>
				<Tag minimal={true}>{log.origin}</Tag>
			</div>
			<div className={["zr-log--summary", CustomClasses.TEXT_SMALL].join(" ")}>
				<div>
					<span className={Classes.MONOSPACE_TEXT}>{log.message}</span>
					{log.detail && <span className={[Classes.MONOSPACE_TEXT, CustomClasses.TEXT_SECONDARY, CustomClasses.TEXT_SMALL].join(" ")}>{log.detail}</span>}
				</div>
				{hasContext && <Button className={CustomClasses.TEXT_SECONDARY} rightIcon={isContextOpen ? "chevron-up" : "chevron-down"} minimal={true} onClick={toggleContext} small={true} text={isContextOpen ? "Hide" : "View"} title="Show details" />}
			</div>
		</div>
		<div className="zr-log--details">
			{hasContext && <Collapse isOpen={isContextOpen}>
				<pre className={[Classes.CODE_BLOCK, CustomClasses.TEXT_AUXILIARY].join(" ")}>{JSON.stringify(log.context, null, "  ")}</pre>
			</Collapse>}
		</div>
	</ListItem>;
});

export default LogEntry;