'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: isDev ? 'development' : 'production',

    entry: './src/app.js',

    output: {
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        clean: true,
    },

    ignoreWarnings: [
        {
            module: /sass-loader/,
            message: /@import rules are deprecated/,
        },
    ],

    devtool: isDev ? 'eval-source-map' : 'source-map',

    devServer: {
        static: path.resolve(__dirname, 'dist'),
        compress: true,
        watchFiles: ['src/**/*', 'index.html', 'templates/**/*'],
        port: 8080,
        open: true,
        hot: true,
        liveReload: true, // обновление при изменении HTML
        historyApiFallback: true, // 👈 SPA-режим (чтобы #/signup работал)
        client: {
            overlay: true,
            progress: true,
        },
    },

    plugins: [
        // Единый HTML для всего приложения (SPA)
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
        }),

        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
        }),

        // Плагин для production только
        ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: 'css/[name].css' })]),

        // Копируем шаблоны и статику
        new CopyPlugin({
            patterns: [
                { from: 'src/static', to: 'static' },
                { from: 'src/templates', to: 'templates' },
            ],
        }),
    ],

    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.scss$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [autoprefixer()],
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: { quietDeps: true },
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
};

