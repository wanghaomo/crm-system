<template>
    <div class="app-core-business">
        <div
            v-for="item in businessItems"
            :key="item.key"
            :class="['business-item', `business-item--${item.key}`]">
            <img class="item-icon" :src="item.icon" alt="" />
            <div class="item-title">{{ item.title }}</div>
            <div class="item-value">
                <span :class="{ 'rate-value': item.key === 'collectionRate' }">{{ formatDashboardValue(item.value) }}</span>
                <span class="item-unit">{{ item.unit }}</span>
            </div>
            <div v-if="item.subTitle" class="item-subvalue">
                {{ item.subTitle }} {{ formatDashboardValue(item.subValue) }} {{ item.subUnit }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import amountDueIcon from '@/assets/images/dashboard/icon-core-amount-due.png';
import collectionIcon from '@/assets/images/dashboard/icon-core-collection-rate.png';
import shipmentIcon from '@/assets/images/dashboard/icon-core-shipment.png';
import settledIcon from '@/assets/images/dashboard/icon-core-settled.png';
import unsettledIcon from '@/assets/images/dashboard/icon-core-unsettled.png';
import deliveredIcon from '@/assets/images/dashboard/icon-core-delivered.png';
import { formatDashboardValue } from '../utils';

const props = defineProps<{
    coreData: Record<string, any>;
}>();

const businessItems = computed(() => [
    {
        key: 'shipmentNum',
        title: '发货总览',
        value: props.coreData.shipmentNum,
        unit: '万吨',
        icon: shipmentIcon,
    },
    {
        key: 'amountDue',
        title: '应回款总额',
        value: props.coreData.amountDue,
        unit: '万元',
        subTitle: '待回款',
        subValue: props.coreData.unReceived,
        subUnit: '万元',
        icon: amountDueIcon,
    },
    {
        key: 'collectionRate',
        title: '回款率',
        value: props.coreData.collectionRate,
        unit: '%',
        subTitle: '已回款',
        subValue: props.coreData.payment,
        subUnit: '万元',
        icon: collectionIcon,
    },

    {
        key: 'settledNum',
        title: '已结算量',
        value: props.coreData.settledNum,
        unit: '万吨',
        icon: settledIcon,
    },
    {
        key: 'unSettledNum',
        title: '待结算量',
        value: props.coreData.unSettledNum,
        unit: '万吨',
        icon: unsettledIcon,
    },
    {
        key: 'deliveredNum',
        title: '已交付量',
        value: props.coreData.deliveredNum,
        unit: '万吨',
        icon: deliveredIcon,
    },
]);
</script>

<style scoped lang="less">
.app-core-business {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
    margin-bottom: 20px;
}

.business-item {
    min-width: 0;
    min-height: 108px;
    padding: 12px;
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid #ffffff;
    border-radius: 8px;
    background: linear-gradient(180deg, #eeeafd 0%, #ffffff 100%);
    box-shadow: 0 3px 10px 1px rgba(190, 200, 219, 0.24);

    &--collectionRate {
        background: linear-gradient(180deg, #fbf6e9 0%, #ffffff 100%);
    }

    &--shipmentNum {
        background: linear-gradient(180deg, #e9eefb 0%, #ffffff 100%);
    }

    &--settledNum {
        background: linear-gradient(180deg, #e9f7fb 0%, #ffffff 100%);
    }

    &--unSettledNum {
        background: linear-gradient(180deg, #fbf1e9 0%, #ffffff 100%);
    }

    &--deliveredNum {
        background: linear-gradient(180deg, #e9fbf4 0%, #ffffff 100%);
    }
}

.item-icon {
    display: block;
    width: 24px;
    height: 24px;
    object-fit: contain;
}

.item-title {
    margin-top: 6px;
    overflow: hidden;
    color: #666666;
    font-size: 12px;
    line-height: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-value {
    margin-top: 2px;
    overflow: hidden;
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rate-value {
    color: #ff8201;
}

.item-unit {
    margin-left: 4px;
    color: #999999;
    font-size: 12px;
    font-weight: 400;
}

.item-subvalue {
    overflow: hidden;
    color: #999999;
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
