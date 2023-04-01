/* istanbul ignore file */
import { useEffect, useGlobals } from "@storybook/addons";
import { DecoratorFn, Parameters, Story, StoryContext } from "@storybook/react";
import { initialize, mswLoader } from "msw-storybook-addon";
import { rest } from "msw";
import { mockDateDecorator } from "storybook-mock-date-decorator";

import "../node_modules/@blueprintjs/core/lib/css/blueprint.css";
import "../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import "../node_modules/@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "../src/index.css";

import { withExtensionContext } from "./withExtensionContext";
import { withHotkeysProvider } from "./withHotkeysProvider";
import { withQueryClient } from "./withQueryClient";
import { withRoamCitekeys } from "./withRoamCitekeys";
import { withUserSettings } from "./withUserSettings";

import { A11Y_RULES } from "./a11y-rules";
import { fallbackHandler, roamAssetsHandler, sciteApiHandler, sciteAssetsHandler, apiHandlers } from "Mocks/handlers";


// Initialize MSW
initialize({
	onUnhandledRequest: ({ method, url }) => {
		console.error(`Unhandled ${method} request to ${url}.`);
	},
});

// https://storybook.js.org/docs/react/essentials/toolbars-and-globals
const withTheme = (Story: Story, context: StoryContext) => {
	const [{ theme }, /* updateGlobals */] = useGlobals();

	useEffect(() => {
		document.getElementById("root")?.parentElement?.setAttribute("zr-dark-theme", (theme == "dark").toString());
	}, [theme]);

	return <div className="zr-" 
		style={{ backgroundColor: "var(--zr-dialog-bg)", margin: "50px", padding: "20px", height: "1000px" }}>
		<Story {...context} />
	</div>;
};

export const globalTypes = {
	theme: {
		name: "Theme",
		description: "Global theme for components",
		defaultValue: "light",
		toolbar: {
			icon: "circlehollow",
			// Array of plain string values or MenuItem shape (see below)
			items: ["light", "dark"],
			// Property that specifies if the name of the item will be displayed
			showName: true,
			// Change title based on selected value
			dynamicTitle: true,
		},
	},
};

export const parameters: Parameters = {
	actions: { argTypesRegex: "^on[A-Z].*" },
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
	msw: {
		handlers: [
			...apiHandlers,
			roamAssetsHandler,
			sciteApiHandler,
			sciteAssetsHandler,
			rest.get("http://localhost:6006/runtime*", (req, _res, _ctx) => req.passthrough()),
			rest.get("http://localhost:6006/main*", (req, _res, _ctx) => req.passthrough()),
			rest.get("http://localhost:6006/vendors*", (req, _res, _ctx) => req.passthrough()),
			rest.get("http://localhost:6006/*", (req, res, ctx) => {
				return res(ctx.status(312, "Check if this request should be allowed : " + req.url));
			}),
			fallbackHandler
		]
	},
	a11y: {
		config: {
			rules: A11Y_RULES
		}
	},
	chromatic: { diffThreshold: 0.1 },
	date: new Date("April 6, 2022 17:15:00")
};

export const decorators: DecoratorFn[] = [withTheme, withHotkeysProvider, withQueryClient, withExtensionContext, withUserSettings, withRoamCitekeys, mockDateDecorator];

export const loaders = [mswLoader];