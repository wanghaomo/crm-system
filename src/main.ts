import '../public/public-path';
import './style.css';
import 'vant/lib/index.css';

import { createApp } from 'vue';
import App from './App.vue';
import router, { initQiankunRoutes } from './router';
import { showMessage, addBtnRight } from '@/utils/comm';
import { createDiscreteApi } from 'naive-ui';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import webComponents from './components/index';
import appComponents from './appComponents/index.js';
import qiankunLifeCycle from './qiankun';
import { setApiConfig, setConfig } from '@mx/mx-ui';

import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { mountSubAppVersionGuard } from '@/utils/version-check';
import { HOME_MENU_DATA } from '@/config/global.cfg';
import { menuData } from '@/store/menu';
import { handleRoutes, getDictMapApiFun } from '@/utils/comm';
import { useRouteStore } from '@/store/index.js';
import { useUserRightsStore } from '@/store/userStore';
import { shouldUseMock } from '@/mock';

import '@mx/mx-ui/style.css';
import '@/assets/style/index.postcss';

let instance: any = null;
let history: any = null;
let pinia: any = null;
// 子应用版本守护的卸载钩子，qiankun unmount 时必须释放。
let subAppVersionGuardTeardown: (() => void) | null = null;
// 创建离散API
const { message, dialog } = createDiscreteApi(['message']);
qiankunLifeCycle();
// 拦截报错信息并打印在控制台
// main.js 或 App.vue
// window.addEventListener('unhandledrejection', (event) => {
//     // 检查错误是否与微应用加载失败相关
//     if (
//         event.reason?.message?.includes('Failed to fetch') ||
//         event.reason?.message?.includes('qiankun') ||
//         event.reason?.message?.includes('LOADING_SOURCE_CODE')
//     ) {
//         // 阻止错误继续冒泡到控制台的默认行为
//         event.preventDefault();
//         // 可选：在控制台输出一个静默的日志，方便调试
//         console.error('捕获到微前端加载错误，已阻止向用户显示:', event.reason);
//     }
// });

/**
 * 重写router的push和replace方法，校验路由是否以__QIANKUN_PROPS__.routerBase开头
 * 如果不是，就将路由拼接上__QIANKUN_PROPS__.routerBase
 * @param to
 * @param options
 * @returns
 */

setApiConfig({
    人员选择: {
        responseConfig: {
            field: 'data',
            value: 'code',
            label: 'username',
        },
        url: '/master-data/user/list',
        method: 'POST',
        token: null,
        data: {
            status: 'WORKING',
            needDept: true,
        },
    },
});
/**
 * 开发环境（未登录、启用模拟数据）时准备完整菜单路由。
 * 直接访问业务页面不会经过登录页，需要在此提前注册路由并加载字典，避免页面空白。
 *
 * @returns 菜单路由列表；未启用模拟数据时返回 undefined
 */
function prepareMockRoutes(): any[] | undefined {
    if (!shouldUseMock()) return undefined;
    const { setRouterArray, setFullMenuTree } = useRouteStore();
    const { setUserRights } = useUserRightsStore();
    setUserRights(['*:*:*']);
    const routerList = [HOME_MENU_DATA, ...handleRoutes(menuData)];
    setRouterArray(routerList);
    setFullMenuTree(routerList);
    getDictMapApiFun().catch((error) => {
        console.warn('[mock] 字典加载失败：', error);
    });
    return routerList;
}

function render(props?: any) {
    const { container, routerBase } = props || {};
    // 根据是否在qiankun环境中运行来设置路由基础路径


    pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    window.$message = showMessage(message);
    window.router = router;

    instance = createApp(App);
    instance.use(pinia);
    addBtnRight(instance, pinia);
    instance.use(webComponents); // web自定义组件
    instance.use(appComponents); // app自定义组件

    // 模拟数据模式下提前注册菜单路由，保证任意页面可直接访问
    const mockRoutes = prepareMockRoutes();

    initQiankunRoutes(mockRoutes)
        .then(() => {
            instance.use(router);
            setConfig({
                baseURL: '/apis',
                // baseURL: 'http://115.190.97.25:8070',
                iconPath: import.meta.env.VITE_CUSTOM_ICON_PATH,
                router: router,
            });
            const mountTarget = container
                ? container.querySelector('#app')
                : document.getElementById('app');
            instance.mount(mountTarget);

            // 子应用 mount 成功后启动版本自检，覆盖飞书长驻后台未刷新主应用的场景。
            try {
                if (typeof subAppVersionGuardTeardown === 'function') {
                    subAppVersionGuardTeardown();
                }
                // 传入 router，启用路由变化防抖检查和懒加载 chunk 失败兜底。
                subAppVersionGuardTeardown = mountSubAppVersionGuard({ router });
            } catch (error) {
                console.warn('[version::CRM] 版本守护初始化失败（不影响主流程）：', error);
                subAppVersionGuardTeardown = null;
            }
        })
        .catch((error) => {
            console.error('[crm] 路由初始化或应用挂载失败：', error);
        });
}



function storeTest(props: any) {
    props.setGlobalState &&
        props.setGlobalState({
            ignore: props.name,
            user: {
                name: props.name,
            },
        });
}

// qiankun 生命周期
renderWithQiankun({
    update: () => { },
    mount(props: any) {
        console.log('乾坤——mount');
        // 乾坤props变量
        window.__QIANKUN_PROPS__ = props;
        window.__QIANKUN_ROUTER_BASE__ = props.routerBase;
        window.__POWERED_BY_QIANKUN__ = true;
        storeTest(props);
        render(props);
        instance.config.globalProperties.$onGlobalStateChange = props.onGlobalStateChange;
        instance.config.globalProperties.$setGlobalState = props.setGlobalState;
    },
    bootstrap() {
        console.log('[qiankun] 子应用 bootstrap');
    },
    unmount(props) {
        if (typeof subAppVersionGuardTeardown === 'function') {
            try {
                subAppVersionGuardTeardown();
            } catch (error) {
                console.warn('[version::CRM] 版本守护卸载失败：', error);
            }
            subAppVersionGuardTeardown = null;
        }
        if (instance) {
            instance.unmount();
            if (instance._container) instance._container.innerHTML = '';
            instance = null;
        }
        if (pinia) {
            pinia = null;
        }
    },
});
// 独立运行时直接挂载
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
    window.__POWERED_BY_QIANKUN__ = false;
    render();
}
