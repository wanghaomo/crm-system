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
            <div class="firm-price-add">
                <n-spin :show="pageLoading" description="加载中...">
                    <div class="add-con-header">
                        <div class="page-title">
                            <span class="title-text">{{ pageTitle }}</span>
                        </div>
                        <div class="tabs">
                            <div v-for="item in navList" :key="item.id" class="tabs-item" @click="scrollTo(item.id)">
                                <div class="tabs-item-text" :class="{ 'tabs-item-text-select': item.id === activeId }">
                                    {{ item.name }}
                                </div>
                                <div v-if="item.id === activeId" class="tabs-item-line"></div>
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
                            <section v-if="approvalLogs.length" class="edit-approval-flow">
                                <DetailsTitle title="流程信息" :styleOption="{ padding: '18px 0px' }" />
                                <ApprovalDetails :model-value="approvalLogs" type="horizontal" />
                            </section>
                            <section id="basicInfo" class="anchor-section">
                                <DetailsTitle title="基础信息" :styleOption="{ padding: '18px 0px' }" />
                                <n-grid :cols="2" :x-gap="40">
                                    <n-grid-item>
                                        <n-form-item label="企业名称" path="customerId">
                                            <MxCommSelect
                                                :extraParams="{
                                                    customerType: CUSTOMER_TYPE_CHEMICAL,
                                                }"
                                                v-model="formData.customerId"
                                                v-model:label="formData.customerName"
                                                typeName="企业客户"
                                                title="企业客户"
                                                placeholder="请选择"
                                                :clearable="true"
                                                :text="false"
                                                @changeEvt="handleCustomerChange" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="子公司贸易商" path="subsidiaryId">
                                            <n-select
                                                v-model:value="formData.subsidiaryId"
                                                :options="subsidiaryTraderOptions"
                                                :loading="subsidiaryTraderLoading"
                                                filterable
                                                clearable
                                                placeholder="请选择"
                                                @update:value="handleSubsidiaryTraderChange" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="定价月份" path="pricingMonth">
                                            <n-date-picker
                                                v-model:value="formData.pricingMonth"
                                                type="month"
                                                clearable
                                                placeholder="请选择"
                                                @update:value="handlePricingMonthChange" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="项目名称" path="projectName">
                                            <n-input
                                                v-model:value="formData.projectName"
                                                maxlength="50"
                                                show-count
                                                clearable
                                                placeholder="请填写" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="与会人员" path="attendees">
                                            <MxPersonSelect
                                                multiple
                                                collapseTags
                                                :clearable="true"
                                                placeholder="请选择"
                                                v-model:selectedPerson="formData.attendees" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="企业主要产品规模" path="extChemicalDTO.productScale">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.productScale"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="库存情况(万吨)" path="extChemicalDTO.inventoryStatus">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.inventoryStatus"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="开工率(%)" path="extChemicalDTO.operatingRate">
                                            <n-input-number
                                                v-model:value="formData.extChemicalDTO.operatingRate"
                                                :min="0"
                                                :max="100"
                                                :precision="0"
                                                :show-button="false"
                                                clearable
                                                placeholder="请输入" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="年矿石采购量" path="extChemicalDTO.annualPurchaseVolume">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.annualPurchaseVolume"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="计划采购量" path="extChemicalDTO.planPurchaseVolume">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.planPurchaseVolume"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="支付情况" path="extChemicalDTO.paymentTerms">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.paymentTerms"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="重要合同条件" path="extChemicalDTO.importantContractTerms">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.importantContractTerms"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="财务费用" path="extChemicalDTO.financialCost">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.financialCost"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="其他" path="extChemicalDTO.otherInfo">
                                            <n-input
                                                v-model:value="formData.extChemicalDTO.otherInfo"
                                                type="textarea"
                                                show-count
                                                :maxlength="500"
                                                placeholder="请输入"
                                                :autosize="{ minRows: 4, maxRows: 8 }" />
                                        </n-form-item>
                                    </n-grid-item>
                                </n-grid>
                            </section>

                            <section id="logisticsFee" class="anchor-section">
                                <!-- <DetailsTitle title="物流运输费用" :styleOption="{ padding: '18px 0px' }" /> -->
                                <!-- <MxButton border type="success" class="section-add-btn" @click="addItem('transport')">
                                    <template #leftIcon>
                                        <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                                    </template>
                                    添加
                                </MxButton>
                                <MxWebDataTable v-bind="transportConfig" /> -->
                                <n-grid :cols="2" :x-gap="40">
                                    <n-grid-item :span="2">
                                        <n-form-item label="物流运输费用" path="logistics">
                                            <MxWebFileUpload
                                                v-model="formData.logistics"
                                                :limit="1"
                                                :accept="logisticsAttachmentAccept" />
                                        </n-form-item>
                                    </n-grid-item>
                                </n-grid>
                            </section>

                            <section id="marketRefPrice" class="anchor-section">
                                <DetailsTitle title="市场价(参考价)" :styleOption="{ padding: '18px 0px' }" />
                                <MxButton border type="success" class="section-add-btn" @click="addItem('marketPrice')">
                                    <template #leftIcon>
                                        <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                                    </template>
                                    添加
                                </MxButton>
                                <MxWebDataTable v-bind="marketPriceConfig" />
                            </section>

                            <section id="planPrice" class="anchor-section">
                                <DetailsTitle title="计划量以及价格" :styleOption="{ padding: '18px 0px' }" />
                                <MxButton border type="success" class="section-add-btn" @click="addItem('planPrice')">
                                    <template #leftIcon>
                                        <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                                    </template>
                                    添加
                                </MxButton>
                                <MxWebDataTable v-bind="planPriceConfig" />
                            </section>

                            <section id="approvalInfo" class="anchor-section">
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
                                        <n-form-item label="所属公司" path="companyId">
                                            <MxDict
                                                v-model="formData.companyId"
                                                v-model:label="formData.companyName"
                                                clearable
                                                placeholder="请选择"
                                                dictType="所属公司" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="流程是否需要二次报价报量审批" path="isTwoApprove">
                                            <n-radio-group v-model:value="formData.isTwoApprove">
                                                <n-radio
                                                    v-for="item in secondQuoteApprovalOptions"
                                                    :key="String(item.value)"
                                                    :value="item.value">
                                                    {{ item.label }}
                                                </n-radio>
                                            </n-radio-group>
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
                                                :limit="attachmentLimit"
                                                :multiple="true"
                                                :file-size="attachmentFileSize"
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
                            </section>
                        </n-form>
                    </div>
                </n-spin>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
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
    NSpin,
} from 'naive-ui';
import { CUSTOMER_TYPE_CHEMICAL, FIRM_PRICE_ANCHOR_LIST } from '../commonTs/conmon';
import initData from './index';

