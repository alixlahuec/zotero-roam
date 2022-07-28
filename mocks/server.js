import { setupServer } from "msw/node";
import { fallbackHandler, roamAssetsHandler, apiHandlers } from "./handlers";

/* istanbul ignore next */
export const server = setupServer(
	...apiHandlers,
	roamAssetsHandler,
	fallbackHandler
);