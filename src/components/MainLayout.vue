<template>
    <template v-if="_isApp">
        <router-view></router-view>
        <div v-if="showFeedback">
            <MxFeedback
                :person="{
                    code: userInfo?.code || '',
                    username: userInfo?.username || '',
                }"></MxFeedback>
        </div>
    </template>
    <template v-else>
        <!-- <MxHeader v-if="showHeader"></MxHeader> -->
        <n-layout has-sider>
            <n-layout-sider
                class="menu-sider"
                bordered
                show-trigger
                collapse-mode="width"
                :collapsed-width="64"
                :width="240"
                :native-scrollbar="false"
                :inverted="inverted"
                :style="`height: calc(100vh - ${56}px);`">
                <n-menu
                    :inverted="inverted"
                    :collapsed-width="64"
                    :collapsed-icon-size="22"
                    :value="selectedMenu"
                    :options="menuOptions"
                    :expanded-keys="expandedMenuKeys"
                    @update:value="handleMenuSelect"
                    @update:expanded-keys="handleMenuExpand" 
                     />
            </n-layout-sider>
            <n-layout-content class="scrollable-content" :style="`height: calc(100vh - ${56}px);`">
                <div class="page-main">
                    <div class="page-main__content">
                        <router-view></router-view>
                    </div>
                </div>
            </n-layout-content>
        </n-layout>
    </template>
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { handleMenuRoutes, isApp, handleNavRoutes, flattenRoutes } from '@/utils/comm';
const _isApp = isApp();
import { NMenu, NLayout, NLayoutSider, NLayoutContent } from 'naive-ui';
import { ref } from 'vue';
import { MenuItem } from '@/types/index';
import { useRouteStore } from '@/store/index.js';
import { storeToRefs } from 'pinia';
const { fullMenuTree, routerArray } = storeToRefs(useRouteStore());
import { MxFeedback } from '@mx/mx-ui';
import { useUserStore } from '@/store/userStore';
import { useRoute } from 'vue-router';
const { userInfo } = storeToRefs(useUserStore());
const menuOptions = ref<any[]>([]);
const inverted = ref(false);
const $router = useRouter();
const route = useRoute();
const menuObj = ref<{ [name: string]: string[] }>({});
const pathNameArray = ref<string[]>([]);
// 选中的菜单
const selectedMenu = ref('');
// 展开的菜单
const expandedMenuKeys = ref<string[]>([]);
// 菜单是否已完成首次构建，用于默认展开全部分组
let menuInitialized = false;
// 扁平化处理后的路由数据
const flatRoutes = ref<any[]>(flattenRoutes(fullMenuTree.value));
// const showHeader = computed(() => {
//     return !window.__POWERED_BY_QIANKUN__;
// });
// 监测当前路由对应的菜单
const getSelectedMenu = () => {
    const router = $router.currentRoute.value;
    if (Object.keys(menuObj.value).length > 0) {
        pathNameArray.value = menuObj.value[router.meta.code as string] || [];
    }
    selectedMenu.value = router.meta.code || 'home';
    // 通过路由的meta.code获取对应的flatRoutes，
    const currRoute = flatRoutes.value.find((item) => item.code === router.meta.code);
    console.log('当前路由的数据--router', router);
    console.log('当前路由的数据', currRoute);
    console.log('当前路由的数据-列表', menuOptions.value);

    // selectedMenu.value = router.meta.parentCode as string;
    if (currRoute && currRoute.type === 'BTN') {
        // 按钮-通常本地注册
        selectedMenu.value = router.meta.parentCode as string;
    } else {
        if (currRoute && currRoute.meta && currRoute.visible === false) {
            selectedMenu.value = router.meta.parentCode as string;
        } else {
            selectedMenu.value = router.meta.code as string;
        }
    }
      syncExpandedMenu();
};
const showFeedback = computed(() => {
    
    // 判断当前是否在登录页，或者当前是否仅有‘/’
    if (route.path.startsWith('/login')) {
        return false;
    }else if (route.path === '/') {
        return false;
    }
    const token = sessionStorage.getItem('mx_token');
    return token !== null;
});
/**
 * 递归查找菜单项的所有父级 key，用于展开对应的 submenu。
 *
 * @param options 菜单树节点列表
 * @param targetKey 目标菜单 key
 * @param parentKeys 当前递归层级的父级 key 列表
 * @returns 父级 key 列表，未找到目标菜单时返回 null
 */
