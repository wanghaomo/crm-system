<template>
    <div class="page-container">
        <!-- ==========================================================
          第一行：核心业务数据 + 轮播图
          coreDataLoading 控核心数据，bannerLoading 控轮播图
        ========================================================== -->
        <div class="top-row">
            <!-- 核心业务数据 -->
            <template v-if="coreDataLoading">
                <div class="skeleton-card skeleton-core">
                    <div class="skeleton-card-body skeleton-stats">
                        <n-skeleton v-for="i in 6" :key="'s' + i" :height="86" :sharp="false" />
                    </div>
                </div>
            </template>
            <webCoreBusinessData v-else :coreData="coreData" class="web-coreBusinessData" />

            <!-- 轮播图 -->
            <template v-if="bannerLoading">
                <div class="skeleton-card skeleton-banner">
                    <n-skeleton class="skeleton-banner-content" :sharp="false" />
                </div>
            </template>
            <webBanner v-else class="web-banner" :bannerList="bannerList" />
        </div>

        <!-- 核心业务汇总 -->
        <template v-if="coreDataLoading">
            <div class="skeleton-card skeleton-summary">
                <div v-for="i in 4" :key="'summary' + i" class="skeleton-summary-item">
                    <n-skeleton circle :width="32" :height="32" />
                    <div class="skeleton-summary-content">
                        <n-skeleton :width="72" :height="16" :sharp="false" />
                        <n-skeleton :width="110" :height="20" :sharp="false" />
                    </div>
                </div>
            </div>
        </template>
        <webCoreBusinessSummary v-else :coreData="coreData" />

        <!-- ==========================================================
          第二行：本月订单执行状态（独立接口 getOrderStatisticsApi）
        ========================================================== -->
        <template v-if="orderStatisticsLoading">
            <div class="skeleton-card skeleton-full">
                <div class="skeleton-card-header"><n-skeleton :width="140" :sharp="false" size="medium" /></div>
                <div class="skeleton-card-body skeleton-row">
                    <n-skeleton v-for="i in 6" :key="'o' + i" :width="120" :sharp="false" size="medium" />
                </div>
            </div>
        </template>
        <webMonthsOrders v-else class="web-monthorder" :monthsOrders="monthsOrders" />

        <!-- ==========================================================
          第三行：库存报表（库存报表接口）
        ========================================================== -->
        <template v-if="inventoryLoading">
            <div class="skeleton-card skeleton-full">
                <div class="skeleton-card-header"><n-skeleton :width="100" :sharp="false" size="medium" /></div>
                <div class="skeleton-card-body skeleton-table">
                    <n-skeleton :height="32" :sharp="false" />
                    <n-skeleton v-for="i in 4" :key="'t' + i" :height="28" :sharp="false" />
                </div>
            </div>
        </template>
        <webInventoryReport
            v-else
            class="web-inventoryReport"
            :totalInventory="inventoryReportData.totalInventory"
            :highInventory="inventoryReportData.highInventory"
            :lowInventory="inventoryReportData.lowInventory"
            :mixedOreNum="inventoryReportData.mixedOreNum"
            :transferNums="inventoryReportData.transferNums"
            :inventoryOptions="inventoryReportData.inventoryOptions"
            :columns="inventoryColumns" />

        <!-- ==========================================================
          第四行：待结算-待回款（settlementLoading）+ 客户发货量（customerShipmentLoading）
        ========================================================== -->
        <template v-if="settlementLoading">
            <div class="skeleton-card skeleton-half">
                <div class="skeleton-card-header"><n-skeleton :width="140" :sharp="false" size="medium" /></div>
                <n-skeleton :height="162" :sharp="false" />
            </div>
        </template>
        <payment v-else class="web-payment" :xAxisData="paymenyData.xAxisData" :seriesData="paymenyData.seriesData" />

        <template v-if="customerShipmentLoading">
            <div class="skeleton-card skeleton-half">
                <div class="skeleton-card-header"><n-skeleton :width="150" :sharp="false" size="medium" /></div>
                <div class="skeleton-card-body skeleton-bars">
                    <n-skeleton v-for="i in 8" :key="'b' + i" :height="14" :sharp="false" />
                </div>
            </div>
        </template>
        <shipment v-else class="web-shipment" :shipmentData="shipmentData" />
    </div>
</template>
<script setup lang="ts">
import { NSkeleton } from 'naive-ui'
import { inventoryColumns } from "./index"
import useDashboardData from "./useDashboardData"
import webCoreBusinessData from "./cpns/webCoreBusinessData.vue"
import webCoreBusinessSummary from "./cpns/webCoreBusinessSummary.vue"
import webBanner from "./cpns/webBanner.vue"
import webMonthsOrders from "./cpns/webMonthsOrders.vue"
import payment from "./cpns/payment.vue"
import shipment from "./cpns/shipment.vue"
import webInventoryReport from "./cpns/webInventoryReport/index.vue"

