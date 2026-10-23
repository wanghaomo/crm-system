<template>
    <WebPage contentPadding="0px" @addEvt="createEvt" :hideAddBtn="!checkPermission(['crm:monthly_shipping_plan:create'])">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"></MxWebSearchBar>
                </template>
            </MxWebDataTable>
            <ReportDetailDrawer v-model:show="detailDrawerVisible" :detail="currentReport" />
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import initData from './index';
import ReportDetailDrawer from '../aiPrediction/components/ReportDetailDrawer.vue';
import { checkPermission } from '@/utils/comm';

const { createEvt, tableConfig, queryConfiguration, queryEvt, currentReport, detailDrawerVisible } = initData();
</script>
