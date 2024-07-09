const path = require('node:path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = function (options = {}, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    // JUST KEEP THEM
    mode: 'production',
    target: 'node',
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...(options.plugins || []),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: '.env',
            to: '[name][ext]',
          },
          {
            from: 'package.json',
            to: '[name][ext]',
          },
          {
            from: 'node_modules/**/.prisma/client/*.node',
            to: () => Promise.resolve('[path][name][ext]'),
            globOptions: {
              dot: true,
            },
          },
          {
            from: 'src/module/common/service/gen/gen-template',
            to: 'gen-template',
            globOptions: {
              dot: true,
            },
          },
        ],
      }),
      new WriteFilePlugin(),
    ],
  };
};
