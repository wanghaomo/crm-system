<template>
    <div class="component_page_conatiner">
        <!-- 头部导航栏 -->
        <div class="component_page_header" v-if="!closeHeader">
            <!-- 返回模块 -->
            <div class="back_box" v-if="showBack" @click="handleBack">
                <i class="icon back_icon"></i>
                <span>返回</span>
            </div>
            <!-- 面包屑导航 -->
            <div class="breadcrumb_box">
                <span class="breadcrumb_box_title">当前路径:&nbsp;</span>
                <n-breadcrumb separator="/">
                    <n-breadcrumb-item v-for="item in pathNameArray">
                        {{ item }}
                    </n-breadcrumb-item>
                </n-breadcrumb>
            </div>
            <!-- 右侧操作 -->
            <div class="right_box">
                <MxButton :hasLeftIcon="true" v-if="!hideAddBtn" @click="handleAddClick">
                    <template #leftIcon>
                        <i class="add_btn_icon icon"></i>
                    </template>
                    新增
                </MxButton>
                <slot name="headerRight"></slot>
            </div>
        </div>
        <div class="component_page_content">
            <div :style="{
                backgroundColor: contentBg ? contentBg : 'none',
                padding: contentPadding,
                height: '100%',
                borderRadius: contentRadius,
                overflowY: 'auto'
            }">
                <slot name="content"></slot>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { NBreadcrumb, NBreadcrumbItem, useDialog, } from 'naive-ui';
import { handleNavRoutes } from '@/utils';
import { computed, onMounted, ref, useSlots } from 'vue';
import { useRouteStore } from '@/store/index.js';
import { storeToRefs } from 'pinia';
const { fullMenuTree } = storeToRefs(useRouteStore());
const router = useRouter();
const route = useRoute();
const props = defineProps({
    // 是否展示返回按钮
    showBack: {
        type: Boolean,
        default: false,
    },
    // 是否关闭头部导航栏
    closeHeader: {
        type: Boolean,
        default: false,
    },
    // 内容区域背景颜色
    contentBg: {
        type: String,
        default: 'var(--base-white)',
    },
    // 是否隐藏自带的新增按钮
    hideAddBtn: {
        type: Boolean,
        default: false,
    },
    // 内容区域圆角
    contentRadius: {
        type: String,
        default: 'var(--base-radius-8)',
    },
    // 内容区域内边距
    contentPadding: {
        type: String,
        default: '16px',
    },
    // 返回时是否需要确认弹窗（用于新增/编辑页）
    confirmBack: {
        type: Boolean,
        default: false,
    },
});
// 定义事件
const emit = defineEmits(['addEvt']);
const dialog = useDialog();
// 面包屑导航数组
const pathNameArray = computed(() => {
    console.log("这是完整菜单结构", router.currentRoute.value.meta.code);

    if (router.currentRoute.value.meta.code && Object.keys(menuObj.value).length > 0) {
        return menuObj.value[router.currentRoute.value.meta.code as string] || [];
    }
    return [];
});
// 路由菜单对象
const menuObj = ref<{ [name: string]: string[] }>({});
// 新增按钮点击事件
const handleAddClick = () => {
    emit('addEvt');
};
// 返回上一页
const handleBack = () => {
    // 优先使用 props.confirmBack 显式控制；兜底：检查路径中是否包含 add/edit/create 作为完整路径段
    const isEditPage = props.confirmBack || /\/(add|edit|create|batchPayment)(\/|$)/.test(route.path);
    if (isEditPage) {
        dialog.warning({
            title: '返回确认',
            content: '是否确认返回？返回后编辑内容将不会被保存',
            positiveText: '确 定',
            negativeText: '取 消',
            draggable: true,
            onPositiveClick: () => {
                router.back();
            },
        });
    } else {
        router.back();
    }
};
// 初始化面包屑导航数组
onMounted(() => {
    console.log("这是完整菜单结构", handleNavRoutes(fullMenuTree.value));
    menuObj.value = { ...handleNavRoutes(fullMenuTree.value) };

});
</script>
<style scoped lang="postcss">
.component_page_conatiner {
    height: 100%;
    display: flex;
    flex-direction: column;

    .component_page_header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        flex-shrink: 0;
        background-color: var(--base-white);
        font-size: 14px;
        padding: 0 20px;
        gap: 12px;
        height: 44px;

        .back_box {
            display: flex;
            align-items: center;
            color: var(--base-grey);
            flex-shrink: 0;
            cursor: pointer;

            .back_icon {
                display: inline-block;
                width: 18px;
                height: 18px;
                margin-right: 4px;
                background: center url('./images/back_icon.png') no-repeat;
                background-size: 100% 100%;
            }
        }

        .breadcrumb_box {
            display: flex;
            align-items: center;
            color: var(--base-grey);
            flex-shrink: 0;

            :deep(.n-breadcrumb-item__link) {
                color: var(--base-grey);
            }

            :deep(.n-breadcrumb-item:last-child .n-breadcrumb-item__link) {
                color: var(--base-black);
            }

            :deep(.n-breadcrumb-item__separator) {
                margin: 0 2px;
            }
        }

        .right_box {
            margin-left: auto;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
    }

    .component_page_content {
        flex: 1;
        font-size: 14px;
        padding: 20px;
        overflow-y: auto;

        >div {
            box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
        }
    }
}
</style>
