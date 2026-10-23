<template>
    <AppPage title="编辑回款单" :showSearch="false" :showList="false">
        <template #content>
            <div class="edit-content">
                <!-- 表单卡片 -->
                <div class="form-card">
                    <Form ref="formRef" label-width="120px">
                        <field
                            v-model="formData.receiptCode"
                            name="title"
                            label="回款单编号"
                            required
                            placeholder="请输入回款单编号">
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.receiptCode || '--' }}
                                </div>
                            </template>
                        </field>
                        <field
                            v-model="formData.settlementCode"
                            name="title"
                            label="关联结算单号"
                            required
                            placeholder="请输入关联结算单号">
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.settlementCode || '--' }}
                                </div>
                            </template>
                        </field>
                        <field
                            v-model="formData.customerName"
                            name="title"
                            label="客户名称"
                            required
                            placeholder="请输入客户名称">
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.customerName || '--' }}
                                </div>
                            </template>
                        </field>
                        <field v-model="formData.handlerName" name="handlerName" label="跟单人" required>
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.handlerName || '--' }}
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
                        <field
                            v-model="formData.amountDue"
                            name="title"
                            label="应收金额"
                            required
                            placeholder="请输入应收金额">
                            <template #input>
                                <div style="color: #999">
                                    {{ formData.amountDue ?? '--' }}
                                </div>
                            </template>
                        </field>
                        <Field
                            :modelValue="formData.plannedDate.join('-')"
                            :is-link="true"
                            :required="true"
                            readonly
                            name="plannedDate"
                            label="计划回款日"
                            placeholder="请选择"
                            :rules="[{ required: true, message: '请选择计划回款日', trigger: 'onChange' }]"
                            @click="showDatePicker = true">
                        </Field>
                        <Field :modelValue="formData.fileData" label-align="top" name="fileData" label="结算附件">
                            <template #input>
                                <div>
                                    <MxWebFileUpload
                                        v-if="formData.fileData?.length"
                                        :model-value="formData.fileData"
                                        only-show
                                        force-app-size />
                                    <span v-else>--</span>
                                </div>
                            </template>
                        </Field>
                        <Field
                            name="targetUrl"
                            label-align="top"
                            v-model="formData.remark"
                            label="备注"
                            rows="5"
                            autosize
                            maxlength="200"
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
                <Button plain type="primary" block class="bottom-btn" :loading="submitLoading" :disabled="submitLoading" @click="handleSubmit('save')">保存</Button>
                <Button type="primary" block class="bottom-btn" :loading="submitLoading" :disabled="submitLoading" @click="handleSubmit('submit')">提交</Button>
            </div>
        </template>
    </AppPage>

    <MxAppDatePicker v-model="formData.plannedDate" title="选择年" v-model:show="showDatePicker" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form, Field, Button } from 'vant';
import { getPaymentDetailApi, updatePaymentApi } from '@/api';
import { PAYMENT_STATUS_CONSTANT } from '@/constants/payment';
import { formatDateParam, normalizePaymentRecord, toDatePickerValue } from '../utils';

const route = useRoute();
const router = useRouter();
const showDatePicker = ref(false);
interface IndustryNewsFormData {
    receiptCode: string;
    settlementCode: string;
    customerName: string;
    handlerName: string;
    handler: string;
    contractCode: string;
    amountDue: string | number;
    plannedDate: any[];
    fileData: any[];
    remark: string;
}

/**
 * 创建 App 编辑页空表单。
 * @returns 回款单编辑表单默认值
 */
const createEmptyForm = (): IndustryNewsFormData => {
    return {
        receiptCode: '',
        settlementCode: '',
        customerName: '',
        handlerName: '',
        handler: '',
        contractCode: '',
        amountDue: '',
        plannedDate: [],
        fileData: [],
        remark: '',
    };
};
const formData = ref<IndustryNewsFormData>(createEmptyForm());
const formRef = ref<any>(null);
const detailData = ref<any>(null);
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
const submitLoading = ref(false);
/**
 * 获取回款单详情并回填 App 编辑表单。
 * @returns 无返回值
 */
const getDetail = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = normalizePaymentRecord(res.data || {});
        formData.value = {
            receiptCode: detailData.value.receiptCode || '',
            settlementCode: detailData.value.settlementCode || '',
            customerName: detailData.value.customerName || '',
            handlerName: detailData.value.handlerName || '',
            handler: detailData.value.handler || '',
            contractCode: detailData.value.contractCode || '',
            amountDue: detailData.value.amountDue ?? '',
            plannedDate: toDatePickerValue(detailData.value.plannedDate),
            fileData: detailData.value.attachmentsList || [],
            remark: detailData.value.remark || '',
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
 * 保存或提交回款单。
 * @param type save 为草稿保存，submit 为提交进入回款中
 * @returns 无返回值
 */
const handleSubmit = async (type: 'save' | 'submit') => {
    try {
        await formRef.value?.validate();
        submitLoading.value = true;
        const res = await updatePaymentApi({
            id: editId.value,
            plannedDate: formatDateParam(formData.value.plannedDate.join('-')),
            remark: formData.value.remark || '',
            status:
                type === 'save'
                    ? PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01
                    : PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
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