const {
    formRef,
    formData,
    formRules,
    pageTitle,
    pageLoading,
    submitLoading,
    deptTree,
    secondQuoteApprovalOptions,
    attachmentAccept,
    logisticsAttachmentAccept,
    attachmentLimit,
    attachmentFileSize,
    subsidiaryTraderOptions,
    subsidiaryTraderLoading,
    // transportConfig,
    marketPriceConfig,
    planPriceConfig,
    confirmEvt,
    addItem,
    handleCustomerChange,
    handleSubsidiaryTraderChange,
    handlePricingMonthChange,
    handleApplicantChange,
    approvalLogs,
} = initData();

const activeId = ref(FIRM_PRICE_ANCHOR_LIST[0].id);
const navList = FIRM_PRICE_ANCHOR_LIST;
let observer: IntersectionObserver | null = null;

const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const initObserver = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) activeId.value = entry.target.id;
            });
        },
        { threshold: 0.25 }
    );
    navList.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer?.observe(el);
    });
};

onMounted(() => {
    nextTick(initObserver);
});

onBeforeUnmount(() => {
    observer?.disconnect();
});
</script>

<style lang="less" scoped>
.firm-price-add {
    height: 100%;
    overflow: hidden;
    background: var(--base-white);

    :deep(.n-spin-container),
    :deep(.n-spin-content) {
        height: 100%;
    }
}

.add-con-header {
    flex-shrink: 0;
    padding: 16px 20px 0;
}

.page-title {
    height: 24px;
    display: flex;
    align-items: center;
}

.title-text {
    color: var(--base-black);
    font-size: 16px;
    font-weight: 600;
}

.tabs {
    display: flex;
    align-items: center;
    gap: 24px;
    overflow-x: auto;
    border-bottom: 1px solid #E2e2e2;
}

.tabs-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    cursor: pointer;
    flex-shrink: 0;
}

.tabs-item-line {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    width: 36px;
    height: 3px;
    margin: auto;
    background: #2c65f2;
}

.tabs-item-text {
    color: #666666;
    font-size: 14px;
    font-weight: 400;
}

.tabs-item-text-select {
    color: #333333;
    font-weight: 600;
}

.form-con {
    height: calc(100% - 80px);
    overflow-y: auto;
    padding: 0 20px 20px;
}

.edit-approval-flow {
    margin-bottom: 4px;
}

.anchor-section {
    scroll-margin-top: 8px;
}

.section-add-btn {
    margin-bottom: 12px;
}

.add-icon {
    width: 14px;
    height: 14px;
}

:deep(.n-input-number),
:deep(.n-date-picker) {
    width: 100%;
}

:deep(.require-label)::before {
    margin-right: 4px;
    color: var(--base-color-red);
    content: '*';
}

:deep(.web-n-data-table) {
    margin-bottom: 0;
}

:deep(.n-data-table) {
    .n-form-item-feedback-wrapper {
        display: none;
    }
}
:deep(.n-radio){
    margin-right: 30px;
}
</style>
