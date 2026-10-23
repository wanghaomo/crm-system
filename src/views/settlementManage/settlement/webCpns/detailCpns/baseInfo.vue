<template>
    <div>
        <div class="title" style="margin-top: 11px">基础信息</div>
        <div class="row">
            <div class="item">
                <div class="label">销售合同编号</div>
                <div class="value">{{ getCellText(detailData.contractCode) }}</div>
            </div>
            <div class="item">
                <div class="label">回款到期时间</div>
                <div class="value">{{ getCellText(detailData.expirationTime) }}</div>
            </div>
            <div class="item">
                <div class="label">企业名称</div>
                <div class="value">{{ getCellText(detailData.customerName) }}</div>
            </div>
            <div class="item">
                <div class="label">客户类型</div>
                <div class="value">{{ getCustomerTypeLabel(detailData.customerType) }}</div>
            </div>
            <div class="item">
                <div class="label">我方经办人</div>
                <div class="value">{{ handlerName }}</div>
            </div>
            <div class="item">
                <div class="label">客户经办人</div>
                <div class="value">{{ getCellText(detailData.handlerName) }}</div>
            </div>
            <div class="item">
                <div class="label">结算总价(元)</div>
                <div class="value">{{ getCellText(detailData.totalTaxAmount) }}</div>
            </div>
            <div class="item">
                <div class="label">结算总量(吨)</div>
                <div class="value">{{ getCellText(detailData.settlementTotal) }}</div>
            </div>
        </div>
        <div class="title" style="margin-top: 16px">结算明细表</div>
        <div class="web-data-table settlement-detail-table">
            <div class="web-n-data-table-con">
                <n-data-table
                    class="web-n-data-table"
                    :columns="settlementDetailColumns"
                    :data="settlementDetailList"
                    :row-key="getRowKey"
                    :pagination="false"
                    :bordered="true"
                    :bottom-bordered="true"
                    :single-line="false"
                    :scroll-x="tableScrollX"
                    :max-height="500"
                    striped />
            </div>
        </div>
        <div class="row">
            <div class="item" style="width: 100%">
                <div class="label">合同结算条款</div>
                <div class="value">{{ getCellText(detailData.terms) }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NDataTable } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';

const props = defineProps({
    detailData: {
        type: Object,
        default: () => ({}),
    },
});

const { dictMap } = storeToRefs(useDictStore());
const EMPTY_TEXT = '--';
const ORE_TYPE_DICT = '矿石种类';
const CUSTOMER_TYPE_TRADER = 'TRADER';
const customerTypeOptions = [
    { label: '化工企业', value: 'CHEMICAL' },
    { label: '贸易商', value: CUSTOMER_TYPE_TRADER },
];
const contentFieldMap = {
    content: ['content', 'value', '含量'],
    weightedAverage: ['weightedAverage', 'weightedAvg', 'weighted', 'average', '加权平均'],
    priceIncrease: ['priceIncrease', 'increasePrice', 'priceFloat', '增价', '增减价'],
};

/**
 * 获取单元格展示值，空值统一显示占位符。
 * @param value 原始字段值
 * @returns 展示文案
 */
const getCellText = (value: any) => {
    return value === null || value === undefined || value === '' ? EMPTY_TEXT : value;
};

/**
 * 判断字段是否为有效值，数字 0 视为有效。
 * @param value 待判断字段值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== null && value !== undefined && value !== '';

/**
 * 按两位小数格式化数字，非法值返回空。
 * @param value 原始数字
 * @returns 两位小数数字
 */
const getFixedNumber = (value: any) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return null;
    return Number(numberValue.toFixed(2));
};

/**
 * 从人员对象数组中提取我方经办人名称。
 * @param handler 经办人对象数组
 * @returns 我方经办人名称
 */
