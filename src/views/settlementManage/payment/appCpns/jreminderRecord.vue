<template>
    <AppPage ref="appPageRef" title="录入催收信息" :showSearch="false" :showList="false">
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
            <card title="催收信息">
                <Form ref="formRef" label-width="120px">
                    <Field
                        :modelValue="formData.collectorTime.join('-')"
                        :is-link="true"
                        :required="true"
                        readonly
                        name="collectorTime"
                        label="催收日期"
                        placeholder="请选择"
                        :rules="[{ required: true, message: '请选择催收日期', trigger: 'onChange' }]"
                        @click="openDatePicker('collectorTime')">
                    </Field>
                    <MxCommSelect
                        v-model="formData.collectionMethod"
                        v-model:label="formData.collectionMethodLabel"
                        title="催收方式"
                        name="collectionMethod"
                        :required="true"
                        :options="collectionMethodOptions"
                        :rules="[{ required: true, message: '请选择催收方式', trigger: 'onChange' }]"
                        :clearable="true"
                        :text="false" />
                    <Field
                        name="collectionContent"
                        label-align="top"
                        v-model="formData.collectionContent"
                        label="催收内容"
                        :required="true"
                        :rules="[{ required: true, message: '请输入催收内容', trigger: 'onChange' }]"
                        rows="5"
                        autosize
                        maxlength="500"
                        type="textarea"
                        show-word-limit
                        clearable
                        placeholder="请输入" />
                    <Field
                        :modelValue="formData.customerReplyTime.join('-')"
                        :is-link="true"
                        readonly
                        name="customerReplyTime"
                        label="客户回复时间"
                        :required="false"
                        placeholder="请选择"
                        @click="openDatePicker('customerReplyTime')">
                    </Field>
                    <Field
                        name="replyContent"
                        label-align="top"
                        v-model="formData.replyContent"
                        label="客户回复内容"
                        rows="5"
                        autosize
                        maxlength="500"
                        type="textarea"
                        show-word-limit
                        clearable
                        placeholder="请输入" />
                    <Field
                        :modelValue="formData.expectedReceiptDate.join('-')"
                        :is-link="true"
                        readonly
                        name="expectedReceiptDate"
                        label="预计回款时间"
                        :required="false"
                        placeholder="请选择"
                        @click="openDatePicker('expectedReceiptDate')">
                    </Field>
                    <Field
                        name="followUpAction"
                        label-align="top"
                        v-model="formData.followUpAction"
                        label="后续跟进措施"
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
    <MxAppDatePicker v-model="datePickerValue" title="选择日期" v-model:show="showDatePicker" @confirm="onDateConfirm" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { Form, Field, Button } from 'vant';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import card from './card.vue';
import { deepClone } from '@/utils/comm';
import { createCollectionRecordApi, getPaymentDetailApi } from '@/api';
import { formatDateParam, normalizePaymentRecord, toDatePickerValue } from '../utils';
const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
const detailData = ref<any>({});
const descriptionsData = ref([
    {
        label: '关联回款单',
        value: '',
    },
]);
const showDatePicker = ref(false);
const appPageRef = ref<any>(null);
const route = useRoute();
const router = useRouter();
const formRef = ref<any>(null);
const submitLoading = ref(false);
const datePickerValue = ref<string[]>([]);

const formData = reactive<any>({
    collectorTime: toDatePickerValue(new Date()),
    collectionMethod: '',
    collectionMethodLabel: '',
    collectionContent: '',
    customerReplyTime: [],
    replyContent: '',
    expectedReceiptDate: [],
    followUpAction: '',
    collectorId: '',
    collectorName: '',
});
const collectionMethodOptions = computed(() => dictMap.value?.['催收方式'] || []);
const activeDateField = ref<'collectorTime' | 'customerReplyTime' | 'expectedReceiptDate'>('collectorTime');
/**
 * 打开指定催收日期字段的日期选择器。
 * @param field 当前需要编辑的日期字段
 * @returns 无返回值
 */
const openDatePicker = (field: 'collectorTime' | 'customerReplyTime' | 'expectedReceiptDate') => {
    activeDateField.value = field;
    const fieldValue = formData[field];
    datePickerValue.value = Array.isArray(fieldValue) && fieldValue.length
        ? [...fieldValue]
        : toDatePickerValue(new Date());
    showDatePicker.value = true;
};
/**
 * 确认日期选择。
 * @returns 无返回值
 */
const onDateConfirm = () => {
    formData[activeDateField.value] = [...datePickerValue.value];
};
/**
 * 默认使用当前登录用户作为催收人。
 * @returns 无返回值
 */
const setDefaultCollector = () => {
    formData.collectorId = userInfo.value?.code || '';
    formData.collectorName = userInfo.value?.username || '';
};
/**
 * 保存单条催收记录。
 * @returns 无返回值
 */
const handleSubmit = async () => {
    try {
        await formRef.value?.validate();
        submitLoading.value = true;
        const res = await createCollectionRecordApi({
            receiptCode: detailData.value.receiptCode,
            customerName: detailData.value.customerName,
            collectorTime: formatDateParam(formData.collectorTime.join('-')),
            collectorId: formData.collectorId,
            collectorName: formData.collectorName,
            collectionMethod: formData.collectionMethod,
            collectionContent: formData.collectionContent,
            replyTime: formatDateParam(formData.customerReplyTime.join('-')),
            replyContent: formData.replyContent || '',
            expectedPaymentDate: formatDateParam(formData.expectedReceiptDate.join('-')),
            followUpAction: formData.followUpAction || '',
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
 * 获取当前回款单详情。
 * @returns 无返回值
 */
const getDetaily = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = normalizePaymentRecord(deepClone(res?.data || {}));
        descriptionsData.value[0].value = detailData.value.receiptCode;
    } catch (error) {
        console.error('Failed to obtain details:', error);
    }
};
getDetaily();

watch(
    () => userInfo.value,
    () => setDefaultCollector(),
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
