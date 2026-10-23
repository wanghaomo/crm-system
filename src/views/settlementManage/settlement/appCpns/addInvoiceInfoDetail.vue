<template>
    <AppPage :title="pageTitle" :showSearch="false" :showList="false">
        <template #content>
            <div class="edit-content">
                <!-- 表单卡片 -->
                <div class="form-card">
                    <Form ref="formRef" label-width="120px">
                        <template v-for="(item, index) in formFieds" :key="index">
                            <Field
                                v-model="item.value"
                                :name="item.key"
                                :label="item.label"
                                :type="item.type"
                                :required="item.required"
                                :placeholder="'请输入' + item.label"
                                :rules="getRule(item)">
                                <template v-if="item.disabled" #input>
                                    <div style="color: #999">
                                        {{ item.value || '--' }}
                                    </div>
                                </template>
                            </Field>
                            <div class="title" v-if="item.type == 'title'">{{ item.label }}</div>
                        </template>
                    </Form>
                </div>
            </div>
        </template>

        <!-- 底部按钮：保存 + 提交 -->
        <template #footer>
            <div class="bottom-btn-wrapper">
                <Button type="primary" block class="bottom-btn" @click="handleSubmit('submit')">保存</Button>
            </div>
        </template>
    </AppPage>

    <MxAppDatePicker v-model="formData.shoulDate" title="选择年" v-model:show="showDatePicker" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form, Popup, Picker, Field, PickerGroup, DatePicker, TimePicker, Button } from 'vant';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';
import { getPaymentDetailApi } from '@/api';

const route = useRoute();
const router = useRouter();
const showDatePicker = ref(false);
// 用户信息
const userInfo = computed(() => {
    return useUserStore().userInfo;
});
interface IndustryNewsFormData {
    remittanceNumber: string;
    enterpriseName: string;
    followUpPersonName: string;
    followUpPersonId: string;
    constractNumber: string;
    amountReceivable: string;
    shoulDate: any[];
    fileData: any[];
    remark: string;
}

const createEmptyForm = (): IndustryNewsFormData => {
    return {
        remittanceNumber: 'RJH26030004', //汇款单编号
        enterpriseName: '兴发集团有限责任公司', //企业名称
        followUpPersonName: '张三', //跟单人
        followUpPersonId: '', //跟单人
        constractNumber: 'XS26030001', //合同编号
        amountReceivable: '800', //应收金额(元)
        shoulDate: ['2026', '05', '15'], //计划回款日
        fileData: [],
        remark: '',
    };
};
const pageTitle = computed(() => '新增开票明细');
const formData = ref<IndustryNewsFormData>(createEmptyForm());
const formRef = ref<any>(null);
const formFieds = ref([]);
const getFormFieds = () => {
    return [
        { type: 'filed', label: '业务类型', required: true, disabled: false, value: 'RFH26030001', key: '' },
        {
            type: 'filed',
            label: '货物或应税劳务、服务名称',
            required: true,
            disabled: false,
            value: '2026-05-22 12:00:00',
            key: '',
        },
        { type: 'text', label: '规格型号', required: true, disabled: false, value: '车阳河码头', key: '' },
        { type: 'text', label: '单位', required: true, disabled: false, value: '', key: '' },
        { type: 'text', label: '规格型号', required: true, disabled: false, value: '', key: '' },
        { type: 'number', label: '数量', required: true, disabled: false, value: '', key: '' },
        { type: 'number', label: '含税单价(元)', required: true, disabled: false, value: '', key: '' },
        { type: 'number', label: '含税金额(元)', required: true, disabled: false, value: '', key: '' },
        { type: 'number', label: '税率(%)', required: true, disabled: false, value: '', key: '' },
        { type: 'number', label: '税额(元)', required: true, disabled: false, value: '', key: '' },
        { type: 'number', label: '不含税金额(元)', required: true, disabled: false, value: '', key: '' },
    ];
};
formFieds.value = getFormFieds();
const getRule = (item) => {
    return [{ required: item.key, message: '请填写' + item.label }];
};
const detailData = ref<any>(null);
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
const getDetail = async () => {
    try {
        const res = await getPaymentDetailApi(route.query.id);
        detailData.value = res.data;
    } catch (error) {
        console.log(error);
    }
};
onMounted(() => {
    if (editId.value) {
        getDetail();
    } else {
        formData.value = createEmptyForm();
    }
});
// 提交表单
const handleSubmit = async (action: 'save' | 'submit') => {
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
.title {
    font-size: 16px;
    color: #333333;
    padding: 12px;
}
</style>
