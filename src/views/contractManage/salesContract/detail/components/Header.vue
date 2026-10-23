<template>
    <div class="sales-contract-header">
        <div class="header-top">
            <div class="code">{{ detail.contractSalesId || '--' }}</div>
            <StatusTag :text="statusName" :color="statusTagStyle.color" :bgColor="statusTagStyle.backgroudColor" :borderColor="statusTagStyle.bdColor" />
        </div>
        <div class="header-bottom">
            <div class="key-value">
                <div class="label">发货月份</div>
                <div class="value">{{ detail.shipmentMonth || '--' }}</div>
            </div>
            <div class="key-value">
                <div class="label">创建时间</div>
                <div class="value">{{ detail.createdAt || '--' }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { statusConfig } from '../../commonTs/conmon';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

type StatusConfigItem = typeof statusConfig[number];

const currentStatusConfig = computed<StatusConfigItem | undefined>(() => {
    return statusConfig.find((item) => item.value === props.detail.status)
});

const statusName = computed(() => {
    return currentStatusConfig.value?.label || '--'
});

const statusTagStyle = computed(() => {
    return currentStatusConfig.value || {} as StatusConfigItem
});
</script>

<style lang="less" scoped>
.sales-contract-header {
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;

}
.header-top {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    gap: 12px;
}
.code {
    font-weight: 600;
    font-size: 16px;
    color: #333333;
}

.header-bottom {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 88px;
}
.key-value {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
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
