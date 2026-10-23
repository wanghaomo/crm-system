<template>
    <div class="header">
        <div class="header-top">
            <div class="header-date">{{ detail.monthlyMonth || '--' }}</div>
            <StatusTag
                v-if="statusName"
                :text="statusName"
                :color="statusTagStyle.color"
                :bg-color="statusTagStyle.bgColor"
                :border-color="statusTagStyle.borderColor"
            />
        </div>
        <div class="header-bottom">
            <div class="label-value">
                <div class="label">计划编号</div>
                <div class="value">{{ detail.planCode || '--' }}</div>
            </div>
            <div class="label-value">
                <div class="label">提交人</div>
                <div class="value">{{ detail.submitter || '--' }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusTag from '@/components/StatusTag/index.vue';
import { getMonthlyStatusTagStyle, getMonthlyStatusLabel } from '../../commonTs/comon';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

const statusName = computed(() => {
    return getMonthlyStatusLabel(props.detail.status) || '--';
});

const statusTagStyle = computed(() => {
    return getMonthlyStatusTagStyle(props.detail.status);
});
</script>

<style lang="less" scoped>
.header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    padding: 16px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.08);
}

.header-top {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-date {
    font-weight: 600;
    font-size: 16px;
    color: #333333;
}

.header-bottom {
    display: flex;
    gap: 88px;
    align-items: center;
    flex-wrap: wrap;
}

.label-value {
    display: flex;
    align-items: center;
    gap: 8px;
}

.label {
    flex-shrink: 0;
    font-weight: 400;
    font-size: 14px;
    color: #999999;
}

.value {
    font-weight: 400;
    font-size: 14px;
    color: #333333;
}
</style>
