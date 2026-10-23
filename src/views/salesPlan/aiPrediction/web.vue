<template>
    <WebPage contentPadding="0px" :hideAddBtn="true">
        <template #headerRight>
            <MxButton v-if="checkPermission(['crm:ai_prediction:add_set'])" type="success" @click="createRule()">
                <template #leftIcon>
                    <i class="add_btn_icon icon"></i>
                </template>
                预测配置
            </MxButton>
        </template>
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableContent>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt" />
                </template>
            </MxWebDataTable>
        </template>
    </WebPage>
    <RuleConfigDrawer v-model:show="ruleDrawerVisible" @refresh="getList" />
    <ReportDetailDrawer v-model:show="detailDrawerVisible" :detail="currentReport" />
</template>

<script setup lang="ts">
import initData from './index';
import RuleConfigDrawer from './components/RuleConfigDrawer.vue';
import ReportDetailDrawer from './components/ReportDetailDrawer.vue';
import { checkPermission } from '@/utils/comm';

const {
    tableConfig,
    queryConfiguration,
    queryEvt,
    getList,
    createRule,
    ruleDrawerVisible,
    detailDrawerVisible,
    currentReport,
} = initData();
</script>

<style lang="less" scoped>
:deep(.ai-report-status) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

:deep(.ai-report-status-dot) {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}
</style>
