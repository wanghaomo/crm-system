<template>
    <WebPage showBack hideAddBtn contentPadding="0px" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border :disabled="submitLoading" @click="confirmEvt('save')"  :styleOption="{'color': 'var(--base-color)', 'border-color': 'var(--base-color)'}">
                {{ submitLoading ? '保存中' : '保 存' }}
            </MxButton>
            <MxButton :disabled="submitLoading" @click="confirmEvt('submit')">
                {{ submitLoading ? '提交中' : '提 交' }}
            </MxButton>
        </template>
        <template #content>
            <n-spin :show="pageLoading" description="加载中...">
                <div class="add-con">
                    <div class="add-con-header">
                        <div class="page-title">
                            <span class="title-text">{{ pageTitle }}</span>
                        </div>
                    </div>
                </div>
                <div class="form-con">
                    <n-form
                        ref="formRef"
                        :model="formData"
                        :rules="formRules"
                        label-placement="left"
                        label-align="right"
                        require-mark-placement="left"
                        label-width="112px">
                    <div v-if="approvalLogs.length" class="edit-approval-flow">
                        <DetailsTitle title="流程信息" :styleOption="{ padding: '18px 0px' }" />
                        <ApprovalDetails :model-value="approvalLogs" type="horizontal" />
                    </div>
                    <div class="form-item">
                        <DetailsTitle title="基础信息" :styleOption="{ padding: '18px 0px' }" />
                        <n-grid :cols="2" :x-gap="40">
                            <n-grid-item>
                                <n-form-item label="计划发货月份" path="monthlyMonth">
                                    <n-date-picker v-model:value="formData.monthlyMonth" type="month" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="定价月份" path="pricingMonthRange">
                                    <n-date-picker
                                        :value="formData.pricingMonthRange"
                                        type="monthrange"
                                        clearable
                                        start-placeholder="开始月份"
                                        end-placeholder="结束月份"
                                        @update:value="handlePricingMonthRangeChange" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <div class="flex">
                                    <n-form-item label="关联AI分析报告编号" path="aiReportCode" style="flex: 1">
                                        <n-select
                                            v-model:value="formData.aiReportCode"
                                            :options="aiReportList"
                                            filterable
                                            clearable
                                            placeholder="请选择" />
                                    </n-form-item>
                                    <MxButton
                                        border
                                        type="success"
                                        style="margin-left: 16px"
                                        :disabled="reportDetailLoading"
                                        @click="openSelectedReportDetail">
                                        {{ reportDetailLoading ? '加载中' : '查看' }}
                                    </MxButton>
                                </div>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="关联基准定价单" path="basePricingCodes">
                                    <n-select
                                        :value="formData.basePricingCodes"
                                        :options="basePricingList"
                                        multiple
                                        filterable
                                        clearable
                                        placeholder="请选择"
                                        @update:value="handleBasePricingCodesChange" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="计划备注" path="remark">
                                    <n-input
                                        v-model:value="formData.remark"
                                        type="textarea"
                                        show-count
                                        :maxlength="500"
                                        placeholder="请输入"
                                        :autosize="{
                                            minRows: 4,
                                            maxRows: 8,
                                        }" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                    </div>
                    <div class="form-item">
                        <DetailsTitle title="历史合同剩余明细" :styleOption="{ padding: '18px 0px' }" />
                        <MxWebDataTable v-bind="remainingDetails"> </MxWebDataTable>
                    </div>
                    <div class="form-item">
                        <DetailsTitle title="本月新增计划明细" :styleOption="{ padding: '18px 0px 0' }" />
                        <div class="table-action-row">
                            <MxTab class="mx-tab" :tabs="tabs" v-model="tab"></MxTab>
                        </div>
                        <div v-if="tab === 'TRADER'" class="table-add-row">
                            <MxButton border type="success" @click="addTraderItem">
                                <template #leftIcon>
                                    <i class="monthly-add-icon"></i>
                                </template>
                                添加
                            </MxButton>
                        </div>
                        <n-data-table
                            :row-key="(row) => row.frontId || row.id"
                            :columns="addRemainingDataColumns"
                            :data="monthlyAddDetailTableList"
                            :single-line="false"
                            :scroll-x="monthlyAddTableScrollX"
                            :max-height="400" />
                    </div>
                    <div class="form-item">
                        <DetailsTitle title="按品位汇总" :styleOption="{ padding: '18px 0px' }" />
                        <MxWebDataTable v-bind="allTableConfig"> </MxWebDataTable>
                    </div>
                    <div class="form-item">
                        <DetailsTitle title="审批信息" :styleOption="{ padding: '18px 0px' }" />
                        <n-grid :cols="2" :x-gap="40">
                            <n-grid-item>
                                <n-form-item label="申请人" path="applicantId">
                                    <MxPersonSelect
                                        v-model="formData.applicantId"
                                        v-model:label="formData.applicantName"
                                        :clearable="true"
                                        placeholder="请选择"
                                        @changeEvt="handleApplicantChange" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="审批备注" path="approvalRemark">
                                    <n-input
                                        v-model:value="formData.approvalRemark"
                                        type="textarea"
                                        show-count
                                        :maxlength="500"
                                        placeholder="请输入"
                                        :autosize="{ minRows: 4, maxRows: 8 }" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="事项说明" path="instruction">
                                    <n-input
                                        v-model:value="formData.instruction"
                                        type="textarea"
                                        show-count
                                        :maxlength="500"
                                        placeholder="请输入"
                                        :autosize="{ minRows: 4, maxRows: 8 }" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="附件" path="attachmentUrls">
                                    <MxWebFileUpload
                                        v-model="formData.attachmentUrls"
                                        :limit="9"
                                        :multiple="true"
                                        :file-size="'50M'"
                                        :accept="attachmentAccept" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="关联审批" path="associatedApproval">
                                    <MxApprovalSelect
                                        v-model="formData.associatedApproval"
                                        value-format="object"
                                        :multiple="true" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                    </div>
                </n-form>
                </div>
            </n-spin>
            <ReportDetailDrawer v-model:show="detailDrawerVisible" :detail="currentReport" />
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NGrid, NGridItem, NDatePicker, NSelect, NInput, NDataTable, NSpin } from 'naive-ui';
import initData from './index';
import ReportDetailDrawer from '../../aiPrediction/components/ReportDetailDrawer.vue';

