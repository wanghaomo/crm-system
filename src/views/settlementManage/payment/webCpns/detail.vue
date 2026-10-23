<template>
    <WebPage contentPadding="0px" contentBg="none" :hideAddBtn="true" showBack>
        <template #content>
            <div style="display: flex;flex-direction: column;height: 100%;">
                <div class="head">
                    <div class="title">
                        <span style="margin-right: 8px">{{ detailData.customerName || '--' }}</span>
                        <StatusTag :text="currentColor.label" :color="currentColor.textColor" :bgColor="currentColor.backgroundColor" :borderColor="currentColor.borderColor" />
                    </div>
                    <div class="row">
                        <div class="item">
                            <div class="label">回款单编号</div>
                            <div class="value">{{ detailData.receiptCode || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label">跟单人</div>
                            <div class="value">{{ detailData.handlerName || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label">计划回款日</div>
                            <div class="value">{{ detailData.plannedDate || '--' }}</div>
                        </div>
                    </div>
                </div>
                <div class="main">
                    <div style="position: relative;">
                        <n-tabs type="line" v-model:value="tabActive" :tab-style="{ color: '#666666', fontSize: '16px' }" animated>
                            <n-tab-pane name="baseInfo" tab="基础信息"> </n-tab-pane>
                            <n-tab-pane name="paymentRecord" tab="回款记录"> </n-tab-pane>
                            <n-tab-pane name="jreminderRecord" tab="催款记录"> </n-tab-pane>
                        </n-tabs>
                        <div class="line"></div>
                    </div>
                    <div class="content">
                        <baseInfo :detailData="detailData" v-show="tabActive == 'baseInfo'" />
                        <paymentRecord :detailData="detailData" @addEvt="addPayMent()" v-show="tabActive == 'paymentRecord'" />
                        <jreminderRecord :detailData="detailData" @addEvt="addJreminder()" v-show="tabActive == 'jreminderRecord'" />
                    </div>
                </div>
            </div>
        </template>
    </WebPage>
    <addPaymentDrawer ref="addPaymentDrawerRef" @refresh="getDetaily"></addPaymentDrawer>
    <addJrenubderDrawer ref="addJrenubderDrawerRef" @refresh="getDetaily"></addJrenubderDrawer>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, watch, computed, nextTick } from 'vue';
import { NInput, NTabs, NTabPane, NInputNumber } from 'naive-ui';
import { deepClone } from '@/utils/comm';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import baseInfo from './baseInfo.vue';
import paymentRecord from './paymentRecord.vue';
import jreminderRecord from './jreminderRecord.vue';
import addPaymentDrawer from './addPaymentDrawer.vue';
import addJrenubderDrawer from './addJrenubderDrawer.vue';
const router = useRouter();
import { getCollectionRecordListApi, getPaymentDetailApi, getPaymentRecordListApi } from '@/api';
import { paymentStatusMap, PAYMENT_STATUS_CONSTANT } from '@/constants/payment';
import { normalizePaymentRecord } from '../utils';
const addPaymentDrawerRef = ref(null);
const addJrenubderDrawerRef = ref(null);
const route = useRoute();
const tabActive = ref('baseInfo');
const detailData = ref<any>({});
const currentColor = ref<any>({});
/**
 * 获取当前回款单的回款记录列表。
 * @returns 无返回值，结果写入详情数据的 paymentRecord 字段
 */
const getPaymentRecordList = async () => {
    const { receiptCode, customerId, customerName, plannedDate } = detailData.value || {};
    if (!receiptCode) {
        detailData.value.paymentRecord = [];
        return;
    }
    const res = await getPaymentRecordListApi({
        current: 1,
        size: 999,
        searchCount: false,
        receiptCode,
        customerId,
    });
    const list = Array.isArray(res?.data) ? res.data : [];
    detailData.value.paymentRecord = list.map((item: any) => ({
        ...item,
        customerName,
        plannedDate,
    }));
};
/**
 * 获取当前回款单的催收记录列表。
 * @returns 无返回值，结果写入详情数据的 jreminderRecord 字段
 */
const getCollectionRecordList = async () => {
    const { receiptCode } = detailData.value || {};
    if (!receiptCode) {
        detailData.value.jreminderRecord = [];
        return;
    }
    const res = await getCollectionRecordListApi({
        current: 1,
        size: 999,
        searchCount: false,
        receiptCode,
    });
    detailData.value.jreminderRecord = Array.isArray(res?.data) ? res.data : [];
};
/**
 * 获取回款单详情，并同步加载回款记录和催收记录。
 * @returns 无返回值
 */
const getDetaily = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = normalizePaymentRecord(deepClone(res?.data || {}));
        await getPaymentRecordList();
        await getCollectionRecordList();
        currentColor.value = paymentStatusMap[detailData.value?.status];
    } catch (error) {
        console.error('Failed to obtain details:', error);
    }
};
getDetaily();

/**
 * 打开录入回款记录抽屉。
 * @returns 无返回值
 */
const addPayMent = () => {
    addPaymentDrawerRef.value.showDrawer(detailData.value);
};
/**
 * 打开录入催收记录抽屉。
 * @returns 无返回值
 */
const addJreminder = () => {
    addJrenubderDrawerRef.value.showDrawer(detailData.value);
};
</script>

<style scoped lang="less">
:deep(.component_page_content) {
    padding: 0 !important;
}

:deep(.component_page_content_box) {
    display: flex;
    flex-direction: column;
}

:deep(.n-tabs.n-tabs--top .n-tab-pane) {
    padding: 0;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--line-type.n-tabs-nav--top .n-tabs-nav-scroll-content) {
    border-bottom: 1px solid transparent;
}

.head {
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
    flex: 1;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px 8px 8px 8px;
    padding: 6px 16px 16px;
    box-sizing: border-box;
    width: calc(100% - 32px);
    margin: 16px;
    display: flex;
    flex-direction: column;

    .line {
        position: absolute;
        left: -24px;
        right: -24px;
        bottom: 0;
        height: 1px;
        background-color: #E2E2E2;
    }

    .content {
        flex: 1;
        box-sizing: border-box;
        scrollbar-width: none;
        overflow-y: scroll;
    }
}
</style>
