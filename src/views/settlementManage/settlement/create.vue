<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from './webCpns/create.vue';
import MobileView from './appCpns/create.vue';
import { isApp } from '@/utils/comm';
const _isApp = isApp();
</script>
