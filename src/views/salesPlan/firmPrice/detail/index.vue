<template>
    <MxDetailPage v-model:show="show" title="化工企业基准定价详情" class="firm-price-detail" :closablePop="false" :showApprovalLogs="tab == 2" :approval-logs="detail.approvalLogs || []" approval-logs-title="流程信息" :hasTabBorder="true" :left-content-style="{ padding: '24px' }"
        :right-content-style="rightContentStyle">
        <template #header-sub-title>
            <div class="detail-header">
                <div class="title-row">
                    <span class="company-name">{{ text(detail.customerName) }}</span>
                    <StatusTag :text="statusName" :color="statusTagStyle.color" :bgColor="statusTagStyle.backgroundColor" :borderColor='statusTagStyle.bdColor' />
                </div>
                <div class="meta-row">
                    <div class="meta-item">
                        <span class="label">基准定价单号</span>
                        <span class="value">{{ text(detail.pricingCode) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">定价月份</span>
                        <span class="value">{{ text(detail.pricingMonth) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">创建人</span>
                        <span class="value">{{ text(detail.createdByName) }}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">创建时间</span>
                        <span class="value">{{ text(detail.createdAt) }}</span>
                    </div>
                </div>
            </div>
        </template>

        <template #tabs-content>
            <MxTab :tabs="tabs" v-model="tab" />
        </template>

        <template #right-content>
            <div v-if="tab === 1" class="base-content">
                <DetailsTitle title="基础信息" :styleOption="{ padding: '0 0 20px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
                    <n-descriptions-item label="项目名称">
                        <div class="link-value">{{ text(detail.projectName) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="子公司贸易商">
                        <div class="link-value">{{ text(detail.subsidiaryName) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="与会人员">
                        <div class="link-value">{{ formatAttendees(detail.attendees) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="企业主要产品规模" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.productScale) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="库存情况(万吨)" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.inventoryStatus) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="开工率(%)" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.operatingRate) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="年矿石采购量" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.annualPurchaseVolume) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="计划采购量" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.planPurchaseVolume) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="支付情况" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.paymentTerms) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="重要合同条件" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.importantContractTerms) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="财务费用" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.financialCost) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="其他" :span="2">
                        <div class="link-value">{{ text(detail.extChemicalDTO?.otherInfo) }}</div>
                    </n-descriptions-item>
                    <n-descriptions-item label="物流运输费用" :span="2">
                        <MxWebFileUpload
                            v-if="detail.logistics?.length"
                            only-show
                            force-app-size
                            :model-value="detail.logistics"
                            :accept="logisticsAttachmentAccept" />
                        <span v-else>--</span>
                    </n-descriptions-item>
                </n-descriptions>

                <!-- <DetailsTitle title="物流运输费用" :styleOption="{ padding: '20px 0' }" :fontSize="16" />
                <n-data-table :columns="logisticsColumns" :data="detail.logisticsDTOList || []" :bordered="true" :single-line="false" :pagination="false" /> -->

                <DetailsTitle title="市场价(参考价)" :styleOption="{ padding: '20px 0' }" :fontSize="16" />
                <n-data-table :columns="marketColumns" :data="detail.refDTOList || []" :bordered="true" :single-line="false" :pagination="false" />

                <DetailsTitle title="计划量以及价格" :styleOption="{ padding: '20px 0' }" :fontSize="16" />
                <n-data-table :columns="itemColumns" :data="detail.itemDTOList || []" :bordered="true" :single-line="false" :pagination="false" />
            </div>

            <div v-if="tab === 2" class="approval-content">
                <div class="approve-right">
                    <DetailsTitle title="审批信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
                    <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style approve-info">
                        <n-descriptions-item label="申请人">
                            <div class="link-value">{{ text(detail.applicantName) }}</div>
                        </n-descriptions-item>
                        <n-descriptions-item label="申请部门">
                            <div class="link-value">{{ text(detail.applyDeptName) }}</div>
                        </n-descriptions-item>
                        <n-descriptions-item label="所属公司">
                            <div class="link-value">{{ text(detail.companyName) }}</div>
                        </n-descriptions-item>
                        <n-descriptions-item label="流程是否需要二次报价报量审批">
                            <div class="link-value">{{ text(detail.isTwoApprove) }}</div>
                        </n-descriptions-item>
                        <n-descriptions-item label="事项说明" :span="2">
                            <div class="link-value">{{ text(detail.instruction) }}</div>
                        </n-descriptions-item>
                        <n-descriptions-item label="附件" :span="2">
                            <MxWebFileUpload v-if="detail.attachments?.length" :limit="attachmentLimit" only-show force-app-size :model-value="detail.attachments" :accept="attachmentAccept" />
                            <span v-else>--</span>
                        </n-descriptions-item>
                        <n-descriptions-item label="关联审批" :span="2">
                            <MxApprovalSelect :model-value="detail.associatedApprovals" value-format="object" only-show />
                        </n-descriptions-item>
                    </n-descriptions>

                    <MxFeishuComment :approval-code="detail.approvalDTO?.approvalInstanceId || ''" :title-style-option="{ padding: '16px 0px' }" />
                </div>
            </div>
        </template>
        <template #footer>
            <MxApprovalCancel
                v-if="tab === 2"
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
import { NDataTable, NDescriptions, NDescriptionsItem } from 'naive-ui';
import initData from './index';

const emit = defineEmits<{
    (event: 'refresh'): void;
}>();

const {
    show,
    detail,
    tabs,
    tab,
    statusName,
    statusTagStyle,
    rightContentStyle,
    // logisticsColumns,
    marketColumns,
    itemColumns,
    attachmentAccept,
    logisticsAttachmentAccept,
    attachmentLimit,
    showDialog,
    text,
    formatAttendees,
} = initData();

/**
 * 撤销审批成功后重新加载详情并通知分页刷新。
 * @returns 无返回值
 */
const handleCancelSuccess = async () => {
    await showDialog(detail.value.id);
    tab.value = 2;
    emit('refresh');
};

defineExpose({
    showDialog,
});
</script>

<style lang="less" scoped>
.firm-price-detail {
    :deep(.detail-spin.n-spin-container) {
        width: 100%;
        height: 100%;
    }

    :deep(.detail-spin .n-spin-content) {
        box-sizing: border-box;
        height: 100%;
        padding: 24px;
        overflow-y: auto;
    }

    :deep(.n-data-table-th) {
        background: #f7f7f7;
        color: #999999;
        font-weight: 400;
    }
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
    color: #333333;
    font-size: 16px;
    font-weight: 600;
}


.meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 80px;
}

.meta-item {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
}

.label {
    flex-shrink: 0;
    color: #999999;
    font-size: 14px;
}

.value,
.link-value {
    min-width: 0;
    color: #333333;
    font-size: 14px;
    line-height: 24px;
    word-break: break-word;
}

.base-content {
    // width: 100%;
    // height: 100%;
    // min-height: 100%;
    // box-sizing: border-box;
}

.approval-content {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
}

.approve-left {
    width: 200px;
    flex-shrink: 0;
    padding: 0 16px 16px;
    overflow-y: auto;
}

.approve-right {
    // flex: 1;
    min-width: 800px;
    // padding: 0 16px 16px;
    // border-left: 1px solid #e2e2e2;
    // overflow-y: auto;
    width: 100%;
}

.approve-info {
    :deep(.n-descriptions-table-content__label) {
        width: 150px;
    }
}
</style>
