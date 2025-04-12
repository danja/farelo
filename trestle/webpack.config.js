import path from 'path';

export default {
    resolve: {
        extensions: ['.js', '.json'],
        alias: {
            '@': path.resolve(process.cwd(), 'js')
        }
    },
    output: {
        filename: '[name].js',
        module: true
    },
    experiments: {
        outputModule: true
    }
};
