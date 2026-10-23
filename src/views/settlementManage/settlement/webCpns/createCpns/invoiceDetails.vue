<template>
    <div>
        <MxButton class="addBtn" type="success" hasLeftIcon border @click="handleAddInvoiceDetail">
            <template #leftIcon> <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" /> </template
            >新增
        </MxButton>

        <MxWebDataTable class="invoice-detail-table" :style="tableStyle" v-bind="tableConfig"> </MxWebDataTable>
        <div class="tips">
            <div class="item">
                申请开票明细汇总数量
                <span class="value">{{ invoiceSummary.totalQuantity }}</span>
            </div>
            <div class="item">
                申请开票明细汇总单价(含税)
                <span class="value">{{ formatSettlementAmount(invoiceSummary.totalUnitPrice, '0.0000') }}</span>元
            </div>
            <div class="item">
                申请开票明细汇总税额
                <span class="value">{{ formatSettlementAmount(invoiceSummary.totalTaxAmount, '0.0000') }}</span>元
            </div>
            <div class="item">
                申请开票明细汇总金额(不含税)
                <span class="value">{{ formatSettlementAmount(invoiceSummary.totalAmountExcludingTax, '0.0000') }}</span>元
            </div>
            <div class="item">
                申请开票明细汇总金额(含税)
                <span class="value">{{ formatSettlementAmount(invoiceSummary.totalAmount, '0.0000') }}</span>元
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { storeToRefs } from 'pinia';
import { NInput, NInputNumber, NSelect } from 'naive-ui';
import { useDictStore } from '@/store/commStore';
import { calculateInvoiceAmounts, formatSettlementAmount, getSettlementAmountNumber } from '../../utils';

const { dictMap } = storeToRefs(useDictStore());
const BUSINESS_TYPE_DICT = '业务类型';
const DEFAULT_BUSINESS_TYPE_LABEL = '产品服务';
const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
    tableList: {
        type: Array,
        default: () => [],
    },
    validateTrigger: {
        type: Number,
        default: 0,
    },
    isEdit: {
        type: Boolean,
        default: false,
    },
});

const TEMP_ROW_PREFIX = 'TEMP_INVOICE_DETAIL';
const REQUIRED_FIELD_KEYS = [
    'businessType',
    'goodsName',
    'specificationModel',
    'unit',
    'quantity',
    'unitPrice',
    'amount',
    'taxRate',
];
const INVOICE_TEXT_MAX_LENGTH = 50;
const TEXT_LIMIT_FIELD_KEYS = ['goodsName', 'specificationModel', 'unit'];
const businessTypeOptions = computed(() => {
    const options = dictMap.value?.[BUSINESS_TYPE_DICT] || [];
    return options.map((item: any) => ({
        label: item.label || item.text || item.name || '',
        value: item.value,
    }));
});

/**
 * 获取新增申请开票明细行的默认业务类型。
 * @returns “产品服务”的字典值，未找到字典时返回 null
 */
const getDefaultBusinessType = () => {
    const option = businessTypeOptions.value.find((item: any) => String(item.label || '').trim() === DEFAULT_BUSINESS_TYPE_LABEL);
    return option?.value || null;
};

/**
 * 创建一条空的申请开票明细。
 * @returns 申请开票明细默认行数据
 */
