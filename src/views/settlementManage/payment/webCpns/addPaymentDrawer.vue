<template>
    <MxDrawer v-model:show="drawerShow" title="录入回款记录" size="small" :closablePop="false">
        <div class="content">
            <div class="title">基础信息</div>
            <div class="row">
                <div class="item">
                    <div class="label">关联回款单</div>
                    <div class="value blue">{{ detailData.receiptCode || '--' }}</div>
                </div>
                <div class="item">
                    <div class="label">客户名称</div>
                    <div class="value blue">{{ detailData.customerName || '--' }}</div>
                </div>
                <div class="item">
                    <div class="label">计划回款日期</div>
                    <div class="value">{{ detailData.plannedDate || '--' }}</div>
                </div>
                <div class="item">
                    <div class="label">资金余额(元)</div>
                    <div class="value">{{ detailData.prepaymentAmount ?? '--' }}</div>
                </div>
                <div class="item">
                    <div class="label">未收金额(元)</div>
                    <div class="value">{{ detailData.amountUnpaid ?? '--' }}</div>
                </div>
                <div class="item">
                    <div class="label">应收金额(元)</div>
                    <div class="value">{{ detailData.amountDue ?? '--' }}</div>
                </div>
            </div>
            <div class="title">回款信息</div>
            <n-form
                style="margin-top: 16px"
                ref="formRef"
                :model="formData"
                :rules="formRules"
                required-mark-placement="left"
                label-placement="left"
                label-align="right"
                label-width="120px">
                <n-grid :cols="1" :x-gap="0">
                    <n-grid-item>
                        <n-form-item label="回款金额(元)" path="payAmount">
                            <n-input-number
                                v-model:value="formData.payAmount"
                                placeholder="请输入"
                                :min="0"
                                :max="Number(detailData.amountUnpaid || 0)"
                                :precision="PAYMENT_AMOUNT_PRECISION" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="溢冲处理" path="overflowingType">
                            <n-radio-group v-model:value="formData.overflowingType" @update:value="handleOverflowingTypeChange">
                                <n-radio value="1">无溢收款/预收冲应收</n-radio>
                                <n-radio value="2">溢收款</n-radio>
                                <n-radio value="3">
                                    <span>预收冲应收</span>
                                    <n-tooltip trigger="hover" placement="top">
                                        <template #trigger>
                                            <n-icon class="overflowing-tip-icon" :component="InformationCircleOutline" />
                                        </template>
                                        <div>预收冲应收不能超过资金余额</div>
                                        <div>预收冲应收加上回款金额不能超过该回款单的应收金额。</div>
                                    </n-tooltip>
                                </n-radio>
                            </n-radio-group>
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item v-if="formData.overflowingType !== OVERFLOWING_TYPE_NONE">
                        <n-form-item :label="surplusRevenueLabel" path="surplusRevenue">
                            <n-input-number
                                v-model:value="formData.surplusRevenue"
                                placeholder="请输入"
                                :min="0"
                                :precision="PAYMENT_AMOUNT_PRECISION" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="经办人" path="handlerId">
                            <MxPersonSelect
                                v-model:modelValue="formData.handlerId"
                                v-model:label="formData.handlerName"
                                placeholder="请选择经办人" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="抹零数据(元)" path="roundOff">
                            <n-input-number
                                v-model:value="formData.roundOff"
                                placeholder="请输入"
                                :min="ROUND_OFF_MIN"
                                :max="ROUND_OFF_MAX"
                                :precision="2" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="回款方式" path="payMethod">
                            <n-select v-model:value="formData.payMethod" placeholder="请选择" :options="paymentTypes" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="回款日期" path="payDate">
                            <n-date-picker v-model:value="formData.payDate" placeholder="请选择" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="备注" path="remark">
                            <n-input
                                v-model:value.trim="formData.remark"
                                type="textarea"
                                placeholder="请输入"
                                :rows="4"
                                :maxlength="500"
                                show-count />
                        </n-form-item>
                    </n-grid-item>
                </n-grid>
            </n-form>
        </div>
        <template #footer>
            <div class="drawer-footer">
                <n-button color="#2C65F2" :loading="submitLoading" :disabled="submitLoading" @click="handleSave" ghost>保 存</n-button>
            </div>
        </template>
    </MxDrawer>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue';
