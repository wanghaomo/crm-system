<!-- 审批弹窗 -->
<template>
    <div class="details_title" :style="styleOption">
        <div class="details_title_left">
            <div class="details_title_info" :style="{ fontSize: fontSize + 'px' }">{{ title }}</div>
            <slot name="left" />
        </div>
        <slot name="btn" />
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
const props = withDefaults(
    defineProps<{
        title: string;
        styleOption?: any;
        fontSize?: number;
    }>(),
    {
        title: '标题内容',
        styleOption: {
            padding: '20px 0px 16px 0px',
        },
        fontSize: 14,
    }
);
</script>
<style lang="postcss" scoped>
.details_title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .details_title_left {
        display: flex;
        align-items: center;
    }

    .details_title_info {
        font-weight: 600;
        color: var(--base-black);
        position: relative;
        line-height: 1;
        padding-left: 12px;
    }

    .details_title_info::after {
        content: '';
        width: 4px;
        height: 100%;
        background: var(--base-color);
        border-radius: 2px 2px 2px 2px;
        position: absolute;
        left: 0;
    }
}
</style>
