<template>
    <component :is="isAppPage ? AppView : WebView" />
</template>

<script setup lang="ts">
import { isApp } from '@/utils/comm';
import AppView from './app.vue';
import WebView from './web.vue';

const isAppPage = isApp();
</script>
