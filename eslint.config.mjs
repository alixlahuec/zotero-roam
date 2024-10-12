import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vitest from "@vitest/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";


// TODO: Reinstall Storybook plugin when possible

export default [
	eslint.configs.recommended,
	reactPlugin.configs.flat.recommended,
	importPlugin.flatConfigs.recommended,

	{
		ignores: [
			"**/*.css",
			"**/*.scss",
			"**/*.sass",
			"dist/**/*",
			"dev/**/*",
			"**/*.html",
			"extension.js"
		]
	},

	{
		name: "Core",
		plugins: {
			"eslint": eslint,
			"@typescript-eslint": tseslint,
			"importPlugin": importPlugin,
			"react": reactPlugin,
			"react-hooks": reactHooksPlugin
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				PACKAGE_VERSION: "readonly"
			},
			parser: tsParser,
			ecmaVersion: 13,
			sourceType: "module",
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			}
		},
		linterOptions: {
			reportUnusedDisableDirectives: "error"
		},
		settings: {
			react: {
				version: "detect"
			},
			linkComponents: [{
				name: "ButtonLink",
				linkAttribute: "href"
			}],
			"import/resolver": {
				alias: {
					map: [
						["@clients", "./src/clients"],
						["@hooks", "./src/hooks"],
						["@services", "./src/services"],
						["Mocks", "./mocks"],
						["Components", "./src/components"],
						["Styles", "./styles"],
						["Types", "./src/types"]
					],

					extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".scss"]
				}
			}
		},
		rules: {
			// Must use `rules` instead of the config because the plugin doesn't support flat config yet
			...reactHooksPlugin.configs.recommended.rules,
			// Must use `rules` instead of the config because of the `extends` error
			...tseslint.configs.recommended.rules,
			"arrow-spacing": "error",
			"comma-dangle": ["error", "never"],
			curly: ["error", "all"],
			"default-case": "error",
			"dot-notation": "warn",
			indent: ["error", "tab"],

			"key-spacing": ["error", {
				beforeColon: false,
				afterColon: true,
				mode: "strict"
			}],

			"linebreak-style": "off",
			"no-alert": "error",
			"no-await-in-loop": "warn",

			"no-duplicate-imports": ["error", {
				includeExports: true
			}],

			"no-implicit-coercion": "warn",
			"no-label-var": "error",
			"no-param-reassign": "error",
			"no-unused-vars": "off",
			"no-var": "error",
			"object-curly-spacing": ["warn", "always"],
			"prefer-const": "warn",
			"prefer-rest-params": "off",
			"quotes": ["error", "double"],
			"require-await": "error",
			"semi": ["error", "always"],
			"sort-imports": "off",
			"react/jsx-uses-react": "off",
			"react/no-unknown-property": "off",
			"react/prop-types": "off",
			"react/react-in-jsx-scope": "off",

			"import/newline-after-import": ["error", {
				count: 2
			}],

			"import/no-unresolved": ["warn", {
				amd: true,
				commonjs: true
			}],

			"import/order": ["warn", {
				groups: ["builtin", "external", ["parent", "sibling", "index"], "internal"],
				pathGroups: [
					{
						pattern: "react",
						group: "builtin"
					},
					{
						pattern: "react-dom",
						group: "builtin"
					},
					{
						pattern: "*/constants",
						group: "internal"
					},
					{
						pattern: "Mocks/*",
						group: "internal"
					},
					{
						pattern: "@blueprintjs/**",
						group: "external"
					},
					{
						pattern: "Components/**",
						group: "parent"
					},
					{
						pattern: "@clients/**",
						group: "parent"
					},
					{
						pattern: "@hooks",
						group: "parent"
					},
					{
						pattern: "@services/**",
						group: "parent"
					}
				],

				pathGroupsExcludedImportTypes: [
					"react",
					"react-dom",
					"@blueprintjs/*",
					"Components/*",
					"@clients/*",
					"@hooks",
					"@services/*",
					"*/constants"
				]
			}],

			"@typescript-eslint/ban-ts-comment": "off",

			"@typescript-eslint/no-unused-vars": ["error", {
				ignoreRestSiblings: true,
				argsIgnorePattern: "^_"
			}],

			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-non-null-assertion": "off"
		}
	},

	{
		name: "Tests",
		files: ["tests/**"],
		plugins: { vitest },
		languageOptions: {
			globals: {
				...vitest.environments.env.globals
			}
		},
		rules: {
			...vitest.configs.recommended.rules,
			"vitest/prefer-expect-assertions": "off"
		}
	},

	{
		name: "Storybook",
		files: [".storybook/**"],
		rules: {
			"react/react-in-jsx-scope": "off",
			"react-hooks/rules-of-hooks": "off"
		}
	}
];