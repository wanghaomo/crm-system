<template>
    <AppPage title="补充回款明细" :showSearch="false" :showList="false">
        <template #content>
            <div class="edit-content">
                <!-- 表单卡片 -->
                <div class="form-card">
                    <Form ref="formRef" label-width="120px">
                        <field
                            v-model="formData.receiptCode"
                            name="title"
                            label="关联回款单"
                            required
                            placeholder="请输入关联回款单">
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.receiptCode || '--' }}
                                </div>
                            </template>
                        </field>
                        <field
                            v-model="formData.contractCode"
                            name="title"
                            label="合同编号"
                            required
                            placeholder="请输入合同编号">
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.contractCode || '--' }}
                                </div>
                            </template>
                        </field>
                        <Field
                            :modelValue="formData.plannedDate.join('-')"
                            :is-link="true"
                            :required="true"
                            readonly
                            name="publishTime"
                            label="计划回款日期"
                            placeholder="请选择"
                            :rules="[
                                { required: true, message: '请选择计划回款日期', trigger: 'onChange' },
                            ]"
                            @click="showDatePicker = true">
                        </Field>
                        <field
                            v-model="formData.amount"
                            name="title"
                            label="回款金额(元)"
                            required
                            type="number"
                            :formatter="formatPaymentAmountInput"
                            format-trigger="onChange"
                            placeholder="请输入回款金额(元)">
                        </field>
                        <field
                            v-model="formData.zeroingAmount"
                            name="zeroingAmount"
                            label="抹零数据(元)"
                            type="number"
                            :formatter="formatRoundOffInput"
                            format-trigger="onChange"
                            placeholder="请输入抹零数据(元)">
                        </field>
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
                </div>
            </div>
        </template>

        <!-- 底部按钮：保存 + 提交 -->
        <template #footer>
            <div class="bottom-btn-wrapper">
                <Button type="primary" block class="bottom-btn" @click="handleSubmit">保存</Button>
            </div>
        </template>
    </AppPage>

    <MxAppDatePicker v-model="formData.plannedDate" title="选择年" v-model:show="showDatePicker" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form, Field, Button } from 'vant';
import { getPaymentDetailApi } from '@/api';
import { formatPaymentAmountInput, formatRoundOffInput, normalizePaymentRecord, toDatePickerValue } from '../utils';

const route = useRoute();
const router = useRouter();
const showDatePicker = ref(false);
interface IndustryNewsFormData {
    receiptCode: string;
    contractCode: string;
    plannedDate: any[];
    amount: string;
    zeroingAmount: string;
    fileData: any[];
    remark: string;
}

/**
 * 创建补充回款明细空表单。
 * @returns 补充回款明细表单默认值
 */
const createEmptyForm = (): IndustryNewsFormData => {
    return {
        receiptCode: '',
        contractCode: '',
        plannedDate: [],
        amount: '',
        zeroingAmount: '',
        fileData: [],
        remark: '',
    };
};
const formData = ref<IndustryNewsFormData>(createEmptyForm());
const formRef = ref<any>(null);
const detailData = ref<any>(null);
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
/**
 * 获取回款单详情并回填补充明细表单。
 * @returns 无返回值
 */
const getDetail = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = normalizePaymentRecord(res.data || {});
        formData.value = {
            receiptCode: detailData.value.receiptCode || '',
            contractCode: detailData.value.contractCode || '',
            plannedDate: toDatePickerValue(detailData.value.plannedDate),
            amount: '',
            zeroingAmount: '',
            fileData: [],
            remark: '',
        };
    } catch (error) {
        console.error('Failed to obtain details:', error);
    }
};
onMounted(() => {
    if (editId.value) {
        getDetail();
    } else {
        formData.value = createEmptyForm();
    }
});
/**
 * 保存补充回款明细。
 * @returns 无返回值
 */
const handleSubmit = async () => {
    try {
        router.back();
        // await formRef.value?.validate();
        // console.log('formData.value', formData.value);
    } catch (error) {
        console.error('表单验证失败', error);
    }
};
</script>

<style scoped lang="less">
.edit-content {
    padding: 2px 0 8px;

    .form-card {
        padding: 4px 0px;
        background: #ffffff;
        border-radius: 10px;
        :deep(.van-cell) {
            padding: 14px 12px;
        }
        :deep(.van-cell:after) {
            border-bottom: 1px solid #ededed;
        }
    }
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
</style>
