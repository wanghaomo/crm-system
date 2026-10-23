<template>
    <dashboard ></dashboard>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import dashboard from "@/views/dashboard/index.vue"
</script>
<style lang="less" scoped>
// 圆角
@border-radius: 5px;

.web-page-container {
    min-width: 600px;
    overflow-x: auto;
}

.conditions-container {
    margin-bottom: var(--base-width);
}

.module-container {
    margin-bottom: var(--base-width);
}
.img_bg {
    width: 100px;
    height: 100px;
    background-color: #f5f5f5;
    background-image: url('@/assets/images/logo.png');
    background-size: cover;
}
</style>
