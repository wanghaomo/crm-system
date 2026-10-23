<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from './webCpns/batchPayment.vue';
import MobileView from './appCpns/batchPayment.vue';
import { isApp } from '@/utils/comm';
// 根据运行容器切换 PC / App 批量回款页。
const _isApp = isApp();
</script>
