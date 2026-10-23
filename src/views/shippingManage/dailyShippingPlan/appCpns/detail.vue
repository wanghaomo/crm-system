<template>
    <AppPage ref="appPageRef" title="发货订单详情" :showSearch="false" :showList="false">
        <template #sub-title>
            <div class="wrapper-white">
                <div class="head">
                    <div class="left">
                        <div class="title">
                            {{ detailData.code }}
                            <AppTag :style="{
                                color: currentColor.textColor,
                                borderColor: currentColor.borderColor,
                                backgroundColor: currentColor.backgroundColor,
                            }" :text="currentColor.label"></AppTag>

                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #content>
            <card title="基础信息">
                <div class="row">
                    <div class="item">
                        <div class="label">关联合同单号</div>
                        <div class="value">{{ detailData?.contractCodeDisplay || '--' }}</div>
                    </div>
                    <div class="item wrap">
                        <div class="label">备注</div>
                        <div class="value">{{ detailData?.remark || '--' }}</div>
                    </div>
                </div>
            </card>

            <card title="发货订单明细">
                <template v-for="(item, index) in planRecord" :key="item.id">
                    <dataItem
                        title="计划明细"
                        :index="index + 1"
                        :item="item"
                        :descriptions="getPaymentRecordDescriptions(item)" />
                </template>
                <empty v-if="planRecord.length == 0" />
            </card>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { ref, } from 'vue';
import card from '../card.vue';
import dataItem from '../data-item.vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
    DAILY_SHIPPING_PLAN_TYPE,
    planStatusMap,
} from '@/constants/dailyShippingPlan';
import { deepClone } from '@/utils/comm';
import { getDailyShippingPlanDetailApi } from '@/api';
import { useDictStore } from '@/store/commStore';
const detailData = ref<any>({});
const currentColor = ref<any>({});
const { dictMap } = storeToRefs(useDictStore());
// 发运计划明细使用的业务字典名称。
const DICT = {
    SUPPLIER_UNIT: '供方单位',
    ORE_TYPE: '矿种',
    TRANSPORT_MODE: '运输方式',
    DELIVERY_METHOD: '交割方式',
    PRIORITY: '优先级',
};
/**
 * 获取指定业务字典选项。
 * @param dictName 字典名称
 * @returns 字典选项列表
 */
const getDictOptions = (dictName: string) => dictMap.value?.[dictName] || [];
/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或字典文案
 * @returns 匹配到的字典文案，空值返回占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const option = getDictOptions(dictName).find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};
/**
 * 将逗号分隔的交割方式逐项转换为字典文案。
 * @param value 接口返回的交割方式
 * @returns 使用顿号连接的交割方式文案
 */
const formatDeliveryMethods = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter((item) => item !== null && item !== undefined && item !== '')
        .map((item) => formatDict(DICT.DELIVERY_METHOD, item))
        .join('、') || '--';
};
/**
 * 格式化发运计划明细状态。
 * @param value 状态编码
 * @returns 状态展示文案
 */
const formatDetailStatus = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    return planStatusMap[value]?.label || value;
};
const formatQuantity = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);
/**
 * 格式化预发货数量。
 * @param value 预发货数量
 * @returns 固定两位小数的展示文案，空值返回占位符
 */
const formatPreDeliveryQuantity = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const quantity = Number(value);
    return Number.isFinite(quantity) ? quantity.toFixed(2) : value;
};
const route = useRoute();

const planRecord = ref([]);
const loading = ref(false);
/**
 * 获取发运计划详情。
 * @returns 无返回值，结果写入主表详情和明细列表
 */
const getDetaily = async () => {
    try {
        loading.value = true;
        const res = await getDailyShippingPlanDetailApi(route.query.id);
        detailData.value = deepClone(res?.data || {});
        currentColor.value = planStatusMap[detailData.value?.status];
        loading.value = false;
        planRecord.value = res.data?.details || [];
    } catch (error) {
        loading.value = false;
        console.error('Failed to obtain details:', error);
    }
};
/**
 * 组装 App 明细卡片描述字段。
 * @param item 发货订单明细
 * @returns 描述组件需要的字段列表
 */
const getPaymentRecordDescriptions = (item) => {
    const descriptions = [
        { label: '发货订单号', value: item.deliveryOrderCode || '--' },
        { label: '关联销售合同编号', value: item.salesContractNumber },
        { label: '优先级', value: formatDict(DICT.PRIORITY, item.priority) },
        { label: '状态', value: formatDetailStatus(item.status) },
        { label: '供方单位', value: formatDict(DICT.SUPPLIER_UNIT, item.supplierUnit) },
        { label: '企业名称', value: item.companyname },
        { label: '子公司贸易商', value: item.subsidiaryName || '--' },
        { label: '联系方式', value: item.contactInformation || item.phone },
        { label: '矿石品位（%）', value: item.oreGgrade },
        { label: '矿石种类', value: formatDict(DICT.ORE_TYPE, item.oreType) },
        { label: '合同数量（吨）', value: item.contractQuantity },
        { label: '已发货量（吨）', value: formatQuantity(item.actualQuantity) },
        { label: '未发货量（吨）', value: formatQuantity(item.unshippedNum) },
        { label: '发货阈值（%）', value: formatQuantity(item.shipmentThreshold) },
        { label: '交货地点', value: item.deliveryLocationName },
        { label: '运输方式', value: formatDict(DICT.TRANSPORT_MODE, item.modeTransportation) },
        { label: '交割方式', value: formatDeliveryMethods(item.deliveryMethods) },
        { label: '交货期限', value: item.deliveryDeadline },
        { label: '计划备注', value: item.remark },
    ];
    const planType = detailData.value?.planType || item.planType;
    if (planType === DAILY_SHIPPING_PLAN_TYPE.CONTRACT) {
        descriptions.splice(10, 0, {
            label: '预发货数量',
            value: formatPreDeliveryQuantity(item.preDeliveryQuantity),
        });
    }
    return descriptions;
};
getDetaily();
</script>

<style scoped lang="less">
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
    }

    .status-tag {
        padding: 2px 8px;
        font-size: 12px;
        color: #67c23a;
        background: #e8f5e8;
        border-radius: 4px;
        line-height: 1.4;
        margin-right: 8px;
        font-weight: normal;
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

.row {

    .item {
        display: flex;
        padding: 14px 0px;
        border-bottom: 1px solid #ededed;
        font-size: 16px;

        &:last-child {
            border-bottom: none;
        }

        .label {

            color: #999999;
            width: 130px;
        }

        .value {
            color: #333333;
            margin-left: 8px;
            flex: 1;
        }

        .blue {
            color: #2c65f2;
        }
    }

    .wrap {
        flex-wrap: wrap;

        .label {
            width: 100%;
        }

        .value {
            width: 100%;
            margin-top: 4px;
        }
    }

    .item:first-child {
        padding-top: 0;
    }

    .item:last-child {
        padding-bottom: 0;
    }
}
</style>
