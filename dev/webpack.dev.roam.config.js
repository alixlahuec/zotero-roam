const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { merge } = require("webpack-merge");
const baseDevConfig = require("./webpack.dev.config");

module.exports = merge(baseDevConfig, {
	experiments: {
		outputModule: true,
	},
	entry: path.resolve("loader.js"),
	output: {
		path: path.resolve("."),
		filename: "extension.js",
		sourceMapFilename: "extension.js.map",
		library: {
			type: "module",
		}
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "extension.css",
		}),
	],
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				include: [path.resolve("src"), path.resolve("loader.js")],
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react"]
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader
					},
					{
						loader: "css-loader",
						options: {
							sourceMap: false
						}
					}
				],
			},
		],
	}
});