<template>
    <AppPage ref="appPageRef" title="运输情况" :showSearch="false" :showList="false">
        <template #sub-title>
            <div class="wrapper-white">
                <div class="head">
                    <div class="left">
                        <div class="title">
                            {{ detailData.deliveryOrderCode || detailData.salesContractNumber || '--' }}
                            <AppTag
                                :text="currentColor.label"
                                :color="currentColor.textColor"
                                :border-color="currentColor.borderColor"
                                :bg-color="currentColor.backgroundColor"
                            />
                        </div>
                        <MxAppDescriptions class="detail-descriptions" :data="descriptionsData" :column="1" />
                    </div>
                </div>
            </div>
        </template>

        <template #content>
            <template v-for="item in leftList" :key="item.id">
                <div class="list-item">
                    <div class="head">
                        <div class="title">{{ item.title }}</div>
                        <AppTag :text="item.status" :color="item.statusColor" :bg-color="item.statusBgColor" :border-color="item.statusBorderColor" />
                    </div>
                        <div class="gray-bg">
                            <div class="row">
                                <div class="label">货物名称</div>
                                <div class="value">{{ item.goodsName || '--' }}</div>
                            </div>
                            <div class="row">
                                <div class="label">起运量(吨)</div>
                                <div class="value">{{ formatValue(item.shipmentQuantity) }}</div>
                            </div>
                            <div class="row">
                                <div class="label">在途量(吨)</div>
                                <div class="value">{{ formatValue(item.transitQuantity) }}</div>
                            </div>
                            <div class="row">
                                <div class="label">交割量(吨)</div>
                                <div class="value">{{ formatValue(item.deliveryQuantity) }}</div>
                            </div>
                            <div class="row">
                                <div class="label">运单日期</div>
                                <div class="value">{{ item.transportationOrderDate || '--' }}</div>
                        </div>
                    </div>
                    <div class="row" style="justify-content: space-between; align-items: center">
                        <div class="row" style="margin: 0px">
                            <div class="label">收货地</div>
                            <div class="value">{{ item.receivingPlace || '--' }}</div>
                        </div>
                        <Button plain round type="primary" style="width: 64px; height: 32px" @click="itemClick(item)"
                            >详情</Button
                        >
                    </div>
                </div>
            </template>
            <empty v-if="!loading && leftList.length === 0" />
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { planStatusMap } from '@/constants/dailyShippingPlan';
import { getDailyShippingPlanDetailItemApi } from '@/api';
import { useDictStore } from '@/store/commStore';

const detailData = ref<any>({});
const currentColor = ref<any>({});
const leftList = ref<any[]>([]);
const appPageRef = ref<any>(null);
const route = useRoute();
const router = useRouter();
const { dictMap } = storeToRefs(useDictStore());

const loading = ref(false);
const DICT = {
    TRANSPORT_MODE: '运输方式',
    DELIVERY_METHOD: '交割方式',
    MINERAL_TYPE: '矿种',
    PRIORITY: '优先级',
    SUPPLIER_UNIT: '供方单位',
};
/**
 * 判断字段是否有可展示值。
 * @param value 待判断值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== undefined && value !== null && value !== '';
/**
 * 格式化普通字段展示值。
 * @param value 待展示值
 * @returns 有值时返回原值，空值返回占位文案
 */
const formatValue = (value: any) => (hasValue(value) ? value : '--');
/**
 * 获取指定业务字典选项。
 * @param dictName 字典名称
 * @returns 字典选项列表
 */
const getDictOptions = (dictName: string) => dictMap.value?.[dictName] || [];
/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值
 * @returns 匹配的字典文案，空值返回占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (!hasValue(value)) return '--';
    const option = getDictOptions(dictName).find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) =>
                optionValue !== null &&
                optionValue !== undefined &&
                String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};
/**
 * 格式化发货订单明细状态。
 * @param value 状态枚举值
 * @returns 状态中文文案
 */
const formatDetailStatus = (value: any) => {
    if (!hasValue(value)) return '--';
    return planStatusMap[value]?.label || value;
};
/**
 * 将交割方式转换为字典文案。
 * @param value 逗号分隔的交割方式或交割方式数组
 * @returns 使用顿号连接的交割方式文案
 */
const formatDeliveryMethods = (value: any) => {
    if (!hasValue(value)) return '--';
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter(hasValue)
        .map((item) => formatDict(DICT.DELIVERY_METHOD, item))
        .join('、') || '--';
};
/**
 * 格式化交货期限。
 * @param startDate 交货期限开始日期
 * @param endDate 交货期限结束日期
 * @returns 使用“至”连接的交货期限
 */
const formatDeliveryDeadline = (startDate: any, endDate: any) =>
    [startDate, endDate].filter(hasValue).join('至') || '--';
