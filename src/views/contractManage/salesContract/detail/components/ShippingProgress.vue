<template>
    <div class="shipping-progress">
        <div v-if="loading" class="state-text">发运进度加载中...</div>
        <div v-else class="shipping-progress-content">
            <div class="basic-section">
                <DetailsTitle title="基础信息" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
                    <n-descriptions-item label="合同编号">
                        {{ progressData.contractCode || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="企业名称">
                        {{ progressData.customerName || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="发货率">
                        {{ formatRate(progressData.shipmentRate) }}
                    </n-descriptions-item>
                </n-descriptions>
            </div>
            <div class="detail-section">
                <DetailsTitle title="发运明细" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
                <div class="table-wrapper">
                    <MxWebDataTable v-bind="tableConfig"> </MxWebDataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import { getShipmentProgressApi } from '@/api';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);
const progressData = ref<any>({});
const loading = ref(false);
let latestRequestId = 0;

const contractCode = computed(() => props.detail.contractCode || '');
/**
 * 判断字段是否有可展示值。
 * @param value 待判断值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== undefined && value !== null && value !== '';
/**
 * 格式化普通数值。
 * @param value 待展示值
 * @returns 空值返回占位文案
 */
const formatValue = (value: any) => (hasValue(value) ? value : '--');
/**
 * 格式化发货率。
 * @param value 发货率数值
 * @returns 带百分号的发货率文案
 */
const formatRate = (value: any) => (hasValue(value) ? `${value}%` : '--');
/**
 * 获取销售合同发运进度数据。
 * @returns 无返回值
 */
const getShipmentProgress = async () => {
    const requestId = ++latestRequestId;
    progressData.value = {};
    if (!contractCode.value) {
        loading.value = false;
        return;
    }
    loading.value = true;
    try {
        const res: any = await getShipmentProgressApi(contractCode.value);
        if (requestId !== latestRequestId) return;
        progressData.value = res?.data || {};
    } catch (error) {
        if (requestId === latestRequestId) progressData.value = {};
        console.error('Failed to obtain shipment progress:', error);
    } finally {
        if (requestId === latestRequestId) loading.value = false;
    }
};

const tableConfig = computed(() => ({
    columns: [
        { key: 'grade', title: '品位（%）', width: 160, render: (row: any) => formatValue(row.grade) },
        { key: 'contractQuantity', title: '合同数量（吨）', width: 180, render: (row: any) => formatValue(row.contractQuantity) },
        { key: 'shippedQuantity', title: '已发货数量（吨）', width: 180, render: (row: any) => formatValue(row.shippedQuantity) },
        { key: 'intransitQuantity', title: '在途数量（吨）', width: 180, render: (row: any) => formatValue(row.intransitQuantity) },
        { key: 'deliveryQuantity', title: '已交割数量（吨）', width: 180, render: (row: any) => formatValue(row.deliveryQuantity) },
    ],
    tableList: Array.isArray(progressData.value.shipmentDetails) ? progressData.value.shipmentDetails : [],
    isShowPagination: false,
    styleOption: {
        padding: '0px',
    },
}));

watch(
    contractCode,
    () => {
        getShipmentProgress();
    },
    { immediate: true }
);
</script>

<style lang="less" scoped>
.shipping-progress {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 0 16px 16px;
    overflow: hidden;
}
.shipping-progress-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}
.basic-section {
    flex-shrink: 0;
}
.detail-section {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}
.table-wrapper {
    display: flex;
    flex: 1;
    min-height: 0;
}
.table-wrapper :deep(.web-data-table),
.table-wrapper :deep(.web-n-data-table-con) {
    flex: 1;
    min-height: 0;
}
.table-wrapper :deep(.web-n-data-table) {
    min-height: 0;
    margin-bottom: 0;
}
.table-wrapper :deep(.n-data-table),
.table-wrapper :deep(.n-data-table-wrapper),
.table-wrapper :deep(.n-data-table-base-table) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}
.table-wrapper :deep(.n-data-table-base-table-body) {
    flex: 1;
    min-height: 0;
    height: 100% !important;
}
.table-wrapper :deep(.n-scrollbar-container),
.table-wrapper :deep(.n-scrollbar-content) {
    height: 100%;
}
.table-wrapper :deep(.n-data-table-empty) {
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: 0;
}
.mx_crm_descriptions_style {
    :deep(.n-descriptions-table-content__label) {
        width: 120px;
    }
}
.state-text {
    color: #999999;
    font-size: 14px;
    padding: 16px 0;
}
</style>