import {
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NDatePicker,
    NGrid,
    NGridItem,
    NIcon,
    NInputNumber,
    NRadio,
    NRadioGroup,
    NTooltip,
} from 'naive-ui';
import { InformationCircleOutline } from '@vicons/ionicons5';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import { createPaymentRecordApi } from '@/api';
import {
    formatDateParam,
    isValidPaymentAmountPrecision,
    isValidRoundOff,
    PAYMENT_AMOUNT_PRECISION,
    ROUND_OFF_MAX,
    ROUND_OFF_MIN,
    OVERFLOWING_TYPE_NONE,
    OVERFLOWING_TYPE_PREPAYMENT_OFFSET,
    OVERFLOWING_TYPE_SURPLUS_REVENUE,
    toPaymentAmountNumber,
    toRoundOffNumber,
    validatePrepaymentOffset,
} from '../utils';

const emit = defineEmits(['refresh']);
const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
const drawerShow = ref(false);
const formRef = ref<any>(null);
const submitLoading = ref(false);
const formData = reactive<any>({
    payDate: dayjs().valueOf(),
    payAmount: null as number | null,
    handlerId: '',
    handlerName: '',
    roundOff: 0,
    payMethod: '',
    remark: '',
    overflowingType: OVERFLOWING_TYPE_NONE,
    surplusRevenue: 0,
});
const paymentTypes = computed(() => dictMap.value?.['回款方式'] || []);
const surplusRevenueLabel = computed(() =>
    formData.overflowingType === OVERFLOWING_TYPE_SURPLUS_REVENUE ? '溢收款(元)' : '预收冲应收(元)'
);
/**
 * 创建必填数字校验器。
 * @param message 校验失败文案
 * @returns Naive UI 表单校验函数
 */
const validateRequiredNumber = (message: string) => (_: any, value: number | null) => {
    if (value === null || value === undefined || value === '') {
        return new Error(message);
    }
    return true;
};
// 录入回款记录表单校验规则。
const formRules = {
    payDate: {
        required: true,
        trigger: ['change', 'blur'],
        validator: validateRequiredNumber('请选择回款日期'),
    },
    payAmount: {
        required: true,
        trigger: ['change', 'blur'],
        validator(_: any, value: number | null) {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入回款金额');
            }
            if (Number(value) < 0) {
                return new Error('回款金额不能小于0');
            }
            if (!isValidPaymentAmountPrecision(value)) {
                return new Error('回款金额最多保留2位小数');
            }
            if (Number(value) > Number(detailData.value.amountUnpaid || 0)) {
                return new Error('回款金额不能超过未回款金额');
            }
            return true;
        },
    },
    surplusRevenue: {
        trigger: ['change', 'blur'],
        validator(_: any, value: number | null) {
            if (formData.overflowingType === OVERFLOWING_TYPE_NONE) return true;
            if (value === null || value === undefined || value === '') {
                return new Error('请输入溢收款/预收冲应收金额');
            }
            if (Number(value) < 0) {
                return new Error('溢收款/预收冲应收金额不能小于0');
            }
            if (!isValidPaymentAmountPrecision(value)) {
                return new Error('溢收款/预收冲应收金额最多保留2位小数');
            }
            if (formData.overflowingType === OVERFLOWING_TYPE_PREPAYMENT_OFFSET) {
                const result = validatePrepaymentOffset(
                    value,
                    formData.payAmount,
                    detailData.value.prepaymentAmount,
                    detailData.value.amountDue
                );
                if (!result.withinBalance) {
                    return new Error('预收冲应收金额不能超过资金余额');
                }
                if (!result.withinDue) {
                    return new Error('预收冲应收金额加上回款金额不能超过该回款单的应收金额');
                }
            }
            return true;
        },
    },
    handlerId: { required: true, message: '请选择经办人', trigger: ['change', 'blur'] },
    roundOff: {
        trigger: ['change', 'blur'],
        validator(_: any, value: number | null) {
            if (!isValidRoundOff(value)) {
                return new Error('抹零数据需在0到999之间，且最多保留2位小数');
            }
            return true;
        },
    },
    payMethod: { required: true, message: '请选择回款方式', trigger: ['change', 'blur'] },
};
/**
 * 重置录入回款记录表单。
 * @returns 无返回值
 */
