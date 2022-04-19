import React, { useContext } from "react";
import { Classes, H4 } from "@blueprintjs/core";

import { UserSettings } from "../../App";

function Typemap(){
	const { typemap } = useContext(UserSettings);

	return <>
		<H4>Typemap</H4>
		<div>
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