<template>
    <!-- 报表通用壳子组件 -->
    <div class="report-box" :class="{'report-box--app': _isApp}">
        <!-- 报表标题区域 -->
        <div class="report-box__header">
            <!-- 左边标题区域 -->
            <div class="report-box__title">
                <div class="report-box__icon" v-if="showIcon">
                    <img
                        v-if="resolvedIconSrc"
                        class="report-box__icon-img"
                        :src="resolvedIconSrc"
                        :alt="iconAlt"
                        :style="iconStyle" />
                    <slot v-else name="icon" />
                </div>
                <div class="report-box__title-text">{{ title }}</div>
            </div>
            <!-- 标题右边区域 -->
            <div class="report-box__extra" v-if="slots['title-extra']">
                <slot name="title-extra" />
            </div>
        </div>
        <!-- 报表内容区域 -->
        <div class="report-box__body">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { isApp } from "@/utils/comm"
const _isApp = isApp()

defineOptions({ name: 'ReportBox' });

const props = withDefaults(
    defineProps<{
        title: string;
        iconSrc?: string;
        iconAlt?: string;
        iconSize?: number | string;
    }>(),
    {
        title: '',
        iconSrc: '',
        iconAlt: '',
    }
);

const slots = useSlots();
const resolvedIconSrc = computed(() => props.iconSrc);
const iconAlt = computed(() => props.iconAlt);
const iconStyle = computed(() => {
    const size = props.iconSize;
    if (size === undefined || size === null || size === '') return undefined;
    const normalized = typeof size === 'number' ? `${size}px` : size;
    return { width: normalized, height: normalized };
});

const showIcon = computed(() => !!resolvedIconSrc.value || !!slots.icon);
const title = computed(() => props.title);
</script>

<style lang="postcss" scoped>
.report-box {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 16px;
    line-height: 1;
    gap: 12px;
}

.report-box__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
}

.report-box__title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.report-box__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
}

.report-box__icon-img {
    display: block;
    object-fit: contain;
    width: 100%;
    height: 100%;
}

.report-box__title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--base-black, #000);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.report-box__extra {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 12px;
}

.report-box__body {
    min-width: 0;
}

.report-box--app {
    padding: 16px 12px;
    margin-bottom: 20px;
}
</style>
