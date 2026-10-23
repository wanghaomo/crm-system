<template>
    <div class="header-container">
        <div class="header-left" @click="handleClickLogoOut">
            <i class="icon logo-icon"></i>
            <span class="logo-name">智慧矿山・ITO系统</span>
        </div>
        <div class="header-right">
            <!-- 菜单路径 -->
            <div class="header-right-path">
                <span class="header-right-path-text">当前位置：</span>
                <n-breadcrumb separator=">">
                    <n-breadcrumb-item v-for="item in pathNameArray">
                        {{ item }}
                    </n-breadcrumb-item>
                </n-breadcrumb>
            </div>
            <div class="header-right-user">
                <!-- <div class="user-info"></div> -->
                <n-flex class="user-info" :align="'center'">
                    <n-avatar :src="avatarProcessing" size="medium" :round="true" />
                    <span class="user-name">{{ userInfo?.username || '未知用户' }}</span>
                </n-flex>
                <i class="icon help-icon" @click="showManualModal = true"></i>
            </div>
        </div>
    </div>
    <n-modal v-model:show="showManualModal">
        <n-card style="width: 80vw" :bordered="false" size="huge" role="dialog" aria-modal="true">
            <div style="height: 80vh; overflow-y: auto; overflow-x: hidden">
                <PdfPreview :pdfUrl="iframeUrl"></PdfPreview>
            </div>
        </n-card>
    </n-modal>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { generateTextAvatar } from '@mx/mx-ui/utils';
import { NBreadcrumb, NBreadcrumbItem, NFlex, NAvatar, NModal, NCard, useDialog } from 'naive-ui';
import { getLocationSearchObj } from '@/utils';
import PdfPreview from '../PdfPreview.vue';
import { useUserStore } from '@/store/userStore';
import { storeToRefs } from 'pinia';
const { userInfo } = storeToRefs(useUserStore());
const dialog = useDialog();
const props = defineProps({
    pathNameArray: {
        type: Array,
        default: () => [],
    },
});
const emit = defineEmits(['logoutEvt']);
// 计算属性，设置头像
const avatarProcessing = computed(() => {
    console.log("userInfo.value",userInfo.value);
    
    let url = userInfo.value?.avatar;
    if (url) {
        return url;
    } else {
        return generateTextAvatar(userInfo.value?.username || '未知用户', false, {
            baseFontSize: 20 * 2.8,
        });
    }
});
// 操作手册模态框控制
const showManualModal = ref<boolean>(false);
// 操作手册地址
const iframeUrl = ref(import.meta.env.VITE_APP_HELP_URL);
// 系统返回方法
const handleClickLogoOut = () => {
    // 只有web端需要，弹窗
    dialog.warning({
        title: '退出提示',
        content: '确定要退出系统？',
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: () => {
            //  获取导航栏数据
            const hrefData = getLocationSearchObj();
            const redirectUrl = hrefData?.redirectUrl
                ? decodeURIComponent(hrefData.redirectUrl)
                : import.meta.env.VITE_HOME_URL;
            //  跳转
            window.location.href = redirectUrl;
        },
        onNegativeClick: () => {
            //
        },
    });
};
</script>
<style scoped lang="less">
.header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 53px;
    background-color: var(--base-white);
    overflow-x: hidden;

    .header-left {
        display: flex;
        align-items: center;
        width: 240px;
        padding: 10px;
        flex-shrink: 0;
        cursor: pointer;

        .logo-icon {
            width: 32px;
            height: 32px;
            background: center url('@/assets/images/logo.png') no-repeat;
            background-size: 100% 100%;
            margin-right: 8px;
        }
        .logo-name {
            color: var(--base-color);
            font-size: 12px;
        }
    }

    .header-right {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 10px;

        .header-right-path {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            font-size: 14px;

            &::v-deep(.n-breadcrumb .n-breadcrumb-item) {
                font-size:14px;
            }
        }

        .header-right-user {
            display: flex;
            align-items: center;

            &::v-deep(.user-info) {
                min-width: 110px;
                gap: 8px 5px !important;
            }

            .user-name {
                font-size:14px;
            }
        }

        .help-icon {
            width: 32px;
            height: 32px;
            background: center url('@/assets/images/help.png') no-repeat;
            background-size: 26px;
            cursor: pointer;
        }
    }
}
</style>
