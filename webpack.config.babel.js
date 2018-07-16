import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import cleanWebpackPlugin from 'clean-webpack-plugin'
import CompressionWebpackPlugin from 'compression-webpack-plugin'

export default {
    entry: './src/js/index.js',
    output: {
        path: __dirname + '/lib',
        filename: 'build-[hash].js'
    },
    //监测错误使用  生产
    devtool: 'eval-source-map',
    module: {
        rules: [{
            test: /\.(js)$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                }
            },
            exclude: /node_modules/,
        }, {
            test: /\.css/,
            use: [{
                loader: 'style-loader'
            }, {
                loader: "css-loader",
            },]
        }, {
            test: /\.(png|jpg|gif)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]'
                }
            }]
        }, {
            test: /\.(htm|html)$/,
            use: [{
                loader: 'html-withimg-loader'
            }]
        }]
    },
    plugins: [
        new webpack.BannerPlugin('版权所有，翻倍必究，刘志飞'),
        new HtmlWebpackPlugin({
            template: __dirname + '/index.html',
            inject: 'head'

        }), //ID
        new webpack.optimize.OccurrenceOrderPlugin(),
        //压缩
        new webpack.optimize.UglifyJsPlugin(),
        new cleanWebpackPlugin(['./lib']),
        //压缩 gzip  不会用
        // new CompressionWebpackPlugin({
        //     asset: '[path].gz[query]',
        //     algorithm: 'gzip',
        //     test: new RegExp(
        //         '\\.(js|css)$'
        //     ),
        //     threshold: 10240,
        //     minRatio: 0.8,
        // })
    ]
}