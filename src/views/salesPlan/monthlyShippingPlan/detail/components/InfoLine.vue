<template>
    <div class="info-line">
        <div class="info-label">{{ label }}</div>
        <div class="info-value">
            <slot>{{ value === null || value === undefined || value === '' ? '--' : value }}</slot>
        </div>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        label: string;
        value?: string | number;
    }>(),
    {
        value: '',
    }
);
</script>

<style lang="less" scoped>
.info-line {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    line-height: 22px;
}

.info-label {
    width: 130px;
    flex-shrink: 0;
    text-align: right;
    color: #999999;
}

.info-value {
    min-width: 0;
    flex: 1;
    color: #333333;
    word-break: break-all;
}
</style>
