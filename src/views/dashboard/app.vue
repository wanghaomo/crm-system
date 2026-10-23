<template>
    <AppPage :showList="false" title="数据看板" :showSearch="false">
        <template #content>
            <!-- 移动端每个模块由自己的数据接口独立控制骨架屏，按模块顺序排列。 -->
            <div class="app_page_content">
                <!-- 核心业务数据 -->
                <template v-if="coreDataLoading">
                    <div class="skeleton-core-grid">
                        <div v-for="i in 6" :key="`core-${i}`" class="skeleton-card skeleton-core-item"></div>
                    </div>
                    <div class="skeleton-card skeleton-summary"></div>
                </template>
                <template v-else>
                    <appCoreBusinessData :coreData="coreData" />
                    <appCoreBusinessSummary :coreData="coreData" />
                </template>

                <!-- 轮播图 -->
                <template v-if="bannerLoading">
                    <div class="skeleton-card skeleton-banner"></div>
                </template>
                <appBanner v-else-if="bannerList.length" class="appbanner" :bannerList="bannerList"/>

                <!-- 月度订单 -->
                <template v-if="orderStatisticsLoading">
                    <div class="skeleton-card skeleton-list"></div>
                </template>
                <appMonthsOrders v-else :monthsOrders="monthsOrders"/>

                <!-- 库存报表 -->
                <template v-if="inventoryLoading">
                    <div class="skeleton-card skeleton-inventory"></div>
                </template>
                <appInventoryReport v-else
                    :totalInventory="inventoryReportData.totalInventory"
                    :highInventory="inventoryReportData.highInventory"
                    :lowInventory="inventoryReportData.lowInventory"
                    :inventoryOptions="(inventoryReportData.inventoryOptions as any)" />

                <!-- 待结算-待回款 -->
                <template v-if="settlementLoading">
                    <div class="skeleton-card skeleton-chart"></div>
                </template>
                <payment v-else isApp :xAxisData="paymenyData.xAxisData" :seriesData="paymenyData.seriesData" />

                <!-- 客户发货量 -->
                <template v-if="customerShipmentLoading">
                    <div class="skeleton-card skeleton-chart"></div>
                </template>
                <shipment v-else isApp :shipmentData="shipmentData"/>
            </div>
        </template>
    </AppPage>
</template>
<script setup lang="ts">
// App 与 Web 共用一套数据装载逻辑，保证接口字段、默认兜底和展示顺序保持一致。
import useDashboardData from "./useDashboardData"
import appCoreBusinessData from "./cpns/appCoreBusinessData.vue"
import appCoreBusinessSummary from "./cpns/appCoreBusinessSummary.vue"
import appBanner from "./cpns/appBanner.vue"
import appMonthsOrders from "./cpns/appMonthsOrders.vue"
import appInventoryReport from "./cpns/appInventoryReport.vue"
import payment from "./cpns/payment.vue"
import shipment from "./cpns/shipment.vue"

// 移动端新增库存树状图模块，并与 Web 端共用同一份 inventoryReportData 数据源。
const { coreDataLoading, settlementLoading, orderStatisticsLoading, customerShipmentLoading, bannerLoading, inventoryLoading, coreData, bannerList, monthsOrders, inventoryReportData, paymenyData, shipmentData } = useDashboardData()
</script>
<style scoped lang="less">
.appbanner{
    margin-bottom: 20px;
}
.skeleton-card {
    width: 100%;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, #f0f0f0 25%, #f7f7f7 37%, #f0f0f0 63%);
        background-size: 400% 100%;
        animation: skeleton-loading 1.4s ease infinite;
    }
}

.skeleton-core-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
    margin-bottom: 20px;
}

.skeleton-core-item {
    height: 108px;
    margin-bottom: 0;
}

.skeleton-summary {
    height: 108px;
}

.skeleton-banner {
    height: 117px;
}

.skeleton-list {
    height: 356px;
}

.skeleton-inventory {
    height: 520px;
}

.skeleton-chart {
    height: 230px;
}

@keyframes skeleton-loading {
    0% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0 50%;
    }
}
</style>
