import { setupServer } from "msw/node";

import { apiHandlers, fallbackHandler } from "Mocks/handlers";


const server = setupServer(
	...apiHandlers,
	fallbackHandler
);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());