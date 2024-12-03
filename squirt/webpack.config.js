import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default {
    entry: {
        main: ['./src/js/app.js', './src/css/styles.css']
    },
    output: {
        path: path.resolve('public'),
        filename: '[name].bundle.js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/index.html'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css'
        })
    ],
    resolve: {
        extensions: ['.js', '.json']
    },
    devServer: {
        static: {
            directory: path.join(process.cwd(), 'public')
        },
        compress: true,
        hot: true,
        port: 9000
    }
}