// Web 与 App 统一复用看板数据，库存报表数据由父组件获取并处理后传入子组件。
// coreDataLoading / settlementLoading / orderStatisticsLoading / customerShipmentLoading / bannerLoading / inventoryLoading 各自控制对应模块的骨架屏。
const { coreDataLoading, settlementLoading, orderStatisticsLoading, customerShipmentLoading, bannerLoading, inventoryLoading, coreData, bannerList, monthsOrders, paymenyData, shipmentData, inventoryReportData } = useDashboardData()
</script>
<style scoped lang="less">
.page-container {
    padding: 16px;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    align-content: flex-start;
    overflow: auto;
    overflow-y: scroll;
}

// 第一行：核心数据 + 轮播图，高度始终对齐
.top-row {
    display: flex;
    align-items: stretch;
    width: 100%;
    margin-bottom: 20px;
}

:deep(.web-coreBusinessData) {
    flex: 1;
    margin-right: 20px;
    min-width: 0;
}

.web-banner {
    flex-shrink: 0;
}

:deep(.web-payment),
:deep(.web-shipment) {
    width: calc(50% - 10px);
    margin-bottom: 0px;
}

// /* ---- 骨架屏 ========================================================== */
.skeleton-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
    margin-bottom: 20px;
    box-sizing: border-box;
}

.skeleton-card-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
}

.skeleton-card-body {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

// /* 核心数据区 = 左侧大块，右侧留出轮播图位置 */
.skeleton-core {
    flex: 1;
    margin-right: 20px;
    margin-bottom: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
}

.skeleton-core .skeleton-stats ::v-deep(.n-skeleton) {
    flex: 0 0 calc(33.333% - 8px);
}

.skeleton-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    padding: 12px 20px;
}

.skeleton-summary-item {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 0 28px;
}

.skeleton-summary-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    margin-left: 10px;
}

// /* 轮播图 = 右侧固定宽 */
.skeleton-banner {
    width: 396px;
    flex-shrink: 0;
    height: 184px;
    margin-bottom: 0;
    padding: 0;
    overflow: hidden;
}

.skeleton-banner-content {
    height: 100%;
}

// /* 全宽卡片 */
.skeleton-full {
    width: 100%;
}

// /* 半宽卡片（待结算 / 发货量） */
.skeleton-half {
    width: calc(50% - 10px);
}

.skeleton-half+.skeleton-half {
    margin-left: 0;
}

// /* 骨架表格行 */
.skeleton-table {
    flex-direction: column;
    gap: 8px;
}

// /* 骨架横条 */
.skeleton-bars {
    flex-direction: column;
    gap: 10px;
}

.skeleton-bars .n-skeleton {
    border-radius: 6px;
}

@media (min-width: 2000px) {
    :deep(.web-coreBusinessData) {
        .item {
            padding: 20px;
        }
    }

    :deep(.web-swipe){
        width: 496px;
    }

    // .web-monthorder {
    //     height: calc(50% - 345px);
    // }

    // .web-payment {
    //     height: calc(50% - 345px);

    //     :deep(.bar-card) {
    //         height: 100%;
    //     }
    // }

    // .web-shipment {
    //     height: calc(50% - 345px);

    //     :deep(.shipment) {
    //         height: 100%;
    //     }
    // }
}

/* ==========================================================
   响应式布局 - 数据看板
   策略：核心业务数据 3列→2列→1列，轮播图换行，底部图表纵向
   ========================================================== */

// /* ---- ≤1400px：轮播图适当收窄 ---- */
@media (max-width: 1400px) {
    :deep(.web-coreBusinessData){
        height: auto;
    }
    // /* 骨架屏同步 */
    .skeleton-banner {
        width: 320px;
    }
}

// /* ---- ≤1240px：轮播图换行至下方，高度固定、宽度 100% ---- */
@media (max-width: 1240px) {
    .top-row {
        flex-direction: column;
    }
    :deep(.web-coreBusinessData){
        width: 100%;
        flex: none;
        margin-right: 0;
        margin-bottom: 20px;
        height: auto;
    }
    :deep(.web-swipe){
        width: 100%;
        height: 228px;
    }

    // /* 骨架屏同步 */
    .skeleton-core {
        flex: none;
        width: 100%;
        margin-right: 0;
        margin-bottom: 20px;
    }
    .skeleton-banner {
        width: 100%;
        height: 220px;
    }
}

// /* 待结算-待回款与客户发货量纵向排列，自身高度不变 ---- */
@media (max-width: 1064px) {
    :deep(.web-payment){
        margin-bottom: 20px;
    }
    :deep(.web-payment),
    :deep(.web-shipment){
        width: 100%;
    }
    // /* 骨架屏同步 */
    .skeleton-half {
        width: 100%;
    }
}

@media (max-width: 900px) {
    .skeleton-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        row-gap: 16px;
    }
}

// /* 核心业务数据内部由组件自身响应式控制，此处仅同步骨架屏 ---- */
@media (max-width: 720px) {
    // /* 骨架屏同步 */
    .skeleton-core .skeleton-stats :deep(.n-skeleton) {
        flex: 0 0 calc(50% - 6px);
    }
}
</style>
