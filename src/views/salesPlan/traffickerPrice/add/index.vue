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
            <div class="add-con">
                <n-spin :show="pageLoading" description="加载中...">
                    <!-- 头部标题 -->
                    <div class="add-con-header">
                        <div class="page-title">
                            <span class="title-text">{{ pageTitle }}</span>
                        </div>
                        <div class="tabs">
                            <div class="tabs-item" v-for="it in navList" :key="it.id" @click="scrollTo(it.id)">
                                <div class="tabs-item-text" :class="{ 'tabs-item-text-select': it.id === activeId }">
                                    {{ it.name }}
                                </div>
                                <div class="tabs-item-line" v-if="it.id == activeId"></div>
                            </div>
                        </div>
                    </div>
                    <div class="form-con">
                        <n-form
                            ref="formRef"
                            :model="formData"
                            :rules="formRules"
                            label-placement="left"
                            require-mark-placement="left"
                            label-width="86px">
                            <div v-if="approvalLogs.length" class="edit-approval-flow">
                                <DetailsTitle title="流程信息" :styleOption="{ padding: '18px 0px' }" />
                                <ApprovalDetails :model-value="approvalLogs" type="horizontal" />
                            </div>
                            <div id="a">
                                <DetailsTitle title="基础信息" :styleOption="{ padding: '18px 0px' }" />
                                <n-grid :cols="2" :x-gap="40">
                                    <n-grid-item>
                                        <n-form-item label="定价月份" path="pricingMonth">
                                            <n-date-picker
                                                v-model:value="formData.pricingMonth"
                                                type="month"
                                                clearable
                                                @update:value="handlePricingMonthChange" />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item>
                                        <n-form-item label="项目名称" path="projectName">
                                            <n-input
                                                v-model:value="formData.projectName"
                                                maxlength="50"
                                                show-count
                                                clearable />
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item label="与会人员" path="attendees">
                                            <MxPersonSelect
                                                multiple
                                                collapseTags
                                                :clearable="true"
                                                placeholder="请选择"
                                                v-model:selectedPerson="formData.attendees"></MxPersonSelect>
                                        </n-form-item>
                                    </n-grid-item>
                                    <n-grid-item :span="2">
                                        <n-form-item
                                            label="主流化工企业存库情况"
                                            path="extTraderDTO.mainstreamChemInventory">
                                            <n-input
                                                v-model:value="formData.extTraderDTO.mainstreamChemInventory"
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="矿山存库情况" path="extTraderDTO.mineInventory">
                                            <n-input
                                                v-model:value="formData.extTraderDTO.mineInventory"
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="下游产品市场情况" path="extTraderDTO.downstreamMarketSituation">
                                            <n-input
                                                v-model:value="formData.extTraderDTO.downstreamMarketSituation"
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
                                    <n-grid-item :span="2">
                                        <n-form-item
                                            label="竞品矿山让利金额"
                                            path="extTraderDTO.competitorConcessionAmount">
                                            <n-input
                                                v-model:value="formData.extTraderDTO.competitorConcessionAmount"
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="财务费用" path="extTraderDTO.financialCost">
                                            <n-input
                                                v-model:value="formData.extTraderDTO.financialCost"
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="备注" path="extTraderDTO.remark">
                                            <n-input
                                                v-model:value="formData.extTraderDTO.remark"
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
                            <div id="b">
                                <!-- <DetailsTitle title="物流运输费用" :styleOption="{ padding: '18px 0px' }" /> -->
                                <!-- <MxButton
                                    @click="addItem('transport')"
                                    style="margin-bottom: 12px"
                                    border
                                    type="success"
                                    hasLeftIcon>
                                    <template #leftIcon>
                                        <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                                    </template>
                                    <span>添加</span>
                                </MxButton>
                                <MxWebDataTable v-bind="transportConfig"> </MxWebDataTable> -->
                                <n-grid :cols="2" :x-gap="40">
                                    <n-grid-item :span="2">
                                        <n-form-item label="物流运输费用" path="logistics">
                                            <MxWebFileUpload
                                                v-model="formData.logistics"
                                                :limit="1"
                                                :accept="LOGISTICS_ATTACHMENT_ACCEPT" />
                                        </n-form-item>
                                    </n-grid-item>
                                </n-grid>
                            </div>
                            <div id="c">
                                <DetailsTitle title="市场价(参考价)" :styleOption="{ padding: '18px 0px' }" />
                                <MxButton
                                    @click="addItem('marketPrice')"
                                    style="margin-bottom: 12px"
                                    border
                                    type="success"
                                    hasLeftIcon>
                                    <template #leftIcon>
                                        <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                                    </template>
                                    <span>添加</span>
                                </MxButton>
                                <MxWebDataTable v-bind="marketPriceConfig"> </MxWebDataTable>
                            </div>
                            <div id="d">
                                <DetailsTitle title="贸易商磷矿石销售价" :styleOption="{ padding: '18px 0px' }" />
                                <MxButton
                                    @click="addItem('goodsPrice')"
                                    style="margin-bottom: 12px"
                                    border
                                    type="success"
                                    hasLeftIcon>
                                    <template #leftIcon>
                                        <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                                    </template>
                                    <span>添加</span>
                                </MxButton>
                                <MxWebDataTable v-bind="goodsPriceConfig"> </MxWebDataTable>
                            </div>
                            <div id="e">
                                <DetailsTitle title="审批信息" :styleOption="{ padding: '18px 0px' }" />
                                <n-grid :cols="2" :x-gap="40">
                                    <n-grid-item>
                                        <n-form-item label="申请人" path="applicantId">
                                            <MxPersonSelect
                                                :clearable="true"
                                                placeholder="请选择"
                                                v-model="formData.applicantId"
                                                v-model:label="formData.applicantName"
                                                @changeEvt="handleApplicantChange"></MxPersonSelect>
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="审批备注" path="approvalRemark">
                                            <n-input
                                                v-model:value="formData.approvalRemark"
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="事项说明" path="instruction">
                                            <n-input
                                                v-model:value="formData.instruction"
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
                                    <n-grid-item :span="2">
                                        <n-form-item label="附件" path="attachmentUrls">
                                            <MxWebFileUpload
                                                v-model="formData.attachmentUrls"
                                                :limit="ATTACHMENT_LIMIT"
                                                :multiple="true"
                                                :file-size="ATTACHMENT_FILE_SIZE"
                                                :accept="ATTACHMENT_ACCEPT" />
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
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { NForm, NFormItem, NGrid, NGridItem, NInput, NDatePicker, NSpin } from 'naive-ui';
import { TRADER_PRICE_ANCHOR_LIST } from '../commonTs/conmon';
import initData from './index';
const {
    confirmEvt,
    formData,
    formRules,
    pageTitle,
    pageLoading,
    submitLoading,
    // transportConfig,
    marketPriceConfig,
    goodsPriceConfig,
    addItem,
    formRef,
    handlePricingMonthChange,
    deptTree,
    handleApplicantChange,
    ATTACHMENT_ACCEPT,
    LOGISTICS_ATTACHMENT_ACCEPT,
    ATTACHMENT_FILE_SIZE,
    ATTACHMENT_LIMIT,
    approvalLogs,
} = initData();
const activeId = ref(TRADER_PRICE_ANCHOR_LIST[0].id);

