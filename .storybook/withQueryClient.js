import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

const defaultQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            cacheTime: Infinity,
            retry: false,
            staleTime: Infinity
        }
    }
});

export const withQueryClient = (Story, context) => {
    // If the story specifies its own query client, use it - otherwise use the default client
    const { args, parameters } = context;
    if(!args.queryClient){ args.queryClient = defaultQueryClient }
    return (
        <QueryClientProvider client={args.queryClient}>
            <Story {...{ args, parameters }} />
        </QueryClientProvider>
    );
}