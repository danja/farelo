import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default {
    entry: './src/main.js', // Corrected the entry point to match the actual file location
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(process.cwd(), 'src/js') // Adjusted alias to match project layout
        }
    },
    output: {
        filename: '[name].js',
        path: path.resolve(process.cwd(), 'dist/public/js'), // Changed output path to dist/public
    },
    devServer: {
        static: {
            directory: path.resolve(process.cwd(), 'dist/public') // Serve from dist/public
        },
        port: 9090, // Changed the development server port to 9090
        open: true // Automatically open the browser on server start
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                // { from: 'src/html/index.html', to: 'dist/public/index.html' },
                {
                    from: "./src/html/**/*",
                    to: "./dist/public/",
                },
                {
                    from: './src/css/**/*',
                    to: './dist/public/css/'
                } // Copy CSS file to dist/public/css
            ]
        })
    ]
};
