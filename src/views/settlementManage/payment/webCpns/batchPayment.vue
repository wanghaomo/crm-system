<template>
    <WebPage contentPadding="0px" :hideAddBtn="true" showBack  show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton @click="saveTable()" :disabled="submitLoading">保 存</MxButton>
        </template>
        <template #content>
            <div class="main">
                <div class="big-title">批量回款</div>
                <div class="title" style="margin-bottom:16px;">基础信息</div>
                <n-form
                    ref="formRef"
                    :model="formData"
                    :rules="rules"
                    require-mark-placement="left"
                    label-placement="left"
                    label-align="right"
                    label-width="120px">
                    <n-grid :cols="2" :x-gap="16" :y-gap="0">
                        <n-grid-item>
                            <n-form-item label="客户名称" path="customerId">
                                <MxCommSelect
                                    v-model="formData.customerId"
                                    v-model:label="formData.customerName"
                                    typeName="批量回款客户"
                                    placeholder="请选择"
                                    @changeEvt="handleCustomerChange" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="资金余额(元)">
                                <n-input-number
                                    :value="formData.prepaymentAmount"
                                    :precision="PAYMENT_AMOUNT_PRECISION"
                                    disabled />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="回款日期" path="paymentDate">
                                <n-date-picker v-model:value="formData.paymentDate" placeholder="请选择" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="经办人" path="handler">
                                <MxPersonSelect
                                    v-model:modelValue="formData.handler"
                                    v-model:label="formData.handlerName"
                                    placeholder="请选择经办人" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="回款方式" path="paymentType">
                                <n-select
                                    v-model:value="formData.paymentType"
                                    :options="paymentTypes"
                                    placeholder="请选择" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="回款总额(元)" path="allMoney">
                                <n-input-number
                                    v-model:value="formData.allMoney"
                                    placeholder="请输入"
                                    :min="0"
                                    :precision="PAYMENT_AMOUNT_PRECISION" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="溢收款(元)">
                                <n-input-number
                                    :value="overflowingTotals.surplusRevenueTotal"
                                    :precision="PAYMENT_AMOUNT_PRECISION"
                                    disabled />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="预收冲应收(元)">
                                <n-input-number
                                    :value="overflowingTotals.advanceReceiptTotal"
                                    :precision="PAYMENT_AMOUNT_PRECISION"
                                    disabled />
                            </n-form-item>
                        </n-grid-item>
                    </n-grid>
                </n-form>
                <div class="title" style="margin: 0;">回款单明细表</div>

                <MxWebDataTable v-bind="tableConfig"> </MxWebDataTable>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { computed, ref, reactive, h, watch } from 'vue';
import { NInput, NSelect, NForm, NFormItem, NGrid, NGridItem, NDatePicker, NInputNumber } from 'naive-ui';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
const router = useRouter();
import { batchCreatePaymentRecordApi, getPaymentReceiptListApi } from '@/api';
import {
    calculateOverflowingTotals,
    formatDateParam,
    getBatchPaymentRowErrors,
    isValidPaymentAmountPrecision,
    normalizePaymentRecord,
    OVERFLOWING_TYPE_NONE,
    OVERFLOWING_TYPE_OPTIONS,
    OVERFLOWING_TYPE_PREPAYMENT_OFFSET,
    OVERFLOWING_TYPE_SURPLUS_REVENUE,
    PAYMENT_AMOUNT_PRECISION,
    ROUND_OFF_MAX,
    ROUND_OFF_MIN,
    toPaymentAmountNumber,
    toRoundOffNumber,
} from '../utils';
const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
const formData = reactive({
    customerId: '', // 客户ID
    customerName: '', // 客户名称
    paymentDate: dayjs().valueOf(), // 回款日期
    handler: '', // 经办人
    handlerName: '',
    paymentType: '', // 回款方式
    allMoney: null as number | null, // 回款总额(元)
    prepaymentAmount: 0, // 客户资金余额(元)
});
const formRef = ref<any>(null);
const submitLoading = ref(false);
// 表单验证规则
const rules = {
    customerId: { required: true, message: '请选择客户名称', trigger: ['change'] },
    paymentDate: {
        required: true,
        trigger: ['change', 'blur'],
        validator(_: any, value: number | null) {
            if (value === null || value === undefined) {
                return new Error('请选择回款日期');
            }
            return true;
        },
    },
    handler: { required: true, message: '请选择经办人', trigger: ['change'] },
    paymentType: { required: true, message: '请选择回款方式', trigger: ['change'] },
    allMoney: {
        required: true,
        trigger: ['change', 'blur'],
        validator(_: any, value: number | null) {
            if (value === null || value === undefined) {
                return new Error('请输入回款总额');
            }
            if (Number.isNaN(Number(value)) || Number(value) < 0) {
                return new Error('回款总额不能小于0');
            }
            if (!isValidPaymentAmountPrecision(value)) {
                return new Error('回款总额最多保留2位小数');
            }
            return true;
        },
    },
};
const paymentTypes = computed(() => dictMap.value?.['回款方式'] || []);

