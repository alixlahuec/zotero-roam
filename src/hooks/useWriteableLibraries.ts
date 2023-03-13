import { useMemo } from "react";
import { useQuery_Permissions } from "../api/zotero";

import { ZLibrary } from "Types/common";


/** Custom hook for retrieving the list of Zotero libraries with `write` permissions.
 * @param libraries - The targeted Zotero libraries
 * @returns The operation's status and outcome
 */
const useWriteableLibraries = (libraries: ZLibrary[]) => {
	const apiKeys = useMemo(() => Array.from(new Set(libraries.map(lib => lib.apikey))), [libraries]);
	const permissionQueries = useQuery_Permissions(apiKeys, {
		notifyOnChangeProps: ["data", "isLoading"]
	});

	const isLoading = permissionQueries.some(q => q.isLoading);
	const permissions = useMemo(() => permissionQueries.map(q => q.data || []).flat(1), [permissionQueries]);

	const data = useMemo(() => {
		return libraries
			.filter(lib => {
				const keyData = permissions.find(k => k.key == lib.apikey);
				if (!keyData) {
					return false;
				} else {
					const { access } = keyData;
					const [libType, libId] = lib.path.split("/");
					const permissionsList = libType == "users"
						? access.user
						: (access.groups?.[libId] || access.groups?.all);
					return (permissionsList || {}).write || false;
				}
			});
	}, [libraries, permissions]);

	return {
		data,
		isLoading
	};
};

export default useWriteableLibraries;