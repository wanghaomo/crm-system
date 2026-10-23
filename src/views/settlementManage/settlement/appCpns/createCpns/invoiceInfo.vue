<template>
    <div class="edit-content">
        <div class="form-card">
            <div class="form-card-title">开票信息</div>
            <Form ref="formRef" label-width="120px">
                <Field
                    :model-value="formData.applyUnit"
                    name="applyUnit"
                    label="申请单位"
                    required
                    readonly
                    placeholder="自动匹配销售合同供方单位">
                    <template #input>
                        <div style="color: #999">
                            {{ applyUnitLabel || '--' }}
                        </div>
                    </template>
                </Field>
                <Field
                    :model-value="formData.enterpriseName"
                    name="customerName"
                    label="客户名称"
                    required
                    readonly
                    placeholder="自动匹配销售合同需方单位">
                    <template #input>
                        <div style="color: #999">
                            {{ formData.enterpriseName || '--' }}
                        </div>
                    </template>
                </Field>
                <Field
                    :model-value="invoiceTypeLabel"
                    name="invoiceType"
                    label="本次开票类型"
                    readonly
                    is-link
                    required
                    placeholder="请选择"
                    @click="showInvoiceTypePicker = true" />
                <Field
                    style="border-radius: 12px;"
                    name="invoiceInformation"
                    label-align="top"
                    v-model="formData.invoiceInformation"
                    label="开票信息"
                    rows="5"
                    autosize
                    maxlength="500"
                    type="textarea"
                    show-word-limit
                    clearable
                    placeholder="请输入" />
                <Field
                    style="border-radius: 12px;"
                    name="invoiceRemark"
                    label-align="top"
                    v-model="formData.invoiceRemark"
                    label="开票备注"
                    rows="5"
                    required
                    autosize
                    maxlength="500"
                    type="textarea"
                    show-word-limit
                    clearable
                    placeholder="请输入" />
            </Form>
        </div>
    </div>
    <card title="申请开票明细">
        <div class="mx_mes-wrapper-grey">
            <div class="row">
                <div class="label">申请开票明细汇总数量</div>
                <div class="value">{{ invoiceSummary.totalQuantity }}</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总单价(含税)</div>
                <div class="value">{{ formatSettlementAmount(invoiceSummary.totalUnitPrice, '0.0000') }}元</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总税额</div>
                <div class="value">{{ formatSettlementAmount(invoiceSummary.totalTaxAmount, '0.0000') }}元</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总金额(不含税)</div>
                <div class="value">{{ formatSettlementAmount(invoiceSummary.totalAmountExcludingTax, '0.0000') }}元</div>
            </div>
            <div class="row">
                <div class="label">申请开票明细汇总金额(含税)</div>
                <div class="value">{{ formatSettlementAmount(invoiceSummary.totalAmount, '0.0000') }}元</div>
            </div>
        </div>
        <template v-for="(item, index) in invoiceDetailList" :key="item.id || index">
            <dataItem
                title="序号"
                :index="index + 1"
                :item="item"
                showEdit
                showDelete
                @edit="handleEditInvoiceDetail(item, index)"
                @delete="handleDeleteInvoiceDetail(index)"
                class="data-item"
                :descriptions="getInvoiceDetailDescriptions(item)" />
        </template>
        <empty v-if="invoiceDetailList.length == 0" />

        <button class="add-button" @click="handleAddInvoiceDetail">
            <div class="icon"></div>
            添加信息
        </button>
    </card>

    <Popup v-model:show="showInvoiceTypePicker" position="bottom" round>
        <Picker
            :columns="invoiceTypeOptions"
            title="本次开票类型"
            @confirm="onInvoiceTypeConfirm"
            @cancel="showInvoiceTypePicker = false" />
    </Popup>

    <Popup v-model:show="showInvoiceDetailPopup" position="bottom" round>
        <div class="invoice-detail-popup">
            <div class="popup-title">{{ editingInvoiceIndex === -1 ? '新增开票明细' : '编辑开票明细' }}</div>
            <Form label-width="130px">
                <Field
                    :model-value="businessTypeLabel"
                    label="业务类型"
                    required
                    readonly
                    is-link
                    placeholder="请选择业务类型"
                    @click="showBusinessTypePicker = true" />
                <Field
                    v-model="invoiceEditForm.goodsName"
                    label="货物或应税劳务、服务名称"
                    required
                    maxlength="50"
                    placeholder="请输入" />
                <Field
                    v-model="invoiceEditForm.specificationModel"
                    label="规格型号"
                    required
                    maxlength="50"
                    placeholder="请输入" />
                <Field v-model="invoiceEditForm.unit" label="单位" required maxlength="50" placeholder="请输入" />
                <Field v-model="invoiceEditForm.quantity" label="数量" type="number" required placeholder="请输入" />
                <Field
                    v-model="invoiceEditForm.unitPrice"
                    label="单价（元、含税）"
                    type="number"
                    required
                    placeholder="请输入" />
                <Field
                    :model-value="formatSettlementAmount(invoiceEditForm.amount, '')"
                    label="金额（元、含税）"
                    type="number"
                    required
                    readonly
                    placeholder="自动计算" />
                <Field
                    v-model="invoiceEditForm.taxRate"
                    label="税率（%）"
                    type="number"
                    required
                    placeholder="请输入" />
                <Field
                    :model-value="formatSettlementAmount(invoiceEditForm.taxAmount, '')"
                    label="税额（元）"
                    readonly
                    placeholder="自动计算" />
                <Field
                    :model-value="formatSettlementAmount(invoiceEditForm.amountExcludingTax, '')"
                    label="金额（不含税）"
                    readonly
                    placeholder="自动计算" />
            </Form>
            <div class="popup-footer">
                <button class="popup-cancel" @click="showInvoiceDetailPopup = false">取消</button>
                <button class="popup-confirm" @click="handleSaveInvoiceDetail">确定</button>
            </div>
        </div>
    </Popup>

    <Popup v-model:show="showBusinessTypePicker" position="bottom" round>
        <Picker
            :columns="businessTypeOptions"
            title="业务类型"
            @confirm="onBusinessTypeConfirm"
            @cancel="showBusinessTypePicker = false" />
    </Popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Field, Form, Picker, Popup, showToast } from 'vant';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import card from '../card.vue';
