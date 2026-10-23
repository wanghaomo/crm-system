import { defineStore } from 'pinia';
import { ref } from 'vue';
import { secureSessionStorage } from './encryptedStorage';
// 模板
export const store = defineStore('mainStore', () => {
    const count = ref(0);
    const countAdd = () => {
        count.value++;
    };
    return {
        count,
        countAdd,
    };
});
// 存储当前路由信息
export const useRouteStore = defineStore(
    'routeStore',
    () => {
        const routerArray = ref([]);
        const setRouterArray = (route) => {
            routerArray.value = route || [];
        };
          // 当前完整的菜单结构-包含所有子路径以及按钮
        const fullMenuTree = ref([]);
        const setFullMenuTree = (menuTree) => {
            fullMenuTree.value = menuTree || [];
        };
        return {
            routerArray,
            fullMenuTree,
            setRouterArray,
            setFullMenuTree
        };
    },
    {
        persist: {
            enabled: true,
            storage: secureSessionStorage('uBk6FgT9XqJ3RnP2sVv5Yy7wZ1c4DmH8'),
        }, // 暂时使用any类型断言解决类型问题
    }
);
