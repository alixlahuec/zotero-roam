import React, { useCallback, useContext, useState } from "react";
import { H3, NumericInput, Radio, RadioGroup } from "@blueprintjs/core";

import { UserSettings } from "../../App";
import SciteBadge from "../../SciteBadge";
import TextField from "./TextField";
import Toggle from "./Toggle";

function SciteSettings(){
	const { sciteBadge } = useContext(UserSettings);
	const [doi, setDOI] = useState("10.1126/science.1179052");
	const [layout, setLayout] = useState(sciteBadge.layout);
	const [showLabels, setShowLabels] = useState(sciteBadge.showLabels);
	const [showZero, setShowZero] = useState(sciteBadge.showZero);
	const [small, setSmall] = useState(sciteBadge.small);
	const [tooltipPlacement, setTooltipPlacement] = useState(sciteBadge.tooltipPlacement);
	const [tooltipSlide, setTooltipSlide] = useState(sciteBadge.tooltipSlide);

	const toggleLayout = useCallback(() => setLayout(prev => prev == "horizontal" ? "vertical" : "horizontal"), []);
	const toggleLabels = useCallback(() => setShowLabels(prev => !prev), []);
	const toggleZero = useCallback(() => setShowZero(prev => !prev), []);
	const toggleSmall = useCallback(() => setSmall(prev => !prev), []);
	const handleTooltipPlacementChange = useCallback((event) => setTooltipPlacement(event.currentTarget.value), []);
	const handleTooltipSlideChange = useCallback((_valnum, valstring) => setTooltipSlide(Number(valstring)), []);

	return <>
		<H3>Scite Badge</H3>
		<span className={["zr-secondary", "zr-text-small"].join(" ")}>Try different settings by using the controls below. Note : none of these changes will be reflected in your graph.</span>
		<div zr-role="settings-scite">
			<div zr-role="scite-example">
				<SciteBadge 
					doi={doi} 
					layout={layout} 
					showLabels={showLabels} 
					showZero={showZero} 
					small={small}
					tooltipPlacement={tooltipPlacement}
					tooltipSlide={tooltipSlide} />
			</div>
			<div>
				<TextField disabled={false} label="Test DOI" value={doi} onChange={setDOI} />
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Layout</span>
					<div>
						<RadioGroup inline={true} onChange={toggleLayout} selectedValue={layout}>
							<Radio label="Horizontal" value="horizontal" />
							<Radio label="Vertical" value="vertical" />
						</RadioGroup>
					</div>
				</div>
				<Toggle disabled={false} isChecked={showLabels} label="Show Labels" onChange={toggleLabels} />
				<Toggle disabled={false} isChecked={showZero} label="Show Zero" onChange={toggleZero} />
				<Toggle disabled={false} isChecked={small} label="Small display" onChange={toggleSmall} />
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Tooltip Placement</span>
					<RadioGroup inline={true} onChange={handleTooltipPlacementChange} selectedValue={tooltipPlacement}>
						<Radio label="Top" value="top" />
						<Radio label="Right" value="right" />
						<Radio label="Left" value="left" />
						<Radio label="Bottom" value="bottom" />
						<Radio label="Auto" value="auto" />
					</RadioGroup>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Tooltip Slide</span>
					<div>
						<NumericInput min={0} minorStepSize={1} onValueChange={handleTooltipSlideChange} value={tooltipSlide} />
					</div>
				</div>
			</div>
		</div>
	</>;
}

export default SciteSettings;
