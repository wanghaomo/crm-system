<template>
    <AppPage ref="appPageRef" title="批量回款" :showSearch="false" :showList="false">
        <template #content>
            <card title="基础信息" class="base">
                <Form ref="formRef" label-width="120px">
                    <MxCommSelect
                        v-model="formData.customerId"
                        v-model:label="formData.customerName"
                        typeName="批量回款客户"
                        title="客户名称"
                        name="customerId"
                        :required="true"
                        :rules="[{ required: true, message: '请选择客户名称', trigger: 'onChange' }]"
                        :clearable="true"
                        :text="false"
                        @changeEvt="handleCustomerChange" />
                    <Field
                        :model-value="formData.prepaymentAmount"
                        label="资金余额(元)"
                        readonly />
                    <Field
                        :modelValue="formData.paymentDate.join('-')"
                        :is-link="true"
                        :required="true"
                        readonly
                        name="paymentDate"
                        label="回款日期"
                        placeholder="请选择"
                        :rules="[{ required: true, message: '请选择回款日期', trigger: 'onChange' }]"
                        @click="showDatePicker = true" />
                    <MxPersonSelect
                        :clearable="true"
                        title="经办人"
                        :required="true"
                        name="handler"
                        placeholder="请选择经办人"
                        :rules="[{ required: true, message: '请选择经办人', trigger: 'onChange' }]"
                        v-model="formData.handler"
                        v-model:label="formData.handlerName" />
                    <MxCommSelect
                        v-model="formData.paymentType"
                        v-model:label="formData.paymentTypeLabel"
                        title="回款方式"
                        name="paymentType"
                        :required="true"
                        :options="paymentTypes"
                        :rules="[{ required: true, message: '请选择回款方式', trigger: 'onChange' }]"
                        :clearable="true"
                        :text="false" />
                    <field
                        v-model="formData.allMoney"
                        name="allMoney"
                        label="回款总额(元)"
                        required
                        type="number"
                        :formatter="formatPaymentAmountInput"
                        format-trigger="onChange"
                        placeholder="请输入"
                        :rules="[{ required: true, message: '请输入回款总额', trigger: 'onChange' }]" />
                    <Field
                        :model-value="overflowingTotals.surplusRevenueTotal"
                        label="溢收款(元)"
                        readonly />
                    <Field
                        :model-value="overflowingTotals.advanceReceiptTotal"
                        label="预收冲应收(元)"
                        readonly />
                </Form>
            </card>
            <card title="回款单明细表">
                <template v-for="(item, index) in paymentRecord" :key="item.id">
                    <dataItem
                        title="回款明细"
                        :index="index + 1"
                        :item="item"
                        showEdit
                        editBtnText="补充内容"
                        @edit="itemEdit(item, index)"
                        :descriptions="getPaymentRecordDescriptions(item)" />
                </template>
                <empty v-if="paymentRecord.length == 0" />
            </card>
        </template>
        <template #footer>
            <div class="bottom-btn-wrapper">
                <Button type="primary" block class="bottom-btn" :loading="submitLoading" :disabled="submitLoading" @click="handleSubmit()">保存</Button>
            </div>
        </template>
    </AppPage>
    <MxAppDatePicker v-model="formData.paymentDate" title="选择回款日期" v-model:show="showDatePicker" />

    <Popup v-model:show="showEditPopup" position="bottom" :style="{ height: '80%' }" round>
        <div class="edit-popup-header">
            <span class="edit-popup-cancel" @click="showEditPopup = false">取消</span>
            <span class="edit-popup-title">补充内容</span>
            <span class="edit-popup-confirm" @click="handleEditConfirm">确认</span>
        </div>
        <div class="edit-popup-content">
            <Form class="edit-form">
                <Field
                    v-model="editForm.receiptCode"
                    name="receiptCode"
                    label="关联回款单"
                    readonly />
                <Field
                    v-model="editForm.contractCode"
                    name="contractCode"
                    label="合同编号"
                    readonly />
                <Field
                    v-model="editForm.plannedDate"
                    name="plannedDate"
                    label="计划回款日期"
                    readonly />
                <Field
                    v-model="editForm.amount"
                    name="amount"
                    label="回款金额(元)"
                    placeholder="请输入"
                    required
                    type="number"
                    :error="!!getEditFieldError('amount')"
                    :error-message="getEditFieldError('amount')"
                    :formatter="formatPaymentAmountInput"
                    format-trigger="onChange"
                    @update:model-value="clearEditFieldError('amount')"
                    :rules="[{ required: true, message: '请输入回款金额', trigger: 'onChange' }]" />
                <Field
                    name="overflowingType"
                    label="溢冲处理"
                    required
                    :error="!!getEditFieldError('overflowingType')"
                    :error-message="getEditFieldError('overflowingType')">
                    <template #input>
                        <RadioGroup
                            v-model="editForm.overflowingType"
                            class="overflowing-type-group"
                            @change="handleEditOverflowingTypeChange">
                            <Radio
                                v-for="item in OVERFLOWING_TYPE_OPTIONS"
                                :key="item.value"
                                :name="item.value">
                                {{ item.label }}
                            </Radio>
                        </RadioGroup>
                    </template>
                </Field>
                <Field
                    v-if="editForm.overflowingType !== OVERFLOWING_TYPE_NONE"
                    v-model="editForm.surplusRevenue"
                    name="surplusRevenue"
                    :label="editForm.overflowingType === OVERFLOWING_TYPE_SURPLUS_REVENUE ? '溢收款(元)' : '预收冲应收(元)'"
                    placeholder="请输入"
                    required
                    type="number"
                    :error="!!getEditFieldError('surplusRevenue')"
                    :error-message="getEditFieldError('surplusRevenue')"
                    :formatter="formatPaymentAmountInput"
                    format-trigger="onChange"
                    @update:model-value="clearEditFieldError('surplusRevenue')"
                    :rules="[{ required: true, message: '请输入溢收款/预收冲应收金额', trigger: 'onChange' }]" />
                <Field
                    v-model="editForm.zeroing"
                    name="zeroing"
                    label="抹零数据(元)"
                    placeholder="请输入"
                    type="number"
                    :error="!!getEditFieldError('zeroing')"
                    :error-message="getEditFieldError('zeroing')"
                    :formatter="formatRoundOffInput"
                    @update:model-value="clearEditFieldError('zeroing')"
                    format-trigger="onChange" />
                <Field
                    name="remark"
                    label-align="top"
                    v-model="editForm.remark"
                    label="备注"
                    rows="5"
                    autosize
                    maxlength="500"
                    type="textarea"
                    show-word-limit
                    clearable
                    placeholder="请输入" />
            </Form>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue';
