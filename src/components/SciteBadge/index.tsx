import { memo, useEffect, useRef } from "react";
import { insertBadges } from "scite-badge";

import "./_index.sass";


type OwnProps = {
	/** The DOI for which the badge should be made */
	doi: string,
	/** Should the badge be horizontal or vertical ? */
	layout: "horizontal" | "vertical",
	/** Should the badge display category labels ? */
	showLabels: boolean,
	/** Should the badge include categories that contain no citing paper ? */
	showZero: boolean,
	/** Should the badge have a small appearance ? */
	small: boolean,
	/** Where should the tooltip be displayed ? */
	tooltipPlacement: "auto" | "top" | "right" | "bottom" | "left",
	/** Should the tooltip be positioned with offset ? */
	tooltipSlide: number
}
/** Create a Scite badge element, for manual rendering through sciteBadge.insertBadges() **/
const SciteBadge = memo<OwnProps>(function SciteBadge(props) {
	const {
		doi,
		layout = "horizontal",
		showLabels = false,
		showZero = true,
		small = false,
		tooltipPlacement = "auto",
		tooltipSlide = 0
	} = props;
	const divRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		divRef?.current?.removeAttribute("data-fetched");
		insertBadges();
	});

	return (
		<div className="scite-badge" 
			data-doi={doi} 
			data-layout={layout} 
			data-show-labels={showLabels.toString()} 
			data-show-zero={showZero.toString()}
			data-small={small.toString()}
			data-tooltip-placement={tooltipPlacement} 
			data-tooltip-slide={tooltipSlide}
			ref={divRef} >
		</div>
	);
});

export default SciteBadge;