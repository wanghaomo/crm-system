<template>
    <div class="header-container">
        <!-- 左侧 LOGO + 系统名 -->
        <div class="header-left" @click="handleClickLogoOut">
            <i class="icon logo-icon"></i>
            <span class="logo-name">智慧矿山・ITO系统</span>
        </div>

        <!-- 中间顶级菜单（预留扩展位，可根据实际需要配置） -->
        <div class="header-center">
            <div
                v-for="item in topNavList"
                :key="item.key"
                :class="['nav-item', { 'nav-item--active': item.key === activeNav }]"
                @click="handleNavClick(item)">
                {{ item.label }}
            </div>
        </div>

        <!-- 右侧功能区 -->
        <div class="header-right">
            <!-- 面包屑路径 -->
            <div class="header-right-path">
                <span class="path-label">当前位置：</span>
                <n-breadcrumb separator="›">
                    <n-breadcrumb-item v-for="item in pathNameArray" :key="item">
                        {{ item }}
                    </n-breadcrumb-item>
                </n-breadcrumb>
            </div>

            <!-- 分隔线 -->
            <div class="header-right-divider"></div>

            <!-- 帮助 + 用户 -->
            <div class="header-right-user">
                <i class="icon help-icon" title="帮助" @click="showManualModal = true"></i>

                <n-dropdown :options="userDropdownOptions" @select="handleUserMenuSelect">
                    <n-flex class="user-info" :align="'center'">
                        <n-avatar :src="avatarProcessing" size="small" :round="true" />
                        <span class="user-name">{{ userInfo?.username || '未知用户' }}</span>
                        <n-icon size="14" class="user-caret">
                            <component :is="CaretDown" />
                        </n-icon>
                    </n-flex>
                </n-dropdown>
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
import { computed, h, ref } from 'vue';
import { generateTextAvatar } from '@mx/mx-ui/utils';
import { NBreadcrumb, NBreadcrumbItem, NFlex, NAvatar, NModal, NCard, NDropdown, NIcon, useDialog } from 'naive-ui';
import { CaretDown } from '@vicons/ionicons5';
import { getLocationSearchObj } from '@/utils';
import PdfPreview from '../PdfPreview.vue';
import { useUserStore } from '@/store/userStore';
import { storeToRefs } from 'pinia';

const { userInfo } = storeToRefs(useUserStore());
const dialog = useDialog();

const props = defineProps({
    /** 面包屑路径数组 */
    pathNameArray: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['logoutEvt']);

/** 顶级导航列表，可根据实际业务配置 */
const topNavList = ref([
    { key: 'training', label: '安全培训' },
    { key: 'crm', label: 'CRM系统' },
    { key: 'logistics', label: '物流系统' },
    { key: 'slope', label: '边坡监测' },
    { key: 'qc', label: '质检系统' },
    { key: 'iot', label: '物联网系统' },
    { key: 'app', label: '应用' },
]);

/** 当前激活的顶级导航 */
const activeNav = ref('crm');

/** 用户下拉菜单 */
const userDropdownOptions = computed(() => [
    {
        label: '个人信息',
        key: 'profile',
    },
    {
        label: '修改密码',
        key: 'password',
    },
    {
        type: 'divider' as const,
    },
    {
        label: '退出登录',
        key: 'logout',
        props: {
            style: 'color: #f87171;',
        },
    },
]);

/** 头像处理：有 avatar 用 avatar，否则用文字生成 */
const avatarProcessing = computed(() => {
    const url = userInfo.value?.avatar;
    if (url) {
        return url;
    } else {
        return generateTextAvatar(userInfo.value?.username || '未知用户', false, {
            baseFontSize: 20 * 2.8,
        });
    }
});

/** 操作手册模态框控制 */
const showManualModal = ref<boolean>(false);

/** 操作手册地址 */
const iframeUrl = ref(import.meta.env.VITE_APP_HELP_URL);

/** 顶级导航点击 */
const handleNavClick = (item: { key: string; label: string }) => {
    activeNav.value = item.key;
};

/** 用户下拉菜单选择 */
const handleUserMenuSelect = (key: string) => {
    if (key === 'logout') {
        handleClickLogoOut();
    }
};

/** 退出系统确认并跳转 */
const handleClickLogoOut = () => {
    dialog.warning({
        title: '退出提示',
        content: '确定要退出系统？',
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: () => {
            const hrefData = getLocationSearchObj();
            const redirectUrl = hrefData?.redirectUrl
                ? decodeURIComponent(hrefData.redirectUrl)
                : import.meta.env.VITE_HOME_URL;
            window.location.href = redirectUrl;
        },
    });
};
</script>

<style scoped lang="less">
.header-container {
    display: flex;
    align-items: center;
    height: 53px;
    padding: 0 20px;
    background: linear-gradient(90deg, #0f1c3a 0%, #162547 50%, #1a2d55 100%);
    color: #fff;
    overflow-x: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

    /* ===== 左侧 LOGO ===== */
    .header-left {
        display: flex;
        align-items: center;
        padding-right: 24px;
        flex-shrink: 0;
        cursor: pointer;
        border-right: 1px solid rgba(255, 255, 255, 0.12);

        .logo-icon {
            width: 28px;
            height: 28px;
            background: center url('@/assets/images/logo-white.png') no-repeat;
            background-size: 100% 100%;
            margin-right: 8px;
            flex-shrink: 0;
        }

        .logo-name {
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
            white-space: nowrap;
        }
    }

    /* ===== 中间顶级导航 ===== */
    .header-center {
        display: flex;
        align-items: center;
        flex: 1;
        padding-left: 16px;
        gap: 4px;
        overflow-x: auto;

        .nav-item {
            position: relative;
            padding: 0 16px;
            height: 53px;
            line-height: 53px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.75);
            cursor: pointer;
            transition: color 0.2s ease;
            white-space: nowrap;
            flex-shrink: 0;

            &:hover {
                color: #fff;
            }

            &--active {
                color: #fff;
                font-weight: 500;

                &::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 28px;
                    height: 2px;
                    background: #2C65F2;
                    border-radius: 2px 2px 0 0;
                }
            }
        }
    }

    /* ===== 右侧功能区 ===== */
    .header-right {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        padding-left: 12px;

        .header-right-path {
            display: flex;
            align-items: center;
            font-size: 13px;

            .path-label {
                color: rgba(255, 255, 255, 0.55);
                margin-right: 6px;
            }

            &::v-deep(.n-breadcrumb .n-breadcrumb-item) {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.85);
            }

            &::v-deep(.n-breadcrumb .n-breadcrumb-item__separator) {
                color: rgba(255, 255, 255, 0.4);
            }
        }

        .header-right-divider {
            width: 1px;
            height: 20px;
            background: rgba(255, 255, 255, 0.18);
            margin: 0 14px;
        }

        .header-right-user {
            display: flex;
            align-items: center;
            gap: 8px;

            &::v-deep(.user-info) {
                gap: 6px !important;
                cursor: pointer;
                padding: 4px 10px;
                border-radius: 20px;
                transition: background 0.2s ease;

                &:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            }

            .user-name {
                font-size: 14px;
                color: #fff;
                max-width: 80px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .user-caret {
                color: rgba(255, 255, 255, 0.7);
            }

            .help-icon {
                width: 32px;
                height: 32px;
                background: center url('@/assets/images/help.png') no-repeat;
                background-size: 22px;
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s ease;

                &:hover {
                    opacity: 1;
                }
            }
        }
    }
}
</style>
