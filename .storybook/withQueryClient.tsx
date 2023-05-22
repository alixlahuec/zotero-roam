import { Decorator } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const defaultQueryClient = new QueryClient({
	defaultOptions: {
		queries: {
			cacheTime: Infinity,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchIntervalInBackground: true,
			retry: false,
			retryOnMount: false,
			staleTime: Infinity
		}
	}
});

export const withQueryClient: Decorator = (Story, context) => {
	// If the story specifies its own query client, use it - otherwise use the default client
	const { args, parameters } = context;
	if(!parameters.queryClient){ parameters.queryClient = defaultQueryClient; }
	return (
		<QueryClientProvider client={parameters.queryClient}>
			<Story {...{ args, parameters }} />
		</QueryClientProvider>
	);
};