// stores/appSearchSingletonStore.ts
import { defineStore } from 'pinia';
import { ref, nextTick } from 'vue';

export interface IComponent {
    close: () => void;
}

export const useAppSearchSingleton = defineStore('appSearchSingleton', () => {
    // 状态
    const appSaearchLowerContainerId = ref<string>('lower-container');
    const appSearchLowerContainerVisable = ref<boolean>(false);
    const currentOpenComponent = ref<IComponent | null>(null);
    // 关闭下拉组件
    const closeComponents = (): void => {
        if (currentOpenComponent.value) {
            currentOpenComponent.value.close();
            currentOpenComponent.value = null;
        }
    };
    // 打开下拉组件
    const openComponents = (component: IComponent, callBack: () => void): void => {
        closeComponents();
        currentOpenComponent.value = component;
        appSearchLowerContainerVisable.value = true;
        nextTick(() => {
            callBack();
        });
    };
    // 关闭拉下组件渲染器
    const clearSaearchLowerContainer = (): void => {
        closeComponents();
        appSearchLowerContainerVisable.value = false;
    };
    return {
        appSaearchLowerContainerId,
        appSearchLowerContainerVisable,
        closeComponents,
        openComponents,
        clearSaearchLowerContainer,
    };
});