<template>
    <AppPage ref="appPageRef" title="运单详情" :showSearch="false" :showList="false">
        <template #sub-title>
            <div class="wrapper-white">
                <div class="head">
                    <div class="left">
                        <div class="title">
                            {{ orderData.logisticsOrderCode || '--' }}
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
            <card title="基础信息">
                <div class="row">
                    <div class="item" style="padding-top: 4px;">
                        <div class="label">起运量(吨)</div>
                        <div class="value">{{ formatValue(orderData?.shipmentQuantity) }}</div>
                    </div>
                    <div class="item">
                        <div class="label">在途量(吨)</div>
                        <div class="value">{{ formatValue(orderData?.transitQuantity) }}</div>
                    </div>
                    <div class="item">
                        <div class="label">交割量(吨)</div>
                        <div class="value">{{ formatValue(orderData?.deliveryQuantity) }}</div>
                    </div>
                    <div v-if="!isAutomobileOrder" class="item">
                        <div class="label">运单号</div>
                        <div class="value">{{ orderData?.transportationOrderCode || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">承运商</div>
                        <div class="value">{{ orderData?.carrier || '--' }}</div>
                    </div>
                    <div v-if="!isAutomobileOrder" class="item">
                        <div class="label">船长姓名</div>
                        <div class="value">{{ orderData?.shipCaptain || '--' }}</div>
                    </div>
                    <div v-if="!isAutomobileOrder" class="item">
                        <div class="label">船舶号</div>
                        <div class="value">{{ orderData?.shipNumber || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">始发地</div>
                        <div class="value">{{ orderData?.placeOfOrigin || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">发货人</div>
                        <div class="value">{{ orderData?.shipperName || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">发货人电话</div>
                        <div class="value">{{ orderData?.shipperTel || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">收货地</div>
                        <div class="value">{{ orderData?.receivingPlace || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">收货人姓名</div>
                        <div class="value">{{ orderData?.receivingPerson || '--' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">收货人电话</div>
                        <div class="value">{{ orderData?.receivingPersonTel || '--' }}</div>
                    </div>
                </div>
            </card>

            <card title="物流信息">
                <logisticsinfo :order="orderData" />
                <empty v-if="planRecord.length == 0" />
            </card>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import card from '../card.vue';
import logisticsinfo from './logisticsinfo.vue';
import { useRoute } from 'vue-router';
import { planStatusMap } from '@/constants/dailyShippingPlan';
import { deepClone } from '@/utils/comm';
import { getDailyShippingPlanDetailItemApi } from '@/api';
const detailData = ref<any>({});
const orderData = ref<any>({});
const currentColor = ref<any>({});
const descriptionsData = ref([
    {
        label: '货物名称',
        value: ' ',
    },
    {
        label: '运单日期',
        value: '',
    },
]);
const appPageRef = ref<any>(null);
const route = useRoute();

const planRecord = ref([]);
const loading = ref(false);
// 当前运单是否为汽运。
const isAutomobileOrder = computed(() => String(orderData.value?.shippingOrLand || '').toUpperCase() === 'AOTOMOBILE');
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
 * 获取发货订单明细，并根据 orderId 定位当前运单。
 * @returns 无返回值，结果写入运单基础信息和物流信息入参
 */
const getDetaily = async () => {
    try {
        loading.value = true;
        const res = await getDailyShippingPlanDetailItemApi(route.query.id);
        detailData.value = deepClone(res?.data || {});
        currentColor.value = planStatusMap[detailData.value?.status];
        const orderList = detailData.value.shipmentTransportationOrderDTOList || [];
        orderData.value = orderList.find((item: any) => String(item.id) === String(route.query.orderId)) || orderList[0] || {};
        descriptionsData.value[1].value = orderData.value?.transportationOrderDate || '--';
        descriptionsData.value[0].value = orderData.value?.goodsName || '--';
        loading.value = false;
        planRecord.value = orderList;
    } catch (error) {
        loading.value = false;
        console.error('Failed to obtain details:', error);
    }
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
        font-size: 16px;
        display: flex;
        padding: 14px 0px;
        border-bottom: 1px solid #ededed;
        &:last-child {
            border-bottom: none;
        }
        .label {
            color: #999999;
            width: 90px;
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
            margin-top: 8px;
        }
    }
}
</style>
