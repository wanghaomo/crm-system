<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from './webCpns/edit.vue';
import MobileView from './appCpns/edit.vue';
import { isApp } from '@/utils/comm';
// 根据运行容器切换 PC / App 回款单编辑页。
const _isApp = isApp();
</script>
