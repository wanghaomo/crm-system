<template>
    <WebPage contentPadding="0px" contentBg="none" :hideAddBtn="true" showBack>
        <template #content>
            <div class="head">
                <div class="title">
                    <span style="margin-right: 8px;font-weight: 500;">{{ detailData.code || '--' }}</span>
                    <StatusTag :text="currentColor.label" :color="currentColor.textColor" :bgColor="currentColor.backgroundColor" :borderColor="currentColor.borderColor" />

                </div>
                <div class="row">
                    <div class="item">
                        <div class="label">关联合同单号</div>
                        <div class="value">{{ detailData.contractCodeDisplay || '--' }}</div>
                    </div>
                </div>
            </div>
            <div class="main">
                <div class="content">
                    <div class="title">基础信息</div>
                    <div class="row">
                        <div class="item">
                            <div class="label">备注</div>
                            <div class="value">{{ detailData.remark || '--' }}</div>
                        </div>
                    </div>

                    <div class="title">发货订单明细</div>
                    <MxWebDataTable v-bind="tableConfig"> </MxWebDataTable>
                </div>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { h, ref } from 'vue';
import { deepClone } from '@/utils/comm';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { NSpace } from 'naive-ui';
import { useDictStore } from '@/store/commStore';
import { getDailyShippingPlanDetailApi } from '@/api';
import {
    DAILY_SHIPPING_PLAN_TYPE,
    planStatusMap,
} from '@/constants/dailyShippingPlan';
const route = useRoute();
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
/**
 * 渲染发货订单明细状态，样式与分页列表状态列保持一致。
 * @param row 发货订单明细行数据
 * @returns 状态圆点和状态文案
 */
const renderDetailStatus = (row: any) => {
    const color = planStatusMap[row.status]?.iconColor || 'var(--base-grey)';
    return h(
        NSpace,
        { align: 'center', size: 8 },
        {
            default: () => [
                h('div', {
                    style: {
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: color,
                    },
                }),
                h('span', null, formatDetailStatus(row.status)),
            ],
        }
    );
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
const preDeliveryQuantityColumn = {
    key: 'preDeliveryQuantity',
    title: '预发货数量',
    width: 140,
    render: (row: any) => formatPreDeliveryQuantity(row.preDeliveryQuantity),
};
// 发货订单明细表格配置。
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'deliveryOrderCode',
            title: '发货订单号',
            width: 140,
            render: (row: any) => row.deliveryOrderCode || '--',
        },
        {
            key: 'salesContractNumber',
            title: '关联销售合同编号',
            width: 140,
        },
        {
            key: 'priority',
            title: '优先级',
            width: 140,
            render: (row: any) => formatDict(DICT.PRIORITY, row.priority),
        },
        {
            key: 'status',
            title: '状态',
            width: 120,
            render: (row: any) => renderDetailStatus(row),
        },
        {
            key: 'supplierUnit',
            title: '供方单位',
            width: 140,
            render: (row: any) => formatDict(DICT.SUPPLIER_UNIT, row.supplierUnit),
        },
        {
            key: 'companyname',
            title: '企业名称',
            width: 140,
        },
        {
            key: 'subsidiaryName',
            title: '子公司贸易商',
            width: 160,
            render: (row: any) => row.subsidiaryName || '--',
        },
        {
            key: 'contactInformation',
            title: '联系方式',
            width: 140,
            render: (row: any) => row.contactInformation || row.phone || '--',
        },
        {
            key: 'oreGgrade',
            title: '矿石品位（%）',
            width: 140,
        },
        {
            key: 'oreType',
            title: '矿石种类',
            width: 140,
            render: (row: any) => formatDict(DICT.ORE_TYPE, row.oreType),
        },
        {
            key: 'contractQuantity',
            title: '合同数量（吨）',
            width: 140,
        },
        {
            key: 'shippedQuantity',
            title: '已发货量（吨）',
            width: 140,
            render: (row: any) => formatQuantity(row.actualQuantity),
        },
        {
            key: 'unshippedQuantity',
            title: '未发货量（吨）',
            width: 140,
            render: (row: any) => formatQuantity(row.unshippedNum),
        },
        {
            key: 'shipmentThreshold',
            title: '发货阈值（%）',
            width: 140,
            render: (row: any) => formatQuantity(row.shipmentThreshold),
        },
        {
            key: 'deliveryLocationName',
            title: '交货地点',
            width: 140,
        },
        {
            key: 'modeTransportation',
            title: '运输方式',
            width: 140,
            render: (row: any) => formatDict(DICT.TRANSPORT_MODE, row.modeTransportation),
        },
        {
            key: 'deliveryMethods',
            title: '交割方式',
            width: 140,
            render: (row: any) => formatDeliveryMethods(row.deliveryMethods),
        },
        {
            key: 'deliveryDeadline',
            title: '交货期限',
            width: 140,
        },
        {
            key: 'remark',
            title: '计划备注',
            width: 140,
            render: (row: any) => row.remark || '--'
        },
    ],
    // 表格数据
    tableList: [],
    singleLine: false,
    isShowPagination: false,
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
    },
    bordered: true,
    bottomBordered: true,
    flexHeight: false,
});

/**
 * 根据发货类型同步详情表格的预发货数量列。
 * @param planType 发货类型
 * @returns 无返回值
 */
const syncPreDeliveryQuantityColumn = (planType: string) => {
    const columns = tableConfig.value.columns.filter((column: any) => column.key !== 'preDeliveryQuantity');
    if (planType === DAILY_SHIPPING_PLAN_TYPE.CONTRACT) {
        const contractQuantityIndex = columns.findIndex((column: any) => column.key === 'contractQuantity');
        columns.splice(contractQuantityIndex + 1, 0, preDeliveryQuantityColumn);
    }
    tableConfig.value.columns = columns;
};

/**
 * 获取发运计划详情。
 * @returns 无返回值，结果写入主表详情和明细表格
 */
const getDetaily = async () => {
    try {
        const res = await getDailyShippingPlanDetailApi(route.query.id);
        detailData.value = deepClone(res?.data || {});
        currentColor.value = planStatusMap[detailData.value?.status];
        const detailList = res.data?.details || [];
        tableConfig.value.tableList = detailList;
        syncPreDeliveryQuantityColumn(detailData.value?.planType || detailList[0]?.planType);
    } catch (error) {
        console.error('Failed to obtain details:', error);
    }
};
getDetaily();
</script>

<style scoped lang="less">
:deep(.component_page_content) {
    padding: 0 !important;
}

:deep(.component_page_content_box) {
    display: flex;
    flex-direction: column;
}

.head {
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px 8px 8px 8px;
    padding: 12px 16px;
    box-sizing: border-box;
    width: calc(100% - 32px);
    margin: 16px 16px 0px;

    .title {
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
    // height: 85%;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px 8px 8px 8px;
    padding: 12px 16px 16px;
    box-sizing: border-box;
    width: calc(100% - 32px);
    margin: 16px;


    .content {
        box-sizing: border-box;

        .title {
            font-weight: 600;
            font-size: 16px;
            color: #333333;
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
            margin-bottom: 16px;

            .item {
                display: flex;
                width: 100%;
                margin-top: 16px;

                .label {
                    font-size: 14px;
                    color: #999999;
                    margin-right: 12px;
                    text-align: right;
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
</style>
