<template>
    <MxDetailPage v-model:show="show" title="合同定价详情" class="contract-price-detail" :closablePop="false" :showApprovalLogs="tab === 'approval'" :approval-logs="detail.approvalLogs || []" approval-logs-title="流程信息" :left-content-style="{ padding: '24px' }" :right-content-style="{ padding: '24px' }">
        <template #header-sub-title>
            <div class="detail-header">
                <div class="title-row">
                    <span class="company-name">{{ text(detail.customerName) }}</span>
                    <StatusTag :text="statusName" :color="statusTagStyle.color" :bgColor="statusTagStyle.backgroundColor" :borderColor='statusTagStyle.bdColor' />
                </div>
                <div class="meta-row">
                    <div class="meta-item">
                        <span class="label">定价单号</span>
                        <span class="value">{{ text(detail.contractPricingCode) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">发货月份</span>
                        <span class="value">{{ formatMonth(detail.planMonth) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">关联月发货计划编号</span>
                        <span class="value">{{ text(detail.monthlyCode) }}</span>
                    </div>
                </div>
            </div>
        </template>

        <template #tabs-content>
            <MxTab v-model="tab" :tabs="tabs" />
        </template>

        <template #right-content>
            <div v-show="tab === 'basic'" class="tab-panel">
                <DetailsTitle title="基础信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style basic-info">
                    <n-descriptions-item label="含税总金额(万元)" :span="2">
                        {{ formatNumber(detail.totalTaxAmount) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="是否拆分合同" :span="2">
                        {{ formatSplitContract(detail.isSplit) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="子公司贸易商" :span="2">
                        {{ detail.subsidiaryName || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="定价附件" :span="2">
                        <MxWebFileUpload v-if="detail.attachmentUrls?.length" :model-value="detail.attachmentUrls" :limit="9" only-show force-app-size :accept="ATTACHMENT_ACCEPT" />
                        <span v-else>--</span>
                    </n-descriptions-item>
                    <n-descriptions-item label="定价备注" :span="2">
                        {{ text(detail.pricingRemark) }}
                    </n-descriptions-item>
                </n-descriptions>

                <DetailsTitle title="定价明细表" :styleOption="{ padding: '20px 0 16px' }" :fontSize="16" />
                <div v-if="showChemicalPricingDetail" class="pricing-detail-section">
                    <MxWebDataTable v-bind="chemicalPricingDetailConfig" />
                </div>
                <div v-if="showTraderPricingDetail" class="pricing-detail-section">
                    <MxWebDataTable v-bind="traderPricingDetailConfig" />
                </div>
            </div>

            <div v-show="tab === 'adjust'" class="tab-panel">
                <MxWebDataTable v-bind="adjustHistoryConfig" />
            </div>

            <div v-show="tab === 'approval'" class="tab-panel">
                <DetailsTitle title="审批信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style approval-info">
                    <n-descriptions-item label="申请人">
                        {{ text(detail.applicantName) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="申请部门">
                        {{ text(detail.applyDeptName) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="定价所属公司" :span="2">
                        {{ text(detail.companyName) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="事项说明" :span="2">
                        {{ text(detail.instruction) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="关联审批" :span="2">
                        <MxApprovalSelect :model-value="detail.associatedApprovals" value-format="object" only-show />
                    </n-descriptions-item>
                </n-descriptions>

                <MxFeishuComment :approval-code="detail.approvalDTO?.approvalInstanceId || ''" :title-style-option="{ padding: '20px 0 16px' }" />
            </div>
        </template>
        <template #footer>
            <MxApprovalCancel
                v-if="tab === 'approval'"
                in-footer
                :approval-id="detail.approvalDTO?.id"
                :initiator-lark-id="detail.approvalDTO?.larkUserId"
                :reviewing="detail.status === 'REVIEWING'"
                @success="handleCancelSuccess" />
        </template>
    </MxDetailPage>
</template>

<script setup lang="ts">

import MxFeishuComment from '@/components/MxFeishuComment/index.vue';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import initData from './index';

const emit = defineEmits<{
    (event: 'refresh'): void;
}>();

const {
    show,
    tab,
    tabs,
    detail,
    statusName,
    statusTagStyle,
    ATTACHMENT_ACCEPT,
    chemicalPricingDetailConfig,
    traderPricingDetailConfig,
    showChemicalPricingDetail,
    showTraderPricingDetail,
    adjustHistoryConfig,
    showDialog,
    text,
    formatMonth,
    formatNumber,
    formatSplitContract,
} = initData();

/**
 * 撤销审批成功后重新加载详情并通知分页刷新。
 * @returns 无返回值
 */
const handleCancelSuccess = async () => {
    await showDialog(detail.value.id);
    tab.value = 'approval';
    emit('refresh');
};

defineExpose({
    showDialog,
});
</script>

<style lang="less" scoped>
:deep(.basic-info .n-descriptions-table-content__label) {
    width: 120px;
}

.detail-header {
    width: 100%;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.company-name {
    max-width: 420px;
    overflow: hidden;
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status-tag {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 18px;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 64px;
    color: #333333;
    font-size: 14px;
    overflow: hidden;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.label {
    flex-shrink: 0;
    color: #999999;
}

.value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}


.pricing-detail-section+.pricing-detail-section {
    margin-top: 18px;
}

:deep(.web-n-data-table) {
    margin-bottom: 0;
}

.approval-info {
    margin-bottom: 0;
}
</style>
