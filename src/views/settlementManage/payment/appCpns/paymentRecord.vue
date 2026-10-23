<template>
    <AppPage ref="appPageRef" title="录入回款信息" :showSearch="false" :showList="false">
        <template #sub-title>
            <div class="wrapper-white">
                <div class="head">
                    <div class="left">
                        <div class="title">
                            {{ detailData.customerName || '--' }}
                        </div>
                        <MxAppDescriptions class="detail-descriptions" :data="descriptionsData" :column="1" />
                    </div>
                </div>
            </div>
        </template>

        <template #content>
            <card title="回款信息">
                <Form ref="formRef" label-width="120px">
                    <field
                        style="padding-top: 4px;"
                        v-model="formData.payAmount"
                        name="payAmount"
                        label="回款金额(元)"
                        required
                        type="number"
                        :formatter="formatPaymentAmountInput"
                        format-trigger="onChange"
                        :rules="[{ required: true, message: '请输入回款金额', trigger: 'onChange' }]"
                        placeholder="请输入">
                    </field>
                    <Field name="overflowingType" label="溢冲处理" required>
                        <template #input>
                            <RadioGroup v-model="formData.overflowingType" direction="horizontal" @change="handleOverflowingTypeChange">
                                <Radio name="1">无溢收款/预收冲应收</Radio>
                                <Radio name="2">溢收款</Radio>
                                <Radio name="3">
                                    <span>预收冲应收</span>
                                    <Popover v-model:show="showPrepaymentOffsetTip" placement="top">
                                        <template #reference>
                                            <Icon class="overflowing-tip-icon" name="info-o" size="16" />
                                        </template>
                                        <div class="overflowing-tip-content">
                                            <div>预收冲应收不能超过资金余额</div>
                                            <div>预收冲应收加上回款金额不能超过该回款单的应收金额。</div>
                                        </div>
                                    </Popover>
                                </Radio>
                            </RadioGroup>
                        </template>
                    </Field>
                    <field
                        v-if="formData.overflowingType !== OVERFLOWING_TYPE_NONE"
                        v-model="formData.surplusRevenue"
                        name="surplusRevenue"
                        :label="surplusRevenueLabel"
                        type="number"
                        :formatter="formatPaymentAmountInput"
                        format-trigger="onChange"
                        :rules="[{ required: true, message: '请输入溢收款/预收冲应收金额', trigger: 'onChange' }]"
                        placeholder="请输入">
                    </field>
                    <MxPersonSelect
                        :clearable="true"
                        title="经办人"
                        :required="true"
                        name="handlerId"
                        placeholder="请选择经办人"
                        :rules="[{ required: true, message: '请选择经办人', trigger: 'onChange' }]"
                        v-model="formData.handlerId"
                        v-model:label="formData.handlerName">
                    </MxPersonSelect>
                    <field
                        v-model="formData.roundOff"
                        name="roundOff"
                        label="抹零数据(元)"
                        type="number"
                        :formatter="formatRoundOffInput"
                        format-trigger="onChange"
                        placeholder="请输入">
                    </field>
                    <MxCommSelect
                        v-model="formData.payMethod"
                        v-model:label="formData.payMethodLabel"
                        title="回款方式"
                        name="payMethod"
                        :required="true"
                        :options="paymentTypes"
                        :rules="[{ required: true, message: '请选择回款方式', trigger: 'onChange' }]"
                        :clearable="true"
                        :text="false" />
                    <Field
                        :modelValue="formData.payDate.join('-')"
                        :is-link="true"
                        :required="true"
                        readonly
                        name="payDate"
                        label="回款日期"
                        placeholder="请选择"
                        :rules="[{ required: true, message: '请选择回款日期', trigger: 'onChange' }]"
                        @click="showDatePicker = true">
                    </Field>
                    <Field
                        name="targetUrl"
                        label-align="top"
                        v-model="formData.remark"
                        label="备注"
                        rows="5"
                        autosize
                        maxlength="500"
                        type="textarea"
                        show-word-limit
                        clearable
                        placeholder="请输入" />
                </Form>
            </card>
        </template>
        <!-- 底部按钮：保存 + 提交 -->
        <template #footer>
            <div class="bottom-btn-wrapper">
                <Button type="primary" block class="bottom-btn" :loading="submitLoading" :disabled="submitLoading" @click="handleSubmit()">保存</Button>
            </div>
        </template>
    </AppPage>
    <MxAppDatePicker v-model="formData.payDate" title="选择回款日期" v-model:show="showDatePicker" />
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue';
import { Form, Field, Button, Icon, Popover, RadioGroup, Radio, showToast } from 'vant';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import card from './card.vue';
import { deepClone } from '@/utils/comm';
import { createPaymentRecordApi, getPaymentDetailApi } from '@/api';
import {
    formatDateParam,
    formatPaymentAmountInput,
    formatRoundOffInput,
    isValidPaymentAmountPrecision,
    isValidRoundOff,
    normalizePaymentRecord,
    OVERFLOWING_TYPE_NONE,
    OVERFLOWING_TYPE_PREPAYMENT_OFFSET,
    OVERFLOWING_TYPE_SURPLUS_REVENUE,
    toDatePickerValue,
    toPaymentAmountNumber,
    toRoundOffNumber,
    validatePrepaymentOffset,
} from '../utils';
const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
const detailData = ref<any>({});
const descriptionsData = ref([
    {
        label: '关联回款单',
        value: '',
    },
    {
        label: '计划回款日期',
        value: '',
    },
    {
        label: '资金余额(元)',
        value: '',
    },
    {
        label: '未收金额(元)',
        value: '',
    },
    {
        label: '应收金额(元)',
        value: '',
    },
]);
const showDatePicker = ref(false);
const showPrepaymentOffsetTip = ref(false);
const appPageRef = ref<any>(null);
const route = useRoute();
const router = useRouter();
const formRef = ref<any>(null);
const submitLoading = ref(false);

