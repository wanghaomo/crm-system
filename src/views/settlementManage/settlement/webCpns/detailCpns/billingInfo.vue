<template>
    <div>
        <div class="title" style="margin-top: 11px">开票信息</div>
        <div class="row">
            <div class="item">
                <div class="label">申请单位</div>
                <div class="value">{{ applyUnitLabel }}</div>
            </div>
            <div class="item">
                <div class="label">客户名称</div>
                <div class="value">{{ getCellText(invoiceMain.customerName) }}</div>
            </div>
            <div class="item" style="width: 100%">
                <div class="label">本次开票类型</div>
                <div class="value">{{ invoiceTypeLabel }}</div>
            </div>
            <div class="item" style="width: 100%">
                <div class="label">开票信息</div>
                <div class="value">{{ getCellText(invoiceMain.invoiceInformation) }}</div>
            </div>
            <div class="item" style="width: 100%">
                <div class="label">开票备注</div>
                <div class="value">{{ getCellText(invoiceMain.invoiceRemark) }}</div>
            </div>
        </div>
        <div class="title" style="margin-top: 16px">申请开票明细</div>
        <MxWebDataTable :style="tableStyle" v-bind="tableConfig"> </MxWebDataTable>
        <div class="tips">
            <div class="item">
                申请开票明细汇总数量
                <span class="value">{{ getCellText(invoiceMain.totalQuantity, 0) }}</span>
            </div>
            <div class="item">
                申请开票明细汇总单价(含税)
                <span class="value">{{ getCellText(invoiceMain.totalUnitPrice, 0) }}</span>元
            </div>
            <div class="item">
                申请开票明细汇总税额
                <span class="value">{{ getCellText(invoiceMain.totalTaxAmount, 0) }}</span>元
            </div>
            <div class="item">
                申请开票明细汇总金额(不含税)
                <span class="value">{{ getCellText(invoiceMain.totalAmountExcludingTax, 0) }}</span>元
            </div>
            <div class="item">
                申请开票明细汇总金额(含税)
                <span class="value">{{ getCellText(invoiceMain.totalAmount, 0) }}</span>元
            </div>
        </div>
    </div>
</template>
    
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
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
 * @param placeholder 空值占位
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
 * 创建空值展示为占位符的开票明细详情列。
 * @param key 字段 key
 * @param title 表头标题
 * @param width 列宽
 * @returns 详情列配置
 */
const createInvoiceDetailColumn = (key: string, title: string, width: number) => ({
    key,
    title,
    width,
    render: (row: any) => getCellText(row[key]),
});

const tableConfig = computed(() => ({
    columns: [
        {
            key: 'businessType',
            title: '业务类型',
            width: 140,
            render: (row: any) => getDictLabel(BUSINESS_TYPE_DICT, row.businessType),
        },
        createInvoiceDetailColumn('goodsName', '货物或应税劳务、服务名称', 180),
        createInvoiceDetailColumn('specificationModel', '规格型号', 140),
        createInvoiceDetailColumn('unit', '单位', 140),
        createInvoiceDetailColumn('quantity', '数量', 140),
        createInvoiceDetailColumn('unitPrice', '单价（元、含税）', 140),
        createInvoiceDetailColumn('amount', '金额（元、含税）', 140),
        createInvoiceDetailColumn('taxRate', '税率（%）', 140),
        createInvoiceDetailColumn('taxAmount', '税额（元）', 140),
        createInvoiceDetailColumn('amountExcludingTax', '金额（不含税）', 140),
    ],
    tableList: invoiceDetailList.value,
    isShowPagination: false,
    isShowIndex: true,
    maxHeight: 500,
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
    },
    bordered: true,
    bottomBordered: true,
}));

const tableStyle = computed(() => {
    const length = invoiceDetailList.value.length;
    return {
        height: length === 0 ? '240px' : `${Math.min(length, 6) * 40 + 92}px`,
    };
});
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
            width: 95px;
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
.tips {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding-top: 4px;

    .item {
        font-size: 12px;
        color: #999999;
        line-height: 20px;
    }
    .value {
        font-weight: 400;
        font-size: 12px;
        color: #e34242;
        margin: 0 4px;
    }
}
</style>
