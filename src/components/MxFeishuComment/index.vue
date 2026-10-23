<template>
    <component :is="_isApp ? MobileView : PcView" v-bind="props" />
</template>

<script setup lang="ts">
import PcView from './web.vue';
import MobileView from './app.vue';
import { isApp } from '@/utils/comm';
import { FeishuCommentType } from './index.type';

const _isApp = isApp();
const props = defineProps<FeishuCommentType>();
</script>