const paymentTypes = computed(() => dictMap.value?.['回款方式'] || []);
const formData = reactive<any>({
    payDate: toDatePickerValue(new Date()),
    payAmount: '',
    handlerId: '',
    handlerName: '',
    roundOff: 0,
    payMethod: '',
    payMethodLabel: '',
    remark: '',
    overflowingType: OVERFLOWING_TYPE_NONE,
    surplusRevenue: '',
});
const surplusRevenueLabel = computed(() =>
    formData.overflowingType === OVERFLOWING_TYPE_SURPLUS_REVENUE ? '溢收款(元)' : '预收冲应收(元)'
);
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
    formData.handlerId = userInfo.value?.code || '';
    formData.handlerName = userInfo.value?.username || '';
};
/**
 * 校验 App 录入回款金额和抹零数据。
 * @returns 是否允许提交
 */
const validateFormValue = () => {
    const payAmount = toNumber(formData.payAmount);
    if (payAmount < 0) {
        showToast('回款金额不能小于0');
        return false;
    }
    if (!isValidPaymentAmountPrecision(formData.payAmount)) {
        showToast('回款金额最多保留2位小数');
        return false;
    }
    if (payAmount > toNumber(detailData.value.amountUnpaid)) {
        showToast('回款金额不能超过未回款金额');
        return false;
    }
    if (!isValidRoundOff(formData.roundOff)) {
        showToast('抹零数据需在0到999之间，且最多保留2位小数');
        return false;
    }
    if (formData.overflowingType !== OVERFLOWING_TYPE_NONE) {
        if (formData.surplusRevenue === '' || formData.surplusRevenue === null || formData.surplusRevenue === undefined) {
            showToast('请输入溢收款/预收冲应收金额');
            return false;
        }
        if (!isValidPaymentAmountPrecision(formData.surplusRevenue)) {
            showToast('溢收款/预收冲应收金额最多保留2位小数');
            return false;
        }
        if (toNumber(formData.surplusRevenue) < 0) {
            showToast('溢收款/预收冲应收金额不能小于0');
            return false;
        }
        if (formData.overflowingType === OVERFLOWING_TYPE_PREPAYMENT_OFFSET) {
            const result = validatePrepaymentOffset(
                formData.surplusRevenue,
                formData.payAmount,
                detailData.value.prepaymentAmount,
                detailData.value.amountDue
            );
            if (!result.withinBalance) {
                showToast('预收冲应收金额不能超过资金余额');
                return false;
            }
            if (!result.withinDue) {
                showToast('预收冲应收金额加上回款金额不能超过该回款单的应收金额');
                return false;
            }
        }
    }
    return true;
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
};
/**
 * 保存单条回款记录。
 * @returns 无返回值
 */
const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        if (!validateFormValue()) return;
        submitLoading.value = true;
        const res = await createPaymentRecordApi({
            receiptCode: detailData.value.receiptCode,
            customerId: detailData.value.customerId,
            payAmount: toPaymentAmountNumber(formData.payAmount),
            payDate: formatDateParam(formData.payDate.join('-')),
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
            router.back();
        }
    } catch (error) {
        console.error('表单验证失败', error);
    } finally {
        submitLoading.value = false;
    }
};
/**
 * 获取当前回款单详情并初始化回款金额。
 * @returns 无返回值
 */
const getDetaily = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = normalizePaymentRecord(deepClone(res?.data || {}));
        descriptionsData.value[0].value = detailData.value.receiptCode;
        descriptionsData.value[1].value = detailData.value.plannedDate;
        descriptionsData.value[2].value = detailData.value.prepaymentAmount ?? '--';
        descriptionsData.value[3].value = detailData.value.amountUnpaid ?? '--';
        descriptionsData.value[4].value = detailData.value.amountDue ?? '--';
        formData.payAmount = detailData.value.amountUnpaid ?? '';
        formData.overflowingType = OVERFLOWING_TYPE_NONE;
        formData.surplusRevenue = 0;
    } catch (error) {
        console.error('Failed to obtain details:', error);
    }
};
getDetaily();

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
.head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 12px 0px;
    .title {
        font-size: 16px;
        color: #333333;
        font-weight: 500;
        margin-bottom: 8px;
    }
    .status-tag {
        padding: 2px 8px;
        font-size: 12px;
        color: #67c23a;
        background: #e8f5e8;
        border-radius: 4px;
        line-height: 1.4;
        margin-right: 8px;
        font-weight: normal;
    }
}

:deep(.van-cell) {
    padding: 14px 0px;
}
:deep(.van-cell:after) {
    border-bottom: 1px solid #ededed;
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

:deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
        }
.overflowing-tip-icon {
    margin-left: 4px;
    color: var(--base-grey);
    vertical-align: -2px;
}
.overflowing-tip-content {
    max-width: 280px;
    line-height: 20px;
}
</style>
