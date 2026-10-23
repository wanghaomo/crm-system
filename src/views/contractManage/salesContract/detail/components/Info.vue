<template>
    <div class="info">
        <DetailsTitle title="基础信息" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
        <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
            <n-descriptions-item label="关联定价单编号">
                <button v-if="detail.pricingCode" type="button" class="link-value" @click="emit('openPricingDetail')">
                    {{ detail.pricingCode }}
                </button>
                <span v-else>--</span>
            </n-descriptions-item>
            <n-descriptions-item label="子公司贸易商">
                {{ detail.subsidiaryName || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="关联框架合同编号">
                <button v-if="detail.frameworkCode" type="button" class="link-value" @click="emit('openFrameworkDetail')">
                    {{ detail.frameworkCode }}
                </button>
                <span v-else>--</span>
            </n-descriptions-item>
            <n-descriptions-item label="关联月发货计划编号">
                <button v-if="detail.monthlyPlanCode" type="button" class="link-value" @click="emit('openMonthlyPlanDetail')">
                    {{ detail.monthlyPlanCode }}
                </button>
                <span v-else>--</span>
            </n-descriptions-item>
            <n-descriptions-item label="结算方式">
                {{ formatDict(DICT.PAYMENT_METHOD, detail.paymentMethod) }}
            </n-descriptions-item>
            <n-descriptions-item label="付款条件" :span="2">
                {{ detail.paymentTerms || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="关联发货订单明细" :span="2">
                <span class="delivery-detail-codes">{{ formatDeliveryDetailCodes(detail.deliveryDetailCodes) }}</span>
            </n-descriptions-item>
        </n-descriptions>
        <DetailsTitle title="合同多品位明细" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
        <MxWebDataTable v-bind="tableConfig"> </MxWebDataTable>
    </div>
</template>

<script setup lang="ts">
import { useDictStore } from '@/store/commStore';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { SALES_CONTRACT_DICT, TABLE_ACTION_COLOR } from '../../commonTs/conmon';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

const emit = defineEmits(['openPricingDetail', 'openFrameworkDetail', 'openMonthlyPlanDetail']);
const DICT = SALES_CONTRACT_DICT;

const { dictMap } = storeToRefs(useDictStore());

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';
const text = (value: any) => (isEmptyValue(value) ? '--' : value);

const formatNumber = (value: any) => {
    if (isEmptyValue(value)) return '--';
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString('zh-CN') : value;
};

const formatDeliveryPeriod = (row: any) => {
    if (row.deliveryPeriod) return row.deliveryPeriod;
    if (!row.startDate && !row.endDate) return '--';
    return `${row.startDate || '--'}至${row.endDate || '--'}`;
};

const formatDict = (dictName: string, value: any) => {
    if (isEmptyValue(value)) return '--';
    const options = dictMap.value?.[dictName] || [];
    const matched = options.find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => !isEmptyValue(optionValue) && String(optionValue) === String(value)
        )
    );
    return matched?.label || matched?.name || value;
};

/**
 * 将逗号分隔的多选字典值逐项转换为字典文案。
 * @param dictName 字典名称
 * @param value 接口返回的逗号分隔值
 * @returns 使用顿号连接的字典文案
 */
const formatMultipleDict = (dictName: string, value: any) => {
    if (isEmptyValue(value)) return '--';
    const values = String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return values.map((item) => formatDict(dictName, item)).join('、') || '--';
};

/**
 * 直接回显关联发货订单编码。
 * @param value 关联发货订单编码值
 * @returns 使用顿号连接的发货订单编码文案
 */
const formatDeliveryDetailCodes = (value: any) => {
    if (isEmptyValue(value)) return '--';
    const values = Array.isArray(value)
        ? value
        : String(value)
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
    return values.map((item) => String(item).trim()).filter(Boolean).join('、') || '--';
};

const tableConfig = computed<any>(() => ({
    columns: [
        { key: 'oreType', title: '矿石种类', width: 160, render: (row: any) => formatDict(DICT.ORE_TYPE, row.oreType) },
        { key: 'oreGrade', title: '矿石品位(%)', width: 130, render: (row: any) => text(row.oreGrade) },
        { key: 'contractQuantity', title: '合同数量(吨)', width: 160, render: (row: any) => formatNumber(row.contractQuantity) },
        { key: 'taxIncludedPrice', title: '含税单价(元/吨)', width: 170, render: (row: any) => formatNumber(row.taxIncludedPrice) },
        { key: 'subItemAmount', title: '分项金额(万元)', width: 150, render: (row: any) => formatNumber(row.subItemAmount) },
        { key: 'deliveryLocationName', title: '交货地点', width: 180, render: (row: any) => text(row.deliveryLocationName) },
        {
            key: 'deliveryMethods',
            title: '交割方式',
            width: 220,
            render: (row: any) => formatMultipleDict(DICT.DELIVERY_METHOD, row.deliveryMethods),
        },
        { key: 'deliveryPeriod', title: '交货期限', width: 250, render: (row: any) => formatDeliveryPeriod(row) },
        {
            key: 'transportationMethods',
            title: '运输方式要求',
            width: 160,
            render: (row: any) => formatDict(DICT.TRANSPORT_MODE, row.transportationMethods),
        },
        {
            key: 'qualityRequirements',
            title: '质量要求与技术标准',
            width: 260,
            render: (row: any) => text(row.qualityRequirements),
        },
        { key: 'changeDescription', title: '变更说明', width: 220, render: (row: any) => text(row.changeDescription) },
    ],
    tableList: props.detail.contractPricingDetailGradeDTOS || [],
    isShowPagination: false,
    bordered: true,
    singleLine: false,
    flexHeight: false,
    styleOption: {
        padding: '0px',
    },
}));
</script>

<style lang="less" scoped>
.info {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 16px 16px;
}
.link-value {
    padding: 0;
    border: 0;
    background: transparent;
    font-weight: 400;
    font-size: 14px;
    color: v-bind('TABLE_ACTION_COLOR');
    cursor: pointer;
    line-height: 22px;
}
.link-value:hover {
    text-decoration: underline;
}
.mx_crm_descriptions_style {
    :deep(.n-descriptions-table-content__label) {
        display: inline-block;
        width: 130px !important;
        text-align: right;
        flex-shrink: 0;
        color: var(--base-grey);
        margin-right: 12px;
    }
}
.delivery-detail-codes {
    display: inline-block;
    word-break: break-all;
    white-space: normal;
}
</style>
