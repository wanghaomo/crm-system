<template>
    <MxDrawer v-model:show="drawerShow" title="录入催款记录" size="small" :closablePop="false">
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
            </div>
            <div class="title">催款信息</div>
            <n-form
                style="margin-top: 16px"
                ref="formRef"
                :model="formData"
                :rules="formRules"
                required-mark-placement="right"
                label-placement="left"
                label-align="right"
                label-width="120px">
                <n-grid :cols="1" :x-gap="0">
                    <n-grid-item>
                        <n-form-item label="催收日期" path="collectorTime">
                            <n-date-picker v-model:value="formData.collectorTime" placeholder="请选择" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="催收方式" path="collectionMethod">
                            <n-select v-model:value="formData.collectionMethod" placeholder="请选择" :options="collectionMethodOptions" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="催收内容" path="collectionContent">
                            <n-input
                                v-model:value.trim="formData.collectionContent"
                                type="textarea"
                                placeholder="请输入"
                                :rows="4"
                                :maxlength="500"
                                show-count />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="客户回复时间" path="replyTime">
                            <n-date-picker v-model:value="formData.replyTime" placeholder="请选择" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="客户回复内容" path="replyContent">
                            <n-input
                                v-model:value.trim="formData.replyContent"
                                type="textarea"
                                placeholder="请输入"
                                :rows="4"
                                :maxlength="500"
                                show-count />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="预计回款时间" path="expectedPaymentDate">
                            <n-date-picker v-model:value="formData.expectedPaymentDate" placeholder="请选择" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="后续跟进措施" path="followUpAction">
                            <n-input
                                v-model:value.trim="formData.followUpAction"
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
import { NForm, NFormItem, NInput, NSelect, NButton, NDatePicker, NGrid, NGridItem } from 'naive-ui';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import { createCollectionRecordApi } from '@/api';
import { formatDateParam } from '../utils';

const emit = defineEmits(['refresh']);
const { userInfo } = storeToRefs(useUserStore());
const { dictMap } = storeToRefs(useDictStore());
const drawerShow = ref(false);
const formRef = ref<any>(null);
const submitLoading = ref(false);
const formData = reactive<any>({
    collectorTime: dayjs().valueOf(),
    collectionMethod: '',
    collectionContent: '',
    replyTime: null as number | null,
    replyContent: '',
    expectedPaymentDate: null as number | null,
    followUpAction: '',
});
const collectionMethodOptions = computed(() => dictMap.value?.['催收方式'] || []);
/**
 * 创建必填数字校验器。
 * @param message 校验失败文案
 * @returns Naive UI 表单校验函数
 */
const validateRequiredNumber = (message: string) => (_: any, value: number | null) => {
    if (value === null || value === undefined) {
        return new Error(message);
    }
    return true;
};
// 录入催收记录表单校验规则。
const formRules = {
    collectorTime: {
        required: true,
        trigger: ['change', 'blur'],
        validator: validateRequiredNumber('请选择催收日期'),
    },
    collectionContent: { required: true, message: '请输入催收内容', trigger: ['blur', 'input'] },
    collectionMethod: { required: true, message: '请选择催收方式', trigger: ['change', 'blur'] },
};
/**
 * 重置录入催收记录表单。
 * @returns 无返回值
 */
const resetForm = () => {
    formData.collectorTime = dayjs().valueOf();
    formData.collectionMethod = '';
    formData.collectionContent = '';
    formData.replyTime = null;
    formData.replyContent = '';
    formData.expectedPaymentDate = null;
    formData.followUpAction = '';
};
/**
 * 保存单条催收记录。
 * @returns 无返回值
 */
const handleSave = async () => {
    try {
        await formRef.value?.validate();
        submitLoading.value = true;
        const res = await createCollectionRecordApi({
            receiptCode: detailData.value.receiptCode,
            customerName: detailData.value.customerName,
            collectorTime: formatDateParam(formData.collectorTime),
            collectorId: userInfo.value?.code || '',
            collectorName: userInfo.value?.username || '',
            collectionMethod: formData.collectionMethod,
            collectionContent: formData.collectionContent,
            replyTime: formatDateParam(formData.replyTime),
            replyContent: formData.replyContent || '',
            expectedPaymentDate: formatDateParam(formData.expectedPaymentDate),
            followUpAction: formData.followUpAction || '',
        });
        if (res?.code === 200) {
            drawerShow.value = false;
            emit('refresh');
        }
    } catch (error) {
        console.error('保存催款记录失败:', error);
    } finally {
        submitLoading.value = false;
    }
};
const detailData = ref<any>({});
/**
 * 打开录入催收记录抽屉。
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
</style>
