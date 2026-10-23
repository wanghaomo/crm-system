<template>
    <WebPage showBack hideAddBtn contentPadding="0px" contentBg="var(--base-grey3)">
        <template #content>
            <div class="detail">
                <Header :detail="detail"></Header>
                <div class="detail-content">
                    <MxTab style="padding: 0;" :tabs="tabs" v-model="tab"></MxTab>
                    <Info
                        v-show="tab === DETAIL_TAB.BASIC"
                        :detail="detail"
                        @open-pricing-detail="openPricingDetail"
                        @open-framework-detail="openFrameworkDetail"
                        @open-monthly-plan-detail="openMonthlyPlanDetail"></Info>
                    <Approve
                        v-show="tab === DETAIL_TAB.APPROVAL"
                        :detail="detail"
                        @cancel-success="getDetail"></Approve>
                    <ShippingProgress v-show="tab === DETAIL_TAB.SHIPPING" :detail="detail"></ShippingProgress>
                    <SettProgress v-show="tab === DETAIL_TAB.SETTLEMENT" :detail="detail"></SettProgress>
                    <ReturnedProgress v-show="tab === DETAIL_TAB.RECEIPT" :detail="detail"></ReturnedProgress>
                </div>
                <ContractPriceDetail ref="pricingDetailRef" />
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import initData from './index';
import Header from './components/Header.vue';
import Info from './components/Info.vue';
import Approve from './components/Approve.vue';
import ShippingProgress from './components/ShippingProgress.vue';
import SettProgress from './components/SettProgress.vue';
import ReturnedProgress from './components/ReturnedProgress.vue';
import ContractPriceDetail from '@/views/salesPlan/contractPrice/detail/index.vue';
import { SALES_CONTRACT_DETAIL_TAB, SALES_CONTRACT_DETAIL_TABS } from '../commonTs/conmon';

const pricingDetailRef = ref<any>(null);
const { detail, getDetail, openPricingDetail, openFrameworkDetail, openMonthlyPlanDetail } = initData({
    pricingDetailRef,
});

const DETAIL_TAB = SALES_CONTRACT_DETAIL_TAB;
const tabs = ref<any>(SALES_CONTRACT_DETAIL_TABS);

const tab = ref<any>(DETAIL_TAB.BASIC);
</script>

<style lang="less" scoped>
.detail {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.detail-content {
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
    min-height: 0;
}
</style>
