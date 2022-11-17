const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
    devtool: false,
    experiments: {
        outputModule: true,
    },
    externals: {
        "@blueprintjs/core": ["Blueprint", "Core"],
        "@blueprintjs/datetime": ["Blueprint", "DateTime"],
        "@blueprintjs/select": ["Blueprint", "Select"],
        react: "React",
        "react-dom": "ReactDOM",
    },
    externalsType: "window",
    entry: path.resolve("loader.js"),
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
    output: {
		path: path.resolve("dist"),
		filename: "extension.js",
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
    },
});