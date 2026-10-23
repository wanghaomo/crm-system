<template>
    <WebPage showBack hideAddBtn contentPadding="16px"  show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border :disabled="submitLoading" @click="confirmEvt('save')" :styleOption="{'color': 'var(--base-color)', 'border-color': 'var(--base-color)'}" > 保 存 </MxButton>
            <MxButton :disabled="submitLoading" @click="confirmEvt('submit')"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="base-edit-page">
                <!-- 头部标题 -->
                <div class="page-title">
                    <span class="title-text">{{ pageTitle }}</span>
                </div>

                <n-form
                    ref="formRef"
                    :model="formData"
                    :rules="formRules"
                    label-placement="left"
                    require-mark-placement="left"
                    label-width="86px">
                    <div v-if="approvalLogs.length" class="edit-approval-flow">
                        <DetailsTitle title="流程信息" :styleOption="{ padding: '18px 0px' }" />
                        <ApprovalDetails :model-value="approvalLogs" type="horizontal"/>
                    </div>
                    <div>
                        <DetailsTitle title="基础信息" :styleOption="{ padding: '18px 0px' }" />
                        <n-grid :cols="2" :x-gap="40">
                            <n-grid-item>
                                <n-form-item label="企业名称" path="customerId">
                                    <MxCommSelect
                                        v-model="formData.customerId"
                                        v-model:label="formData.customerName"
                                        typeName="企业客户"
                                        title="企业客户"
                                        placeholder="请选择"
                                        :clearable="true"
                                        :text="false"
                                        @changeEvt="handleCustomerChange"></MxCommSelect>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="矿石品位" path="grade">
                                    <n-input-number
                                        :min="0"
                                        :max="100"
                                        v-model:value="formData.grade"
                                        clearable
                                        :precision="1" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="矿石种类" path="mineralType">
                                    <n-radio-group v-model:value="formData.mineralType">
                                        <n-space>
                                            <n-radio
                                                v-for="song in getDictEnum('矿种')"
                                                :key="song.value"
                                                :value="song.value">
                                                {{ song.label }}
                                            </n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="年度约定总量(万吨)" path="annualQuantity">
                                    <n-input-number
                                        :min="0"
                                        :max="99999999"
                                        v-model:value="formData.annualQuantity"
                                        clearable
                                        :precision="0" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="价格机制" path="priceMechanism">
                                    <n-radio-group v-model:value="formData.priceMechanism">
                                        <n-space>
                                            <n-radio
                                                v-for="song in getDictEnum('价格机制')"
                                                :key="song.value"
                                                :value="song.value">
                                                {{ song.label }}
                                            </n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="具体价格" path="specificPrice">
                                    <n-input
                                        v-model:value="formData.specificPrice"
                                        type="text"
                                        show-count
                                        :maxlength="100"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="结算方式" path="paymentMethod">
                                    <n-radio-group v-model:value="formData.paymentMethod">
                                        <n-space>
                                            <n-radio
                                                v-for="song in getDictEnum('结算方式')"
                                                :key="song.value"
                                                :value="song.value">
                                                {{ song.label }}
                                            </n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="关联AI分析报告编号" path="aiReportCode">
                                    <n-select
                                        v-model:value="formData.aiReportCode"
                                        :options="aiReportOptions"
                                        filterable
                                        clearable
                                        placeholder="请选择"
                                        @update:value="(_, option) => handleAiReportChange(option)" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="签订时间" path="signDate">
                                    <n-date-picker v-model:value="formData.signDate" type="date" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="AI建议" path="suggestion">
                                    <n-input
                                        show-count
                                        :maxlength="250"
                                        v-model:value="formData.suggestion"
                                        type="textarea"
                                        placeholder="自动匹配关联AI分析报告编号"
                                        :autosize="{
                                            minRows: 4,
                                            maxRows: 8,
                                        }" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="合同备注" path="remark">
                                    <n-input
                                        show-count
                                        :maxlength="250"
                                        v-model:value="formData.remark"
                                        type="textarea"
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
                                        show-count
                                        :maxlength="50"
                                        v-model:value="formData.contractName"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="合同金额(万元)" path="contractAmount">
                                    <n-input-number
                                        :min="0"
                                        :max="99999999"
                                        v-model:value="formData.contractAmount"
                                        clearable
                                        :precision="2" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="计价方式" path="pricingMethod">
                                    <n-radio-group v-model:value="formData.pricingMethod">
                                        <n-space>
                                            <n-radio
                                                v-for="song in getDictEnum('计价方式')"
                                                :key="song.value"
                                                :value="song.value">
                                                {{ song.label }}
                                            </n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="开始时间" path="startDate">
                                    <n-date-picker
                                        v-model:formatted-value="formData.startDate"
                                        type="date"
                                        value-format="yyyy-MM-dd" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="结束时间" path="endDate">
                                    <n-date-picker
                                        v-model:formatted-value="formData.endDate"
                                        type="date"
                                        value-format="yyyy-MM-dd" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="时长(天)" path="duration">
                                    <n-input-number
                                        :min="0"
                                        :disabled="true"
                                        placeholder="自动计算"
                                        :max="99999999"
                                        v-model:value="formData.duration"
                                        clearable
                                        :precision="0" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="供方单位" path="supplierUnit">
                                    <MxDict
                                        placeholder="请选择"
                                        dictType="供方单位"
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
                                        v-model:selectedPerson="formData.directorSelectedPerson"></MxPersonSelect>
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
                                        :disabled="true"
                                        v-model:value="formData.deptName"
                                        type="text"
                                        placeholder="请输入" />
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
                                <n-form-item label="对方负责人" path="oppositeDuration">
                                    <n-input
                                        show-count
                                        :maxlength="50"
                                        v-model:value="formData.oppositeDuration"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="对方联系方式" path="oppositeTel">
                                    <n-input
                                        show-count
                                        :maxlength="50"
                                        v-model:value="formData.oppositeTel"
                                        type="text"
                                        placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item :span="2">
                                <n-form-item label="合同初稿" path="contractFileUrlObject">
                                    <MxWebFileUpload
                                        :limit="9"
                                        :multiple="true"
                                        v-model="formData.contractFileUrlObject"
                                        :fileSize="FILE_SIZE_LIMIT"
                                        :accept="FILE_ACCEPT"></MxWebFileUpload>
                                </n-form-item>
                            </n-grid-item>
                             <n-grid-item :span="2">
                                <n-form-item label="附件" path="fileUrlList">
                                    <MxWebFileUpload
                                        :limit="9"
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
                        </n-grid>
                    </div>
                </n-form>
            </div>
        </template>
    </WebPage>
</template>

<script lang="ts" setup>
import {
    NForm,
    NGrid,
    NGridItem,
    NFormItem,
    NInputNumber,
    NRadioGroup,
    NRadio,
    NSpace,
    NDatePicker,
    NInput,
    NSelect,
} from 'naive-ui';
import initData from './index';
const {
    confirmEvt,
    formData,
    formRules,
    formRef,
    getDictEnum,
    aiReportOptions,
    handleCustomerChange,
    handleAiReportChange,
    handleInitiatorChange,
    submitLoading,
    pageTitle,
    FILE_ACCEPT,
    FILE_SIZE_LIMIT,
    approvalLogs,
} = initData();
</script>

<style lang="less" scoped>
.edit-approval-flow {
    margin-bottom: 4px;
}
</style>
