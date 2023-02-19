import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import useBool from "../../hooks/useBool";


function ClearCacheButton(){
	const [dataIsCached, { set: setDataIsCached }] = useBool(null);

	useEffect(() => {
		window.zoteroRoam?.isDataCached?.()
			.then((data_is_cached) => setDataIsCached(data_is_cached));
	}, [setDataIsCached]);

	const buttonProps = useMemo(() => {
		if(dataIsCached){
			return {
				intent: "warning",
				text: "Clear cache",
				title: "Click to clear the extension's data cache"
			};
		} else {
			return {
				disabled: true,
				text: "No cached data",
				title: "The extension's data cache is empty"
			};
		}
	}, [dataIsCached]);

	const clearCache = useCallback(() => {
		window.zoteroRoam?.clearDataCache?.()
			.then(() => window.zoteroRoam?.info?.({
				context: "Database",
				message: "Successfully cleared data cache",
				showToaster: 1500
			}));
	}, []);

	return <Button loading={dataIsCached == null} onClick={clearCache} {...buttonProps} />;
}

export default ClearCacheButton;