<template>
    <WebPage showBack hideAddBtn contentPadding="0px" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight v-if="!isDetail">
            <MxButton border @click="confirmEvt('save')"  :styleOption="{'color': 'var(--base-color)', 'border-color': 'var(--base-color)'}"> 保 存 </MxButton>
            <MxButton @click="confirmEvt('submit')"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="contract-price-add">
                <div class="add-con-header">
                    <div class="page-title">
                        <span class="title-text">{{ pageTitle }}</span>
                    </div>
                </div>
                <div class="form-con">
                    <n-form
                        ref="formRef"
                        :model="formData"
                        :rules="formRules"
                        label-placement="left"
                        require-mark-placement="left"
                        label-width="120px">
                        <div v-if="approvalLogs.length" class="edit-approval-flow">
                            <DetailsTitle title="流程信息" :styleOption="{ padding: '18px 0px' }" />
                            <ApprovalDetails :model-value="approvalLogs" type="horizontal" />
                        </div>
                        <div class="form-item">
                            <DetailsTitle title="基础信息" :styleOption="{ padding: '18px 0px' }" />
                            <n-grid :cols="2" :x-gap="40">
                                <n-grid-item>
                                    <n-form-item label="关联月发货计划" path="monthlyCode">
                                        <n-select
                                            v-model:value="formData.monthlyCode"
                                            :options="monthlyPlanOptions"
                                            clearable
                                            :disabled="isMonthlyCodeDisabled"
                                            @update:value="handleMonthlyPlanChange"
                                            placeholder="请选择" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="客户名称" path="customerSelectValue">
                                        <n-select
                                            v-model:value="formData.customerSelectValue"
                                            :options="planCustomerOptions"
                                            clearable
                                            filterable
                                            :disabled="isCustomerDisabled"
                                            @update:value="handleCustomerChange"
                                        placeholder="请先选择关联月发货计划" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item v-if="formData.subsidiaryName">
                                    <n-form-item label="子公司贸易商" path="subsidiaryName">
                                        <n-input placeholder="自动匹配" v-model:value="formData.subsidiaryName" disabled />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="发货月份" path="planMonth">
                                        <n-date-picker
                                            v-model:value="formData.planMonth"
                                            type="month"
                                            disabled
                                            placeholder="自动匹配月计划" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="含税总金额(万元)" path="totalTaxAmount">
                                        <n-input-number
                                            v-model:value="formData.totalTaxAmount"
                                            :min="0"
                                            :max="999999999"
                                            :precision="6"
                                            :show-button="false"
                                            disabled
                                            placeholder="由下方定价单明细表汇总" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item :span="2">
                                    <n-form-item label="定价附件" path="attachmentUrls">
                                        <div class="upload-field">
                                            <MxWebFileUpload
                                                v-model="formData.attachmentUrls"
                                                :limit="9"
                                                :multiple="true"
                                                :onlyShow="isDetail"
                                                fileSize="50M"
                                                :accept="ATTACHMENT_ACCEPT" />
                                        </div>
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item :span="2">
                                    <n-form-item label="定价备注" path="pricingRemark">
                                        <n-input
                                            v-model:value="formData.pricingRemark"
                                            type="textarea"
                                            show-count
                                            :maxlength="500"
                                            :disabled="isDetail"
                                            placeholder="请输入"
                                            :autosize="{
                                                minRows: 4,
                                                maxRows: 8,
                                            }" />
                                    </n-form-item>
                                </n-grid-item>
                            </n-grid>
                        </div>

                        <div v-if="hasSelectedCustomerType" class="form-item">
                            <DetailsTitle title="定价明细表" :styleOption="{ padding: '18px 0px' }" />
                            <n-grid v-if="hasMultiplePricingDetails && !isDetail" :cols="2" :x-gap="40">
                                <n-grid-item>
                                    <n-form-item label="是否拆分合同" path="isSplit">
                                        <n-radio-group v-model:value="formData.isSplit">
                                            <n-radio
                                                v-for="option in splitContractOptions"
                                                :key="option.value"
                                                :value="option.value">
                                                {{ option.label }}
                                            </n-radio>
                                        </n-radio-group>
                                    </n-form-item>
                                </n-grid-item>
                            </n-grid>
                            <div v-if="hasChemicalPricingDetail" class="pricing-detail-section">
                                <MxWebDataTable v-bind="chemicalPricingDetailConfig" />
                            </div>
                            <div v-if="hasTraderPricingDetail" class="pricing-detail-section">
                                <MxWebDataTable v-bind="traderPricingDetailConfig" />
                            </div>
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
                                            :disabled="isDetail"
                                            placeholder="请选择"
                                            @changeEvt="handleApplicantChange" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="申请部门" path="applyDeptId">
                                        <MxCascaderTreeSelect
                                            v-model:value="formData.applyDeptId"
                                            v-model:label="formData.applyDeptName"
                                            :type="2"
                                            :option="deptTree" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="定价所属公司" path="companyId">
                                        <MxDict
                                            v-model="formData.companyId"
                                            v-model:label="formData.companyName"
                                            clearable
                                            placeholder="请选择"
                                            :disabled="isDetail"
                                            dictType="合同定价所属公司" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item :span="2">
                                    <n-form-item label="事项说明" path="instruction">
                                        <n-input
                                            v-model:value="formData.instruction"
                                            type="textarea"
                                            show-count
                                            :maxlength="500"
                                            :disabled="isDetail"
                                            placeholder="请输入"
                                            :autosize="{
                                                minRows: 4,
                                                maxRows: 8,
                                            }" />
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
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import {
    NDatePicker,
    NForm,
    NFormItem,
    NGrid,
    NGridItem,
    NInput,
    NInputNumber,
    NRadio,
    NRadioGroup,
    NSelect,
} from 'naive-ui';
import initData from './index';

