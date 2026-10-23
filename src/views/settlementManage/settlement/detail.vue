<template>
    <div class="settlement-detail-page">
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from './webCpns/detail.vue';
import MobileView from './appCpns/detail.vue';
import { isApp } from '@/utils/comm';
const _isApp = isApp();
</script>

<style scoped lang="less">
.settlement-detail-page {
    height: 100%;
    min-height: 0;
    overflow: hidden;
}
</style>
