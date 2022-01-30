import { useMutation } from "react-query";

import { writeItems } from "./utils";

const useImportCitoids = () => {
	return useMutation((variables) => {
		const { citoids, collections = [], library, tags = [] } = variables;
		return writeItems(citoids, { library, collections, tags});
	}, {
		onError: (error, variables, context) => {
			// For debugging
			console.log(error, variables, context);
		},
		onSuccess: (data, variables) => {
			// Update items data ?
			// See https://react-query.tanstack.com/guides/updates-from-mutation-responses
			console.log(data, variables);
		}
	});
};

export {
	useImportCitoids
};