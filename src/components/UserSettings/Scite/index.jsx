import { func, node } from "prop-types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { NumericSelect, SingleInput, Toggle } from "../common";
import SciteBadge from "Components/SciteBadge";

import * as customPropTypes from "../../../propTypes";


const SciteSettings = createContext({});

const SciteProvider = ({ children, init, updater }) => {
	const [sciteBadge, _setSciteBadge] = useState(init);

	const setSciteBadge = useCallback((updateFn) => {
		_setSciteBadge((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [sciteBadge, setSciteBadge], [sciteBadge, setSciteBadge]);

	return (
		<SciteSettings.Provider value={contextValue}>
			{children}
		</SciteSettings.Provider>
	);
};
SciteProvider.propTypes = {
	children: node,
	init: customPropTypes.sciteBadgeSettingsType,
	updater: func
};

const useSciteSettings = () => {
	const context = useContext(SciteSettings);

	return context;
};

const EXAMPLE_DOI = "10.1126/science.1179052";

const LAYOUT_OPTIONS = [
	{ label: "Horizontal", value: "horizontal" },
	{ label: "Vertical", value: "vertical" }
];

const PLACEMENT_OPTIONS = [
	{ label: "Auto", value: "auto" },
	{ label: "Top", value: "top" },
	{ label: "Left", value: "left" },
	{ label: "Right", value: "right" },
	{ label: "Bottom", value: "bottom" }
];

function SciteWidget(){
	const [
		{
			layout,
			showLabels,
			showZero,
			small,
			tooltipPlacement,
			tooltipSlide
		},
		setOpts
	] = useSciteSettings();

	const handlers = useMemo(() => {

		function toggleBool(op){
			setOpts(prevState => ({
				...prevState,
				[op]: !prevState[op]
			}));
		}
		
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}
        
		return {
			selectLayout: (val) => updateSingleValue("layout", val),
			toggleLabels: () => toggleBool("showLabels"),
			toggleZero: () => toggleBool("showZero"),
			toggleSmall: () => toggleBool("small"),
			selectTooltipPlacement: (val) => updateSingleValue("tooltipPlacement", val),
			updateTooltipSlide: (val) => updateSingleValue("tooltipSlide", val)
		};
	}, [setOpts]);

	return <>
		<div style={{ padding: "10px 0px", textAlign: "center" }}>
			<SciteBadge doi={EXAMPLE_DOI}
				layout={layout}
				showLabels={showLabels}
				showZero={showZero}
				small={small}
				tooltipPlacement={tooltipPlacement}
				tooltipSlide={tooltipSlide}
			/>
		</div>
		<SingleInput menuTitle="Select the layout direction for the Scite badge" onChange={handlers.selectLayout} options={LAYOUT_OPTIONS} title="Layout" value={layout} />
		<Toggle description="Should category labels be displayed?" isChecked={showLabels} label="Toggle if category labels should be shown" onChange={handlers.toggleLabels} title="Show labels" />
		<Toggle description="Should categories with no items be displayed?" isChecked={showZero} label="Toggle if categories with no items should be shown" onChange={handlers.toggleZero} title="Show empty categories" />
		<Toggle isChecked={small} label="Toggle if Scite badges should use a smaller styling" onChange={handlers.toggleSmall} title="Use small styling" />
		<SingleInput menuTitle="Select the placement of the badge tooltip" onChange={handlers.selectTooltipPlacement} options={PLACEMENT_OPTIONS} title="Tooltip Placement" value={tooltipPlacement} />
		<NumericSelect label="Indicate a numeric offset for the placement of the badge tooltip" setValue={handlers.updateTooltipSlide} title="Tooltip Offset" value={tooltipSlide} />
	</>;
}

export {
	SciteProvider,
	SciteWidget,
	useSciteSettings
};