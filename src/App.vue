<script lang="ts" setup>
import {
    NModalProvider,
    NMessageProvider,
    NDialogProvider,
    NConfigProvider,
    zhCN,
    dateZhCN,
    lightTheme,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getDictMapApiFun } from './utils';
const route = useRoute();
import { NGlobalStyle, darkTheme } from 'naive-ui';
import { useThemeStore } from '@/store/theme';
import MainLayout from '@/components/MainLayout.vue';

const themeStore = useThemeStore();
// 路由历史记录
const routeHistory = ref<any[]>([]);
// 响应式主题
const currentTheme = computed(() => (themeStore.isDark ? darkTheme : lightTheme));

// 主题覆盖配置
const themeOverrides = {
    Input: {
        heightMedium: '34px',
        borderFocus: '1px solid #2C65F2',
        borderHover: '1px solid #2C65F2',
        caretColor: '#2C65F2',
        // caretColor: '#2C65F2',
        // border: '1px solid #2C65F2',
        boxShadowFocus: '0 0 0 2px rgba(44, 101, 242, .1)',
        boxShadowHover: '0 0 0 2px rgba(44, 101, 242, .1)',
        loadingColor: '#2C65F2',
    },
    Select: {
        peers: {
            InternalSelection: {
                borderFocus: '1px solid #2C65F2',
                borderHover: '1px solid #2C65F2',
                borderActive: '1px solid #2C65F2',
                caretColor: '#2C65F2',
                boxShadowFocus: '0 0 0 2px rgba(44, 101, 242, .1)',
                boxShadowHover: '0 0 0 2px rgba(44, 101, 242, .1)',
                boxShadowActive: '0 0 0 2px rgba(44, 101, 242, .1)',
                loadingColor: '#2C65F2',
            },
        },
    },
    Checkbox: {
        borderFocus: '1px solid #2C65F2',
        borderChecked: '1px solid #2C65F2',
        borderActive: '1px solid #2C65F2',
        caretColor: '#2C65F2',
        boxShadowFocus: '0 0 0 2px rgba(44, 101, 242, .1)',
        boxShadowChecked: '0 0 0 2px rgba(44, 101, 242, .1)',
        boxShadowActive: '0 0 0 2px rgba(44, 101, 242, .1)',
        loadingColor: '#2C65F2',
        colorChecked: '#2C65F2',
    },
    Radio: {
        dotColorActive: 'var(--base-color)',
        boxShadowActive: '0 0 0 1px var(--base-color)',
        boxShadowFocus: '0 0 0 1px var(--base-color)',
        boxShadowHover: '0 0 0 1px var(--base-color)',

    },
    Pagination: {
        actionColor: '#2C65F2',
    },
    DataTable: {
        thColor: '#F7F7F7',
        thTextColor: '#999',
        tdColorHover: '#ECF1FC',
    },
    DatePicker: {
        itemTextColorActive: '#fff',
        itemColorActive: '#2C65F2',
        itemColorHover: 'rgba(44, 101, 242, .1)',
        itemColorIncluded: 'rgba(44, 101, 242, .1)',
        itemBorderRadius: '4px',
        peers: {
            Button: {
                textColorTextPrimary: '#2C65F2',
                textColorTextHoverPrimary: '#2C65F2',
                textColorTextPressedPrimary: '#2C65F2',
                textColorTextFocusPrimary: '#2C65F2',
                textColorGhostPrimary: '#2C65F2',
                textColorGhostHoverPrimary: '#2C65F2',
                textColorGhostPressedPrimary: '#2C65F2',
                textColorGhostFocusPrimary: '#2C65F2',
                colorPrimary: '#2C65F2',
                colorHoverPrimary: '#4A7BF5',
                colorPressedPrimary: '#1E55D8',
                colorFocusPrimary: '#2C65F2',
                borderPrimary: '1px solid #2C65F2',
                borderHoverPrimary: '1px solid #4A7BF5',
                borderPressedPrimary: '1px solid #1E55D8',
                borderFocusPrimary: '1px solid #2C65F2',
                rippleColorPrimary: '#2C65F2',
            },
            Input: {
                borderFocus: '1px solid #2C65F2',
                borderHover: '1px solid #2C65F2',
                caretColor: '#2C65F2',
                boxShadowFocus: '0 0 0 2px rgba(44, 101, 242, .1)',
            },
        },
    },
    common: {
        fontSizeMedium: '14px',
        primaryColor: '#2C65F2',
        primaryColorHover: '#4A7BF5',
        primaryColorPressed: '#1E55D8',
        primaryColorSuppl: '#2C65F2',
        infoColor: '#2C65F2',
        infoColorHover: '#4A7BF5',
        infoColorPressed: '#1E55D8',
        infoColorSuppl: '#2C65F2',
    },
};

// 计算属性-获取路由layout
const getLayout = computed(() => {
    return route.meta.layout || 'blank-layout';
});

// window.console=window.parent?.console;
onMounted(async () => {
    if (sessionStorage.getItem('mx_token')) {
        await getDictMapApiFun();
    }
});
const blueTheme = lightTheme;
</script>

<template>
    <n-config-provider :theme="blueTheme" :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
        <n-message-provider>
            <n-modal-provider>
                <n-dialog-provider>
                    <component :is="getLayout"></component>
                </n-dialog-provider>
            </n-modal-provider>
        </n-message-provider>
    </n-config-provider>
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
