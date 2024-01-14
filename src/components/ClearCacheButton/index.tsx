import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Intent } from "@blueprintjs/core";

import { cleanError } from "../../utils";


function ClearCacheButton(){
	const [dataIsCached, setDataIsCached] = useState<boolean>();
	const updateCacheStatus = useCallback(() => {
		window.zoteroRoam?.isDataCached?.()
			.then(status => setDataIsCached(status))
			.catch(e => {
				window.zoteroRoam?.error?.({
					origin: "Cache",
					message: "Failed to update caching status",
					context: {
						error: cleanError(e)
					}
				});
			});
	}, [setDataIsCached]);

	useEffect(() => updateCacheStatus(), [updateCacheStatus]);

	const buttonProps = useMemo(() => {
		if(dataIsCached){
			return {
				intent: Intent.WARNING,
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

	return <Button loading={dataIsCached == undefined} onClick={clearCache} {...buttonProps} />;
}

export default ClearCacheButton;