const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

const {
    confirmEvt,
    formData,
    formRules,
    basePricingList,
    aiReportList,
    remainingDetails,
    tabs,
    tab,
    addRemainingDataColumns,
    monthlyAddTableScrollX,
    allTableConfig,
    formRef,
    pageTitle,
    pageLoading,
    submitLoading,
    monthlyAddDetailTableList,
    addTraderItem,
    handlePricingMonthRangeChange,
    handleBasePricingCodesChange,
    handleApplicantChange,
    approvalLogs,
    currentReport,
    detailDrawerVisible,
    reportDetailLoading,
    openSelectedReportDetail,
} = initData();
</script>

<style lang="less" scoped>
.add-con-header {
    flex-shrink: 0;
    padding: 0 16px;
    padding-top: 16px;
}
.form-con {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px;
    padding-bottom: 16px;
}
.edit-approval-flow {
    margin-bottom: 4px;
}
.title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--base-black);
}
.table-action-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}
.table-add-row {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 12px;
}
:deep(.monthly-add-child-wrap) {
    background: var(--base-white);
}
:deep(.monthly-add-child-title) {
    display: flex;
    align-items: center;
    height: 40px;
    color: var(--base-black);
    font-weight: 600;
    border-bottom: 1px solid #eeeeee;
}
:deep(.monthly-add-child-action) {
    display: flex;
    justify-content: center;
    padding: 12px 0 10px;
}
:deep(.required-column-title) {
    display: inline-flex;
    align-items: center;
    gap: 2px;
}
:deep(.required-mark) {
    color: var(--base-color-red);
    font-weight: 600;
}
.monthly-add-icon,
:deep(.monthly-add-icon) {
    display: inline-block;
    width: 16px;
    height: 16px;
    background: url('@/assets/images/comm/icon⎽com⎽add_blue.png') center center / 100% 100% no-repeat;
}
:deep(.n-data-table) {
    .n-form-item-feedback-wrapper {
        display: none;
    }
}

.mx-tab {
    margin-bottom: 12px;
    padding: 0;
    width: 100%;
    gap: 32px;
    :deep(.tab-item) {
        padding: 0 !important;
    }
    :deep(.tab-item-name-select) {
        font-size: 14px;
    }
    :deep(.tab-item-name) {
        font-size: 14px;
    }
}
</style>
