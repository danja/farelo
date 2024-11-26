import webpack from 'webpack';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: './src/browser-entry.js',
    output: {
        filename: 'main.bundle.js',
        path: path.resolve(__dirname, 'src/public/webpack'),
        library: {
            name: 'FormAMatic',
            type: 'umd',
            export: 'default'
        },
        globalObject: 'this'
    },
    mode: 'development',
    target: 'web',
    resolve: {
        fallback: {
            "stream": require.resolve('stream-browserify'),
            "buffer": require.resolve('buffer/')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        }),
        new HtmlWebpackPlugin({
            template: './src/public/foaf-form.html',
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'src/public'),
        },
        open: true,
        port: 9000,
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
            }
        ]
    }
};