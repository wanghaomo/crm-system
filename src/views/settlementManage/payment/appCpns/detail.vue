<template>
    <AppPage ref="appPageRef" title="回款单详情" :showSearch="false" :showList="false">
        <template #sub-title>
            <div class="wrapper-white">
                <div class="head">
                    <div class="left">
                        <div class="title">
                            <AppTag class="status-tag" :text="currentColor.label" :type="statusTagType" />
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
            <card title="基础信息" v-show="activeStep == 'baseInfo'">
                <baseInfo :detailData="detailData" />
            </card>
            <card title="回款记录" v-show="activeStep == 'paymentRecord'">
                <template v-for="(item, index) in detailData.paymentRecord" :key="item.id">
                    <dataItem
                        title="回款明细"
                        :index="Number(index) + 1"
                        :item="item"
                        :smallTitle="`回款金额 ${formatAmount(item.payAmount)}`"
                        :descriptions="getPaymentRecordDescriptions(item)" />
                </template>
                <empty v-if="!detailData.paymentRecord || detailData.paymentRecord.length == 0" />
                <button class="add-button" @click="addRecord('payment')" v-if="showAddRecord">
                    <div class="icon"></div>
                    添加回款记录
                </button>
            </card>
            <card title="催款记录" v-show="activeStep == 'jreminderRecord'">
                <template v-for="(item, index) in detailData.jreminderRecord" :key="item.id">
                    <dataItem
                        title="催收明细"
                        :index="Number(index) + 1"
                        :item="item"
                        :descriptions="getjreminderDescriptions(item)" />
                </template>
                <empty v-if="!detailData.jreminderRecord || detailData.jreminderRecord.length == 0" />
                <button class="add-button" @click="addRecord('jreminder')" v-if="showAddRecord">
                    <div class="icon"></div>
                    添加催款记录
                </button>
            </card>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from 'vue';
import { Button, Tabs, Tab, Skeleton, showConfirmDialog } from 'vant';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import card from './card.vue';
import baseInfo from './baseInfo.vue';
import dataItem from './data-item.vue';
import { paymentStatusMap, PAYMENT_STATUS_CONSTANT } from '@/constants/payment';
import { deepClone } from '@/utils/comm';
import { getCollectionRecordListApi, getPaymentDetailApi, getPaymentRecordListApi } from '@/api';
import { formatAmount, normalizePaymentRecord, OVERFLOWING_TYPE_PREPAYMENT_OFFSET } from '../utils';
const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或字典文案
 * @returns 匹配到的字典文案，空值返回占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const option = (dictMap.value?.[dictName] || []).find((item: any) => item.value == value || item.label == value);
    return option?.label || value;
};
const detailData = ref<any>({});
const currentColor = ref<any>({});
// App 状态标签类型映射。
const statusTagType = computed(() => {
    const typeMap: Record<string, string> = {
        [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01]: 'warning',
        [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02]: 'primary',
        [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_03]: 'success',
        [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04]: 'error',
    };
    return typeMap[detailData.value?.status] || 'info';
});
const descriptionsData = ref([
    {
        label: '回款单编号',
        value: '',
    },
]);
const appPageRef = ref<any>(null);
const route = useRoute();
const router = useRouter();

const activeStep = ref('baseInfo');
// App 详情页顶部 Tab 配置。
const tabsOptions = [
    {
        label: '基础信息',
        value: 'baseInfo',
    },
    {
        label: '回款记录',
        value: 'paymentRecord',
    },
    {
        label: '催款记录',
        value: 'jreminderRecord',
    },
];
// 只有回款中或逾期中的回款单允许继续新增回款/催收记录。
const showAddRecord = computed(() => {
    return (
        detailData.value.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02 ||
        detailData.value.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04
    );
});
/**
 * 跳转到 App 录入回款或催收页面。
 * @param type 记录类型，payment 为回款记录，jreminder 为催收记录
 * @returns 无返回值
 */
const addRecord = (type: string) => {
    if (type === 'jreminder') {
        router.push({ path: '/settlementManage/payment/jreminderRecord', query: { id: detailData.value.id } });
    }
    if (type === 'payment') {
        router.push({ path: '/settlementManage/payment/paymentRecord', query: { id: detailData.value.id } });
    }
};
const loading = ref(false);
/**
 * 获取当前回款单的回款记录列表。
 * @returns 无返回值，结果写入详情数据的 paymentRecord 字段
 */
const getPaymentRecordList = async () => {
    const { receiptCode, customerId } = detailData.value || {};
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
    detailData.value.paymentRecord = Array.isArray(res?.data) ? res.data : [];
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
        loading.value = true;
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = normalizePaymentRecord(deepClone(res?.data || {}));
        await getPaymentRecordList();
        await getCollectionRecordList();
        descriptionsData.value[0].value = detailData.value.receiptCode;
        currentColor.value = paymentStatusMap[detailData.value?.status];
        loading.value = false;
    } catch (error) {
        loading.value = false;
        console.error('Failed to obtain details:', error);
    }
};
/**
 * 组装 App 回款记录卡片描述字段。
 * @param item 回款记录数据
 * @returns 描述组件需要的字段列表
 */
const getPaymentRecordDescriptions = (item) => {
    return [
       
        { label: '回款记录编号', value: item.recordCode || '--' },
        { label: '关联回款单', value: item.receiptCode || detailData.value.receiptCode || '--' },
        { label: '回款日期', value: item.payDate || '--' },
         {
            label: '预收冲应收金额(元)',
            value:
                String(item.overflowingType) === OVERFLOWING_TYPE_PREPAYMENT_OFFSET ? item.surplusRevenue ?? '--' : '--',
        },
        { label: '经办人', value: item.handlerName || '--' },
        { label: '抹零数据（元）', value: item.roundOff ?? '--' },
        { label: '计划回款日期', value: item.plannedDate || detailData.value.plannedDate || '--' },
        { label: '客户名称', value: item.customerName || detailData.value.customerName || '--' },
        { label: '回款方式', value: formatDict('回款方式', item.payMethod) },
        { label: '备注', value: item.remark || '--' },
    ];
};
/**
 * 组装 App 催收记录卡片描述字段。
 * @param item 催收记录数据
 * @returns 描述组件需要的字段列表
 */
const getjreminderDescriptions = (item) => {
    return [
        { label: '催收记录编号', value: item.collectionCode || '--' },
        { label: '关联回款单', value: item.receiptCode || detailData.value.receiptCode || '--' },
        { label: '客户名称', value: item.customerName || detailData.value.customerName || '--' },
        { label: '催收日期', value: item.collectorTime || '--' },
        { label: '催收人', value: item.collectorName || '--' },
        { label: '催收内容', value: item.collectionContent || '--' },
        { label: '客户回复时间', value: item.replyTime || '--' },
        { label: '客户回复内容', value: item.replyContent || '--' },
        { label: '预计回款时间', value: item.expectedPaymentDate || '--' },
        { label: '催收方式', value: formatDict('催收方式', item.collectionMethod) },
        { label: '后续跟进措施', value: item.followUpAction || '--' },
    ];
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