const getHandlerName = (handler: any) => {
    const firstHandler = Array.isArray(handler) ? handler[0] : handler;
    return getCellText(firstHandler?.label || firstHandler?.username || firstHandler?.name);
};
const handlerName = computed(() => getHandlerName(props.detailData.handler));

/**
 * 按新增编辑页客户类型选项回显文案，未匹配时展示接口原值。
 * @param value 当前客户类型
 * @returns 客户类型展示文案
 */
const getCustomerTypeLabel = (value: any) => {
    if (value === null || value === undefined || value === '') return EMPTY_TEXT;
    const option = customerTypeOptions.find((item) => String(item.value).toUpperCase() === String(value).toUpperCase());
    return option?.label || value;
};

/**
 * 按字典回显字段。
 * @param dictName 字典名称
 * @param value 字典值
 * @returns 字典 label
 */
const formatDict = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return EMPTY_TEXT;
    const options = dictMap.value?.[dictName] || dictMap.value?.['矿种'] || [];
    const option = options.find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};

/**
 * 解析对象或 JSON 字符串。
 * @param value 原始对象或 JSON 字符串
 * @returns 解析后的对象
 */
const parseObjectValue = (value: any) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error('解析结算明细成分对象失败:', error);
        return {};
    }
};

/**
 * 获取成分二级表头字段值，兼容接口对象里的英文 key 和中文 key。
 * @param row 当前结算明细行
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @param fieldKeys 可匹配的字段 key 列表
 * @returns 成分字段值
 */
const getContentValue = (row: any, objectKey: string, jsonKey: string, fieldKeys: string[]) => {
    const objectValue = row[objectKey] || parseObjectValue(row[jsonKey]);
    const key = fieldKeys.find((item) => objectValue?.[item] !== undefined && objectValue?.[item] !== null);
    return key ? objectValue[key] : '';
};

/**
 * 创建详情页成分二级表头列。
 * @param title 表头标题
 * @param key 表头 key
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @returns 成分二级表头列配置
 */
const createContentColumn = (title: string, key: string, objectKey: string, jsonKey: string) => ({
    title,
    key,
    width: 310,
    children: [
        {
            title: '含量',
            key: `${key}Content`,
            width: 100,
            render: (row: any) => getCellText(getContentValue(row, objectKey, jsonKey, contentFieldMap.content)),
        },
        {
            title: '加权平均',
            key: `${key}WeightedAverage`,
            width: 110,
            render: (row: any) => getCellText(getContentValue(row, objectKey, jsonKey, contentFieldMap.weightedAverage)),
        },
        {
            title: '增减价',
            key: `${key}PriceIncrease`,
            width: 100,
            render: (row: any) => getCellText(getContentValue(row, objectKey, jsonKey, contentFieldMap.priceIncrease)),
        },
    ],
});

/**
 * 创建空值展示为占位符的详情列。
 * @param key 字段 key
 * @param title 表头标题
 * @param width 列宽
 * @returns 详情列配置
 */
const createTextColumn = (key: string, title: string, width: number) => ({
    key,
    title,
    width,
    render: (row: any) => getCellText(row[key]),
});

const settlementDetailList = computed(() => props.detailData.financeSettlementDetailDTOList || []);
const isTraderCustomer = computed(() => String(props.detailData.customerType || '').toUpperCase() === CUSTOMER_TYPE_TRADER);

/**
 * 获取表格行唯一标识。
 * @param row 当前结算明细行
 * @returns 表格行 key
 */
const getRowKey = (row: any) => row.id || `${row.transportOrderCode || ''}-${row.orderNum || ''}`;

const indexColumn = {
    title: '序号',
    key: 'index',
    width: 60,
    fixed: 'left',
    render: (_row: any, index: number) => index + 1,
};