import { Form, Popup, Field, Button, Radio, RadioGroup, showToast } from 'vant';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import card from './card.vue';
import dataItem from './data-item.vue';
import { batchCreatePaymentRecordApi, getPaymentReceiptListApi } from '@/api';
import {
    calculateOverflowingTotals,
    formatDateParam,
    formatPaymentAmountInput,
    formatRoundOffInput,
    getBatchPaymentRowErrors,
    getOverflowingTypeLabel,
    isValidPaymentAmountPrecision,
    normalizePaymentRecord,
    OVERFLOWING_TYPE_NONE,
    OVERFLOWING_TYPE_OPTIONS,
    OVERFLOWING_TYPE_PREPAYMENT_OFFSET,
    OVERFLOWING_TYPE_SURPLUS_REVENUE,
    toDatePickerValue,
    toPaymentAmountNumber,
    toRoundOffNumber,
} from '../utils';

const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
const showDatePicker = ref(false);
const appPageRef = ref<any>(null);
const router = useRouter();
const formRef = ref<any>(null);
const submitLoading = ref(false);

const paymentTypes = computed(() => dictMap.value?.['回款方式'] || []);

const formData = reactive<any>({
    customerId: '',
    customerName: '',
    paymentDate: toDatePickerValue(new Date()),
    handler: '',
    handlerName: '',
    paymentType: '',
    paymentTypeLabel: '',
    allMoney: '',
    prepaymentAmount: 0,
});
const paymentRecord = ref<any[]>([]);
const overflowingTotals = computed(() => calculateOverflowingTotals(paymentRecord.value));
const showEditPopup = ref(false);
const currentEditIndex = ref(-1);
const editForm = reactive<any>({
    receiptCode: '',
    contractCode: '',
    plannedDate: '',
    amount: '',
    overflowingType: OVERFLOWING_TYPE_NONE,
    surplusRevenue: 0,
    zeroing: '',
    remark: '',
});
const editFormErrors = ref<Record<string, string>>({});