import dataItem from '../data-item.vue';
import { calculateInvoiceAmounts, formatSettlementAmount, getSettlementAmountNumber } from '../../utils';

const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
    isEdit: {
        type: Boolean,
        default: false,
    },
});

const { dictMap } = storeToRefs(useDictStore());
const SUPPLIER_UNIT_DICT = '供方单位';
const INVOICE_TYPE_DICT = '增值税开票类型';
const BUSINESS_TYPE_DICT = '业务类型';
const DEFAULT_BUSINESS_TYPE_LABEL = '产品服务';
const TEMP_ROW_PREFIX = 'TEMP_INVOICE_DETAIL';
const REQUIRED_FIELDS = [
    { key: 'businessType', label: '业务类型', type: 'select' },
    { key: 'goodsName', label: '货物或应税劳务、服务名称', type: 'input' },
    { key: 'specificationModel', label: '规格型号', type: 'input' },
    { key: 'unit', label: '单位', type: 'input' },
    { key: 'quantity', label: '数量', type: 'input' },
    { key: 'unitPrice', label: '单价（元、含税）', type: 'input' },
    { key: 'amount', label: '金额（元、含税）', type: 'input' },
    { key: 'taxRate', label: '税率（%）', type: 'input' },
];
const INVOICE_TEXT_MAX_LENGTH = 50;
const INVOICE_TEXT_LIMIT_FIELDS = [
    { key: 'goodsName', label: '货物或应税劳务、服务名称' },
    { key: 'specificationModel', label: '规格型号' },
    { key: 'unit', label: '单位' },
];

const showInvoiceTypePicker = ref(false);
const showInvoiceDetailPopup = ref(false);
const showBusinessTypePicker = ref(false);
const editingInvoiceIndex = ref(-1);
const invoiceEditForm = ref<any>({});

const formData = computed(() => props.formData);
const invoiceDetailList = computed<any[]>(() => props.formData.invoiceDetailList || []);

const applyUnitLabel = computed(() => {
    const value = props.formData.applyUnit;
    const options = dictMap.value?.[SUPPLIER_UNIT_DICT] || [];
    const option = options.find((item: any) => item.value === value || item.label === value);
    return option?.label || value || '';
});

const invoiceTypeOptions = computed(() => {
    const options = dictMap.value?.[INVOICE_TYPE_DICT] || [];
    return options.map((item: any) => ({
        text: item.text || item.label || '',
        value: item.value,
        raw: item,
    }));
});

const invoiceTypeLabel = computed(() => {
    const option = invoiceTypeOptions.value.find((item) => item.value === props.formData.invoiceType);
    return option?.text || '';
});

const businessTypeOptions = computed(() => {
    const options = dictMap.value?.[BUSINESS_TYPE_DICT] || [];
    return options.map((item: any) => ({
        text: item.text || item.label || item.name || '',
        value: item.value,
        raw: item,
    }));
});

const businessTypeLabel = computed(() => {
    const option = businessTypeOptions.value.find((item) => item.value === invoiceEditForm.value.businessType);
    return option?.text || '';
});

