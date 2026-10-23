// 动态导入组件
import { getLocationSearchObj, isApp } from '@/utils/comm';
import { showSuccessToast, showFailToast, showToast } from 'vant';
// 动态导入组件
const modules = import.meta.glob('../views/**/*.vue');
export const loadView = (viewPath) => {
    let targetPath = viewPath;
    // 移除系统代码前缀
    if (targetPath.startsWith(`${import.meta.env.VITE_APP_SYSTEM_CODE}/`)) {
        targetPath = targetPath.replace(`${import.meta.env.VITE_APP_SYSTEM_CODE}`, '');
    }
    
    // 确保路径以斜杠开头
    if (!targetPath.startsWith('/')) {
        targetPath = `/${targetPath}`;
    }
    console.log("所有模块=====",modules);
    
    // 查找匹配的模块
    for (const path in modules) {
        const matchPath = path.replace('../views', '').replace('.vue', '');
        if (matchPath === targetPath) {
            console.log("匹配到的模块=====",targetPath,modules[path]);
            
            return modules[path];
        }
    }
    
    console.log(targetPath, ">>>>>>>>>>404");
    return () => import('@/views/404.vue');
};

// 转换后端路由为前端格式
export const transformRoutes = (routes) => {
    function getCommponent(url) {
        return url ? loadView(url) : '';
    }
    return (routes || []).map((route) => ({
        ...route,
        name: route.code,
        label: route.name,
        meta: {
            ...(route.meta || {}),
            parentCode: route.parentCode || '',
        },
        component: getCommponent(route.filePath || route.path),
        children: route.children ? transformRoutes(route.children) : [],
    }));
};

/**
 * 校验路由是否以__QIANKUN_PROPS__.routerBase开头
 * 这里需要将/加入，防止路由本身就存在__QIANKUN_PROPS__.routerBase+xxx的情况
 */
export const checkRouterPath = (path) => {
    let base = '';
    if (window.__QIANKUN_PROPS__ && window.__QIANKUN_PROPS__.routerBase) {
        base = window.__QIANKUN_PROPS__.routerBase;
        // VITE_APP_SYSTEM_CODE
    } else {
        base = import.meta.env.VITE_APP_SYSTEM_CODE;
    }
    return path.startsWith(base + '/');
};

/**
 * token失效，返回登录页面
 */
export function goToLogin(error) {
    if (error) {
        // if (isApp()) {
        //     showFailToast({
        //         message: error || '操作失败',
        //         duration: 2000,
        //     });
        // } else {
        //     console.error(error || '操作失败');
        // }
        window.$message.error(error || '操作失败', 2000);
    }
    setTimeout(() => {
        if (window.__QIANKUN_PROPS__ && window.__QIANKUN_PROPS__.goToLogin) {
            // window.__QIANKUN_PROPS__.goToLogin();
        } else {
            const hrefData = getLocationSearchObj();
            const redirectUrl = hrefData?.redirectUrl
                ? decodeURIComponent(hrefData.redirectUrl)
                : import.meta.env.VITE_LOGIN_URL;
            // 清除浏览器所有路由栈
            //  window.location.href = redirectUrl;
        }
    }, 1000);
}
/*
 * 退出到首页
 * @param {boolean} isError 是否是错误退出，默认false
 */
export function goToHome(error) {
    console.log('退出到首页', error);
    if (error) {
        console.log('window.$message', window.$message);

        window.$message.error(error || '操作失败', 2000);
    }
    setTimeout(() => {
        if (window.__QIANKUN_PROPS__ && window.__QIANKUN_PROPS__.backHome) {
            window.__QIANKUN_PROPS__.backHome();
        } else {
            const hrefData = getLocationSearchObj();
            let redirectUrl = hrefData?.redirectUrl
                ? decodeURIComponent(hrefData.redirectUrl)
                : import.meta.env.VITE_HOME_URL;
                // 判断redirectUrl是否有‘#/home’，没有则添加‘#/home’
                if (!redirectUrl.includes('#/home')) {
                    redirectUrl += '/#/home';
                }
            console.log("redirectUrl地址",redirectUrl,import.meta.env.VITE_HOME_URL);
            
            window.location.href = redirectUrl;
        }
    }, 1000);
}

// 乾坤微应用路由前缀处理
export function addRouterPrefix(path) {
    if (!window.__POWERED_BY_QIANKUN__ || !window.__QIANKUN_ROUTER_BASE__) {
        return path;
    }
    const prefix = `${window.__QIANKUN_ROUTER_BASE__}`;

    if (path.startsWith(prefix)) {
        return path;
    }
    if (path.startsWith('/')) {
        return `${prefix}${path}`;
    }
    return `${prefix}/${path}`;
}
// 归一化路由路径
export function normalizePath(path) {
    return path.replace(/\/+/g, '/');
}
// 移除乾坤路由前缀
export function removeRouterPrefix(path) {
    if (!window.__POWERED_BY_QIANKUN__ || !window.__QIANKUN_ROUTER_BASE__) {
        return path;
    }
    // 这里window.__QIANKUN_ROUTER_BASE__包含了前缀'/'，需要移除
    const prefix = `${window.__QIANKUN_ROUTER_BASE__}`;
    if (path.startsWith(prefix)) {
        const result = path.substring(prefix.length);
        return result || '/';
    }

    return path;
}

// 构建路由
/**
 * 构建应用路由配置
 * 支持在微前端环境（Qiankun）和独立环境下的路由处理
 *
 * @returns {Array} 处理后的路由配置数组
 */
export function buildRoutes(_routes = []) {
    // 检查是否在Qiankun微前端环境中运行，并且是否有路由基础路径配置
    // 如果不在微前端环境或没有路由基础路径，则直接返回原始路由配置
    if (!window.__POWERED_BY_QIANKUN__ || !window.__QIANKUN_ROUTER_BASE__) {
        return _routes;
    }

    // 在微前端环境中，为每个路由添加前缀并标准化路径
    return _routes.map((route) => {
        // 深拷贝路由对象，避免修改原始路由配置
        const newRoute = { ...route };
        
        // 处理路由路径，添加前缀并标准化
        if (newRoute.path) {
            newRoute.path = normalizePath(addRouterPrefix(newRoute.path));
        }
        // 处理重定向路径，添加前缀并标准化
        if (newRoute.redirect) {
            newRoute.redirect = normalizePath(addRouterPrefix(newRoute.redirect));
        }


        return newRoute;
    });
}
