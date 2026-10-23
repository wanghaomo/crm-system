<template>
    <card title="开票信息">
        <div class="row">
            <div class="item" style="padding-top: 2px;">
                <div class="label">申请单位</div>
                <div class="value">{{ applyUnitLabel }}</div>
            </div>
            <div class="item">
                <div class="label">客户名称</div>
                <div class="value">{{ getCellText(invoiceMain.customerName) }}</div>
            </div>
            <div class="item">
                <div class="label">本次开票类型</div>
                <div class="value">{{ invoiceTypeLabel }}</div>
            </div>
            <div class="item wrap">
                <div class="label">开票信息</div>
                <div class="value">{{ getCellText(invoiceMain.invoiceInformation) }}</div>
            </div>
            <div class="item wrap">
                <div class="label">开票备注</div>
                <div class="value">{{ getCellText(invoiceMain.invoiceRemark) }}</div>
            </div>
        </div>
    </card>

    <card title="申请开票明细">
        <div class="mx_mes-wrapper-grey">
            <div class="row">
                <div class="label">申请开票明细汇总数量</div>
                <div class="value">{{ getCellText(invoiceMain.totalQuantity, 0) }}</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总单价(含税)</div>
                <div class="value">{{ getCellText(invoiceMain.totalUnitPrice, 0) }}元</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总税额</div>
                <div class="value">{{ getCellText(invoiceMain.totalTaxAmount, 0) }}元</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总金额(不含税)</div>
                <div class="value">{{ getCellText(invoiceMain.totalAmountExcludingTax, 0) }}元</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总金额(含税)</div>
                <div class="value">{{ getCellText(invoiceMain.totalAmount, 0) }}元</div>
            </div>
        </div>
        <template v-for="(item, index) in invoiceDetailList" :key="item.id || index">
            <dataItem
                title="序号"
                :index="index + 1"
                :item="item"
                :descriptions="getInvoiceDetailDescriptions(item)" />
            <div style="height: 12px"></div>
        </template>
        <empty v-if="invoiceDetailList.length == 0" />
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
const INVOICE_TYPE_DICT = '增值税开票类型';
const BUSINESS_TYPE_DICT = '业务类型';
const SUPPLIER_UNIT_DICT = '供方单位';

const invoiceMain = computed(() => props.detailData.financeInvoiceMainDTO || {});
const invoiceDetailList = computed(() => props.detailData.financeInvoiceDetailDTOList || []);

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
 * 将字典值转换为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或文案
 * @returns 字典展示文案
 */
const getDictLabel = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const options = dictMap.value?.[dictName] || [];
    const option = options.find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};

const invoiceTypeLabel = computed(() => getDictLabel(INVOICE_TYPE_DICT, invoiceMain.value.invoiceType));
const applyUnitLabel = computed(() => getDictLabel(SUPPLIER_UNIT_DICT, invoiceMain.value.applyUnit));

/**
 * 生成 App 开票明细描述项，并统一处理空值占位。
 * @param label 描述标签
 * @param value 原始值
 * @returns 描述项
 */
const createDescription = (label: string, value: any) => ({
    label,
    value: getCellText(value),
});

/**
 * 获取 App 开票明细卡片描述数据。
 * @param item 当前开票明细
 * @returns 描述项
 */
const getInvoiceDetailDescriptions = (item: any) => {
    return [
        createDescription('业务类型', getDictLabel(BUSINESS_TYPE_DICT, item.businessType)),
        createDescription('货物或应税劳务、服务名称', item.goodsName),
        createDescription('规格型号', item.specificationModel),
        createDescription('单位', item.unit),
        createDescription('数量', item.quantity),
        createDescription('单价（元、含税）', item.unitPrice),
        createDescription('金额（元、含税）', item.amount),
        createDescription('税率（%）', item.taxRate),
        createDescription('税额（元）', item.taxAmount),
        createDescription('金额（不含税）', item.amountExcludingTax),
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
            width: 100px;
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
.mx_mes-wrapper-grey {
    background: #f4f4f4;
    padding: 12px;
    box-sizing: border-box;
    border-radius: 8px 8px 8px 8px;
    margin-bottom: 12px;
    .row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0px;
        .label {
            font-size: 14px;
            color: #999999;
        }
        .value {
            font-size: 14px;
            color: #e34242;
        }
    }
}
</style>
