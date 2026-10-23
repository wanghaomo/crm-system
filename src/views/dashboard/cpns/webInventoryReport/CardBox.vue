<template>
    <!-- 报表通用卡片壳子组件 -->
    <div :class="cardBoxClass">
        <div class="card-box__header">
            <div class="card-box__title">{{ title }}</div>
            <div class="card-box__header-right" v-if="showHeaderRight">
                <slot name="value">
                    <span class="card-box__value">{{ value }}</span>
                </slot>
            </div>
        </div>
        <div class="card-box__body">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

defineOptions({ name: 'CardBox' });

const props = withDefaults(
    defineProps<{
        title: string;
        value?: string | number;
        type?: 'orange' | 'default';
    }>(),
    {
        title: '',
        value: undefined,
        type: 'default'
    }
);

const slots = useSlots();

const title = computed(() => props.title);
const cardBoxClass = computed(() => ['card-box', props.type === 'orange' ? 'card-box--orange' : '']);
const showHeaderRight = computed(() => {
    if (slots.value) return true;
    return props.value !== undefined && props.value !== null && `${props.value}` !== '';
});

const value = computed(() => props.value);
</script>

<style lang="less" scoped>
.card-box {
    background: #eaf2ff;
    border-radius: 8px;
    min-width: 180px;
    overflow: hidden;
    border: 1px solid #FFFFFF;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 3px 6px 1px #8eacf729;
}
.card-box--orange {
    box-shadow: 0 3px 6px 1px #f8ce7e29;
}

.card-box__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    background: #EAF1FF;
    min-width: 0;
}

.card-box--orange {
    & .card-box__header {
        background: #FDF0D6;
    }

    & .card-box__value {
        color: #FF9300;
    }

    & .card-box__body {
        background: #FBF8F6;
    }
}

.card-box__title {
    font-weight: 600;
    color: var(--base-black, #000);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-box__header-right {
    display: inline-flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 4px;
    flex-shrink: 0;
    white-space: nowrap;
}

.card-box__value {
    font-weight: 600;
    color: var(--base-color);
    line-height: 1;
}

.card-box__body {
    padding: 12px;
    box-sizing: border-box;
    background: #F6F8FB;
    max-height: 192px;
    overflow: hidden;
    overflow-y: auto;
}
</style>