/**
 * 获取明细行字段错误。
 * @param row 当前回款明细
 * @returns 字段错误映射
 */
const getRowErrors = (row: any) => {
    return getBatchPaymentRowErrors(row);
};

/**
 * 获取指定字段的行级提示文案。
 * @param row 当前回款明细
 * @param index 表格行下标
 * @param field 字段名
 * @returns 带行号的错误文案
 */
const getRowErrorText = (row: any, index: number, field: string) => {
    const error = getRowErrors(row)[field];
    return error ? `第${index + 1}行${error}` : '';
};

/**
 * 渲染带错误状态的表格输入控件。
 * @param component Naive UI 控件
 * @param props 控件属性
 * @param error 错误文案
 * @returns 控件节点
 */
const renderFieldWithError = (component: any, props: Record<string, any>, error: string) => {
    return h('div', { class: 'batch-payment-field' }, [
        h(component, { ...props, status: error ? 'error' : undefined }),
    ]);
};

/**
 * 更新明细溢冲处理类型并清空旧类型金额。
 * @param row 当前回款明细
 * @param value 新的溢冲处理类型
 * @returns 无返回值
 */
const handleOverflowingTypeChange = (row: any, value: string) => {
    if (row.overflowingType !== value) {
        row.surplusRevenue = 0;
    }
    row.overflowingType = value;
};

// 批量回款明细表格配置，回款金额、溢冲处理、抹零数据和备注支持行内编辑。
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'receiptCode',
            title: '关联回款单',
            width: 140,
        },
        {
            key: 'contractCode',
            title: '合同编号',
            width: 140,
        },
        {
            key: 'plannedDate',
            title: '计划回款日期',
            width: 140,
        },
        {
            key: 'amount',
            title: '回款金额(元)',
            isRule: true,
            width: 200,
            render(row: any, index: number) {
                return renderFieldWithError(NInputNumber, {
                    value: row.amount,
                    min: 0,
                    max: Number(row.amountUnpaid || 0),
                    precision: PAYMENT_AMOUNT_PRECISION,
                    'onUpdate:value': (val: any) => {
                        row.amount = val;
                    },
                }, getRowErrorText(row, index, 'amount'));
            },
        },
        {
            key: 'overflowingType',
            title: '溢冲处理',
            width: 210,
            render(row: any, index: number) {
                return renderFieldWithError(NSelect, {
                    value: row.overflowingType,
                    options: OVERFLOWING_TYPE_OPTIONS,
                    'onUpdate:value': (value: string) => handleOverflowingTypeChange(row, value),
                }, getRowErrorText(row, index, 'overflowingType'));
            },
        },
        {
            key: 'surplusRevenueAmount',
            title: '溢收款(元)',
            width: 150,
            render: (row: any, index: number) =>
                row.overflowingType === OVERFLOWING_TYPE_SURPLUS_REVENUE
                    ? renderFieldWithError(NInputNumber, {
                          value: row.surplusRevenue,
                          min: 0,
                          precision: PAYMENT_AMOUNT_PRECISION,
                          'onUpdate:value': (value: any) => {
                              row.surplusRevenue = value;
                          },
                      }, getRowErrorText(row, index, 'surplusRevenue'))
                    : '--',
        },
        {
            key: 'advanceReceiptAmount',
            title: '预收冲应收(元)',
            width: 170,
            render: (row: any, index: number) =>
                row.overflowingType === OVERFLOWING_TYPE_PREPAYMENT_OFFSET
                    ? renderFieldWithError(NInputNumber, {
                          value: row.surplusRevenue,
                          min: 0,
                          precision: PAYMENT_AMOUNT_PRECISION,
                          'onUpdate:value': (value: any) => {
                              row.surplusRevenue = value;
                          },
                      }, getRowErrorText(row, index, 'surplusRevenue'))
                    : '--',
        },
        {
            key: 'zeroing',
            title: '抹零数据(元)',
            width: 200,
            render(row: any, index: number) {
                return renderFieldWithError(NInputNumber, {
                    value: row.zeroing,
                    min: ROUND_OFF_MIN,
                    max: ROUND_OFF_MAX,
                    precision: 2,
                    'onUpdate:value': (val: any) => {
                        row.zeroing = val;
                    },
                }, getRowErrorText(row, index, 'zeroing'));
            },
        },
        {
            key: 'remark',
            title: '备注',
            width: 200,
            render(row: any) {
                return h(NInput, {
                    value: row.remark,
                    maxlength: 500,
                    showCount: true,
                    'onUpdate:value': (val) => {
                        row.remark = val;
                    },
                });
            },
        },
    ],
    // 表格数据
    tableList: [],
    isShowPagination: false,
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
    },
    bordered: true,
    bottomBordered: true,
    singleLine: false,
});
const overflowingTotals = computed(() => calculateOverflowingTotals(tableConfig.value.tableList));
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
 * 默认使用当前登录用户作为经办人。
 * @returns 无返回值
 */
