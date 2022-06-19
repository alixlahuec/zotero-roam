import { setupServer } from "msw/node";
import { apiHandlers, fallbackHandler, roamAssetsHandler } from "./handlers";

export const server = setupServer({
	...apiHandlers,
	dev: [
		roamAssetsHandler,
		fallbackHandler
	]
});