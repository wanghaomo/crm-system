<template>
    <WebPage class="monthly-shipping-plan-detail-page" showBack hideAddBtn contentPadding="0px" contentBg="var(--base-grey3)">
        <template #content>
            <div class="detail-con">
                <Header :detail="detail" />
                <div class="detail-card">
                    <MxTab style="padding: 0;" v-model="tab" :tabs="tabs" />
                    <BasicInfo
                        v-show="tab === 'basic'"
                        :detail="detail"
                        :chemical-add-plan-columns="chemicalAddPlanColumns"
                        :trader-add-plan-columns="traderAddPlanColumns"
                        :history-table-config="historyTableConfig"
                        :summary-table-config="summaryTableConfig"
                        :report-detail-loading="reportDetailLoading"
                        @open-report-detail="openReportDetail" />
                    <ApproveFlow v-show="tab === 'approval'" :detail="detail" @cancel-success="loadDetail" />
                    <ExecutionProgress
                        v-show="tab === 'progress'"
                        :visible="tab === 'progress'"
                        :detail="detail"
                        :table-config="executionTableConfig" />
                </div>
                <ReportDetailDrawer v-model:show="detailDrawerVisible" :detail="currentReport" />
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from './components/Header.vue';
import BasicInfo from './components/BasicInfo.vue';
import ApproveFlow from './components/ApproveFlow.vue';
import ExecutionProgress from './components/ExecutionProgress.vue';
import ReportDetailDrawer from '../../aiPrediction/components/ReportDetailDrawer.vue';
import initData from './index';

const tab = ref('basic');
const {
    detail,
    tabs,
    chemicalAddPlanColumns,
    traderAddPlanColumns,
    historyTableConfig,
    summaryTableConfig,
    executionTableConfig,
    currentReport,
    detailDrawerVisible,
    reportDetailLoading,
    openReportDetail,
    loadDetail,
} = initData();
</script>

<style lang="less" scoped>
.detail-con {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
}

.detail-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.08);

    :deep(.detail-tab) {
        padding: 0 16px;
    }
}

.monthly-shipping-plan-detail-page {
    :deep(.component_page_content) {
        overflow: hidden;
    }

    :deep(.component_page_content > div) {
        overflow-y: hidden !important;
    }
}
</style>
