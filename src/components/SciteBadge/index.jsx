import { bool, number, oneOf, string } from "prop-types";
import { memo, useEffect, useRef } from "react";

import * as sciteBadge from "scite-badge";

import "./index.css";


/** Create a Scite badge element, for manual rendering through sciteBadge.insertBadges()
 * @param {string} doi - The DOI for which the badge should be made
 * @param {string} layout - Should the badge be horizontal or vertical ?
 * @param {Boolean} showLabels - Should the badge display category labels ?
 * @param {Boolean} showZero - Should the badge include categories that contain no citing paper ?
 * @param {Boolean} small - Should the badge have a small appearance ?
 * @param {string} tooltipPlacement - Where should the tooltip be displayed ?
 * @param {Integer} tooltipSlide - Should the tooltip be positioned with offset ? 
 **/
const SciteBadge = memo(function SciteBadge(props) {
	const {
		doi,
		layout = "horizontal",
		showLabels = false,
		showZero = true,
		small = false,
		tooltipPlacement = "auto",
		tooltipSlide = 0
	} = props;
	const divRef = useRef();

	useEffect(() => {
		divRef?.current?.removeAttribute("data-fetched");
		sciteBadge.insertBadges();
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
SciteBadge.propTypes = {
	doi: string,
	layout: oneOf(["horizontal", "vertical"]),
	showLabels: bool,
	showZero: bool,
	small: bool,
	tooltipPlacement: oneOf(["auto", "top", "right", "bottom", "left"]),
	tooltipSlide: number
};

export default SciteBadge;