const navList = TRADER_PRICE_ANCHOR_LIST;

const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
    });
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    activeId.value = entry.target.id;
                }
            });
        },
        {
            threshold: 0.3,
        }
    );

    navList.forEach((item) => {
        const el = document.getElementById(item.id);

        if (el) {
            observer.observe(el);
        }
    });
});

onBeforeUnmount(() => {
    observer?.disconnect();
});
</script>

<style lang="less" scoped>
.tabs {
    display: flex;
    align-items: center;
    overflow-x: auto;
    gap: 24px;
     border-bottom: 1px solid #E2e2e2;
}
.tabs-item {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
}
.tabs-item-line {
    width: 36px;
    height: 3px;
    background: #2c65f2;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
}
.tabs-item-text {
    font-weight: 400;
    font-size: 14px;
    color: #666666;
}
.tabs-item-text-select {
    font-weight: 600;
    font-size: 14px;
    color: #333333;
}
.add-con {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.n-spin-container) {
        height: 100%;
        min-height: 0;
    }

    :deep(.n-spin-content) {
        height: 100%;
        min-height: 0;
        // n-spin 会包一层内容容器，这里保持纵向 flex 才能让表单区域独立滚动。
        display: flex;
        flex-direction: column;
    }
}
.add-con-header {
    flex-shrink: 0;
    padding: 0 16px;
    padding-top: 16px;
}
.form-con {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 16px;
    padding-bottom: 16px;
}
.edit-approval-flow {
    margin-bottom: 4px;
}
.add-icon {
    width: 16px;
    height: 16px;
}

.title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--base-black);
}

:deep(.require-label)::before {
    content: '*';
    color: #f46b6c;
}

:deep(.n-data-table) {
    .n-form-item-feedback-wrapper {
        display: none;
    }
}

:deep(.market-price-upload) {
    width: 240px;

    .tips {
        width: 100%;
        white-space: normal;
        word-break: break-all;
        line-height: 18px;
    }
}
</style>
