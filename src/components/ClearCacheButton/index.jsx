import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@blueprintjs/core";

import { useBool } from "../../hooks";
import { cleanErrorIfAxios } from "../../utils";


function ClearCacheButton(){
	const [dataIsCached, { set: setDataIsCached }] = useBool(null);
	const updateCacheStatus = useCallback(() => {
		window.zoteroRoam?.isDataCached?.()
			.then(status => setDataIsCached(status))
			.catch(e => {
				window.zoteroRoam?.error?.({
					origin: "Cache",
					message: "Failed to update caching status",
					detail: {
						error: cleanErrorIfAxios(e)
					}
				});
			});
	}, [setDataIsCached]);

	useEffect(() => updateCacheStatus(), [updateCacheStatus]);

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
			.then(() => updateCacheStatus());
	}, [updateCacheStatus]);

	return <Button loading={dataIsCached == null} onClick={clearCache} {...buttonProps} />;
}

export default ClearCacheButton;