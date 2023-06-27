const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { mergeWithRules } = require("webpack-merge");
const baseDevConfig = require("./webpack.dev.config");

module.exports = mergeWithRules({
	module: {
		rules: "replace"
	}
})(baseDevConfig, {
	experiments: {
		outputModule: true,
	},
	entry: path.resolve("loader.tsx"),
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
				test: /\.(sa|sc|c)ss$/,
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
});