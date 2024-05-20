/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 */

import { TextDecoder, TextEncoder } from "util";


Object.defineProperties(globalThis, {
	TextDecoder: { value: TextDecoder },
	TextEncoder: { value: TextEncoder }
});
