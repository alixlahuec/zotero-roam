/* istanbul ignore file */
import { ReactChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WrapperComponent } from "@testing-library/react-hooks";


// https://tkdodo.eu/blog/testing-react-query
export const wrapper: WrapperComponent<{ children: ReactChildren }> = ({ children }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Set global defaults here
			}
		},
		logger: {
			log: console.log,
			warn: console.warn,
			error: () => { }
		}
	});
	return (
		<QueryClientProvider client= { queryClient } > { children } </QueryClientProvider>
	);
};
