<template>
    <div class="business-summary">
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
.business-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    margin-bottom: 20px;
    padding: 12px 20px;
    box-sizing: border-box;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 3px 20px 1px rgba(83, 84, 88, 0.16);
}

.summary-item {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 0 28px;

    &::after {
        position: absolute;
        top: 8px;
        right: 0;
        bottom: 8px;
        width: 1px;
        background: #eeeeee;
        content: '';
    }

    &:first-child {
        padding-left: 0;
    }

    &:last-child {
        padding-right: 0;

        &::after {
            display: none;
        }
    }
}

.summary-icon {
    width: 32px;
    height: 32px;
    margin-right: 10px;
    flex-shrink: 0;
    object-fit: contain;
}

.summary-content {
    min-width: 0;
}

.summary-title {
    overflow: hidden;
    color: #666666;
    font-size: 14px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.summary-value {
    overflow: hidden;
    color: #333333;
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
    text-overflow: ellipsis;
    white-space: nowrap;

    span {
        margin-left: 4px;
        color: #999999;
        font-size: 12px;
        font-weight: 400;
    }
}

@media (max-width: 900px) {
    .business-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        row-gap: 16px;
    }

    .summary-item {
        &:nth-child(2)::after {
            display: none;
        }
    }
}
</style>
