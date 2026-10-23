import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import qiankun from 'vite-plugin-qiankun';
// https://vite.dev/config/

// 缓存治理：版本号由 CRM 子应用自身维护，不能依赖主应用版本号。
const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
const APP_VERSION = pkg.version || '0.0.1';
const BUILD_TIME = new Date().toISOString();

/**
 * 在构建产物根目录生成 version.json，供主应用 entry 版本拼接和子应用自检使用。
 * @returns {import('vite').Plugin} Vite 构建插件。
 */
function versionJsonPlugin() {
    return {
        name: 'vite-plugin-crm-version-json',
        apply: 'build',
        closeBundle() {
            try {
                const outDir = path.resolve(process.cwd(), 'dist');
                if (!fs.existsSync(outDir)) {
                    fs.mkdirSync(outDir, { recursive: true });
                }
                const content = JSON.stringify(
                    {
                        version: APP_VERSION,
                        buildTime: BUILD_TIME,
                        app: pkg.name || 'CRM',
                    },
                    null,
                    2
                );
                fs.writeFileSync(path.join(outDir, 'version.json'), content, 'utf-8');
                console.log(
                    `\n✅ [crm-subapp] version.json 已生成: version=${APP_VERSION} buildTime=${BUILD_TIME}`
                );
            } catch (error) {
                console.error('\n❌ [crm-subapp] version.json 生成失败:', error);
            }
        },
    };
}

