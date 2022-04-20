import React, { useContext } from "react";
import { Classes, H3 } from "@blueprintjs/core";

import { UserSettings } from "../../App";

function Typemap(){
	const { typemap } = useContext(UserSettings);

	return <>
		<H3>Typemap</H3>
		<div zr-role="settings-typemap">
			{Object.keys(typemap).map(itemType => {
				return <div zr-role="settings-row" key={itemType}>
					<span className="zr-auxiliary">{itemType}</span>
					<div>
						<input className={Classes.INPUT} disabled={true} value={typemap[itemType]} />
					</div>
				</div>;
			})}
		</div>
	</>;
}

export default Typemap;