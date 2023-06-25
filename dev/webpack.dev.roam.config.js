const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

// ! Do not merge with another config - it will give a SASS error (unrelated to the config contents, seems to be due to the merging process)
module.exports = {
	/* I/O */
	context: path.resolve(__dirname, '../'),
	entry: path.resolve("loader.tsx"),
	experiments: {
		outputModule: true,
	},
	output: {
		path: path.resolve("."),
		filename: "extension.js",
		sourceMapFilename: "extension.js.map",
		library: {
			type: "module",
		}
	},

	resolve: {
		alias: {
			"Mocks": path.resolve("mocks"),
			"Roam": path.resolve("src", "roam.ts"),
			"Components": path.resolve("src", "components"),
			"Types": path.resolve("src", "types"),
			"react-dom$": "react-dom/profiling",
			"scheduler/tracing": "scheduler/tracing-profiling"
		},
		extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".sass"]
	},

	devtool: "source-map",
	mode: "development",
	optimization: {
		minimize: false
	},
	performance: {
		maxAssetSize: 2000000,
		maxEntrypointSize: 2000000,
	},

	/* Plugins and loaders */
	plugins: [
		new MiniCssExtractPlugin({
			filename: "extension.css",
		}),
	],
	module: {
		rules: [
			{
				test: /\.[tj]sx?$/,
				include: [path.resolve("src"), path.resolve("loader.tsx")],
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
					}
				}
			},
			{
				test: /\.(sa|sc|c)ss$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader
					},
					{
						loader: "css-loader",
						options: {
							sourceMap: false
						}
					},
					{
						loader: "sass-loader",
						options: {
							sourceMap: false
						}
					}
				],
			},
		],
	}
};