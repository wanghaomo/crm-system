<template>
    <WebPage contentPadding="0px" :hideAddBtn="true" showBack  show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton @click="saveTable('save')" :disabled="submitLoading" border>保 存</MxButton>
            <MxButton @click="saveTable('submit')" :disabled="submitLoading">提 交</MxButton>
        </template>
        <template #content>
            <div class="main">
                <div class="big-title">回款单信息</div>
                <div style="margin: 16px 0;">
                    <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="120px">
                        <n-grid :cols="2" :x-gap="16" :y-gap="0">
                            <n-grid-item>
                                <n-form-item label="回款单编号" required path="receiptCode">
                                    <n-input disabled v-model:value="formData.receiptCode" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="关联结算单号" required path="settlementCode">
                                    <n-input disabled v-model:value="formData.settlementCode" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="客户名称" required path="customerName">
                                    <n-input disabled v-model:value="formData.customerName" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="合同编号" required path="contractCode">
                                    <n-input disabled v-model:value="formData.contractCode" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="跟单人" required path="handler">
                                    <n-input disabled v-model:value="formData.handlerName" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="计划回款日" required path="plannedDate">
                                    <n-date-picker v-model:value="formData.plannedDate" placeholder="请选择" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="应收金额(元)" path="amountDue">
                                    <n-input disabled v-model:value="formData.amountDue" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item span="2">
                                <n-form-item label="结算附件">
                                    <MxWebFileUpload
                                        v-if="formData.attachmentsList?.length"
                                        :model-value="formData.attachmentsList"
                                        only-show
                                        force-app-size />
                                    <span v-else>--</span>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item span="2">
                                <n-form-item label="备注">
                                    <n-input v-model:value="formData.remark" type="textarea" maxlength="500" show-count rows="5" placeholder="请输入" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                    </n-form>
                </div>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { NInput, NForm, NFormItem, NGrid, NGridItem, NDatePicker } from 'naive-ui';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();
import { getPaymentDetailApi, updatePaymentApi } from '@/api';
import { PAYMENT_STATUS_CONSTANT } from '@/constants/payment';
import { formatDateParam, normalizePaymentRecord } from '../utils';
const formData = reactive({
    receiptCode: '',
    settlementCode: '',
    customerName: '',
    contractCode: '',
    plannedDate: null as number | null,
    handler: '',
    handlerName: '',
    amountDue: '',
    attachmentsList: [] as any[],
    remark: '',
});
const formRef = ref<any>(null);
const submitLoading = ref(false);
// 表单验证规则
const rules = {
    plannedDate: {
        required: true,
        trigger: ['change', 'blur'],
        validator(_: any, value: number | null) {
            if (value === null || value === undefined || value === '') {
                return new Error('请选择计划回款日');
            }
            return true;
        },
    },
};
/**
 * 获取回款单详情并回填编辑表单。
 * @returns 无返回值
 */
const getAllData = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id as any);

        if (res && res.code === 200) {
            const data = normalizePaymentRecord(res.data || {});
            formData.receiptCode = data.receiptCode || '';
            formData.settlementCode = data.settlementCode || '';
            formData.customerName = data.customerName || '';
            formData.contractCode = data.contractCode || '';
            formData.plannedDate = data.plannedDate ? dayjs(data.plannedDate).valueOf() : null;
            formData.handler = data.handler || '';
            formData.handlerName = data.handlerName || '';
            formData.amountDue = data.amountDue ?? '';
            formData.attachmentsList = data.attachmentsList || [];
            formData.remark = data.remark || '';
        }
    } catch (error) {
        console.error('Failed to obtain daily report:', error);
    }
};
getAllData();
/**
 * 保存或提交回款单。
 * @param type save 为草稿保存，submit 为提交进入回款中
 * @returns 无返回值
 */
const saveTable = async (type: 'save' | 'submit') => {
    try {
        await formRef.value?.validate();
        submitLoading.value = true;
        const res = await updatePaymentApi({
            id: route.query.id,
            plannedDate: formatDateParam(formData.plannedDate),
            remark: formData.remark || '',
            status:
                type === 'save'
                    ? PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01
                    : PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
        });
        if (res?.code === 200) {
            router.back();
        }
    } catch (error) {
        console.error('保存回款单失败:', error);
    } finally {
        submitLoading.value = false;
    }
};
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
