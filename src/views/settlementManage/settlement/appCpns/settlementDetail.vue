<template>
    <AppPage :title="pageTitle" :showSearch="false" :showList="false">
        <template #content>
            <div class="edit-content">
                <!-- 表单卡片 -->
                <div class="form-card">
                    <Form ref="formRef" label-width="120px">
                        <template v-for="(item, index) in formFieds" :key="index">
                            <Field :class="item.class" v-if="item.type == 'filed'" v-model="item.value" :name="item.key" :label="item.label" :required="item.required" :placeholder="'请输入' + item.label" :disabled="item.disabled" :rules="getRule(item)">
                            </Field>
                            <Field :class="item.class" v-if="item.type == 'textarea'" v-model="item.value" :name="item.key" :label="item.label" autosize maxlength="200" label-align="top" rows="5" type="textarea" :required="item.required" :placeholder="'请输入' + item.label" :disabled="item.disabled"
                                :rules="getRule(item)">
                            </Field>
                            <Field :class="item.class" v-if="item.type == 'date'" v-model="item.value" :name="item.key" :label="item.label" :is-link="true" :required="true" readonly :placeholder="'请选择' + item.label" :rules="getRule(item)" @click="showDatePicker = true">
                            </Field>

                            <MxPersonSelect v-if="item.type == 'person'" :clearable="true" :title="item.label" :required="true" :name="item.key" :placeholder="'请选择' + item.label" :rules="getRule(item)" v-model="formData.followUpPersonId" v-model:label="formData.followUpPersonName">
                            </MxPersonSelect>
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
const pageTitle = computed(() => route.query.title);
const formData = ref<IndustryNewsFormData>(createEmptyForm());
const formRef = ref<any>(null);
const formFieds = ref([]);
const getFormFieds = () => {
    return [
        { type: 'filed', label: '运输订单编号', required: false, disabled: true, value: 'RFH26030001', key: '' },
        { type: 'date', label: '验收时间', required: true, disabled: false, value: '2026-05-22 12:00:00', key: '' },
        { type: 'filed', label: '交货地点', required: false, disabled: true, value: '车阳河码头', key: '', },
        { type: 'person', label: '业务人员', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '验货人员', required: false, disabled: false, value: '', key: '' },
        { type: 'filed', label: '矿石种类', required: false, disabled: true, value: '高品位磷矿', key: '' },
        { type: 'filed', label: '合同约定品位(%)', required: false, disabled: true, value: '', key: '' },
        { type: 'filed', label: '结算品位(%)', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '增减价', required: true, disabled: false, value: '', key: '' },
        { type: 'title', label: 'Mg0含量≥4.5%', key: '' },
        { type: 'filed', label: '含量', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '加权平均', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '增减价', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'title', label: '氧化铁含量(≤0.8%)', key: '' },
        { type: 'filed', label: '含量', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '加权平均', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '增减价', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'title', label: '氧化铝含量(≤1%)', key: '' },
        { type: 'filed', label: '含量', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '加权平均', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '增减价', required: true, disabled: false, value: '', key: '', class: 'child' },
        { type: 'filed', label: '水分(%)', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '超出水分吨位(吨)', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '粒度≤30mm过筛率%', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '发货量(吨)', required: false, disabled: true, value: '高品位磷矿', key: '' },
        { type: 'filed', label: '实收量(吨)', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '结算量(吨)', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '合同单价(元/吨)', required: false, disabled: true, value: '高品位磷矿', key: '' },
        { type: 'filed', label: '结算单价(元/吨)', required: true, disabled: false, value: '', key: '' },
        { type: 'filed', label: '分项金额(元)', required: false, disabled: true, value: '高品位磷矿', key: '' },
        { type: 'textarea', label: '备注', required: false, disabled: false, value: '', key: '' },
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

:deep(.van-cell.van-field.child) {
    padding-left: 36px;

}

:deep(.van-cell.van-field.child .van-field__label) {
    width: 96px !important;
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
    font-weight: 500;
    color: #333333;
    padding: 12px;
}
</style>
