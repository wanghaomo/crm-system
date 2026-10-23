<template>
    <div class="app-business-summary">
        <div v-for="item in summaryItems" :key="item.key" class="summary-item">
            <img class="summary-icon" :src="item.icon" alt="" />
            <div class="summary-content">
                <div class="summary-title">{{ item.title }}</div>
                <div class="summary-value">
                    {{ formatDashboardValue(item.value) }}<span>{{ item.unit }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import inventoryIcon from '@/assets/images/dashboard/icon-summary-inventory.png';
import contractIcon from '@/assets/images/dashboard/icon-summary-contract.png';
import settledAmountIcon from '@/assets/images/dashboard/icon-summary-settled.png';
import unsettledAmountIcon from '@/assets/images/dashboard/icon-summary-unsettled.png';
import { formatDashboardValue } from '../utils';

const props = defineProps<{
    coreData: Record<string, any>;
}>();

const summaryItems = computed(() => [
    {
        key: 'inventory',
        title: '库存总览',
        value: props.coreData.inventory,
        unit: '万吨',
        icon: inventoryIcon,
    },
    {
        key: 'contract',
        title: '合同总览',
        value: props.coreData.contract,
        unit: '万元',
        icon: contractIcon,
    },
    {
        key: 'settledAmount',
        title: '已结算金额',
        value: props.coreData.settledAmount,
        unit: '万元',
        icon: settledAmountIcon,
    },
    {
        key: 'unSettledAmount',
        title: '待结算金额',
        value: props.coreData.unSettledAmount,
        unit: '万元',
        icon: unsettledAmountIcon,
    },
]);
</script>

<style scoped lang="less">
.app-business-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
    margin-bottom: 20px;
    padding: 14px 12px;
    box-sizing: border-box;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 3px 20px 1px rgba(83, 84, 88, 0.12);
}

.summary-item {
    display: flex;
    align-items: center;
    min-width: 0;
}

.summary-icon {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    flex-shrink: 0;
    object-fit: contain;
}

.summary-content {
    min-width: 0;
}

.summary-title {
    overflow: hidden;
    color: #666666;
    font-size: 12px;
    line-height: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.summary-value {
    overflow: hidden;
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
        margin-left: 4px;
        color: #999999;
        font-size: 12px;
        font-weight: 400;
    }
}
</style>
