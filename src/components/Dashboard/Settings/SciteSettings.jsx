import React, { useCallback, useContext, useState } from "react";
import { Classes, H4, NumericInput, Radio, RadioGroup, Switch } from "@blueprintjs/core";

import { UserSettings } from "../../App";
import SciteBadge from "../../SciteBadge";

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
	const handleTooltipSlideChange = useCallback((value) => setTooltipSlide(value), []);

	return <>
		<H4>Scite Settings</H4>
		<span className="zr-secondary">Try different settings by using the controls below. Note : none of these changes will be reflected in your graph.</span>
		<div>
			<div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Test DOI</span>
					<div>
						<input autoComplete="off" className={Classes.INPUT} onChange={setDOI} spellCheck="false" type="text" value={doi} />
					</div>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Layout</span>
					<div>
						<RadioGroup label="Layout" onChange={toggleLayout} selectedValue={layout}>
							<Radio label="Horizontal" value="horizontal" />
							<Radio label="Vertical" value="vertical" />
						</RadioGroup>
					</div>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Show Labels</span>
					<div>
						<Switch checked={showLabels} onChange={toggleLabels} />
					</div>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Show Zero</span>
					<div>
						<Switch checked={showZero} onChange={toggleZero} />
					</div>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Small display</span>
					<div>
						<Switch checked={small} onChange={toggleSmall} />
					</div>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Tooltip Placement</span>
					<RadioGroup label="Label Placement" onChange={handleTooltipPlacementChange} selectedValue={tooltipPlacement}>
						<Radio label="Auto" value="auto" />
						<Radio label="Top" value="top" />
						<Radio label="Right" value="right" />
						<Radio label="Bottom" value="bottom" />
						<Radio label="Left" value="left" />
					</RadioGroup>
				</div>
				<div zr-role="settings-row">
					<span className="zr-auxiliary">Tooltip Slide</span>
					<div>
						<NumericInput min={0} minorStepSize={1} onValueChange={handleTooltipSlideChange} value={tooltipSlide} />
					</div>
				</div>
			</div>
			<SciteBadge 
				doi={doi} 
				layout={layout} 
				showLabels={showLabels} 
				showZero={showZero} 
				small={small}
				tooltipPlacement={tooltipPlacement}
				tooltipSlide={tooltipSlide} />
		</div>
	</>;
}

export default SciteSettings;
