import type { Environment } from 'vitest';
import { builtinEnvironments } from 'vitest/environments';

export default <Environment> {
	name: "custom_jsdom",
	transformMode: "web",
	setup: (global, options) => {
		const envReturn = builtinEnvironments.jsdom.setup(global, options)

		// eslint-disable-next-line no-param-reassign
		global.structuredClone = structuredClone

		return envReturn
  	}

};