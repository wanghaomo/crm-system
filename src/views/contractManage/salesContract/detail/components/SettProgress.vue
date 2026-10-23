<template>
    <div class="sett">
        <div v-if="loading" class="state-text">结算进度加载中...</div>
        <div v-else class="sett-content">
            <div class="basic-section">
                <DetailsTitle title="基础信息" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
                    <n-descriptions-item label="合同编号">
                        {{ displayProgressData.contractCode || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="企业名称">
                        {{ displayProgressData.customerName || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="合同总金额(万元)">
                        {{ formatAmount(displayProgressData.contractAmount) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="已结算金额（万元）">
                        {{ formatAmount(displayProgressData.receivedAmount) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="未结算金额（万元）">
                        {{ formatAmount(displayProgressData.unReceivedAmount) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="结算完成率">
                        {{ formatCompletionRate(displayProgressData.completionRate) }}
                    </n-descriptions-item>
                </n-descriptions>
            </div>
            <div class="record-section">
                <DetailsTitle title="结算记录" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
                <div class="table-wrapper">
                    <MxWebDataTable v-bind="tableConfig"> </MxWebDataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { getSettlementProgressApi } from '@/api';

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
// 结算进度表格状态枚举。
const SETTLEMENT_PROGRESS_STATUS_MAP: Record<string, string> = {
    DRAFT: '草稿',
    REVIEWING: '审批中',
    ARCHIVED: '已归档',
};

const contractCode = computed(() => props.detail.contractCode || '');
const displayProgressData = computed(() => ({
    contractCode: progressData.value.contractCode,
    customerName: progressData.value.customerName,
    contractAmount: progressData.value.contractAmount,
    receivedAmount: progressData.value.receivedAmount,
    unReceivedAmount: progressData.value.unReceivedAmount,
    completionRate: progressData.value.completionRate,
    settlementRecords: Array.isArray(progressData.value.settlementRecords) ? progressData.value.settlementRecords : [],
}));
/**
 * 判断字段是否有可展示值。
 * @param value 待判断值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== undefined && value !== null && value !== '';
/**
 * 格式化金额。
 * @param value 金额
 * @returns 金额文案
 */
const formatAmount = (value: any) => (hasValue(value) ? value : '--');
/**
 * 格式化结算完成率。
 * @param value 完成率数值
 * @returns 带百分号的完成率文案
 */
const formatCompletionRate = (value: any) => (hasValue(value) ? `${value}%` : '--');
/**
 * 格式化结算单状态。
 * @param value 状态值
 * @returns 状态展示文案
 */
const formatSettlementStatus = (value: any) => {
    if (!hasValue(value)) return '--';
    return SETTLEMENT_PROGRESS_STATUS_MAP[String(value)] || value;
};
/**
 * 获取销售合同结算进度数据。
 * @returns 无返回值
 */
const getSettlementProgress = async () => {
    const requestId = ++latestRequestId;
    progressData.value = {};
    if (!contractCode.value) {
        loading.value = false;
        return;
    }
    loading.value = true;
    try {
        const res: any = await getSettlementProgressApi(contractCode.value);
        if (requestId !== latestRequestId) return;
        progressData.value = res?.data || {};
    } catch (error) {
        if (requestId === latestRequestId) progressData.value = {};
        console.error('Failed to obtain settlement progress:', error);
    } finally {
        if (requestId === latestRequestId) loading.value = false;
    }
};

const tableConfig = computed(() => ({
    columns: [
        { key: 'settlementCode', title: '结算单编号', width: 200, render: (row: any) => row.settlementCode || '--' },
        { key: 'totalAmount', title: '结算总价（万元）', width: 200, render: (row: any) => formatAmount(row.totalAmount) },
        { key: 'status', title: '状态', width: 200, render: (row: any) => formatSettlementStatus(row.status) },
    ],
    tableList: displayProgressData.value.settlementRecords,
    isShowPagination: false,
    styleOption: {
        padding: '0px',
    },
}));

watch(
    contractCode,
    () => {
        getSettlementProgress();
    },
    { immediate: true }
);
</script>

<style lang="less" scoped>
.sett {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 0 16px 16px;
    overflow: hidden;
}
.sett-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}
.basic-section {
    flex-shrink: 0;
}
.record-section {
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
