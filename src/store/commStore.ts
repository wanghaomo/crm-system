import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SelectOption } from '@/components/CommSelect/index.type';
import { secureSessionStorage } from './encryptedStorage';
type dictType = {
    [key: string]: any;
};
// 全局字典
export const useDictStore = defineStore(
    'dictStore',
    () => {
        // 全局字典对象
        const dictMap = ref<dictType | null>(null);
        // 设置全局字典
        const setDictMap = (map: dictType | null) => {
            dictMap.value = map;
        };
        // 单独设置一个字典对象
        const setDictMapByName = (name: string, map: Array<any>) => {
            // 字典尚未初始化时先兜底为空对象，避免页面单独缓存人员等数据时报错
            if (!dictMap.value) {
                dictMap.value = {};
            }
            dictMap.value[name] = map;
        };
        return {
            dictMap,
            setDictMap,
            setDictMapByName,
        };
    },
    {
        persist: {
            enabled: true,
            storage: secureSessionStorage('uBk6FgT9XqJ3RnP2sVv5Yy7wZ1c4DmH8'),
        } as any, // 暂时使用any类型断言解决类型问题
    }
);

// 全局不缓存数据
export const useNoCacheStore = defineStore(
    'noCacheStore',
    () => {
        // 全局下拉选择组件数据
        const selectMap = ref<{
            [name: string]: {
                time: number; // 当时数据写入的时间戳，用于判断是否需要刷新数据
                data: SelectOption[];
            };
        }>({});
        // 设置全局下拉选择组件数据
        const setSelectMap = (
            name: string,
            map: {
                time: number; // 当时数据写入的时间戳，用于判断是否需要刷新数据
                data: SelectOption[];
            }
        ) => {
            selectMap.value[name] = map;
        };
        // 清除全局下拉选择组件数据
        const clearSelectMap = (name?: string) => {
            if (name) {
                delete selectMap.value[name];
            } else {
                selectMap.value = {};
            }
        };
        return {
            selectMap,
            setSelectMap,
            clearSelectMap,
        };
    },
    {
        persist: {
            enabled: true,
            storage:secureSessionStorage('uBk6FgT9XqJ3RnP2sVv5Yy7wZ1c4DmH8'),
        } as any, // 暂时使用any类型断言解决类型问题
    }
);

