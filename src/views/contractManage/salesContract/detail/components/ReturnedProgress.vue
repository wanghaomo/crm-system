<template>
    <div class="returned">
        <div v-if="loading" class="state-text">回款进度加载中...</div>
        <div v-else class="returned-content">
            <div class="basic-section">
                <DetailsTitle title="基础信息" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style returned-info">
                    <n-descriptions-item label="合同编号">
                        {{ summaryData.contractCode || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="企业名称">
                        {{ summaryData.customerName || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="合同总金额(万元)">
                        {{ formatValue(summaryData.totalAmount) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="已收金额(万元)">
                        {{ formatValue(summaryData.amountPaid) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="未收金额(万元)">
                        {{ formatValue(summaryData.amountUnpaid) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="回款完成率">
                        {{ formatRate(summaryData.progress) }}
                    </n-descriptions-item>
                </n-descriptions>
            </div>
            <div class="record-section">
                <DetailsTitle title="回款单列表" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
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
import { getPaymentProgressApi } from '@/api';
import { paymentStatusMap } from '@/constants/payment';
import { normalizePaymentRecord } from '@/views/settlementManage/payment/utils';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);
const progressData = ref<any>({});
const receiptList = ref<any[]>([]);
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
 * 格式化普通字段。
 * @param value 待展示值
 * @returns 空值返回占位文案
 */
const formatValue = (value: any) => (hasValue(value) ? value : '--');
/**
 * 格式化回款完成率。
 * @param value 完成率
 * @returns 带百分号的完成率文案
 */
const formatRate = (value: any) => (hasValue(value) ? `${value}%` : '--');
/**
 * 格式化回款单状态。
 * @param row 回款单行数据
 * @returns 状态展示文案
 */
const formatPaymentStatus = (row: any) => row.statusName || paymentStatusMap[row.status]?.label || row.status || '--';
const summaryData = computed(() => progressData.value || {});
/**
 * 获取销售合同回款进度数据。
 * @returns 无返回值
 */
const getReceiptProgress = async () => {
    const requestId = ++latestRequestId;
    progressData.value = {};
    receiptList.value = [];
    if (!contractCode.value) {
        loading.value = false;
        return;
    }
    loading.value = true;
    try {
        const res: any = await getPaymentProgressApi(contractCode.value);
        if (requestId !== latestRequestId) return;
        progressData.value = res?.data || {};
        receiptList.value = Array.isArray(progressData.value.receiptList)
            ? progressData.value.receiptList.map((item: any) => normalizePaymentRecord(item))
            : [];
    } catch (error) {
        if (requestId === latestRequestId) {
            progressData.value = {};
            receiptList.value = [];
        }
        console.error('Failed to obtain receipt progress:', error);
    } finally {
        if (requestId === latestRequestId) loading.value = false;
    }
};

const tableConfig = computed(() => ({
    columns: [
        { key: 'receiptCode', title: '回款单编号', width: 160, render: (row: any) => formatValue(row.receiptCode) },
        { key: 'settlementCode', title: '结算单编号', width: 160, render: (row: any) => formatValue(row.settlementCode) },
        { key: 'customerName', title: '客户名称', width: 180, render: (row: any) => formatValue(row.customerName) },
        { key: 'handlerName', title: '跟单人', width: 120, render: (row: any) => formatValue(row.handlerName) },
        { key: 'contractCode', title: '合同编号', width: 160, render: (row: any) => formatValue(row.contractCode) },
        { key: 'amountDue', title: '应收金额(万元)', width: 140, render: (row: any) => formatValue(row.amountDue) },
        { key: 'amountPaid', title: '已收金额(万元)', width: 140, render: (row: any) => formatValue(row.amountPaid) },
        { key: 'amountUnpaid', title: '未收金额(万元)', width: 140, render: (row: any) => formatValue(row.amountUnpaid) },
        { key: 'plannedDate', title: '计划回款日', width: 130, render: (row: any) => formatValue(row.plannedDate) },
        { key: 'actualDate', title: '实际回款日', width: 130, render: (row: any) => formatValue(row.actualDate) },
        { key: 'status', title: '状态', width: 140, render: (row: any) => formatPaymentStatus(row) },
        { key: 'submitTime', title: '提交时间', width: 180, render: (row: any) => formatValue(row.submitTime) },
        { key: 'collectionCount', title: '催收次数', width: 110, render: (row: any) => formatValue(row.collectionCount) },
        { key: 'lastCollectionTime', title: '最新催收时间', width: 180, render: (row: any) => formatValue(row.lastCollectionTime) },
        { key: 'remark', title: '备注', width: 220, render: (row: any) => formatValue(row.remark) },
    ],
    tableList: receiptList.value,
    isShowPagination: false,
    styleOption: {
        padding: '0px',
    },
}));

watch(
    contractCode,
    () => {
        getReceiptProgress();
    },
    { immediate: true }
);
</script>

<style lang="less" scoped>
.returned {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 0 16px 16px;
    overflow: hidden;
}
.returned-content {
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
:deep(.returned-info .n-descriptions-table-content__label) {
    width: 120px;
}
.state-text {
    color: #999999;
    font-size: 14px;
    padding: 16px 0;
}
</style>
