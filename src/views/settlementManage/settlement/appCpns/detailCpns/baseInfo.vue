<template>
    <card title="基础信息">
        <div class="row">
            <div class="item" style="padding-top: 2px;">
                <div class="label">销售合同编号</div>
                <div class="value">{{ getCellText(detailData.contractCode) }}</div>
            </div>
            <div class="item">
                <div class="label">回款到期时间</div>
                <div class="value">{{ getCellText(detailData.expirationTime) }}</div>
            </div>
            <div class="item">
                <div class="label">客户类型</div>
                <div class="value">{{ getCustomerTypeLabel(detailData.customerType) }}</div>
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
            <div class="item wrap">
                <div class="label">合同结算条款</div>
                <div class="value">{{ getCellText(detailData.terms) }}</div>
            </div>
        </div>
    </card>
    <card title="结算明细表">
        <template v-for="(item, index) in settlementRecord" :key="item.id || index">
            <dataItem
                title="结算明细"
                :index="getSettlementRecordIndex(index)"
                :item="item"
                :smallTitle="`分项金额 ${getCellText(getTaxIncludedAmount(item), 0)}元`"
                :descriptions="getSettlementRecordDescriptions(item)" />
            <div style="height: 12px"></div>
        </template>
        <empty v-if="settlementRecord.length == 0" />
    </card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import card from '../card.vue';
import dataItem from '../data-item.vue';
import { useDictStore } from '@/store/commStore';

const props = defineProps({
    detailData: {
        type: Object,
        default: () => ({}),
    },
});

const { dictMap } = storeToRefs(useDictStore());
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
 * 获取字段展示值，空值统一展示占位符。
 * @param value 原始字段值
 * @param placeholder 占位值
 * @returns 展示文案
 */
const getCellText = (value: any, placeholder: any = '--') => {
    return value === null || value === undefined || value === '' ? placeholder : value;
};

/**
 * 按新增编辑页客户类型选项回显文案，未匹配时展示接口原值。
 * @param value 当前客户类型
 * @returns 客户类型展示文案
 */
const getCustomerTypeLabel = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
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
    if (value === null || value === undefined || value === '') return '--';
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

const settlementRecord = computed(() => props.detailData.financeSettlementDetailDTOList || []);
const isTraderCustomer = computed(() => String(props.detailData.customerType || '').toUpperCase() === CUSTOMER_TYPE_TRADER);

/**
 * 将结算明细遍历下标转换为 dataItem 所需的从 1 开始的序号。
 * @param index 结算明细遍历下标
 * @returns 展示序号
 */
const getSettlementRecordIndex = (index: string | number) => Number(index) + 1;

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
 * 按结算单价和结算量计算分项金额。
 * @param row 当前结算明细行
 * @returns 分项金额
 */
const getTaxIncludedAmount = (row: any) => {
    
    return row.taxIncludedAmount
};

/**
 * 生成 App 结算明细描述项，并统一处理空值占位。
 * @param label 描述标签
 * @param value 原始值
 * @returns 描述项
 */
const createDescription = (label: string, value: any) => ({
    label,
    value: getCellText(value),
});

/**
 * 获取成分字段值，详情页按新增编辑页二级表头粒度拆分展示。
 * @param row 当前结算明细
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
 * 生成成分字段描述项，与新增编辑页的二级表头字段保持一致。
 * @param title 成分字段标题
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @param item 当前结算明细
 * @returns 成分字段描述项
 */
const createContentDescriptions = (title: string, objectKey: string, jsonKey: string, item: any) => [
    createDescription(`${title}含量`, getContentValue(item, objectKey, jsonKey, contentFieldMap.content)),
    createDescription(`${title}加权平均`, getContentValue(item, objectKey, jsonKey, contentFieldMap.weightedAverage)),
        createDescription(`${title}增减价`, getContentValue(item, objectKey, jsonKey, contentFieldMap.priceIncrease)),
];

/**
 * 获取 App 结算明细卡片描述数据。
 * @param item 当前结算明细
 * @returns 描述项
 */
const getSettlementRecordDescriptions = (item: any) => {
    const leadingDescriptions = [
        createDescription('运输订单编号', item.transportOrderCode),
        createDescription('验收时间', item.acceptanceTime),
        createDescription('交货地点', item.deliveryLocationName),
        createDescription('业务人员', item.businessPersonName),
        createDescription('验货人员', item.inspectorName),
        createDescription('矿石种类', formatDict(ORE_TYPE_DICT, item.oreType)),
        createDescription('合同约定品位', item.contractOreGrade),
        createDescription('结算品位', item.settleOreGrade),
    ];
    const quantityDescriptions = [
        createDescription('发货量（吨）', item.dispatchWeight),
        createDescription('实收量（吨）', item.actualReceiptWeight),
        createDescription('结算量（吨）', item.settleWeight),
        createDescription('合同单价（元/吨）', item.contractUnitPrice),
    ];
    const suffixDescriptions = [
        createDescription('结算单价（元/吨）', item.taxIncludedPrice),
        createDescription('分项金额（元）', getTaxIncludedAmount(item)),
        createDescription('备注', item.remark),
    ];

    if (isTraderCustomer.value) {
        return [
            ...leadingDescriptions,
            createDescription('水分（%）', item.moisture),
            createDescription('超出水分吨数', item.exceedMoisture),
            ...quantityDescriptions,
        createDescription('品位增减价（元）', item.gradeFloat),
            ...suffixDescriptions,
        ];
    }

    return [
        ...leadingDescriptions,
        createDescription('增减价', item.priceIncrease),
        ...createContentDescriptions('氧化镁含量≥4.5%', 'contentMgoObject', 'contentMgo', item),
        ...createContentDescriptions('氧化铁含量（≤0.8%）', 'contentFeoObject', 'contentFeo', item),
        ...createContentDescriptions('氧化铝含量（≤1%）', 'contentAloObject', 'contentAlo', item),
        createDescription('水分（%）', item.moisture),
        createDescription('超出水分吨位（吨）', item.exceedMoisture),
        createDescription('粒度≤30mm过筛率%', item.granularity),
        ...quantityDescriptions,
        ...suffixDescriptions,
    ];
};
</script>

<style scoped lang="less">
.row {
    .item {
        display: flex;
        padding: 14px 0px;
        border-bottom: 1px solid #ededed;
        &:last-child {
            border-bottom: none;
        }
        .label {
            font-size: 16px;
            color: #999999;
            width: 110px;
        }
        .value {
            font-size: 16px;
            color: #333333;
            margin-left: 8px;
            flex: 1;
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
            margin-left: 0;
        }
    }
}
</style>
