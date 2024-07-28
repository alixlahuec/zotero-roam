import { BuildOptions } from "esbuild";
import { resolve } from "path";
import { defineConfig, AliasOptions, PluginOption } from "vite";
import { coverageConfigDefaults } from "vitest/config";

import react from "@vitejs/plugin-react-swc";
import { viteExternalsPlugin } from "vite-plugin-externals";

import pkg from "../package.json";


export default defineConfig(({ command, mode }) => {
	let minify: BuildOptions["minify"] = true;
	let sourcemap: BuildOptions["sourcemap"] = true;
	let outDir: BuildOptions["outdir"] = "dist";
	let rollupInput: Record<string, string>;
	let extraAliases: AliasOptions = {};
	let extraPlugins: PluginOption[] = [];

	// Overrides for dev builds
	if (command == "serve") {
		minify = false;
		sourcemap = false;
		extraAliases = {
			"react-dom$": "react-dom/profiling",
			"scheduler/tracing": "scheduler/tracing-profiling"
		}
	}

	// Mode-specific config
	switch (mode) {
		case "sandbox":
			rollupInput = {
				"zoteroRoam.sandbox": resolve("sandbox")
			};
			
			extraAliases["@services/roam"] = resolve("mocks", "roam");

			break;
		case "roam":
			outDir = ".";

			rollupInput = {
				"extension": resolve("loader")
			};
			
			extraPlugins.push(viteExternalsPlugin({
				"@blueprintjs/core": ["Blueprint", "Core"],
				"@blueprintjs/datetime": ["Blueprint", "DateTime"],
				"@blueprintjs/select": ["Blueprint", "Select"],
				"idb": "idb",
				"react": "React",
				"react-dom": "ReactDOM",
			}, { useWindow: true }));

			break;
		case "default":
		default:
			rollupInput = {
				"zoteroRoam.min": resolve("src", "index")
			};

			break;
	}

	return {
		build: {
			target: "es2021",
			minify,
			sourcemap,
			outDir,
			emptyOutDir: false,
			copyPublicDir: false, // needed because of msw
			chunkSizeWarningLimit: 3000,
			rollupOptions: {
				input: rollupInput,
				output: {
					format: "es",
					assetFileNames: "extension.[ext]",
					entryFileNames: "[name].js"
				},
				preserveEntrySignatures: "allow-extension"
			}
		},
		resolve: {
			alias: {
				"@clients": resolve("src", "clients"),
				"@hooks": resolve("src", "hooks"),
				...(process.env.VITEST ? { "@services/roam": resolve("mocks", "roam.ts") } : {}),
				"@services": resolve("src", "services"),
				"Mocks": resolve("mocks"),
				"Components": resolve("src", "components"),
				"Styles": resolve("styles"),
				"Types": resolve("src", "types"),
				...extraAliases
			}
		},
		plugins: [react(), ...extraPlugins],
		test: {
			alias: {
				"\.(css|sass)$": resolve("mocks", "style.ts")
			},
			clearMocks: true,
			coverage: {
				exclude: ["**/*.stories.tsx", ...coverageConfigDefaults.exclude],
				include: ["src/*", "loader.tsx", "sandbox.ts", "mocks/*"],
				provider: "istanbul",
				reporter: ["text", "json"]
			},
			define: {
				"PACKAGE_VERSION": pkg.version
			},
			environment: "jsdom",
			globals: true,
			outputFile: {
				"junit": "reports/tests-junit.xml",
			},
			reporters: [
				"verbose",
				"junit",
				...(process.env.GITHUB_ACTIONS ? ["github-actions"] : [])
			],
			setupFiles: ["dev/vitest.setup.js"],
			typecheck: {
				enabled: true
			}
		}
	};
});