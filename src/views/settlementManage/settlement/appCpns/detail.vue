<template>
    <AppPage ref="appPageRef" title="结算单详情" :showSearch="false" :showList="false">
        <template #sub-title>
            <div class="wrapper-white">
                <div class="head">
                    <div class="left">
                        <div class="title">
                            <AppTag
                                v-if="currentColor?.label"
                                class="status-tag"
                                :text="currentColor.label"
                                :type="currentColor.type" />
                            {{ detailData.customerName || '--' }}
                        </div>
                        <MxAppDescriptions class="detail-descriptions" :data="descriptionsData" :column="1" />
                    </div>
                </div>
                <Tabs
                    v-model:active="activeStep"
                    color="var(--base-color)"
                    title-active-color="var(--base-black)"
                    title-inactive-color="var(--base-grey2)">
                    <Tab
                        v-for="item in tabsOptions"
                        :key="item.value"
                        :name="item.value"
                        :title="item.label"
                        :title-style="{ fontSize: '16px' }"></Tab>
                </Tabs>
            </div>
        </template>

        <template #content>
            <!-- 内容区域   -->
            <baseInfo :detailData="detailData" v-if="activeStep == 'baseInfo'" />
            <invoiceInfo :detailData="detailData" v-if="activeStep == 'invoiceInfo'" />
            <approveInfo
                :detailData="detailData"
                v-if="activeStep == 'approveInfo'" />
        </template>
        <template #footer>
            <MxApprovalCancel
                v-if="activeStep === 'approveInfo'"
                :approval-id="detailData.approvalId"
                :initiator-lark-id="detailData.initiatorLarkId"
                :reviewing="detailData.status === 'REVIEWING'"
                @success="getDetaily" />
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Tabs, Tab } from 'vant';
import { useRoute } from 'vue-router';
import baseInfo from './detailCpns/baseInfo.vue';
import invoiceInfo from './detailCpns/invoiceInfo.vue';
import approveInfo from './detailCpns/approveInfo.vue';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';
import { settlementStatusMap, SETTLEMENT_STATUS_CONSTANT } from '@/constants/settlement';
import { getSettlementMainDetailApi } from '@/api';
import {
    getSettlementApprovalLogs,
    normalizeSettlementApprovalDetail,
    normalizeSettlementYardDetail,
} from '../utils';
const detailData = ref<any>({});
const currentColor = ref<any>({});
const descriptionsData = computed(() => [
    {
        label: '结算单编号',
        value: detailData.value.settlementCode || '--',
    },
    {
        label: '我方经办人',
        value: handlerName.value,
    },
    {
        label: '结算时间',
        value: detailData.value.settlementTime || '--',
    },
]);
const appPageRef = ref<any>(null);
const route = useRoute();

const activeStep = ref('baseInfo');
const tabsOptions = [
    {
        label: '基础信息',
        value: 'baseInfo',
    },
    {
        label: '开票信息',
        value: 'invoiceInfo',
    },
    {
        label: '审批流程',
        value: 'approveInfo',
    },
];
const loading = ref(false);

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

// 获取详情
const getDetaily = async () => {
    try {
        loading.value = true;
        if (!route.query.id) return;
        const res: any = await getSettlementMainDetailApi(String(route.query.id));
        const detail = normalizeSettlementYardDetail(normalizeSettlementApprovalDetail(res?.data || {}));
        detail.approvalLogs = await getSettlementApprovalLogs(detail.approvalId);
        detailData.value = detail;
        currentColor.value = {
            ...settlementStatusMap[detailData.value?.status],
            type: (() => {
                const typeMap: Record<string, string> = {
                    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01]: 'warning',
                    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_02]: 'primary',
                    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_03]: 'success',
                    [SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING]: 'primary',
                    [SETTLEMENT_STATUS_CONSTANT.APPROVAL_GEN_FAILED]: 'error',
                    [SETTLEMENT_STATUS_CONSTANT.CANCELING]: 'warning',
                };
                return typeMap[detailData.value?.status] || 'info';
            })(),
        };
    } catch (error) {
        console.error('Failed to obtain details:', error);
    } finally {
        loading.value = false;
    }
};
getDetaily();
</script>

<style scoped lang="less">
:deep(.detail-descriptions .mx-descriptions-item){
    margin-bottom: 0;
}
.wrapper-white {
    background-color: var(--base-white);
}
.head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 12px 0px;
    .title {
        font-size: 16px;
        color: #333333;
        font-weight: 500;
        margin-bottom: 8px;
        .status-tag {
            float: left;
            margin-right: 8px;
            margin-top: 2px;
        }
    }
}
.add-button {
    border: none;
    outline: none;
    font-size: 14px;
    color: #2c65f2;
    display: flex;
    align-items: center;
    background: none;
    cursor: pointer;
    margin: auto;
    .icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        background: url('@/assets/images/comm/icon⎽com⎽add_blue.png') center no-repeat;
        background-size: 100% 100%;
    }
}
.item-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333333;
    font-weight: 500;
}
</style>
