import webpack from 'webpack';
const { ProvidePlugin } = webpack
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: './src/browser-entry.js',
    //    externals: {
    //      'rdf': 'rdf-ext',
    //    'N3Writer': '@rdfjs/parser-n3'
    // Add other libraries that can be loaded via <script> tags
    // },
    output: {
        //filename: 'main.bundle.js',
        filename: '[name].bundle.js', // dynamic
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
        extensions: ['.js', '.json'],
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer/")
        }
        /*
        fallback: {
            "fs": false,
            "path": require.resolve("path-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/"),
            "zlib": require.resolve("browserify-zlib"),
            "os": require.resolve("os-browserify/browser"),
            "vm": require.resolve("vm-browserify"),
            "url": require.resolve("url/"),
            "net": false,
            "tls": false,
            "child_process": false,
            "crypto": require.resolve("crypto-browserify"),
            "process": require.resolve("process/browser")
        },
        */
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
        /*
        //    new BundleAnalyzerPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new ProvidePlugin({
            process: 'process/browser'
        }),
*/
    ],
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
        /*
        rules: [
            {
                test: /canvas/,
                use: 'null-loader'
            }
        ]
            */
    },
    optimization: {
        minimize: false,
        splitChunks: {
            chunks: 'all',
            name: false, // Disable naming chunks to avoid conflicts
        },
    },
    devtool: 'source-map',
};