const resetForm = () => {
    formData.payDate = dayjs().valueOf();
    formData.payAmount = Number(detailData.value.amountUnpaid || 0);
    formData.handlerId = userInfo.value?.code || '';
    formData.handlerName = userInfo.value?.username || '';
    formData.roundOff = 0;
    formData.payMethod = '';
    formData.remark = '';
    formData.overflowingType = OVERFLOWING_TYPE_NONE;
    formData.surplusRevenue = 0;
};

/**
 * 处理溢收款类型切换。
 * @param value 溢收款类型
 * @returns 无返回值
 */
const handleOverflowingTypeChange = (value: string) => {
    if (value === OVERFLOWING_TYPE_NONE) {
        formData.surplusRevenue = 0;
    }
    formRef.value?.restoreValidation?.();
};
/**
 * 保存单条回款记录。
 * @returns 无返回值
 */
const handleSave = async () => {
    try {
        await formRef.value?.validate();
        submitLoading.value = true;
        const res = await createPaymentRecordApi({
            receiptCode: detailData.value.receiptCode,
            customerId: detailData.value.customerId,
            payAmount: toPaymentAmountNumber(formData.payAmount),
            payDate: formatDateParam(formData.payDate),
            handlerId: formData.handlerId,
            handlerName: formData.handlerName,
            roundOff: toRoundOffNumber(formData.roundOff),
            payMethod: formData.payMethod,
            remark: formData.remark || '',
            overflowingType: formData.overflowingType,
            surplusRevenue:
                formData.overflowingType === OVERFLOWING_TYPE_NONE ? 0 : toPaymentAmountNumber(formData.surplusRevenue),
        });
        if (res?.code === 200) {
            drawerShow.value = false;
            emit('refresh');
        }
    } catch (error) {
        console.error('保存回款记录失败:', error);
    } finally {
        submitLoading.value = false;
    }
};
const detailData = ref<any>({});
/**
 * 打开录入回款记录抽屉。
 * @param row 当前回款单数据
 * @returns 无返回值
 */
const showDrawer = (row) => {
    detailData.value = row;
    resetForm();
    drawerShow.value = true;
};
watch(
    () => drawerShow.value,
    (newVal) => {
        if (!newVal) {
            formRef.value?.restoreValidation?.();
        }
    },
    { immediate: true }
);

defineExpose({
    showDrawer,
});
</script>

<style scoped lang="less">
.content {
    padding: 0px 16px 16px;
    box-sizing: border-box;
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
.drawer-footer {
    display: flex;
    justify-content: center;
    width: 100%;
}
.row {
    display: flex;
    flex-wrap: wrap;
    .item {
        display: flex;
        width: 50%;
        margin-top: 16px;
        .label {
            font-size: 14px;
            color: #999999;
            margin-right: 8px;
            width: 90px;
            text-align: right;
        }
        .value {
            font-size: 14px;
            color: #333333;
        }
    }
}
.overflowing-tip-icon {
    margin-left: 4px;
    color: #999999;
    cursor: help;
    vertical-align: -2px;
}
</style>