/**
 * 将任意输入转换为安全数字。
 * @param value 待转换值
 * @returns 有效数字，非法值返回 0
 */
const toNumber = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};
/**
 * 将金额保留两位后转为数字。
 * @param value 金额值
 * @returns 两位精度金额数字
 */
const toAmountNumber = (value: any) => toPaymentAmountNumber(value);
/**
 * 默认使用当前登录用户作为经办人。
 * @returns 无返回值
 */
const setDefaultHandler = () => {
    formData.handler = userInfo.value?.code || '';
    formData.handlerName = userInfo.value?.username || '';
};
/**
 * 将客户名下可回款单转换为 App 明细卡片数据。
 * @param records 可回款单列表
 * @returns 无返回值，结果写入回款明细列表
 */
const fillReceiptRows = (records: any[]) => {
    paymentRecord.value = records.map((item) => {
        const row = normalizePaymentRecord(item);
        return {
            ...row,
            prepaymentAmount: row.prepaymentAmount ?? formData.prepaymentAmount,
            amount: row.amountUnpaid ?? 0,
            overflowingType: OVERFLOWING_TYPE_NONE,
            surplusRevenue: 0,
            zeroing: 0,
            remark: '',
        };
    });
};
/**
 * 处理客户变更并加载该客户可回款单。
 * @param customer 客户选择器返回值
 * @returns 无返回值
 */
const handleCustomerChange = async (customer: any) => {
    formData.customerId = customer?.customerId || customer?.value || customer?.id || '';
    formData.customerName = customer?.customerName || customer?.label || customer?.enterpriseName || customer?.name || '';
    formData.prepaymentAmount = toPaymentAmountNumber(customer?.prepaymentAmount);
    paymentRecord.value = [];
    if (!formData.customerId) return;
    try {
        const res = await getPaymentReceiptListApi(formData.customerId);
        if (res?.code === 200) {
            fillReceiptRows(res.data || []);
        }
    } catch (error) {
        console.error('Failed to obtain receipt list:', error);
    }
};
/**
 * 组装 App 回款明细卡片描述字段。
 * @param item 回款单明细数据
 * @returns 描述组件需要的字段列表
 */
const getPaymentRecordDescriptions = (item: any) => {
    return [
        { label: '关联回款单', value: item.receiptCode || '--' },
        { label: '合同编号', value: item.contractCode || '--' },
        { label: '计划回款日期', value: item.plannedDate || '--' },
        { label: '回款金额(元)', value: item.amount ?? '--' },
        { label: '溢冲处理', value: getOverflowingTypeLabel(item.overflowingType) },
        {
            label: '溢收款(元)',
            value: item.overflowingType === OVERFLOWING_TYPE_SURPLUS_REVENUE ? item.surplusRevenue ?? 0 : '--',
        },
        {
            label: '预收冲应收(元)',
            value: item.overflowingType === OVERFLOWING_TYPE_PREPAYMENT_OFFSET ? item.surplusRevenue ?? 0 : '--',
        },
        { label: '抹零数据(元)', value: item.zeroing ?? '--' },
        { label: '备注', value: item.remark || '--' },
    ];
};
/**
 * 打开明细补充内容弹窗并回填当前行。
 * @param item 当前明细数据
 * @param index 当前明细索引
 * @returns 无返回值
 */
