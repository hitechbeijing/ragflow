import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { defineConfig } from 'umi';
import { appName } from './src/conf.json';
import routes from './src/routes';
const fs = require('fs');
const envFilePath = path.resolve(__dirname, '../docker/.env');
console.log(envFilePath);

let envDocker: any = {};

try {
  if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    envDocker = envContent
      .split('\n')
      .filter((line: string) => line && !line.startsWith('#'))
      .reduce((acc: any, line: string) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          acc[key.trim()] = valueParts.join('=').trim();
        }
        return acc;
      }, {});
  }
} catch (error) {
  console.error('Error loading .env file:', error);
}
console.log(envDocker);

export default defineConfig({
  title: appName,
  outputPath: 'dist',
  alias: { '@parent': path.resolve(__dirname, '../') },
  npmClient: 'npm',
  base: '/',
  routes,
  publicPath: '/',
  esbuildMinifyIIFE: true,
  icons: {},
  hash: true,
  favicons: ['/logo.svg'],
  clickToComponent: {},
  history: {
    type: 'browser',
  },
  plugins: [
    '@react-dev-inspector/umi4-plugin',
    '@umijs/plugins/dist/tailwindcss',
  ],
  jsMinifier: 'none', // Fixed the issue that the page displayed an error after packaging lexical with terser
  lessLoader: {
    modifyVars: {
      hack: `true; @import "~@/less/index.less";`,
    },
  },
  devtool: 'source-map',
  copy: [
    { from: 'src/conf.json', to: 'dist/conf.json' },
    { from: 'node_modules/monaco-editor/min/vs/', to: 'dist/vs/' },
  ],
  proxy: [
    {
      context: ['/api', '/v1'],
      target: 'http://127.0.0.1:9380/',
      changeOrigin: true,
      ws: true,
      logger: console,
      // pathRewrite: { '^/v1': '/v1' },
    },
  ],

  chainWebpack(memo, args) {
    memo.module.rule('markdown').test(/\.md$/).type('asset/source');

    memo.optimization.minimizer('terser').use(TerserPlugin); // Fixed the issue that the page displayed an error after packaging lexical with terser

    return memo;
  },
  tailwindcss: {},
  define: {
    //get var on env forward to browser
    HIDE_SIGNUP: envDocker['HIDE_SIGNUP'] || '0',
  },
});