const findMenuParentKeys = (
    options: any[],
    targetKey: string,
    parentKeys: string[] = []
): string[] | null => {
    for (const item of options) {
        if (item.key === targetKey) {
            return parentKeys;
        }

        if (item.children?.length) {
            const result = findMenuParentKeys(item.children, targetKey, [...parentKeys, item.key]);
            if (result) {
                return result;
            }
        }
    }

    return null;
};
/**
 * 递归收集所有含子菜单的节点 key。
 *
 * @param options 菜单树节点列表
 * @returns 所有分组节点的 key 列表
 */
const collectGroupKeys = (options: any[]): string[] => {
    return (options || []).flatMap((item: any) => {
        if (!item.children?.length) return [];
        return [item.key, ...collectGroupKeys(item.children)];
    });
};
/**
 * 根据当前激活菜单同步左侧菜单的展开状态。
 * 与已展开的分组合并，避免路由变化时把用户手动展开的菜单收起。
 */
const syncExpandedMenu = () => {
    const routeParentKeys = findMenuParentKeys(menuOptions.value, selectedMenu.value) || [];
    expandedMenuKeys.value = Array.from(new Set([...expandedMenuKeys.value, ...routeParentKeys]));
};
/**
 * 处理用户手动展开或收起菜单的事件。
 *
 * @param keys 当前展开的 submenu key 列表
 */
const handleMenuExpand = (keys: string[]) => {
    expandedMenuKeys.value = keys;
};
// 监听路由变化
watch(
    () => $router.currentRoute.value,
    (router: any) => {
        getSelectedMenu();
    },
    {
        immediate: true,
        deep: true,
    }
);
watch(
    () => routerArray.value,
    (router: any) => {
        if (router) {
            // flatRoutes.value = flattenRoutes(router);
            menuOptions.value = handleMenuRoutes(router);
            console.log('当前路由的数据-列表222', menuOptions.value);
            // 首次构建菜单时默认展开所有分组，保证完整菜单树可见
            if (!menuInitialized) {
                expandedMenuKeys.value = collectGroupKeys(menuOptions.value);
                menuInitialized = true;
            }
            menuObj.value = handleNavRoutes(router);
            pathNameArray.value = menuObj.value[$router.currentRoute.value.meta.code as string] || [];
            getSelectedMenu();
        }   
    },
    {
        deep: true,
        immediate: true,
    }
);
watch(
    () => fullMenuTree.value,
    (router: any) => {
        if (router) {
            flatRoutes.value = flattenRoutes(router);
            getSelectedMenu();
        }
    },
    {
        deep: true,
        immediate: true,
    }
);
// 菜单选中
const handleMenuSelect = (key: string, item: MenuItem) => {
    if (item.path) {
        $router.push(item.path);
    }
};
</script>
<style lang="postcss" scoped>
.menu-sider {
    :deep(.n-submenu-children .n-menu-item-content) {
        padding-left: 72px !important;
    }
}

.scrollable-content {
    overflow-x: auto;
    flex-grow: 1;

    &::v-deep(.n-layout-scroll-container) {
        /* 自定义最小宽度 */
    }
}

.page-main {
    background-color: var(--base-grey3);
    height: 100%;

    .page-main__content {
        height: 100%;
        overflow-y: auto;
        font-size: 14px;

        > div {
            height: 100%;
        }
    }
}
</style>
