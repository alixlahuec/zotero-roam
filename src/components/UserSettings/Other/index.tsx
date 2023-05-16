import { useMemo } from "react";
import { Toggle, SettingsManager } from "Components/UserSettings";


const { Provider: OtherSettingsProvider, useSettings: useOtherSettings } = new SettingsManager<"other">({
	/* istanbul ignore next */
	beforeUpdate: (prevState, update) => {
		// If user disabled caching, clear the data cache
		if (prevState.cacheEnabled === true && update.cacheEnabled === false) {
			setTimeout(() => {
				window.zoteroRoam?.clearDataCache?.();
			}, 1000);
		}
	}
});

function OtherSettingsWidget() {
	const [
		{
			autoload,
			cacheEnabled,
			darkTheme,
			render_inline
		},
		setOpts
	] = useOtherSettings();

	const handlers = useMemo(() => {

		function toggleBool(op){
			setOpts(prevState => ({
				...prevState,
				[op]: !prevState[op]
			}));
		}

		return {
			toggleAutoload: () => toggleBool("autoload"),
			toggleCacheEnabled: () => toggleBool("cacheEnabled"),
			toggleDarkTheme: () => toggleBool("darkTheme"),
			toggleRenderInline: () => toggleBool("render_inline")
		};
	}, [setOpts]);

	return <>
		<Toggle description="Activate the extension on graph load" isChecked={autoload} label="Toggle 'autoload' setting" onChange={handlers.toggleAutoload} title="Autoload" />
		<Toggle description="Cache API data between sessions, to optimize loading times." isChecked={cacheEnabled} label="Toggle 'cache enabled' setting" onChange={handlers.toggleCacheEnabled} title="Enable Cache" />
		<Toggle isChecked={darkTheme} label="Toggle 'dark theme' setting" onChange={handlers.toggleDarkTheme} title="Use Dark Theme by default" />
		<Toggle description="This will display [[@citekey]] references as a formatted citation, like Scott et al. (2003). Block content will not be affected." isChecked={render_inline} label="Toggle 'render inline' setting" onChange={handlers.toggleRenderInline} title="Display references as citations" />
	</>;

}

export {
	OtherSettingsProvider,
	OtherSettingsWidget,
	useOtherSettings
};