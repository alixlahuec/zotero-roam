import { setupServer } from "msw/node";
import { apiHandlers, fallbackHandler, roamAssetsHandler, sciteApiHandler, sciteAssetsHandler } from "./handlers";

/* istanbul ignore next */
export const server = setupServer(
	...apiHandlers,
	roamAssetsHandler,
	sciteApiHandler,
	sciteAssetsHandler,
	fallbackHandler
);