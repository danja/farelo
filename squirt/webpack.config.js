import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default {
    entry: {
        main: ['./src/js/app.js', './src/css/styles.css', './src/css/form-styles.css']
    },
    output: {
        path: path.resolve('public'),
        filename: '[name].bundle.js',
        clean: true
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: '/'
                        }
                    },
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
    devServer: {
        static: {
            directory: path.join(process.cwd(), 'public')
        },
        compress: true,
        hot: true,
        port: 9000,
        devMiddleware: {
            writeToDisk: true
        }
    }
};