/**
 * qiankun 子应用生命周期配置
 */

let instance = null;

/**
 * 初始化 qiankun 生命周期钩子
 */
export default function qiankunLifeCycle() {
    // 监听 qiankun 全局状态变化
    if (window.__POWERED_BY_QIANKUN__) {
        // 可以在这里添加一些 qiankun 相关的全局逻辑
        console.log('[qiankun] 当前运行在 qiankun 子应用环境中');
    }
}
