<template>
    <WebPage contentPadding="0px" contentBg="none" :hideAddBtn="true" showBack>
        <template #content>
            <div class="settlement-detail-content">
                <div class="head">
                    <div class="title">
                        <span style="margin-right: 8px">{{ detailData.customerName || '--' }}</span>
                        <StatusTag
                            :text="currentColor.label"
                            :color="currentColor.textColor"
                            :bgColor="currentColor.backgroundColor"
                            :borderColor="currentColor.borderColor" />
                    </div>
                    <div class="row">
                        <div class="item">
                            <div class="label">结算单编号</div>
                            <div class="value">{{ detailData.settlementCode || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label">我方经办人</div>
                            <div class="value">{{ handlerName }}</div>
                        </div>
                        <div class="item">
                            <div class="label">结算时间</div>
                            <div class="value">{{ detailData.settlementTime || '--' }}</div>
                        </div>
                    </div>
                </div>
                <div class="main">
                    <div class="tab-header">
                        <n-tabs type="line" v-model:value="tabActive" :tab-style="{ color: '#666666', fontSize: '16px' }" animated>
                            <n-tab-pane name="baseInfo" tab="基础信息"> </n-tab-pane>
                            <n-tab-pane name="billingInfo" tab="开票信息"> </n-tab-pane>
                            <n-tab-pane name="approveRecord" tab="审批流程"> </n-tab-pane>
                        </n-tabs>
                        <div class="line"></div>
                    </div>
                    <div class="content">
                        <baseInfo :detailData="detailData" v-show="tabActive == 'baseInfo'" />
                        <billingInfo :detailData="detailData" v-show="tabActive == 'billingInfo'" />
                        <approveRecord
                            :detailData="detailData"
                            v-show="tabActive == 'approveRecord'"
                            @cancel-success="getDetail" />
                    </div>
                </div>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import { useRoute } from 'vue-router';
import baseInfo from './detailCpns/baseInfo.vue';
import billingInfo from './detailCpns/billingInfo.vue';
import approveRecord from './detailCpns/approveRecord.vue';
import { getSettlementMainDetailApi } from '@/api';
import { settlementStatusMap } from '@/constants/settlement';
import {
    getSettlementApprovalLogs,
    normalizeSettlementApprovalDetail,
    normalizeSettlementYardDetail,
} from '../utils';
const route = useRoute();
const tabActive = ref('baseInfo');
const detailData = ref<any>({});
const defaultStatusStyle = {
    label: '--',
    textColor: '#999999',
    backgroundColor: '#F4F4F4',
    borderColor: '#E2E2E2',
};
const currentColor = computed(() => settlementStatusMap[detailData.value?.status] || defaultStatusStyle);

/**
 * 从人员对象数组中提取我方经办人展示名称。
 * @param handler 经办人对象数组
 * @returns 我方经办人名称
 */
const getHandlerName = (handler: any) => {
    const firstHandler = Array.isArray(handler) ? handler[0] : handler;
    return firstHandler?.label || firstHandler?.username || firstHandler?.name || '--';
};
const handlerName = computed(() => getHandlerName(detailData.value.handler));

/**
 * 获取结算单详情。
 * @returns 无返回值，结果写入详情数据
 */
const getDetail = async () => {
    try {
        if (!route.query.id) return;
        const res: any = await getSettlementMainDetailApi(String(route.query.id));
        if (res?.code === 200) {
            const detail = normalizeSettlementYardDetail(normalizeSettlementApprovalDetail(res.data || {}));
            detail.approvalLogs = await getSettlementApprovalLogs(detail.approvalId);
            detailData.value = detail;
        }
    } catch (error) {
        console.error('获取结算单详情失败:', error);
    }
};
getDetail();
</script>

<style scoped lang="less">
:deep(.component_page_content) {
    padding: 0 !important;
    min-height: 0;
    overflow: hidden;
}

:deep(.component_page_content > div) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden !important;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--line-type.n-tabs-nav--top .n-tabs-nav-scroll-content) {
    border-bottom: 1px solid transparent;
}

.settlement-detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.head {
    flex-shrink: 0;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px 8px 8px 8px;
    padding: 16px;
    box-sizing: border-box;
    width: calc(100% - 32px);
    margin: 16px 16px 0px;

    .title {
        font-weight: 600;
        font-size: 16px;
        color: #333333;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        margin-top: 12px;

        .item {
            display: flex;
            margin-right: 88px;

            .label {
                font-size: 14px;
                color: #999999;
                margin-right: 8px;
            }

            .value {
                font-size: 14px;
                color: #333333;
            }
        }
    }
}

.main {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px 8px 8px 8px;
    padding: 6px 16px 16px;
    margin: 16px;

    .tab-header {
        position: relative;
        flex-shrink: 0;
    }

    .line {
        position: absolute;
        left: -24px;
        right: -24px;
        bottom: 0;
        height: 1px;
        background-color: #E2E2E2;
    }

    .content {
        box-sizing: border-box;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: none;
    }
}

:deep(.n-tabs-pane-wrapper) {
    display: none;
}
</style>
