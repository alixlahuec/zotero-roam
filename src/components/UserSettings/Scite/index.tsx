import { useMemo } from "react";
import SciteBadge from "Components/SciteBadge";
import { NumericSelect, SingleInput, Toggle , SettingsManager } from "Components/UserSettings";


const { Provider: SciteProvider, useSettings: useSciteSettings } = new SettingsManager<"sciteBadge">();

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
		<SingleInput menuTitle="Select the layout direction for the Scite badge" onSelect={handlers.selectLayout} options={LAYOUT_OPTIONS} title="Layout" value={layout} />
		<Toggle isChecked={showLabels} label="Toggle if category labels should be shown" onChange={handlers.toggleLabels} title="Show labels" />
		<Toggle isChecked={showZero} label="Toggle if categories with no items should be shown" onChange={handlers.toggleZero} title="Show empty categories" />
		<Toggle isChecked={small} label="Toggle if Scite badges should use a smaller styling" onChange={handlers.toggleSmall} title="Use small styling" />
		<SingleInput menuTitle="Select the placement of the badge tooltip" onSelect={handlers.selectTooltipPlacement} options={PLACEMENT_OPTIONS} title="Tooltip Placement" value={tooltipPlacement} />
		<NumericSelect label="Indicate a numeric offset for the placement of the badge tooltip" setValue={handlers.updateTooltipSlide} title="Tooltip Offset" value={tooltipSlide} />
	</>;
}

export {
	SciteProvider,
	SciteWidget,
	useSciteSettings
};