const itemEdit = (item: any, index: number) => {
    editFormErrors.value = {};
    currentEditIndex.value = index;
    editForm.receiptCode = item.receiptCode || '';
    editForm.contractCode = item.contractCode || '';
    editForm.plannedDate = item.plannedDate || '';
    editForm.amount = item.amount ?? '';
    editForm.overflowingType = item.overflowingType || OVERFLOWING_TYPE_NONE;
    editForm.surplusRevenue = item.surplusRevenue ?? 0;
    editForm.zeroing = item.zeroing ?? 0;
    editForm.remark = item.remark || '';
    showEditPopup.value = true;
};
/**
 * 切换溢冲处理类型时清空旧类型金额。
 * @returns 无返回值
 */
const handleEditOverflowingTypeChange = () => {
    editForm.surplusRevenue = 0;
    clearEditFieldError('overflowingType');
    clearEditFieldError('surplusRevenue');
};

/**
 * 清除补充内容弹窗中指定字段的错误状态。
 * @param field 字段名
 * @returns 无返回值
 */
const clearEditFieldError = (field: string) => {
    if (!editFormErrors.value[field]) return;
    const nextErrors = { ...editFormErrors.value };
    delete nextErrors[field];
    editFormErrors.value = nextErrors;
};

/**
 * 获取补充内容弹窗中指定字段的错误文案。
 * @param field 字段名
 * @returns 错误文案
 */
const getEditFieldError = (field: string) => editFormErrors.value[field] || '';

/**
 * 获取指定批量回款明细行的字段错误。
 * @param records 批量回款明细
 * @param index 明细行下标
 * @returns 字段错误映射
 */
const getRecordErrors = (records: any[], index: number) => {
    return getBatchPaymentRowErrors(records[index]);
};
/**
 * 确认补充内容并同步到当前明细。
 * @returns 无返回值
 */
const handleEditConfirm = () => {
    const target = paymentRecord.value[currentEditIndex.value];
    if (!target) return;
    const updatedTarget = {
        ...target,
        amount: editForm.amount,
        overflowingType: editForm.overflowingType,
        surplusRevenue:
            editForm.overflowingType === OVERFLOWING_TYPE_NONE
                ? 0
                : editForm.surplusRevenue,
        zeroing: editForm.zeroing,
        remark: editForm.remark || '',
    };
    const nextRecords = paymentRecord.value.map((item, index) =>
        index === currentEditIndex.value ? updatedTarget : item
    );
    const rowErrors = getRecordErrors(nextRecords, currentEditIndex.value);
    editFormErrors.value = rowErrors;
    const errorField = Object.keys(rowErrors)[0];
    if (errorField) {
        showToast(rowErrors[errorField]);
        return;
    }
    Object.assign(target, {
        ...updatedTarget,
        amount: toPaymentAmountNumber(updatedTarget.amount),
        surplusRevenue:
            updatedTarget.overflowingType === OVERFLOWING_TYPE_NONE
                ? 0
                : toPaymentAmountNumber(updatedTarget.surplusRevenue),
        zeroing: toRoundOffNumber(updatedTarget.zeroing),
    });
    showEditPopup.value = false;
};
/**
 * 校验批量回款明细金额。
 * @returns 是否允许提交
 */