const descriptionsData = computed(() => [
    {
        label: '发货订单号',
        value: formatValue(detailData.value.deliveryOrderCode),
    },
    {
        label: '关联销售合同编号',
        value: formatValue(detailData.value.salesContractCode),
    },
    {
        label: '优先级',
        value: formatDict(DICT.PRIORITY, detailData.value.priority),
    },
    {
        label: '状态',
        value: formatDetailStatus(detailData.value.status),
    },
    {
        label: '供货单位',
        value: formatDict(DICT.SUPPLIER_UNIT, detailData.value.supplierUnit),
    },
    {
        label: '客户名称',
        value: formatValue(detailData.value.customerName),
    },
    {
        label: '子公司贸易商',
        value: formatValue(detailData.value.subsidiaryName),
    },
    {
        label: '联系方式',
        value: formatValue(detailData.value.contactInformation),
    },
    {
        label: '矿石品位（%）',
        value: formatValue(detailData.value.grade),
    },
    {
        label: '矿石种类',
        value: formatDict(DICT.MINERAL_TYPE, detailData.value.mineralType),
    },
    {
        label: '合同数量（吨）',
        value: formatValue(detailData.value.contractNum),
    },
    ...(detailData.value.planType === 'CONTRACT'
        ? [{ label: '预发货数量', value: formatValue(detailData.value.preDeliveryQuantity) }]
        : []),
    {
        label: '已发货量（吨）',
        value: formatValue(detailData.value.actualQuantity),
    },
    {
        label: '未发货量（吨）',
        value: formatValue(detailData.value.unshippedNum),
    },
    {
        label: '发货阈值（%）',
        value: formatValue(detailData.value.shipmentThreshold),
    },
    {
        label: '运输方式',
        value: formatDict(DICT.TRANSPORT_MODE, detailData.value.transportation),
    },
    {
        label: '交货地点',
        value: formatValue(detailData.value.deliveryLocationName),
    },
    {
        label: '交割方式',
        value: formatDeliveryMethods(detailData.value.deliveryMethod),
    },
    {
        label: '交货期限',
        value: formatDeliveryDeadline(detailData.value.startDate, detailData.value.endDate),
    },
    {
        label: '计划备注',
        value: formatValue(detailData.value.remark),
    },
]);
/**
 * 按运输方式格式化运输订单状态。
 * @param item 运输订单数据
 * @returns 船运或汽运对应的状态文案
 */
const formatOrderStatus = (item: any = {}) => {
    const status = item.transportationOrderStatus;
    if (status === undefined || status === null || status === '') return '--';
    const shipStatusMap: Record<string, string> = {
        100: '待装货到港',
        101: '已装货到港',
        102: '已装货离港',
        103: '已卸货报港',
        104: '已卸货到港',
        105: '已卸货完成',
        106: '已拒绝',
        107: '已审核',
        108: '已作废',
    };
    const landStatusMap: Record<string, string> = {
        1: '草稿',
        2: '待执行',
        3: '执行中',
        4: '已完成',
        5: '已取消',
        6: '归档',
        7: '作废',
    };
    const shippingOrLand = String(item.shippingOrLand || '').toUpperCase();
    const statusMap = shippingOrLand === 'SHIP' ? shipStatusMap : landStatusMap;
    return statusMap[String(status)] || String(status);
};
/**
 * 格式化 App 运输订单列表卡片数据。
 * @param item 运输订单原始数据
 * @returns App 列表展示需要的标题、状态和样式字段
 */
const formatOrderItem = (item: any) => ({
    ...item,
    title: item.logisticsOrderCode || '--',
    status: formatOrderStatus(item),
    statusColor: '#3370eb',
    statusBgColor: '#eff4ff',
    statusBorderColor: '#d9e3f5',
});
/**
 * 获取发货订单明细及其运输订单列表。
 * @returns 无返回值，结果写入顶部详情和运输订单列表
 */
const getDetaily = async () => {
    const detailId = route.query.id;
    detailData.value = {};
    currentColor.value = {};
    leftList.value = [];

    if (detailId === undefined || detailId === null || detailId === '') {
        loading.value = false;
        return;
    }

    try {
        loading.value = true;
        const res = await getDailyShippingPlanDetailItemApi(detailId);
        if (res?.code !== 200) return;

        detailData.value = res.data || {};
        currentColor.value = planStatusMap[detailData.value?.status] || {};
        loading.value = false;
        leftList.value = (detailData.value.shipmentTransportationOrderDTOList || []).map((item: any) => formatOrderItem(item));
    } catch (error) {
        console.error('Failed to obtain details:', error);
    } finally {
        loading.value = false;
    }
};

watch(
    () => route.query.id,
    () => {
        getDetaily();
    },
    { immediate: true }
);
/**
 * 跳转 App 运单详情页。
 * @param item 当前运输订单数据
 * @returns 无返回值
 */
const itemClick = (item?: any) => {
    if (item?.id === undefined || item?.id === null || item?.id === '') return;

    router.push({
        name: 'crm:daily_shipping_plan:waybillDetails',
        query: {
            id: String(route.query.id),
            orderId: String(item?.id),
        },
    });
};
</script>

<style scoped lang="less">
.wrapper-white {
    background-color: var(--base-white);
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

.list-item {
    border-radius: 8px 8px 8px 8px;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    .head {
        display: flex;
        justify-content: space-between;
        .title {
            font-weight: 500;
            font-size: 14px;
            color: #333333;
        }
    }
    .row {
        display: flex;
        font-size: 14px;
        margin-top: 12px;
        .label {
            margin-right: 4px;
            color: #999999;
        }
        .value {
            flex: 1;
            color: #333333;
        }
    }
    .gray-bg {
        background: #f7f7f7;
        border-radius: 4px 4px 4px 4px;
        padding: 1px 8px 8px;
        margin-top: 8px;
        .row {
            font-size: 14px;
            margin-top: 8px;
            .label {
                margin-right: 8px;
            }
        }
    }
}
</style>
