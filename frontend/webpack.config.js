'use strict'

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        assetModuleFilename: 'assets/[hash][ext][query]',
    },
    devtool: 'source-map',
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        compress: true,
        watchFiles: ['src/**/*', 'index.html'],
        port: 8080,
        open: true,
        hot: true,
        client: {
            overlay: true,
            progress: true,
        },
    },
    stats: {
        warnings: false, // скрыть предупреждения
    },
    infrastructureLogging: {
        level: 'error', // скрыть системные логи
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' }),
        new MiniCssExtractPlugin({ filename: 'styles.css' }),
        new CopyPlugin({ patterns: [{ from: 'src/static', to: 'static' },],}),
    ],
    module: {
        rules: [
            {
                test: /\.(scss)$/,
                use: [
                    process.env.NODE_ENV !== 'production'
                        ? 'style-loader'
                        : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [autoprefixer],
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                quietDeps: true,
                                silenceDeprecations: ['import'],
                            }
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg|webp)$/i,
                type: 'asset/resource',
                generator: { filename: 'images/[name][ext]' },
            },
            {
                test: /\.(woff2?|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: { filename: 'fonts/[name][ext]' },
            },
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.js', '.scss'],
    },
}
