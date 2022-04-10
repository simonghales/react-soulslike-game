
const { override, addExternalBabelPlugins } = require('customize-cra');
const WorkerPlugin = require('worker-plugin');

const addWorker = config => {
    config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
    })
    config.module.rules.push({
        test: /\.worker\.ts$/,
        use: { loader: 'worker-loader' },
    })
    config.plugins.push(new WorkerPlugin({
        filename: '[name].js'
    }));
    return config;
}

module.exports = override(...addExternalBabelPlugins(
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-proposal-class-properties'
), addWorker)
