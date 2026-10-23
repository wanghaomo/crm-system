<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from './webCpns/detail.vue';
import MobileView from './appCpns/detail.vue';
import { isApp } from '@/utils/comm';
// 根据运行容器切换 PC / App 发运计划详情页。
const _isApp = isApp();
</script>