/**
 * 获取新增申请开票明细行的默认业务类型。
 * @returns “产品服务”的字典值，未找到字典时返回 null
 */
const getDefaultBusinessType = () => {
    const option = businessTypeOptions.value.find((item) => String(item.text || '').trim() === DEFAULT_BUSINESS_TYPE_LABEL);
    return option?.value || null;
};

/**
 * 新增时默认选中第一个开票类型字典项，编辑态不补默认值。
 * @returns 无返回值
 */
const setDefaultInvoiceType = () => {
    if (props.isEdit) return;
    if (props.formData.invoiceType !== null && props.formData.invoiceType !== undefined && props.formData.invoiceType !== '') return;
    props.formData.invoiceType = invoiceTypeOptions.value[0]?.value || null;
};

watch(
    invoiceTypeOptions,
    () => {
        setDefaultInvoiceType();
    },
    { immediate: true }
);

/**
 * 获取字段展示值。
 * @param value 原始字段值
 * @param placeholder 占位值
 * @returns 展示值
 */
const getCellText = (value: any, placeholder: any = '--') => {
    return value === null || value === undefined || value === '' ? placeholder : value;
};

/**
 * 判断开票明细字段是否为空，数字 0 视为已填写。
 * @param value 字段值
 * @returns 是否为空
 */
const isEmptyInvoiceDetailValue = (value: any) => {
    return value === null || value === undefined || value === '';
};

/**
 * 将字段转换为数字。
 * @param value 原始字段值
 * @returns 数字
 */
const getNumberValue = (value: any) => {
    if (value === null || value === undefined || value === '') return 0;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
};

/**
 * 格式化为两位小数。
 * @param value 原始字段值
 * @returns 两位小数数字
 */
const getFixedNumber = (value: any) => {
    return Number(getNumberValue(value).toFixed(2));
};

/**
 * 同步弹窗表单里的开票金额字段。
 * @returns 无返回值
 */
const updateInvoiceEditAmounts = () => {
    Object.assign(invoiceEditForm.value, calculateInvoiceAmounts(invoiceEditForm.value));
};

watch(
    () => [invoiceEditForm.value?.quantity, invoiceEditForm.value?.unitPrice, invoiceEditForm.value?.taxRate],
    () => {
        updateInvoiceEditAmounts();
    }
);

/**
 * 创建一条空的开票明细。
 * @returns 开票明细默认行
 */
const createInvoiceDetailRow = () => ({
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
});

/**
 * 选择本次开票类型。
 * @param selectedOptions 选择项
 * @returns 无返回值
 */
const onInvoiceTypeConfirm = ({ selectedOptions }: any) => {
    const option = selectedOptions?.[0];
    props.formData.invoiceType = option?.value || null;
    showInvoiceTypePicker.value = false;
};

/**
 * 选择业务类型。
 * @param selectedOptions 选择项
 * @returns 无返回值
 */
const onBusinessTypeConfirm = ({ selectedOptions }: any) => {
    const option = selectedOptions?.[0];
    invoiceEditForm.value.businessType = option?.value || null;
    showBusinessTypePicker.value = false;
};

/**
 * 打开新增开票明细弹窗。
 * @returns 无返回值
 */
const handleAddInvoiceDetail = () => {
    editingInvoiceIndex.value = -1;
    invoiceEditForm.value = createInvoiceDetailRow();
    updateInvoiceEditAmounts();
    showInvoiceDetailPopup.value = true;
};

/**
 * 打开编辑开票明细弹窗。
 * @param row 当前行
 * @param index 行下标
 * @returns 无返回值
 */
const handleEditInvoiceDetail = (row: any, index: number) => {
    editingInvoiceIndex.value = index;
    invoiceEditForm.value = { ...row };
    updateInvoiceEditAmounts();
    showInvoiceDetailPopup.value = true;
};

/**
 * 删除开票明细。
 * @param index 行下标
 * @returns 无返回值
 */
const handleDeleteInvoiceDetail = (index: number) => {
    props.formData.invoiceDetailList.splice(index, 1);
};

/**
 * 保存开票明细弹窗数据。
 * @returns 无返回值
 */
