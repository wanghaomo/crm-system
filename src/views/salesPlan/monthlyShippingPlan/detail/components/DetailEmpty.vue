<template>
    <div class="detail-empty">
        <DetailsTitle :title="title" :styleOption="{ padding: '22px 0px 16px' }" :fontSize="16" />
        <n-empty description="暂无数据" />
    </div>
</template>

<script setup lang="ts">
import { NEmpty } from 'naive-ui';

withDefaults(
    defineProps<{
        title: string;
    }>(),
    {
        title: '',
    }
);
</script>

<style lang="less" scoped>
.detail-empty {
    flex: 1;
    padding: 0 22px 20px;
    overflow-y: auto;
}
</style>
