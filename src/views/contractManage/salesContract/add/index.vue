<template>
    <WebPage showBack hideAddBtn contentPadding="16px" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border :disabled="submitLoading" @click="confirmEvt('save')"  :styleOption="{'color': 'var(--base-color)', 'border-color': 'var(--base-color)'}"> 保 存 </MxButton>
            <MxButton :disabled="submitLoading" @click="confirmEvt('submit')"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="base-edit-page sales-contract-edit">
                <div class="page-title">
                    <span class="title-text">{{ pageTitle }}</span>
                </div>

                <n-form
                    ref="formRef"
                    :model="formData"
                    :rules="formRules"
                    label-placement="left"
                    require-mark-placement="left"
                    label-width="100px">
                    <div v-if="approvalLogs.length" class="edit-approval-flow">
                        <DetailsTitle title="流程信息" :styleOption="{ padding: '18px 0px' }" />
                        <ApprovalDetails :model-value="approvalLogs" type="horizontal" />
                    </div>
                    <div>
                        <DetailsTitle title="基础信息" :styleOption="{ padding: '18px 0px' }" />
                        <n-grid :cols="2" :x-gap="40">
                            <n-grid-item>
                                <n-form-item label="合同编号" path="contractCode">
                                    <n-input
                                        v-model:value="formData.contractCode"
                                        show-count
                                        :maxlength="CONTRACT_CODE_MAX_LENGTH"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="关联定价单" path="pricingCode">
                                    <n-select
                                        v-model:value="formData.pricingCode"
                                        :options="pricingOptions"
                                        filterable
                                        clearable
                                        :disabled="associationDisabled"
                                        placeholder="请选择"
                                        @update:value="(_, option) => handlePricingChange(option)" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="发货月份" path="shipmentMonth">
                                    <n-date-picker
                                        v-model:formatted-value="formData.shipmentMonth"
                                        type="month"
                                        :value-format="MONTH_PICKER_FORMAT"
                                        disabled
                                        placeholder="自动匹配关联定价单" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="关联框架合同" path="frameworkCode">
                                    <n-select
                                        v-model:value="formData.frameworkCode"
                                        :options="frameworkOptions"
                                        filterable
                                        clearable
                                        placeholder="请选择" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="关联月发货计划" path="monthlyPlanCode">
                                    <n-input
                                        disabled
                                        v-model:value="formData.monthlyPlanCode"
                                        type="text"
                                        placeholder="自动匹配关联定价单" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="关联发货订单明细" path="deliveryDetailCodes" label-width="150px">
                                    <n-select
                                        v-model:value="formData.deliveryDetailCodes"
                                        :options="preShipmentOptions"
                                        :loading="preShipmentLoading"
                                        multiple
                                        filterable
                                        clearable
                                        max-tag-count="responsive"
                                        placeholder="请选择" />
                                </n-form-item>
                            </n-grid-item>
                             <n-grid-item v-if="formData.subsidiaryName">
                                <n-form-item label="子公司贸易商" path="subsidiaryName">
                                    <n-input v-model:value="formData.subsidiaryName" disabled />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="结算方式" path="paymentMethod">
                                    <MxDict
                                        placeholder="请选择"
                                        :dictType="DICT.PAYMENT_METHOD"
                                        v-model="formData.paymentMethod"></MxDict>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="付款条件" path="paymentTerms">
                                    <n-input
                                        v-model:value="formData.paymentTerms"
                                        type="textarea"
                                        show-count
                                        :maxlength="TEXTAREA_MAX_LENGTH"
                                        placeholder="请输入"
                                        :autosize="{
                                            minRows: 4,
                                            maxRows: 8,
                                        }" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                    </div>
                    <div>
                        <DetailsTitle title="审批信息" :styleOption="{ padding: '18px 0px' }" />
                        <n-grid :cols="2" :x-gap="40">
                            <n-grid-item>
                                <n-form-item label="合同名称" path="contractName">
                                    <n-input
                                        v-model:value="formData.contractName"
                                        show-count
                                        :maxlength="SHORT_TEXT_MAX_LENGTH"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="含税总金额(万元)" path="totalAmount">
                                    <n-input-number
                                        disabled
                                        v-model:value="formData.totalAmount"
                                        :precision="2"
                                        :show-button="false"
                                        placeholder="自动计算" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="计价方式" path="pricingMethod">
                                    <n-radio-group v-model:value="formData.pricingMethod">
                                        <n-space>
                                            <n-radio
                                                v-for="song in getDictEnum(DICT.PRICING_METHOD)"
                                                :key="song.value"
                                                :value="song.value">
                                                {{ song.label }}
                                            </n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="签订时间" path="signDate">
                                    <n-date-picker
                                        v-model:formatted-value="formData.signDate"
                                        type="date"
                                        :value-format="DATE_PICKER_FORMAT" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="开始时间" path="startDate">
                                    <n-date-picker
                                        v-model:formatted-value="formData.startDate"
                                        type="date"
                                        :value-format="DATE_PICKER_FORMAT" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="结束时间" path="endDate">
                                    <n-date-picker
                                        v-model:formatted-value="formData.endDate"
                                        type="date"
                                        :value-format="DATE_PICKER_FORMAT" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="时长(天)" path="duration">
                                    <n-input-number
                                        disabled
                                        v-model:value="formData.duration"
                                        :precision="0"
                                        :show-button="false"
                                        placeholder="自动计算" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="供方单位" path="supplierUnit">
                                    <MxDict
                                        placeholder="请选择"
                                        :dictType="DICT.SUPPLIER_UNIT"
                                        v-model="formData.supplierUnit"></MxDict>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="我方负责人" path="directorId">
                                    <MxPersonSelect
                                        :clearable="true"
                                        placeholder="请选择"
                                        v-model="formData.directorId"
                                        v-model:label="formData.directorName"
                                        v-model:selectedPerson="formData.directorSelectedPerson"
                                        @changeEvt="handleDirectorChange"></MxPersonSelect>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="合同发起人" path="contractInitiatorId">
                                    <MxPersonSelect
                                        :clearable="true"
                                        placeholder="请选择"
                                        v-model="formData.contractInitiatorId"
                                        v-model:label="formData.contractInitiatorName"
                                        v-model:selectedPerson="formData.initiatorSelectedPerson"
                                        @changeEvt="handleInitiatorChange"></MxPersonSelect>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="所属部门" path="deptId">
                                    <n-input
                                        disabled
                                        v-model:value="formData.deptName"
                                        type="text"
                                        placeholder="根据合同发起人自动带出" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="合同发起部门" path="contractDeptId">
                                    <MxDeptSelect
                                        v-model:value="formData.contractDeptId"
                                        v-model:label="formData.contractDeptName"></MxDeptSelect>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="需方单位" path="customerName">
                                    <n-input
                                        disabled
                                        v-model:value="formData.customerName"
                                        type="text"
                                        placeholder="自动匹配关联定价单" />
                                </n-form-item>
                            </n-grid-item>

                            <n-grid-item>
                                <n-form-item label="对方负责人" path="oppositeDuration">
                                    <n-input
                                        v-model:value="formData.oppositeDuration"
                                        show-count
                                        :maxlength="SHORT_TEXT_MAX_LENGTH"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="对方联系方式" path="oppositeTel">
                                    <n-input
                                        v-model:value="formData.oppositeTel"
                                        show-count
                                        :maxlength="SHORT_TEXT_MAX_LENGTH"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="合同初稿" path="contractFileUrlObject">
                                    <MxWebFileUpload
                                        :limit="FILE_UPLOAD_LIMIT"
                                        :multiple="true"
                                        v-model="formData.contractFileUrlObject"
                                        :fileSize="FILE_SIZE_LIMIT"
                                        :accept="FILE_ACCEPT"></MxWebFileUpload>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="附件" path="fileUrlList">
                                    <MxWebFileUpload
                                        :limit="FILE_UPLOAD_LIMIT"
                                        :multiple="true"
                                        v-model="formData.fileUrlList"
                                        :fileSize="FILE_SIZE_LIMIT"
                                        :accept="FILE_ACCEPT"></MxWebFileUpload>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="关联审批" path="associatedApprovalObjects">
                                    <MxApprovalSelect
                                        v-model="formData.associatedApprovalObjects"
                                        value-format="object"
                                        :multiple="true" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="备注" path="remark">
                                    <n-input
                                        v-model:value="formData.remark"
                                        type="textarea"
                                        show-count
                                        :maxlength="TEXTAREA_MAX_LENGTH"
                                        placeholder="请输入"
                                        :autosize="{
                                            minRows: 4,
                                            maxRows: 8,
                                        }" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                    </div>
                    <div>
                        <DetailsTitle title="合同多品位明细" :styleOption="{ padding: '18px 0px' }" />
                        <MxWebDataTable v-bind="detailTableConfig"> </MxWebDataTable>
                    </div>
                </n-form>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import initData from './index';
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
    NSpace,
} from 'naive-ui';