export default defineConfig(({ command, mode }) => {
    const root = process.cwd();
    const env = loadEnv(mode, root);
    return {
        base: env.VITE_APP_BASE_URL,
        // base: './',
        define: {
            __APP_VERSION__: JSON.stringify(APP_VERSION),
            __BUILD_TIME__: JSON.stringify(BUILD_TIME),
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
            'import.meta.env.VITE_APP_BUILD_TIME': JSON.stringify(BUILD_TIME),
        },
        plugins: [
            vue(),
            qiankun(env.VITE_APP_NAME, {
                useDevMode: mode === 'development'
            }),
            versionJsonPlugin(),
        ],
        optimizeDeps: {
            force: true,
            // 只在需要时预构建依赖
            include: ['vue', 'vue-router', 'pinia']
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@vue-office/pptx': '@vue-office/pptx/lib/v3/index.js'
            },
        },
        server: {
            host: true,
            // 设置端口为8080
            port: 8082,
            // 如果端口被占用，自动增加端口号
            strictPort: true,
            // 配置CORS头信息
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Private-Network': true,
            },
            /**
             * '/apis/master-data': {
                target: 'http://115.190.97.25:8070/master-data',
                changeOrigin: true,
                pathRewrite: {
                    '^/apis/master-data': '',
                },
            },
            '/apis/mes': {
                // target: 'http://192.168.8.216:8099', // 袁旭
                // target: 'http://192.168.8.246:8099',
                // target: 'http://192.168.8.194:8099',// 张少微
                target: 'http://115.190.97.25:8070/mes',
                changeOrigin: true,
                pathRewrite: {
                    '^/apis/mes': '',
                },
            },
            '/apis/mms': {
                target: 'http://115.190.97.25:8070/mms',
                changeOrigin: true,
                pathRewrite: {
                    '^/apis/mms': '',
                },
            },
            '/apis/process': {
                target: 'http://115.190.97.25:8070/process',
                changeOrigin: true,
                pathRewrite: {
                    '^/apis/process': '',
                },
            },
            '/apis/sat': {
                target: 'http://115.190.97.25:8070/sat',
                changeOrigin: true,
                pathRewrite: {
                    '^/apis/sat': '',
                },
            },
            '/apis/basic-resource': {
                target: 'http://115.190.97.25:8070/basic-resource',
                changeOrigin: true,
                pathRewrite: {
                    '^/apis/basic-resource': '',
                },
            },
             */
            proxy: {
                '/apis/basic-resource': {
                    target: 'http://115.190.97.25:8070/basic-resource',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/basic-resource/, ''),
                },
                '/apis/master-data': {
                    target: 'http://115.190.97.25:8070/master-data',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/master-data/, ''),
                },
                '/apis/mes': {
                    // target: 'http://192.168.8.194:8090',
                    target: 'http://115.190.97.25:8070/mes',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/mes/, ''),
                },
                '/apis/mms': {
                    target: 'http://115.190.97.25:8070/mms',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/mms/, ''),
                },
                '/apis/process': {
                    target: 'http://115.190.97.25:8070/process',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/process/, ''),
                },
                '/apis/mx-crm': {
                    // target: 'http://192.168.8.248:8087', // 刘凡
                    // target: 'http://192.168.110.53:8087', // 李映林
                    // target: 'http://192.168.8.184:8087', // 胡
                    target: 'http://115.190.97.25:8070/mx-crm', //测试
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/mx-crm/, '')
                },
                '/apis/mx-tms': {
                    // target: 'http://192.168.8.76:8090',
                    // target: 'http://192.168.8.246:8089',
                    target: 'http://115.190.97.25:8070/mx-tms',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/apis\/mx-tms/, ''),
                }
            },
        },
        build: {
            // 为静态资源生成hash
            hash: true,
            // 去除console.log和debugger
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: false,
                    drop_debugger: true,
                    // 移除未使用的变量和函数
                    unused: true,
                    // 合并变量
                    collapse_vars: true,
                    // 内联常量
                    inline: true,
                    // 压缩布尔值
                    booleans: true
                },
                mangle: {
                    // 混淆变量名
                    toplevel: true,
                    // 禁用属性名混淆，避免微前端库出现问题
                    properties: false
                }
            },
            // 配置chunk大小限制
            chunkSizeWarningLimit: 800,
            // 生成构建分析报告
            analyze: true,
            // 配置rollup选项
            rollupOptions: {
                external: (id) => {
                    // 忽略 src/assets/fonts 目录下的所有字体文件
                    return id.includes('/src/assets/fonts/');
                },
                // 代码分割配置
                output: {
                    // 按照文件类型分类输出，直接与index.html平级
                    chunkFileNames: 'js/[name]-[hash].js',
                    entryFileNames: 'js/[name]-[hash].js',
                    assetFileNames: (assetInfo) => {
                        // 根据资源类型进行不同的输出目录
                        let extType = assetInfo.name.split('.').pop();

                        // 图片资源
                        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extType)) {
                            return `images/[name]-[hash].[ext]`;
                        }

                        // 样式资源
                        if (['css', 'less', 'scss', 'sass'].includes(extType)) {
                            return `css/[name]-[hash].[ext]`;
                        }

                        // 字体资源
                        if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(extType)) {
                            return `fonts/[name]-[hash].[ext]`;
                        }

                        // 默认资源
                        return `[name]-[hash].[ext]`;
                    },
                    manualChunks: (id) => {
                        if (!id.includes('node_modules')) {
                            return;
                        }

                        if (/[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/.test(id)) {
                            return 'vendor';
                        }
                        if (/[\\/]node_modules[\\/](naive-ui|@css-render|css-render|@juggle\/resize-observer|async-validator|vueuc)([\\/]|$)/.test(id)) {
                            return 'naive-ui';
                        }
                        if (/[\\/]node_modules[\\/]vant[\\/]/.test(id)) {
                            return 'vant';
                        }
                        if (/[\\/]node_modules[\\/]@wangeditor[\\/]/.test(id)) {
                            return 'wang-editor';
                        }
                        if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) {
                            return 'chart';
                        }
                        if (/[\\/]node_modules[\\/](lodash|dayjs|axios)[\\/]/.test(id)) {
                            return 'utils';
                        }
                        if (/[\\/]node_modules[\\/](mui-player|flv\\.js|hls\\.js|xgplayer)[\\/]/.test(id)) {
                            return 'player';
                        }
                        if (/[\\/]node_modules[\\/]ssh2[\\/]/.test(id)) {
                            return 'ssh2';
                        }
                        if (/[\\/]node_modules[\\/](pdfjs-dist|vue-pdf-embed|vue3-pdfjs)[\\/]/.test(id)) {
                            return 'pdf';
                        }

                        return 'vendor';
                    }
                },
                // 启用treeshaking
                treeshake: {
                    moduleSideEffects: false,
                    propertyReadSideEffects: false,
                    unknownGlobalSideEffects: false
                }
            },
            // 启用CSS提取
            cssCodeSplit: true,
            // 禁用生成sourcemap
            sourcemap: false,
            // 启用brotli压缩
            brotliSize: true,
            // 减小预加载的模块大小
            modulePreload: {
                resolveDependencies: (filename, deps, { hostId, hostType }) => {
                    // 过滤掉不需要预加载的依赖
                    return deps.filter(dep => {
                        // 只预加载核心依赖
                        return dep.includes('vue') || dep.includes('router') || dep.includes('pinia');
                    });
                }
            }
        },
    }
});