const {
    formRef,
    formData,
    formRules,
    pageTitle,
    isDetail,
    isMonthlyCodeDisabled,
    isCustomerDisabled,
    monthlyPlanOptions,
    planCustomerOptions,
    deptTree,
    chemicalPricingDetailConfig,
    traderPricingDetailConfig,
    hasMultiplePricingDetails,
    hasChemicalPricingDetail,
    hasTraderPricingDetail,
    hasSelectedCustomerType,
    splitContractOptions,
    ATTACHMENT_ACCEPT,
    confirmEvt,
    handleCustomerChange,
    handleApplicantChange,
    handleMonthlyPlanChange,
    approvalLogs,
} = initData();
</script>

<style lang="less" scoped>
.contract-price-add {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: var(--base-white);
}

.add-con-header {
    flex-shrink: 0;
    padding: 16px 20px 0;
}

.form-con {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px;
}

.edit-approval-flow {
    margin-bottom: 4px;
}

.title-text {
    color: var(--base-black);
    font-size: 16px;
    font-weight: 600;
}

.form-item {
    :deep(.n-input-number) {
        width: 100%;
    }

    :deep(.n-date-picker) {
        width: 100%;
    }
}

.upload-field {
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.upload-tip {
    padding-bottom: 4px;
    color: var(--base-grey);
    font-size: 12px;
    line-height: 20px;
}

.approval-field {
    display: flex;
    align-items: center;
    min-height: 32px;
}

.add-icon {
    width: 14px;
    height: 14px;
}

:deep(.require-label)::before {
    margin-right: 4px;
    color: var(--base-color-red);
    content: '*';
}

:deep(.web-n-data-table) {
    margin-bottom: 0;
}

:deep(.web-n-data-table .n-form-item) {
    margin-bottom: 0;
}
:deep(.n-data-table) {
    .n-form-item-feedback-wrapper {
        display: none;
    }
}
</style>
