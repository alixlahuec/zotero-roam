import { Tag } from "@blueprintjs/core";

import "./_index.sass";


type OwnProps = {
	action: string,
	text: string
};

const ShortcutSequence = ({ action, text }: OwnProps) => <Tag className="zr-shortcut-sequence" htmlTitle={"Press " + text + " to " + action} minimal={true}>{text}</Tag>;

export default ShortcutSequence;