const createInvoiceDetailRow = () => {
    return {
        id: `${TEMP_ROW_PREFIX}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        businessType: getDefaultBusinessType(),
        goodsName: '',
        specificationModel: '',
        unit: '',
        quantity: null,
        unitPrice: null,
        amount: null,
        taxRate: 13,
        taxAmount: null,
        amountExcludingTax: null,
        remark: '',
        applyUnit: props.formData.applyUnit || '',
    };
};

/**
 * 确保表单上存在申请开票明细数组。
 * @returns 申请开票明细数组
 */
const getInvoiceDetailList = () => {
    if (!Array.isArray(props.formData.invoiceDetailList)) {
        props.formData.invoiceDetailList = [];
    }
    return props.formData.invoiceDetailList;
};

/**
 * 新增一条申请开票明细。
 * @returns 无返回值
 */
const handleAddInvoiceDetail = () => {
    getInvoiceDetailList().push(createInvoiceDetailRow());
};

/**
 * 删除当前申请开票明细行。
 * @param row 当前行数据
 * @returns 无返回值
 */
const handleDeleteInvoiceDetail = (row: any) => {
    const list = getInvoiceDetailList();
    const index = list.findIndex((item: any) => item.id === row.id);
    if (index !== -1) {
        list.splice(index, 1);
    }
};

/**
 * 判断开票明细必填单元格是否为空，数值 0 视为已填写。
 * @param value 单元格字段值
 * @returns 是否为空
 */
const isEmptyRequiredValue = (value: any) => {
    return value === null || value === undefined || value === '';
};

/**
 * 获取开票明细单元格校验状态，仅展示红色边框，不展示错误文案。
 * @param row 当前行数据
 * @param key 字段 key
 * @param validateTrigger 提交触发次数
 * @returns Naive UI 输入组件校验状态
 */
const getFieldStatus = (row: any, key: string, validateTrigger: number) => {
    if (!validateTrigger) return undefined;
    if (!REQUIRED_FIELD_KEYS.includes(key)) return undefined;
    return isEmptyRequiredValue(row?.[key]) ? 'error' : undefined;
};

/**
 * 获取文本字段最大长度，非限制字段不设置。
 * @param key 字段 key
 * @returns 最大输入长度
 */
const getTextMaxLength = (key: string) => {
    return TEXT_LIMIT_FIELD_KEYS.includes(key) ? INVOICE_TEXT_MAX_LENGTH : undefined;
};

/**
 * 按字段长度限制截取文本。
 * @param key 字段 key
 * @param value 输入值
 * @returns 限制后的文本
 */
const getLimitedTextValue = (key: string, value: string) => {
    if (!TEXT_LIMIT_FIELD_KEYS.includes(key)) return value;
    return value.slice(0, INVOICE_TEXT_MAX_LENGTH);
};

/**
 * 同步当前行的开票金额字段。
 * @param row 当前开票明细行
 * @returns 无返回值
 */
const updateInvoiceAmounts = (row: any) => {
    Object.assign(row, calculateInvoiceAmounts(row));
};

/**
 * 渲染文本输入框。
 * @param row 当前行数据
 * @param key 字段 key
 * @param placeholder 占位文案
 * @param validateTrigger 提交触发次数
 * @returns 输入框虚拟节点
 */
const renderInput = (row: any, key: string, placeholder = '请输入', validateTrigger = 0) => {
    return h(NInput, {
        value: row[key] ?? '',
        status: getFieldStatus(row, key, validateTrigger),
        size: 'small',
        clearable: true,
        maxlength: getTextMaxLength(key),
        placeholder,
        'onUpdate:value': (value: string) => {
            row[key] = getLimitedTextValue(key, value);
        },
    });
};

/**
 * 渲染字典下拉选择框。
 * @param row 当前行数据
 * @param key 字段 key
 * @param options 下拉选项
 * @param validateTrigger 提交触发次数
 * @returns 下拉选择框虚拟节点
 */
const renderSelect = (row: any, key: string, options: any[], validateTrigger = 0) => {
    return h(NSelect, {
        value: row[key] ?? null,
        status: getFieldStatus(row, key, validateTrigger),
        options,
        size: 'small',
        filterable: true,
        clearable: true,
        placeholder: '请选择',
        'onUpdate:value': (value: string | null) => {
            row[key] = value;
        },
    });
};

/**
 * 渲染数字输入框，并支持变更后回调。
 * @param row 当前行数据
 * @param key 字段 key
 * @param onChange 数值变更后的回调
 * @param validateTrigger 提交触发次数
 * @returns 数字输入框虚拟节点
 */
const renderNumberInput = (row: any, key: string, onChange?: (row: any) => void, validateTrigger = 0) => {
    return h(NInputNumber, {
        value: row[key],
        status: getFieldStatus(row, key, validateTrigger),
        size: 'small',
        min: 0,
        precision: 2,
        showButton: false,
        placeholder: '请输入',
        'onUpdate:value': (value: number | null) => {
            row[key] = value;
            onChange?.(row);
        },
    });
};

/**
 * 渲染只读金额输入框。
 * @param row 当前行数据
 * @param key 字段 key
 * @param validateTrigger 提交触发次数
 * @returns 只读数字输入框虚拟节点
 */
const renderReadonlyNumberInput = (row: any, key: string, validateTrigger = 0) => {
    const amounts = calculateInvoiceAmounts(row);
    return h(NInputNumber, {
        value: (amounts as any)[key],
        status: getFieldStatus(row, key, validateTrigger),
        size: 'small',
        precision: 4,
        showButton: false,
        disabled: true,
        placeholder: '自动计算',
    });
};

const columns = computed(() => {
    const validateTrigger = props.validateTrigger;
    const options = businessTypeOptions.value;
    return [
        {
            key: 'businessType',
            title: '业务类型',
            isRule: true,
            width: 140,
            render: (row: any) => renderSelect(row, 'businessType', options, validateTrigger),
        },
        {
            key: 'goodsName',
            title: '货物或应税劳务、服务名称',
            isRule: true,
            width: 180,
            render: (row: any) => renderInput(row, 'goodsName', '请输入', validateTrigger),
        },
        {
            key: 'specificationModel',
            title: '规格型号',
            isRule: true,
            width: 140,
            render: (row: any) => renderInput(row, 'specificationModel', '请输入', validateTrigger),
        },
        {
            key: 'unit',
            title: '单位',
            isRule: true,
            width: 140,
            render: (row: any) => renderInput(row, 'unit', '请输入', validateTrigger),
        },
        {
            key: 'quantity',
            title: '数量',
            isRule: true,
            width: 140,
            render: (row: any) => renderNumberInput(row, 'quantity', updateInvoiceAmounts, validateTrigger),
        },
        {
            key: 'unitPrice',
            title: '单价（元、含税）',
            isRule: true,
            width: 140,
            render: (row: any) => renderNumberInput(row, 'unitPrice', updateInvoiceAmounts, validateTrigger),
        },
        {
            key: 'amount',
            title: '金额（元、含税）',
            isRule: true,
            width: 140,
            render: (row: any) => renderReadonlyNumberInput(row, 'amount', validateTrigger),
        },
        {
            key: 'taxRate',
            title: '税率（%）',
            isRule: true,
            width: 140,
            render: (row: any) => renderNumberInput(row, 'taxRate', updateInvoiceAmounts, validateTrigger),
        },
        {
            key: 'taxAmount',
            title: '税额（元）',
            isRule: true,
            width: 140,
            render: (row: any) => renderReadonlyNumberInput(row, 'taxAmount', validateTrigger),
        },
        {
            key: 'amountExcludingTax',
            title: '金额（不含税）',
            isRule: true,
            width: 140,
            render: (row: any) => renderReadonlyNumberInput(row, 'amountExcludingTax', validateTrigger),
        },
    ];
});

const tableRows = computed<any[]>(() => props.formData.invoiceDetailList || props.tableList || []);
const tableConfig = computed(() => ({
    columns: columns.value,
    tableList: tableRows.value,
    tableBtns: [
        {
            btnName: '删除',
            btnColor: '#E34242',
            clickTableBtns: (row: any) => {
                handleDeleteInvoiceDetail(row);
            },
        },
    ],
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
    maxHeight: 500,
    singleLine: false,
    actionColumnWidth: 80,
}));

/**
 * 将开票明细数值字段转换成数字，非法值按 0 处理。
 * @param value 原始字段值
 * @returns 可汇总的数字
 */
const getNumberValue = (value: any) => {
    if (value === null || value === undefined || value === '') return 0;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
};

/**
 * 按开票明细计算页面底部汇总信息。
 * @returns 开票明细汇总信息
 */
const invoiceSummary = computed(() => {
    const summary = tableRows.value.reduce(
        (total, row: any) => {
            const amounts = calculateInvoiceAmounts(row);
            total.totalQuantity += getNumberValue(row.quantity);
            total.totalUnitPrice += getNumberValue(row.unitPrice);
            total.totalAmount += getNumberValue(amounts.amount);
            total.totalTaxAmount += getNumberValue(amounts.taxAmount);
            total.totalAmountExcludingTax += getNumberValue(amounts.amountExcludingTax);
            return total;
        },
        {
            totalQuantity: 0,
            totalUnitPrice: 0,
            totalAmount: 0,
            totalTaxAmount: 0,
            totalAmountExcludingTax: 0,
        }
    );
    return {
        totalQuantity: Number(summary.totalQuantity.toFixed(2)),
        totalUnitPrice: getSettlementAmountNumber(summary.totalUnitPrice),
        totalAmount: getSettlementAmountNumber(summary.totalAmount),
        totalTaxAmount: getSettlementAmountNumber(summary.totalTaxAmount),
        totalAmountExcludingTax: getSettlementAmountNumber(summary.totalAmountExcludingTax),
    };
});

const tableStyle = computed(() => {
    const length = tableRows.value.length;
    return {
        height: length === 0 ? '240px' : 'auto',
        maxHeight: '500px',
    };
});
</script>

<style scoped lang="less">
.addBtn {
    width: 88px;
    height: 32px;
    .add-icon {
        width: 16px;
        height: 16px;
    }
}
.tips {
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding-top: 4px;

    .item {
        font-size: 12px;
        color: #999999;
        min-width: 0;
        line-height: 20px;
    }
    .value {
        font-weight: 400;
        font-size: 12px;
        color: #e34242;
        margin: 0 4px;
    }
}

.invoice-detail-table {
    width: 100%;
    min-width: 0;
    max-width: 100%;

    :deep(.web-data-table),
    :deep(.web-n-data-table-con),
    :deep(.web-n-data-table) {
        width: 100%;
        min-width: 0;
        max-width: 100%;
    }

    :deep(.n-data-table-wrapper) {
        width: 100%;
        min-width: 0;
        max-width: 100%;
    }
}
</style>