const {
    confirmEvt,
    formData,
    formRules,
    formRef,
    getDictEnum,
    pricingOptions,
    frameworkOptions,
    preShipmentOptions,
    preShipmentLoading,
    detailTableConfig,
    handlePricingChange,
    handleDirectorChange,
    handleInitiatorChange,
    submitLoading,
    pageTitle,
    associationDisabled,
    FILE_ACCEPT,
    FILE_SIZE_LIMIT,
    FILE_UPLOAD_LIMIT,
    CONTRACT_CODE_MAX_LENGTH,
    TEXTAREA_MAX_LENGTH,
    SHORT_TEXT_MAX_LENGTH,
    DATE_PICKER_FORMAT,
    MONTH_PICKER_FORMAT,
    DICT,
    approvalLogs,
} = initData();
</script>

<style lang="less" scoped>
.sales-contract-edit {
    :deep(.n-input-number),
    :deep(.n-date-picker),
    :deep(.n-select) {
        width: 100%;
    }

    :deep(.n-data-table-th) {
        white-space: nowrap;
    }

    :deep(.sales-contract-required-title) {
        display: inline-flex;
        align-items: center;
        gap: 2px;
    }

    :deep(.sales-contract-required-mark) {
        color: #d03050;
        font-weight: 600;
    }

    :deep(.sales-contract-detail-edit-cell) {
        .n-data-table-td__ellipsis,
        .n-form-item,
        .n-form-item-blank,
        .n-input,
        .n-input-wrapper,
        .n-input__textarea,
        .n-input__textarea-el,
        .n-input-number,
        .n-date-picker,
        .n-select {
            width: 100%;
        }
    }
}
.edit-approval-flow {
    margin-bottom: 4px;
}
:deep(.n-data-table) {
    .n-form-item-feedback-wrapper {
        display: none;
    }
}
</style>
