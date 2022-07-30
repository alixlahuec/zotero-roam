import { apiHandlers, fallbackHandler, roamAssetsHandler } from "./handlers";
import { setupServer } from "msw/node";

/* istanbul ignore next */
export const server = setupServer(
	...apiHandlers,
	roamAssetsHandler,
	fallbackHandler
);