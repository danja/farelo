import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'web',
    resolve: {
        extensions: ['.js', '.json'],
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
            "crypto": require.resolve("crypto-browserify"), // Add this line
        },
    },
    // Add this section to provide a mock for the 'canvas' module
    module: {
        rules: [
            {
                test: /canvas/,
                use: 'null-loader'
            }
        ]
    }
};