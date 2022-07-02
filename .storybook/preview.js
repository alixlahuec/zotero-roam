/* istanbul ignore file */
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { fallbackHandler, roamAssetsHandler, apiHandlers } from '../mocks/handlers';
import { rest } from "msw";

import "../node_modules/@blueprintjs/core/lib/css/blueprint.css";
import "../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import "../node_modules/@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "../node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "../src/index.css";

import { withExtensionContext } from "./withExtensionContext";
import { withQueryClient } from "./withQueryClient";
import { withRoamCitekeys } from './withRoamCitekeys';
import { withUserSettings } from "./withUserSettings";

// Initialize MSW
initialize({
    onUnhandledRequest: ({ method, url }) => {
        console.error(`Unhandled ${method} request to ${url}.`)
    },
});

// https://storybook.js.org/docs/react/essentials/toolbars-and-globals
const withTheme = (Story, context) => {
  const isDark = context.globals.theme == "dark";
  return <div className="zr-" zr-dark-theme={isDark.toString()} 
    style={{ backgroundColor: "var(--zr-dialog-bg)", margin: "50px", padding: "20px", height: "1000px" }}>
    <Story {...context} />
  </div>;
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      // Array of plain string values or MenuItem shape (see below)
      items: ['light', 'dark'],
      // Property that specifies if the name of the item will be displayed
      showName: true,
      // Change title based on selected value
      dynamicTitle: true,
    },
  },
};

export const parameters = {
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
          rest.get("http://localhost:6006/runtime*", (req, _res, _ctx) => req.passthrough()),
          rest.get("http://localhost:6006/main*", (req, _res, _ctx) => req.passthrough()),
          rest.get("http://localhost:6006/*", (req, res, ctx) => {
              return res(ctx.status(312, "Check if this request should be allowed : " + req.url))
          }),
          fallbackHandler
      ]
  },
  a11y: {
      config: {
          rules: [
              {
                  // Contrast check always returns incomplete for QuickCopy toggle
                  // This is due to background being provided by the sibling `input` element
                  id: "color-contrast",
                  selector: "*:not(label.zr-quick-copy)"
                }
            ]
        }
    }
}

export const decorators = [mswDecorator, withTheme, withQueryClient, withExtensionContext, withUserSettings, withRoamCitekeys];