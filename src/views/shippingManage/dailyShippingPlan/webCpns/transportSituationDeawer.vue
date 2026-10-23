<template>
    <MxDrawer v-model:show="detailPopShow" title="运输情况" size="large" :closablePop="false">
        <div class="detail-content">
            <!-- 顶部信息 -->
            <div class="detail-header">
                <div class="detail-header-top">
                    <span class="detail-title">{{ basicInfoData.deliveryOrderCode || '--' }}</span>
                </div>
                <div class="detail-header-info">
                    <div class="info-item">
                        <span class="info-label">关联销售合同编号</span>
                        <span class="info-value">{{ basicInfoData.salesContractCode || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">运输方式</span>
                        <span class="info-value">{{ formatDict(DICT.TRANSPORT_MODE, basicInfoData.transportation) }}</span>
                    </div>
                </div>
            </div>
            <div class="tabs-header">
                <n-tabs
                    v-model:value="activeTab"
                    type="line"
                    animated
                    :bar-width="36"
                    :tab-style="{ color: '#666666', fontSize: '16px' }">
                    <n-tab-pane name="baseInfo" tab="基础信息" />
                    <n-tab-pane name="transportDetail" tab="运输明细" />
                </n-tabs>
            </div>
            <div v-show="activeTab === 'baseInfo'" class="basic-info-content">
                <div class="section-title">
                    <span class="section-bar"></span>
                    <span>基础信息</span>
                </div>
                <div class="basic-info-grid">
                    <div class="basic-info-item">
                        <span class="basic-label">发货订单号</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.deliveryOrderCode) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">关联销售合同编号</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.salesContractCode) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">优先级</span>
                        <span class="basic-value">{{ formatDict(DICT.PRIORITY, basicInfoData.priority) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">状态</span>
                        <span class="basic-value">{{ formatDetailStatus(basicInfoData.status) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">供货单位</span>
                        <span class="basic-value">{{ formatDict(DICT.SUPPLIER_UNIT, basicInfoData.supplierUnit) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">客户名称</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.customerName) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">子公司贸易商</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.subsidiaryName) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">联系方式</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.contactInformation) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">矿石品位（%）</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.grade) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">矿石种类</span>
                        <span class="basic-value">{{ formatDict(DICT.MINERAL_TYPE, basicInfoData.mineralType) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">合同数量（吨）</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.contractNum) }}</span>
                    </div>
                    <div v-if="basicInfoData.planType === 'CONTRACT'" class="basic-info-item">
                        <span class="basic-label">预发货数量</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.preDeliveryQuantity) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">已发货量（吨）</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.actualQuantity) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">未发货量（吨）</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.unshippedNum) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">发货阈值（%）</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.shipmentThreshold) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">交货地点</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.deliveryLocationName) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">运输方式</span>
                        <span class="basic-value">{{ formatDict(DICT.TRANSPORT_MODE, basicInfoData.transportation) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">交割方式</span>
                        <span class="basic-value">{{ formatDeliveryMethods(basicInfoData.deliveryMethod) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">交货期限</span>
                        <span class="basic-value">{{ formatDeliveryDeadline(basicInfoData.startDate, basicInfoData.endDate) }}</span>
                    </div>
                    <div class="basic-info-item full-width">
                        <span class="basic-label">计划备注</span>
                        <span class="basic-value">{{ formatValue(basicInfoData.remark) }}</span>
                    </div>
                </div>
            </div>
            <div v-show="activeTab === 'transportDetail'" class="detail-main">
                <div class="left-list">
                    <template v-for="item in transportationList" :key="item.id">
                        <div :class="{ item: true, active: activeItemId == item.id }" @click="activeItemId = item.id">
                            <div class="head">
                                <div class="title">{{ item.logisticsOrderCode || '--' }}</div>
                                <div class="status">{{ formatOrderStatus(item) }}</div>
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
                            <div class="row">
                                <div class="label">收货地</div>
                                <div class="value">{{ item.receivingPlace || '--' }}</div>
                            </div>
                        </div>
                    </template>
                    <div class="empty-text" v-if="transportationList.length === 0">暂无运输订单</div>
                </div>
                <div class="right-content">
                    <div class="title">基础信息</div>
                    <div class="row">
                        <div class="item">
                            <div class="label">货物名称</div>
                            <div class="value">{{ activeOrder.goodsName || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">起运量(吨)</div>
                            <div class="value">{{ formatValue(activeOrder.shipmentQuantity) }}</div>
                        </div>
                        <div class="item">
                            <div class="label">在途量(吨)</div>
                            <div class="value">{{ formatValue(activeOrder.transitQuantity) }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">交割量(吨)</div>
                            <div class="value">{{ formatValue(activeOrder.deliveryQuantity) }}</div>
                        </div>
                        <div v-if="!isActiveAutomobile" class="item">
                            <div class="label">运单号</div>
                            <div class="value">{{ activeOrder.transportationOrderCode || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">运单日期</div>
                            <div class="value">{{ activeOrder.transportationOrderDate || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label">承运商</div>
                            <div class="value">{{ activeOrder.carrier || '--' }}</div>
                        </div>
                        <div v-if="!isActiveAutomobile" class="item">
                            <div class="label rightLabel">船长姓名</div>
                            <div class="value">{{ activeOrder.shipCaptain || '--' }}</div>
                        </div>
                        <div v-if="!isActiveAutomobile" class="item">
                            <div class="label">船舶号</div>
                            <div class="value">{{ activeOrder.shipNumber || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">当前状态</div>
                            <div class="value">{{ formatOrderStatus(activeOrder) }}</div>
                        </div>
                        <div class="item">
                            <div class="label">始发地</div>
                            <div class="value">{{ activeOrder.placeOfOrigin || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">发货人</div>
                            <div class="value">{{ activeOrder.shipperName || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label">发货人电话</div>
                            <div class="value">{{ activeOrder.shipperTel || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">收货地</div>
                            <div class="value">{{ activeOrder.receivingPlace || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label">收货人姓名</div>
                            <div class="value">{{ activeOrder.receivingPerson || '--' }}</div>
                        </div>
                        <div class="item">
                            <div class="label rightLabel">收货人电话</div>
                            <div class="value">{{ activeOrder.receivingPersonTel || '--' }}</div>
                        </div>
                    </div>
                    <div class="title" style="margin-top: 16px">物流信息</div>
                    <logisticsinfo :order="activeOrder" />
                </div>
            </div>
        </div>
    </MxDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NTabPane, NTabs } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { getDailyShippingPlanDetailItemApi } from '@/api';
import { planStatusMap } from '@/constants/dailyShippingPlan';
import { useDictStore } from '@/store/commStore';
import logisticsinfo from './logisticsinfo.vue';

const { dictMap } = storeToRefs(useDictStore());
const basicInfoData = ref<any>({});
const detailPopShow = ref(false);
const transportationList = ref<any[]>([]);
const activeItemId = ref<any>('');
const activeTab = ref('baseInfo');
const DICT = {
    TRANSPORT_MODE: '运输方式',
    DELIVERY_METHOD: '交割方式',
    MINERAL_TYPE: '矿种',
    PRIORITY: '优先级',
    SUPPLIER_UNIT: '供方单位',
};
// 当前选中的运输订单，右侧基础信息和物流信息都从这里取值。
const activeOrder = computed(() => transportationList.value.find((item) => item.id === activeItemId.value) || {});
// 当前选中运输订单是否为汽运。
const isActiveAutomobile = computed(() => String(activeOrder.value.shippingOrLand || '').toUpperCase() === 'AOTOMOBILE');
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
    if (value === null || value === undefined || value === '') return '--';
    const option = getDictOptions(dictName).find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
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
    if (value === null || value === undefined || value === '') return '--';
    return planStatusMap[value]?.label || value;
};
/**
 * 将分页返回的交割方式转换为字典文案。
 * @param value 逗号分隔的交割方式或交割方式数组
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
 * 格式化分页返回的交货期限。
 * @param startDate 交货期限开始日期
 * @param endDate 交货期限结束日期
 * @returns 使用“至”连接的交货期限
 */
const formatDeliveryDeadline = (startDate: any, endDate: any) => {
    return [startDate, endDate].filter(hasValue).join('至') || '--';
};
/**
 * 判断字段是否有可展示值。
 * @param value 待判断值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== undefined && value !== null && value !== '';
/**
 * 格式化普通字段值。
 * @param value 待展示值
 * @returns 空值返回占位文案
 */
const formatValue = (value: any) => (hasValue(value) ? value : '--');
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
 * 打开运输情况抽屉，并初始化左侧运输订单列表。
 * @param data 发货订单明细数据
 * @returns 无返回值
 */
const showDrawer = async (data?: any) => {
    detailPopShow.value = true;
    basicInfoData.value = {};
    transportationList.value = [];
    activeItemId.value = '';
    activeTab.value = 'baseInfo';

    try {
        if (data?.id === undefined || data?.id === null || data?.id === '') return;

        const res = await getDailyShippingPlanDetailItemApi(data.id);
        if (res?.code !== 200) return;

        basicInfoData.value = res.data || {};
        transportationList.value = basicInfoData.value.shipmentTransportationOrderDTOList || [];
        activeItemId.value = transportationList.value[0]?.id || '';
    } catch (error) {
        console.error('Failed to obtain shipping detail item:', error);
    }
};
defineExpose({
    showDrawer,
});
</script>

<style scoped lang="less">
.drawer-footer {
    display: flex;
    justify-content: center !important;
    gap: 12px;
    width: 100%;
}

/* 详情样式 */
.detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-header {
        padding: 16px 24px;
        flex-shrink: 0;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;

            .detail-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
        }

        .detail-header-info {
            display: flex;
            gap: 88px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;

                .info-label {
                    color: #999;
                    font-size: 14px;
                }

                .info-value {
                    color: #333;
                    font-size: 14px;
                    font-weight: 400;
                }
            }
        }
    }

    .tabs-header {
        padding: 0 24px;
        border-top: var(--n-header-border-bottom);
        border-bottom: var(--n-header-border-bottom);
        flex-shrink: 0;

        :deep(.n-tabs-pane-wrapper) {
            display: none;
        }

        :deep(.n-tabs-nav) {
            margin-bottom: 0;
        }
    }

    .basic-info-content {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 24px;
    }

    .detail-main {
        flex: 1;
        display: flex;
        overflow: hidden;

        .left-list {
            width: 310px;
            height: 100%;
            overflow: auto;
            border-right: var(--n-header-border-bottom);
            padding: 24px 24px;

            .item {
                border-radius: 8px 8px 8px 8px;
                border: 1px solid #eceef4;
                padding: 12px;
                margin-bottom: 12px;
                cursor: pointer;

                &.active {
                    border: 1px solid #2c65f2;
                }

                .head {
                    display: flex;
                    justify-content: space-between;

                    .title {
                        font-weight: 600;
                        font-size: 14px;
                        color: #333333;
                    }

                    .status {
                        font-size: 12px;
                        color: #3370eb;
                        background: #eff4ff;
                        border-radius: 2px 2px 2px 2px;
                        border: 1px solid #d9e3f5;
                        padding: 2px 4px;
                    }
                }

                .row {
                    display: flex;
                    font-size: 12px;
                    margin-top: 8px;

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

                        .label {
                            margin-right: 8px;
                        }
                    }
                }
            }

            .empty-text {
                color: #999999;
                font-size: 14px;
                text-align: center;
                padding: 24px 0;
            }
        }

        .right-content {
            flex: 1;
            overflow: auto;
            padding: 24px;

            .title {
                font-size: 16px;
                color: #333333;
                font-weight: 600;
                position: relative;
                padding-left: 12px;
                display: flex;
                justify-content: space-between;

                &::before {
                    content: '';
                    position: absolute;
                    width: 4px;
                    height: 16px;
                    background: #2c65f2;
                    border-radius: 2px 2px 2px 2px;
                    left: 0px;
                    top: 50%;
                    transform: translateY(-50%);
                }
            }

            .row {
                display: flex;
                flex-wrap: wrap;

                .item {
                    display: flex;
                    width: 50%;
                    margin-top: 12px;

                    .label {
                        width: 56px;
                        font-size: 14px;
                        color: #999999;
                        margin-right: 12px;
                        text-align: right;
                    }

                    .rightLabel {
                        width: 80px;
                    }

                    .value {
                        font-size: 14px;
                        color: #333333;
                    }

                    .blue {
                        color: #2c65f2;
                    }
                }
            }
        }
    }
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    margin-top: 0;

    &:first-child {
        margin-top: 0;
    }

    .section-bar {
        display: inline-block;
        width: 4px;
        height: 16px;
        background-color: #2c65f2;
        border-radius: 2px;
    }
}

.basic-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 40px;

    .basic-info-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        min-width: 0;

        &.full-width {
            grid-column: 1 / -1;
        }

        .basic-label {
            color: #999;
            font-size: 14px;
            flex: 0 0 120px;
            text-align: right;
        }

        .basic-value {
            color: #333;
            font-size: 14px;
            min-width: 0;
            line-height: 22px;
            word-break: break-word;
        }
    }
}
</style>
