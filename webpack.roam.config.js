const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config");

module.exports = merge(baseConfig, {
    context: __dirname,
    devtool: "source-map",
    experiments: {
        outputModule: true,
    },
    externals: {
        // TODO: revert back to Blueprint v3 for Roam Depot
        // "@blueprintjs/core": ["Blueprint", "Core"],
        // "@blueprintjs/datetime": ["Blueprint", "DateTime"],
        // "@blueprintjs/select": ["Blueprint", "Select"],
        react: "React",
        "react-dom": "ReactDOM",
    },
    externalsType: "window",
    entry: "./loader.js",
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
    output: {
        filename: "extension.js",
        path: __dirname,
        library: {
            type: "module",
        },
        sourceMapFilename: "extension.js.map"
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
				include: [path.resolve(__dirname, "src"), path.resolve(__dirname, "loader.js")],
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