import React from "react";
import { number, shape } from "prop-types";
import { ProgressBar } from "@blueprintjs/core";

const Stats = React.memo(function Stats({ stats }){
	if(!stats){
		return null;
	} else {
		const { nTags, nRoam, nAuto, nTotal} = stats;
		return (
			<div className={["zr-auxiliary", "zr-text-small"].join(" ")} zr-role="list-stats" >
				<span>
					Zotero has {nTags} tags, matched in {nTotal} groups
				</span>
				<span>
					Automatic : {nAuto/nTags*100}%
					<ProgressBar animate={false} intent="warning" stripes={false} value={nAuto/nTags} />
				</span>
				<span>
					In Roam : {nRoam/nTotal*100}%
					<ProgressBar animate={false} intent="primary" stripes={false} value={nRoam/nTotal} />
				</span>
			</div>
		);
	}
});
Stats.propTypes = {
	stats: shape({
		nAuto: number,
		nRoam: number,
		nTags: number,
		nTotal: number
	})
};

export default Stats;