const setDefaultHandler = () => {
    formData.handler = userInfo.value?.code || '';
    formData.handlerName = userInfo.value?.username || '';
};
/**
 * 将客户名下可回款单转换为批量回款明细行。
 * @param records 可回款单列表
 * @returns 无返回值，结果写入明细表格
 */
const fillReceiptRows = (records: any[]) => {
    tableConfig.value.tableList = records.map((item) => {
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
    tableConfig.value.tableList = [];
    if (!formData.customerId) return;
    try {
        const res = await getPaymentReceiptListApi(formData.customerId);
        if (res && res.code === 200) {
            fillReceiptRows(res.data || []);
        }
    } catch (error) {
        console.error('Failed to obtain receipt list:', error);
    }
};
/**
 * 构建批量回款明细提交参数。
 * @returns 后端接口需要的回款记录列表
 */
const buildRecordList = () => {
    const payDate = formatDateParam(formData.paymentDate);
    return tableConfig.value.tableList.map((item: any) => ({
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
 * 校验批量回款明细金额。
 * @returns 是否允许提交
 */
const validateTable = () => {
    if (!tableConfig.value.tableList.length) {
        window.$message?.warning?.('请选择客户并获取回款单明细');
        return false;
    }
    const invalidRowIndex = tableConfig.value.tableList.findIndex(
        (item: any) => Object.keys(getRowErrors(item)).length > 0
    );
    if (invalidRowIndex >= 0) {
        const invalidRow = tableConfig.value.tableList[invalidRowIndex];
        const errorField = Object.keys(getRowErrors(invalidRow))[0];
        window.$message?.warning?.(getRowErrorText(invalidRow, invalidRowIndex, errorField));
        return false;
    }
    const balanceRow = tableConfig.value.tableList.find(
        (item: any) => item.prepaymentAmount !== null && item.prepaymentAmount !== undefined && item.prepaymentAmount !== ''
    );
    const prepaymentAmount = toPaymentAmountNumber(balanceRow?.prepaymentAmount ?? formData.prepaymentAmount);
    if (overflowingTotals.value.advanceReceiptTotal > prepaymentAmount) {
        window.$message?.warning?.('预收冲应收合计不能超过资金余额');
        return false;
    }
    const detailPaymentTotal = toPaymentAmountNumber(
        tableConfig.value.tableList.reduce((sum: number, item: any) => sum + toNumber(item.amount), 0)
    );
    const expectedTotal = toPaymentAmountNumber(
        detailPaymentTotal + overflowingTotals.value.surplusRevenueTotal
    );
    if (expectedTotal !== toPaymentAmountNumber(formData.allMoney)) {
        window.$message?.warning?.('回款总额必须等于回款金额合计加溢收款合计');
        return false;
    }
    return true;
};
/**
 * 保存批量回款记录。
 * @returns 无返回值
 */
const saveTable = async () => {
    try {
        await formRef.value?.validate();
        if (!validateTable()) return;
        submitLoading.value = true;
        const res = await batchCreatePaymentRecordApi({
            customerId: formData.customerId,
            customerName: formData.customerName,
            payDate: formatDateParam(formData.paymentDate),
            handlerId: formData.handler,
            handlerName: formData.handlerName,
            payMethod: formData.paymentType,
            payTotalAmount: toNumber(formData.allMoney),
            surplusRevenueTotal: overflowingTotals.value.surplusRevenueTotal,
            advanceReceiptTotal: overflowingTotals.value.advanceReceiptTotal,
            recordList: buildRecordList(),
        });
        if (res?.code === 200) {
            router.back();
        }
    } catch (error) {
        console.error('批量回款保存失败:', error);
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
.main {
    padding: 0 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.big-title {
    font-size: 16px;
    color: #333333;
    font-weight: 600;
    margin-top: 16px;
}
.title {
    font-size: 14px;
    color: #333333;
    font-weight: 600;
    position: relative;
    padding-left: 12px;
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
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

</style>