const validateTable = () => {
    if (!paymentRecord.value.length) {
        showToast('请选择客户并获取回款单明细');
        return false;
    }
    if (!isValidPaymentAmountPrecision(formData.allMoney)) {
        showToast('回款总额最多保留2位小数');
        return false;
    }
    const invalidRowIndex = paymentRecord.value.findIndex(
        (_, index) => Object.keys(getRecordErrors(paymentRecord.value, index)).length > 0
    );
    if (invalidRowIndex >= 0) {
        const rowErrors = getRecordErrors(paymentRecord.value, invalidRowIndex);
        const errorField = Object.keys(rowErrors)[0];
        showToast(rowErrors[errorField]);
        itemEdit(paymentRecord.value[invalidRowIndex], invalidRowIndex);
        editFormErrors.value = rowErrors;
        return false;
    }
    const balanceRow = paymentRecord.value.find(
        (item) => item.prepaymentAmount !== null && item.prepaymentAmount !== undefined && item.prepaymentAmount !== ''
    );
    const prepaymentAmount = toPaymentAmountNumber(balanceRow?.prepaymentAmount ?? formData.prepaymentAmount);
    if (overflowingTotals.value.advanceReceiptTotal > prepaymentAmount) {
        showToast('预收冲应收合计不能超过资金余额');
        return false;
    }
    const detailPaymentTotal = toAmountNumber(
        paymentRecord.value.reduce((sum, item) => sum + toNumber(item.amount), 0)
    );
    const expectedTotal = toAmountNumber(detailPaymentTotal + overflowingTotals.value.surplusRevenueTotal);
    if (expectedTotal !== toAmountNumber(formData.allMoney)) {
        showToast('回款总额必须等于回款金额合计加溢收款合计');
        return false;
    }
    return true;
};
/**
 * 构建批量回款明细提交参数。
 * @returns 后端接口需要的回款记录列表
 */
const buildRecordList = () => {
    const payDate = formatDateParam(formData.paymentDate.join('-'));
    return paymentRecord.value.map((item) => ({
        receiptCode: item.receiptCode,
        customerId: formData.customerId,
        payAmount: toPaymentAmountNumber(item.amount),
        payDate,
        handlerId: formData.handler,
        handlerName: formData.handlerName,
        overflowingType: item.overflowingType,
        surplusRevenue:
            item.overflowingType === OVERFLOWING_TYPE_NONE ? 0 : toPaymentAmountNumber(item.surplusRevenue),
        roundOff: toRoundOffNumber(item.zeroing),
        payMethod: formData.paymentType,
        remark: item.remark || '',
    }));
};
/**
 * 保存批量回款记录。
 * @returns 无返回值
 */
const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        if (!validateTable()) return;
        submitLoading.value = true;
        const res = await batchCreatePaymentRecordApi({
            customerId: formData.customerId,
            customerName: formData.customerName,
            payDate: formatDateParam(formData.paymentDate.join('-')),
            handlerId: formData.handler,
            handlerName: formData.handlerName,
            payMethod: formData.paymentType,
            payTotalAmount: toPaymentAmountNumber(formData.allMoney),
            surplusRevenueTotal: overflowingTotals.value.surplusRevenueTotal,
            advanceReceiptTotal: overflowingTotals.value.advanceReceiptTotal,
            recordList: buildRecordList(),
        });
        if (res?.code === 200) {
            router.back();
        }
    } catch (error) {
        console.error('表单验证失败', error);
    } finally {
        submitLoading.value = false;
    }
};

watch(
    () => userInfo.value,
    () => setDefaultHandler(),
    { immediate: true, deep: true }
);
</script>

<style scoped lang="less">
.wrapper-white {
    background-color: var(--base-white);
}

.bottom-btn-wrapper {
    display: flex;
    gap: 20px;
    padding: 4px 12px 8px;
    background-color: var(--base-white);
    z-index: 99;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);

    .bottom-btn {
        border-radius: 4px;
        height: 40px;
        font-size: 16px;
        font-weight: 500;
    }
}

.base.card {
    :deep(.head) {
        margin-bottom: 2px;
    }
}

.edit-popup-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #ededed;
}
.edit-popup-cancel {
    color: var(--base-grey);
    font-size: 14px;
}
.edit-popup-title {
    color: var(--base-black);
    font-size: 16px;
    font-weight: 500;
}
.edit-popup-confirm {
    color: #2c65f2;
    font-size: 14px;
}
.edit-popup-content {
    padding: 4px 12px 16px;
    height: calc(100% - 48px);
    overflow-y: auto;
}

.overflowing-type-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

:deep(.van-cell) {
    padding: 14px 0px;
    &:last-child {
        padding-bottom: 0;
    }
}

:deep(.van-cell:after) {
    border-bottom: 1px solid #ededed;
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

:deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
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
