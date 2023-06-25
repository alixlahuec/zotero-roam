const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
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
		library: {
			type: "module",
		}
	},

	/* Modules */
    externals: {
        "@blueprintjs/core": ["Blueprint", "Core"],
        "@blueprintjs/datetime": ["Blueprint", "DateTime"],
        "@blueprintjs/select": ["Blueprint", "Select"],
		"idb": "idb",
        react: "React",
        "react-dom": "ReactDOM",
    },
	externalsType: "window",
	resolve: {
		alias: {
			"Mocks": path.resolve("mocks"),
			"Roam": path.resolve("src", "roam.ts"),
			"Components": path.resolve("src", "components"),
			"Types": path.resolve("src", "types")
		},
		extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".sass"]
	},

	/* Config */
	devtool: false,
	mode: "production",
	optimization: {
		minimizer: [
			`...`,
			new CssMinimizerPlugin(),
		],
		splitChunks: {
			cacheGroups: {
				styles: {
					name: "styles",
					type: "css/mini-extract",
					chunks: "all",
					enforce: true,
				},
			},
		},
	},
    performance: {
        maxAssetSize: 2000000,
        maxEntrypointSize: 2000000
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
				use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
			}
        ],
	}
};