// postcss.config.js
import { loadEnv } from 'vite';
import postcssPresetEnv from 'postcss-preset-env';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import cssnano from 'cssnano';

// 加载 .env 文件中的环境变量
const env = loadEnv(
  process.env.NODE_ENV || 'development',
  process.cwd()
);

export default (ctx) => ({
  parser: ctx.parser ? 'sugarss' : false,
  map: ctx.env === 'development' ? ctx.map : false,
  plugins: [
    postcssImport(),
    postcssNested(),
    postcssPresetEnv({
      stage: 2,
      browsers: 'last 2 versions',
    }),
    ...(ctx.env === 'production' ? [cssnano()] : [])
  ]
});
