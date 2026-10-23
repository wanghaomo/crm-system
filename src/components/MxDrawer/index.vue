<template>
    <n-drawer class="custom_drawer_container" v-model:show="showAddPop" :width="widthComputed" :close-on-esc="false" :mask-closable="false" :on-mask-click="closeDrawer" :auto-focus="false">
        <n-drawer-content>
            <template #header>
                <div class="drawer_header">
                    <span class="drawer_header_title">{{ title }}</span>
                    <n-icon class="close_icon" size="18" @click="closeDrawer">
                        <CloseSharp />
                    </n-icon>
                </div>
            </template>
            <slot></slot>
            <template #footer v-if="slots.footer">
                <slot name="footer"></slot>
            </template>
        </n-drawer-content>
    </n-drawer>
</template>
<script setup lang="ts">
import { NDrawer, NDrawerContent, NIcon, useDialog } from 'naive-ui';
import { CloseSharp } from '@vicons/ionicons5';
import { computed, ref, useSlots, VNode, watch } from 'vue';
const dialog = useDialog();
const showAddPop = ref(false);
const props = withDefaults(
    defineProps<{
        // 是否显示
        show: boolean;
        // 大屉标题
        title: string;
        // 大屉大小:small(640px)/large(100vw-260px)
        size?: 'small' | 'large';
        // 大屉宽度
        width?: string;
        // 是否需要关闭提示
        closablePop?: boolean;
    }>(),
    {
        title: '',
        closablePop: true,
        size: 'large',
    }
);
const emits = defineEmits(['update:show']);
// 获取插槽内容
const slots = useSlots()

// 宽度设置
const widthComputed = computed(() => {
    if (props.width) {
        return props.width;
    } else {
        switch (props.size) {
            case 'small':
                return '640px';
            case 'large':
                return 'calc(100vw - 260px)';
            default:
                return 'calc(100vw - 260px)';
        }
    }
});
const closeDrawer = () => {
    if (!props.closablePop) {
        showAddPop.value = false;
        return;
    }
    showAddPop.value = false;
    // dialog.warning({
    //     title: '警告',
    //     content: '退出后当前操作数据将丢失，是否继续？',
    //     positiveText: '确定',
    //     negativeText: '取消',
    //     draggable: true,
    //     negativeButtonProps: {
    //         type: 'info',
    //         style: {
    //             // color:'var(--base-color)',
    //             // border:'1px solid var(--base-color)'
    //         },
    //     },
    //     onPositiveClick: () => {
    //         showAddPop.value = false;
    //     },
    // });
};
watch(
    () => props.show,
    (newVal) => {
        showAddPop.value = newVal;
    },
    { immediate: true }
);
watch(
    () => showAddPop.value,
    (newVal) => {
        if (!showAddPop.value) {
            emits('update:show', newVal);
        }
    }
);
</script>
<style scoped lang="postcss">
.custom_drawer_container {
    &:deep(.n-drawer-header) {
        padding: 0 !important;
    }

    .drawer_header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: #333;

        .close_icon {
            cursor: pointer;
            color: var(--base-grey);
        }
    }
}
</style>
