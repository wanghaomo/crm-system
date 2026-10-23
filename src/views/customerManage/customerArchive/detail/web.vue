<template>
    <WebPage showBack hideAddBtn contentPadding="0">
        <template #content>
            <div class="customer-detail-container">
                <n-spin :show="detailLoading" description="加载中..." style="height: 100%;">
                    <div class="detail-content">
                        <!-- 顶部客户信息 -->
                        <div class="detail-header">
                            <div class="detail-header-top">
                                <span class="detail-company-name">{{ detailData.customerName }}</span>
                                <StatusTag :text="STATUS_MAP[detailData.status]?.text" color="#5AA771" bgColor="#F0F9EB" borderColor='#E2F4D8' />
                            </div>
                            <div class="detail-header-info">
                                <div class="info-item">
                                    <span class="info-label">客户编码</span>
                                    <span class="info-value">{{ detailData.customerCode|| '--' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">客户类型</span>
                                    <span class="info-value">{{ customerTypeMap[detailData.customerType]|| '--' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">客户星级</span>
                                    <span class="info-value">{{ starLevelMap[detailData.starLevel] || '--'}}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">区域</span>
                                    <span class="info-value">{{ regionMap[detailData.region] || detailData.region || '--' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-main">
                            <!-- 选项卡 -->
                            <div class="detail-tabs-container">
                                <n-tabs v-model:value="activeTab" type="line" animated class="detail-tabs" :bar-width="36">
                                    <n-tab v-for="tab in tabList" :key="tab.value" :name="tab.value">
                                        {{ tab.label }}
                                    </n-tab>
                                </n-tabs>
                            </div>

                            <!-- 动态组件展示 -->
                            <div class="tab-content">
                                <BasicInfo v-if="activeTab === 'basic'" :detailData="detailData" :detailFactoryTableConfig="detailFactoryTableConfig" :detailContactColumns="detailContactColumns" />
                                <MxWebDataTable v-else-if="tabTableConfig" v-bind="tabTableConfig" :single-line="false" :bordered="true" :bottom-bordered="true" :flexHeight="false" :styleOption="{ padding: '0' }" />
                                <div v-else class="tab-placeholder">
                                    暂无数据
                                </div>
                            </div>
                        </div>
                    </div>
                </n-spin>
            </div>
        </template>
    </WebPage>

    <!-- 统一详情抽屉 -->
    <MxDrawer v-model:show="detailDrawerShow" :title="detailTitle" size="large" :closablePop="false" @close="closeDetailDrawer">
        <VisitRecordDetail v-if="currentDetailType === 'visit'" :record-id="currentDetailRecordId" />
        <VisitPlanDetail v-else-if="currentDetailType === 'visitRecord'" :record-id="currentDetailRecordId" />
        <CustomerCareDetail v-else-if="currentDetailType === 'care'" :record-id="currentDetailRecordId" />
        <ChemicalCompanyDetail v-else-if="currentDetailType === 'research'" :record-id="currentDetailRecordId" :initial-data="currentDetailRow" />
    </MxDrawer>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NTabs, NTab, NSpin } from 'naive-ui';
import IndexData from "../index";
import BasicInfo from "../components/basicInfo.vue";
import VisitRecordDetail from '@/views/customerManage/components/VisitRecordDetail.vue';
import VisitPlanDetail from '@/views/customerManage/components/VisitPlanDetail.vue';
import CustomerCareDetail from '@/views/customerManage/components/CustomerCareDetail.vue';
import ChemicalCompanyDetail from '@/views/marketInfo/chemicalCompany/components/ChemicalCompanyDetail.vue';
import MxDrawer from '@/components/MxDrawer/index.vue';

const route = useRoute();
const router = useRouter();
const {
    detailLoading,
    activeTab,
    tabList,
    detailData,
    detailFactoryTableConfig,
    detailContactColumns,
    tabTableConfig,
    customerTypeMap,
    starLevelMap,
    STATUS_MAP,
    regionMap,
    loadDetail,
    currentDetailRecordId,
    currentDetailType,
    currentDetailRow,
    detailDrawerShow,
} = IndexData();

// 根据类型获取对应的详情标题
const detailTitle = computed(() => {
    const titleMap: Record<string, string> = {
        visit: '来访记录详情',
        visitRecord: '拜访记录详情',
        care: '关怀记录详情',
        research: '化工企业调研详情',
    };
    return titleMap[currentDetailType.value] || '详情';
});

onMounted(async () => {
    const id = route.query.id;
    const tab = route.query.tab as string;
    if (id) {
        await loadDetail(Number(id));
    }
    if (tab) {
        activeTab.value = tab;
    }
});

// tab切换时更新URL query，确保返回时能恢复tab状态
watch(activeTab, (newTab) => {
    if (newTab && route.query.id) {
        router.replace({
            query: { ...route.query, tab: newTab },
        });
    }
});

// 关闭抽屉时清空记录ID
const closeDetailDrawer = () => {
    detailDrawerShow.value = false;
    currentDetailRecordId.value = null;
    currentDetailType.value = '';
    currentDetailRow.value = {};
};
</script>

<style lang="less" scoped>
:deep(.n-spin-content) {
    height: 100%;
}

.customer-detail-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to right, #ededed 0%, #F5F5F5 100%);

    .detail-content {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .detail-header {
        flex-shrink: 0;
        padding: 16px;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 12px;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .detail-company-name {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
        }

        .detail-header-info {
            display: flex;
            column-gap: 88px;
            row-gap: 12px;
            flex-wrap: wrap;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .info-label {
                color: #999;
                font-size: 14px;
            }

            .info-value {
                color: #333;
                font-size: 14px;
                font-weight: normal;
            }
        }
    }

    .detail-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        background-color: #fff;
        overflow: hidden;

        .detail-tabs-container {
            padding: 6px 16px 0px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .tab-content {
            flex: 1;
            padding: 16px;
            padding-bottom: 0;
            overflow-y: auto;
        }
    }
}

.tab-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #999;
    font-size: 14px;
}
</style>
