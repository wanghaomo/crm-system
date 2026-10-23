<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'
const $router = useRouter()
import PcView from "./web.vue"
import MobileView from "./app.vue"
import { isApp } from "@/utils/comm"
import { bindTenFKeyTrigger } from '@/utils/ten-f-key-trigger';
const _isApp = isApp()
let triggerHandler: { unbind: () => void } | null = null;
onBeforeMount(() => {
    if (sessionStorage.getItem("targetPath")) {
        console.log("有跳转");

        void $router.push(sessionStorage.getItem("targetPath")).catch((error) => {
            console.warn('[home] 目标路径跳转失败：', error);
        });
        sessionStorage.removeItem("targetPath");
    }
})
onMounted(() => {
    triggerHandler = bindTenFKeyTrigger({
        targetRoute: '/test',
        buttonText: '前往缓存测试页面',
        onClick: () => {
            void $router.push('/test').catch((error) => {
                console.warn('[home] 缓存测试页路由跳转失败，使用 location 兜底：', error);
                window.location.href = '/test';
            });
        },
    });
});
onUnmounted(() => {
    triggerHandler?.unbind();
    triggerHandler = null;
});
</script>
