<template>
    <WebPage contentPadding="0px" @addEvt="createEvt" :hideAddBtn="!checkPermission(['crm:contract_price:create'])">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt" />
                </template>
            </MxWebDataTable>
            <ContractPriceDetail ref="detailRef" @refresh="getList" />
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import initData from './index';
import ContractPriceDetail from './detail/index.vue';
import { checkPermission } from '@/utils/comm';

const { createEvt, detailRef, tableConfig, queryConfiguration, queryEvt, getList } = initData();
</script>