const handleSaveInvoiceDetail = () => {
    updateInvoiceEditAmounts();
    const emptyField = REQUIRED_FIELDS.find((field) => isEmptyInvoiceDetailValue(invoiceEditForm.value[field.key]));
    if (emptyField) {
        showToast(`${emptyField.type === 'select' ? '请选择' : '请输入'}${emptyField.label}`);
        return;
    }
    const overLengthField = INVOICE_TEXT_LIMIT_FIELDS.find(
        (field) => String(invoiceEditForm.value[field.key] || '').length > INVOICE_TEXT_MAX_LENGTH
    );
    if (overLengthField) {
        showToast(`${overLengthField.label}最多${INVOICE_TEXT_MAX_LENGTH}字`);
        return;
    }
    const row = {
        ...invoiceEditForm.value,
        quantity: getFixedNumber(invoiceEditForm.value.quantity),
        unitPrice: getFixedNumber(invoiceEditForm.value.unitPrice),
        amount: getSettlementAmountNumber(invoiceEditForm.value.amount, null),
        taxRate: getFixedNumber(invoiceEditForm.value.taxRate),
        taxAmount: getSettlementAmountNumber(invoiceEditForm.value.taxAmount, null),
        amountExcludingTax: getSettlementAmountNumber(invoiceEditForm.value.amountExcludingTax, null),
        applyUnit: invoiceEditForm.value.applyUnit || props.formData.applyUnit || '',
    };
    if (editingInvoiceIndex.value === -1) {
        props.formData.invoiceDetailList.push(row);
    } else {
        props.formData.invoiceDetailList.splice(editingInvoiceIndex.value, 1, row);
    }
    showInvoiceDetailPopup.value = false;
};

/**
 * 获取开票明细卡片描述。
 * @param item 当前开票明细
 * @returns 描述项列表
 */
const getInvoiceDetailDescriptions = (item: any) => {
    const businessType = businessTypeOptions.value.find((option) => option.value === item.businessType)?.text || item.businessType;
    return [
        { label: '业务类型', value: getCellText(businessType) },
        { label: '货物或应税劳务、服务名称', value: getCellText(item.goodsName) },
        { label: '规格型号', value: getCellText(item.specificationModel) },
        { label: '单位', value: getCellText(item.unit) },
        { label: '数量', value: getCellText(item.quantity) },
        { label: '单价（元、含税）', value: getCellText(item.unitPrice) },
        { label: '金额（元、含税）', value: formatSettlementAmount(item.amount) },
        { label: '税率（%）', value: getCellText(item.taxRate) },
        { label: '税额（元）', value: formatSettlementAmount(item.taxAmount) },
        { label: '金额（不含税）', value: formatSettlementAmount(item.amountExcludingTax) },
    ];
};

const invoiceSummary = computed(() => {
    const summary = invoiceDetailList.value.reduce(
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
        totalQuantity: getFixedNumber(summary.totalQuantity),
        totalUnitPrice: getSettlementAmountNumber(summary.totalUnitPrice),
        totalAmount: getSettlementAmountNumber(summary.totalAmount),
        totalTaxAmount: getSettlementAmountNumber(summary.totalTaxAmount),
        totalAmountExcludingTax: getSettlementAmountNumber(summary.totalAmountExcludingTax),
    };
});
</script>

<style scoped lang="less">
.edit-content {
    padding: 2px 0 8px;

    .form-card {
        padding: 4px 0px;
        background: #ffffff;
        border-radius: 10px;
        .form-card-title {
            font-size: 16px;
            font-weight: 500;
            color: var(--base-black);
            padding: 12px 12px 0;
        }
        :deep(.van-cell) {
            padding: 14px 12px;
        }
        :deep(.van-cell:after) {
            border-bottom: 1px solid #ededed;
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
.add-button {
    border: none;
    outline: none;
    font-size: 14px;
    color: #2c65f2;
    display: flex;
    align-items: center;
    background: none;
    cursor: pointer;
    margin: auto;
    .icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        background: url('@/assets/images/comm/icon⎽com⎽add_blue.png') center no-repeat;
        background-size: 100% 100%;
    }
}
.invoice-detail-popup {
    padding: 12px 12px 8px;
    max-height: 80vh;
    overflow-y: auto;

    .popup-title {
        font-size: 16px;
        font-weight: 500;
        color: #333333;
        text-align: center;
        padding: 8px 0 12px;
    }

    .popup-footer {
        display: flex;
        gap: 12px;
        padding-top: 12px;
    }

    .popup-cancel,
    .popup-confirm {
        flex: 1;
        height: 40px;
        border-radius: 4px;
        border: 1px solid #2c65f2;
        background: #ffffff;
        color: #2c65f2;
        font-size: 16px;
    }

    .popup-confirm {
        background: #2c65f2;
        color: #ffffff;
    }
}
:deep(.van-cell) {
    &:last-child {
        padding-bottom: 0;
    }
}
:deep(.van-field__label) {
    font-size: 16px;
    color: var(--base-grey2);
}
:deep(.van-field__control),
:deep(.van-field__value),
:deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}
:deep(.van-field__word-limit),
:deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}
:deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}
</style>
