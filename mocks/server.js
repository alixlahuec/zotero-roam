import { apiHandlers, fallbackHandler, roamAssetsHandler, sciteAssetsHandler } from "./handlers";
import { setupServer } from "msw/node";

/* istanbul ignore next */
export const server = setupServer(
	...apiHandlers,
	roamAssetsHandler,
	sciteAssetsHandler,
	fallbackHandler
);