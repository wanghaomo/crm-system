<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from './webCpns/create.vue';
import MobileView from './appCpns/create.vue';
import { isApp } from '@/utils/comm';
// 根据运行容器切换 PC / App 发货订单新增编辑页。
const _isApp = isApp();
</script>
