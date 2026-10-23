<template>
    <div
    v-if="!isQiankun"
        :class="{
            'login-container': true,
            'app-login-container': _isApp,
        }">
        <div class="loading"></div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ticketValidateApi, getUserBaseinfoApi, getTrackingPointApi } from '@/api/index';
import { handleRoutes, isApp, getLocationSearchObj, getDictMapApiFun,handleNavRoutes } from '@/utils/comm';
import { setFullMenuTree as setUiFullMenuTree } from '@mx/mx-ui';
import { goToHome } from '@/router/routeUtils';
import { HOME_MENU_DATA } from '@/config/global.cfg';
import { menuData } from '@/store/menu';
import { useRouteStore } from '@/store/index.js';
import { initQiankunRoutes } from '@/router';
const { setRouterArray, setFullMenuTree } = useRouteStore();
import { useUserStore, useUserRightsStore } from '@/store/userStore';
const { setUserInfo } = useUserStore();
const { setUserRights } = useUserRightsStore();
// 记录进入应用时的原始 hash 路径，路由注册完成后按此路径跳转，支持直接访问业务页面
const initialHashPath = window.location.hash.replace(/^#/, '');
const $router = useRouter();
const route = useRoute();
const _isApp = isApp();
// 逻辑是否正常(接口正常，会正常跳转路由)
const isLoginSuccess = ref(false);
// 判断是否当前运行在qiankun环境
const isQiankun = window?.__QIANKUN_PROPS__;
// 关闭主应用
// 关闭主应用
const closeSystemLoading = (back?:()=>void) => {
    let props = window?.__QIANKUN_PROPS__;
    if (props && props.loginSuccess) {
        props.loginSuccess(!isLoginSuccess.value,back);
    } else {
        try {
            window.systemLoadingDom?.hide(!isLoginSuccess.value,back);
        } catch (err) {
            console.log('隐藏loading失败', err);
        }
    }
};
onBeforeUnmount(() => {
    if(!isLoginSuccess.value){
        closeSystemLoading();
    }   
});
// 获取地址栏参数
onBeforeMount(async () => {
    // 去除登录验证：直接进入系统，跳过 token/ticket 校验
    skipLogin();
    // let props = window?.__QIANKUN_PROPS__;
    // if (props && props.token) {
    //     await tokenLogin(props);
    // } else {
    //     await ticketLogin();
    // }
    // await getDictMapApiFun();
});

// token登录
async function tokenLogin(props: { path?: string; systemCode: string }) {
    const { systemCode, path } = props;
    let _result = await getUserBaseinfoApi('mx-crm');
    if (_result.code == 200) {
        getTrackingPointApi(systemCode);
        sessionStorage.setItem("systemCode", systemCode);
        console.log('token登录', _result);
        
        // 登录成功并获取用户基础信息，触发事件更新登录状态
        // 存储用户信息
        setUserInfo(_result.data.user);
        // 存储用户权限
        setUserRights(_result.data.operPerms || []);
     
        // 存储用户菜单
        let routerList = [HOME_MENU_DATA, ...handleRoutes(_result.data.menuTree)];
     
        if (import.meta.env.VITE_NODE == 'development') {
            // routerList = [HOME_MENU_DATA, ...handleRoutes(menuData)]; // 开发环境
        }

        setRouterArray(routerList);

        // TODO: 动态传入完整菜单树到 mx-ui
        const fullMenu = [HOME_MENU_DATA, ...handleRoutes(_result.data.fullMenuTree)];
        setFullMenuTree(fullMenu);
        setUiFullMenuTree(handleNavRoutes(fullMenu));
        const path: string = (getLocationSearchObj().path as string) || '';
        console.log("要跳转的地址",path);
        
 if (path) {
                    // 判断是否有指定跳转路径，如果有指定路径，将其存储到sessionStorage中，并在home页面跳转，以保持路由栈的完整。
                    sessionStorage.setItem('targetPath', path);
                } else {
                    sessionStorage.removeItem('targetPath');
                }
        initQiankunRoutes(routerList).then(() => {
            closeSystemLoading()
            // 执行路由添加方法，并在回调后跳转路由，保障路由正确性
            setTimeout(() => {
                try {
                    $router.replace('/home/index');
                } catch (error) {
                    console.log('路由跳转失败', error);
                }
            }, 500);
        });

    } else {
        /** 直接跳转到门户首页 */
        // window.location.href = import.meta.env.VITE_LOGIN_URL as string;
        const routerList = [HOME_MENU_DATA, ...handleRoutes(menuData)];
        setRouterArray(routerList);
        $router.push('/home/index');
        window.$wujie?.bus.$emit('loadError', '登录失败，请重新登录！');
    }
}
// 通过ticket登录
async function ticketLogin() {
    let _ticket = getLocationSearchObj() || $router.currentRoute.value.query;
    console.log('ticket登录参数', _ticket);
    const hrefData = getLocationSearchObj();
    if (!_ticket || !_ticket.ticket) {
        /** 直接跳转到门户首页 */
        goToHome('ticket登录失败');
    } else {
        /** 发起ticket认证，如果认证通过则会获取到token与用户权限、菜单 */
        let _tokenRes = await ticketValidateApi(_ticket.ticket as string);
        if (_tokenRes.code == 200) {
            sessionStorage.setItem('mx_token', _tokenRes.data);
            // let _result = await getUserBaseinfoApi(_ticket.syscode as string);
             let _result = await getUserBaseinfoApi('mx-crm');
            console.log('ticket登录结果', _result);
            if (_result.code == 200) {
                getTrackingPointApi(_ticket.syscode);
                sessionStorage.setItem("systemCode", _ticket.syscode);
                // 存储用户信息
                setUserInfo(_result.data.user);
                // 存储用户权限
                setUserRights(_result.data.operPerms || []);
                // 存储用户菜单
                let routerList = [HOME_MENU_DATA, ...handleRoutes(_result.data.menuTree)];
            
                setRouterArray(routerList);

                // TODO: 动态传入完整菜单树到 mx-ui，后续启用
                const fullMenuForTicket = [HOME_MENU_DATA, ...handleRoutes(_result.data.fullMenuTree)];
                setFullMenuTree(fullMenuForTicket);
                setUiFullMenuTree(handleNavRoutes(fullMenuForTicket));
                const path = hrefData?.path || route.query.path;
                if (path) {
                    // 判断是否有指定跳转路径，如果有指定路径，将其存储到sessionStorage中，并在home页面跳转，以保持路由栈的完整。
                    sessionStorage.setItem('targetPath', path);
                } else {
                    sessionStorage.removeItem('targetPath');
                }

                console.log('routerList', routerList);

                initQiankunRoutes(routerList).then(() => {
                    closeSystemLoading()
                    // 执行路由添加方法，并在回调后跳转路由，保障路由正确性
                    setTimeout(() => {
                        try {
                            $router.replace('/home/index');
                        } catch (error) {
                            console.log('路由跳转失败', error);
                        }
                    }, 500);
                });
            } else {
                /** 直接跳转到门户首页 */
                goToHome(_result.msg || '应用信息获取失败');
            }
        } else {
            /** 直接跳转到门户首页 */
            goToHome(_tokenRes.msg || '应用信息获取失败');
        }
    }
}
// 临时绕开登录
async function skipLogin() {
    setUserRights(['*:*:*']);
    // 模拟登录用户信息，供头部与各业务组件使用
    setUserInfo({
        code: 'U001',
        username: '张伟',
        larkUserId: 'demo-lark-user',
        avatar: '',
        userDeptList: [{ code: 'D001', name: '销售部' }],
    });
    const routerList = [HOME_MENU_DATA, ...handleRoutes(menuData)];
    setRouterArray(routerList);
    // 菜单树与路由使用同一份数据，保证全部菜单可展示
    setFullMenuTree(routerList);
    // 加载字典，避免下拉与状态文案显示为编码
    await getDictMapApiFun();
    initQiankunRoutes(routerList).then(() => {
        // 执行路由添加方法，并在回调后跳转路由，保障路由正确性
        setTimeout(() => {
            try {
                // 优先使用进入应用时的原始 hash 路径，避免刷新或深链时被强制跳回首页
                const isValidPath = initialHashPath && !initialHashPath.includes('/login');
                const targetPath = isValidPath ? initialHashPath : '/home/index';
                const matched = $router.resolve(targetPath).matched.some((item: any) => item.name && item.name !== '404');
                $router.replace(matched ? targetPath : '/home/index');
            } catch (error) {
                console.log('路由跳转失败', error);
            }
        }, 500);
    });
}
</script>
<style lang="less" scoped>
.login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;

    >.brand {
        display: block;
        height: 6.4rem;
        width: 6.4rem;
        background: url('@/assets/images/logo.png') center center / 100% 100% no-repeat;
    }

    >.sub-title,
    >.title {
        display: block;
        text-align: center;
        font-size: 1.1rem;
        margin-bottom: 10px;
        color: var(--base-color);
    }

    >.sub-title {
        font-size: 0.65rem;
    }

    >.loading {
        display: block;
        position: relative;
        height: 200px;
        width: 200px;

        background: url(@/assets/images/loading.png) center center / 100% 100% no-repeat;
    }
}

.app-login-container {
    .loading {
        width: 160px;
        height: 160px;
    }
}

@keyframes loading-loop {
    0% {
        transform: rotate(0deg);
    }

    50% {
        transform: rotate(180deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
