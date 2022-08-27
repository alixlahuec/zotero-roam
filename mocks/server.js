import { apiHandlers, fallbackHandler, roamAssetsHandler, sciteApiHandler, sciteAssetsHandler } from "./handlers";
import { setupServer } from "msw/node";

/* istanbul ignore next */
export const server = setupServer(
	...apiHandlers,
	roamAssetsHandler,
	sciteApiHandler,
	sciteAssetsHandler,
	fallbackHandler
);