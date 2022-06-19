import { setupServer } from "msw/node";
import { fallbackHandler, roamAssetsHandler, apiHandlers } from "./handlers";

export const server = setupServer(
	...apiHandlers,
	roamAssetsHandler,
	fallbackHandler
);