const leadingColumns = [
    { ...createTextColumn('transportOrderCode', '运输订单编号', 140), fixed: 'left' },
    createTextColumn('acceptanceTime', '验收时间', 150),
    createTextColumn('deliveryLocationName', '交货地点', 180),
    createTextColumn('businessPersonName', '业务人员', 180),
    createTextColumn('inspectorName', '验货人员', 120),
    {
        key: 'oreType',
        title: '矿石种类',
        width: 120,
        render: (row: any) => formatDict(ORE_TYPE_DICT, row.oreType),
    },
    createTextColumn('contractOreGrade', '合同约定品位', 120),
    createTextColumn('settleOreGrade', '结算品位', 120),
];

const quantityColumns = [
    createTextColumn('dispatchWeight', '发货量（吨）', 130),
    createTextColumn('actualReceiptWeight', '实收量（吨）', 130),
    createTextColumn('settleWeight', '结算量（吨）', 130),
    createTextColumn('contractUnitPrice', '合同单价（元/吨）', 130),
];

const suffixColumns = [
    createTextColumn('taxIncludedPrice', '结算单价（元/吨）', 150),
    { key: 'taxIncludedAmount', title: '分项金额（元）', width: 130},
    { key: 'remark', title: '备注', width: 160, render: (row: any) => getCellText(row.remark) },
];

/**
 * 根据客户类型生成详情页结算明细列，避免贸易商展示化工企业专属字段。
 * @returns 当前客户类型对应的详情表格列
 */
const getSettlementDetailColumns = () => {
    const moistureColumns = [
        createTextColumn('moisture', '水分（%）', 100),
        createTextColumn('exceedMoisture', '超出水分吨位（吨）', 140),
    ];
    const traderMoistureColumns = [
        createTextColumn('moisture', '水分（%）', 100),
        createTextColumn('exceedMoisture', '超出水分吨数', 140),
    ];

    if (isTraderCustomer.value) {
        return [
            ...leadingColumns,
            ...traderMoistureColumns,
            ...quantityColumns,
            createTextColumn('gradeFloat', '品位增减价（元）', 170),
            ...suffixColumns,
        ];
    }

    return [
        ...leadingColumns,
        createTextColumn('priceIncrease', '增减价', 100),
        createContentColumn('氧化镁含量≥4.5%', 'contentMgoGroup', 'contentMgoObject', 'contentMgo'),
        createContentColumn('氧化铁含量（≤0.8%）', 'contentFeoGroup', 'contentFeoObject', 'contentFeo'),
        createContentColumn('氧化铝含量（≤1%）', 'contentAloGroup', 'contentAloObject', 'contentAlo'),
        ...moistureColumns,
        createTextColumn('granularity', '粒度≤30mm过筛率%', 150),
        ...quantityColumns,
        ...suffixColumns,
    ];
};

const settlementDetailColumns = computed(() => [indexColumn, ...getSettlementDetailColumns()]);

/**
 * 递归计算二级表头叶子列总宽度，保证详情表横向滚动在表格内部出现。
 * @param columnList 表格列配置
 * @returns 横向滚动宽度
 */
const getColumnsWidth = (columnList: any[]) => {
    return columnList.reduce((total, column) => {
        if (column.children?.length) {
            return total + getColumnsWidth(column.children);
        }
        return total + Number(column.width || 0);
    }, 0);
};

const tableScrollX = computed(() => getColumnsWidth(settlementDetailColumns.value));
</script>

<style scoped lang="less">
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
        margin-top: 16px;

        .label {
            width: 120px;
            font-size: 14px;
            color: #999999;
            margin-right: 12px;
            text-align: right;
        }

        .value {
            font-size: 14px;
            color: #333333;
            flex: 1;
            word-break: break-all;
        }
    }
}

.web-data-table {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.web-n-data-table-con {
    width: 100%;
    min-width: 0;
    background-color: #fff;
    border-radius: 8px;
}

.web-n-data-table {
    width: 100%;
    min-width: 0;
    margin-bottom: calc(var(--base-width) / 2);
}

.settlement-detail-table {
    max-height: 500px;
    margin-top: 16px;
    margin-bottom: 16px;
}
</style>
