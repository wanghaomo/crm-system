import { defineStore } from 'pinia';
import { ref } from 'vue';
import { secureSessionStorage } from './encryptedStorage';

// 定义用户信息类型
interface UserInfo {
    [key: string]: any;
}

// 用户信息存储
export const useUserStore = defineStore(
    'userStore',
    () => {
        const userInfo = ref<UserInfo | null>(null);
        const setUserInfo = (info: UserInfo) => {
            userInfo.value = info;
        };
        return {
            userInfo,
            setUserInfo,
        };
    },
    {
        persist: {
            enabled: true,
            storage: secureSessionStorage('uBk6FgT9XqJ3RnP2sVv5Yy7wZ1c4DmH8'),
            paths: ['userInfo'], // 只加密敏感字段
        } as any, // 暂时使用any类型断言解决类型问题
    }
);
// 用户权限存储
export const useUserRightsStore = defineStore(
    'userRightsStore',
    () => {
        const userRights = ref<string[]>([]);
        const setUserRights = (rights: string[]) => {
            userRights.value = rights;
        };
        return {
            userRights,
            setUserRights,
        };
    },
    {
        persist: {
            enabled: true,
            storage: secureSessionStorage('uBk6FgT9XqJ3RnP2sVv5Yy7wZ1c4DmH8'),
        } as any, // 暂时使用any类型断言解决类型问题
    }
);