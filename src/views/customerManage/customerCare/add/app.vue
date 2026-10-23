<template>
    <AppPage class="edit-content" :title="pageTitle" :showSearch="false" :showList="false" noPadding @back="handleBack">
        <template #content>
            <Form @submit="handleSubmit">
                <div class="care-form-card">
                    <div class="section-title">基础信息</div>
                    <Field
                        v-model="formData.customerName"
                        label="企业单位名称"
                        placeholder="请选择"
                        readonly
                        is-link
                        required
                        @click="customerVisible = true" />
                    <MxCommSelect
                        v-model="formData.customerId"
                        v-model:label="formData.customerName"
                        typeName="企业客户"
                        title="企业单位名称"
                        :appShowVanField="false"
                        :show="customerVisible"
                        :clearable="true"
                        @update:show="customerVisible = $event"
                        @changeEvt="handleCustomerChange" />
                    <Field :model-value="starLevelText" label="客户星级" placeholder="自动匹配企业" readonly required />
                    <Field
                        v-model="careTypeText"
                        label="关怀类型"
                        placeholder="请选择"
                        readonly
                        is-link
                        required
                        @click="careTypeVisible = true" />
                    <Field
                        v-model="careMethodText"
                        label="执行方式"
                        placeholder="请选择"
                        readonly
                        is-link
                        required
                        @click="careMethodVisible = true" />
                    <MxPersonSelect
                        v-model="formData.executorCodes"
                        v-model:label="executorLabels"
                        title="执行人"
                        placeholder="请选择"
                        multiple
                        required
                        @changeEvt="handleExecutorChange" />
                    <Field
                        v-model="formData.planTime"
                        label="计划关怀时间"
                        placeholder="请选择"
                        readonly
                        is-link
                        required
                        @click="openDateTime('planTime')" />
                    <Field
                        v-model="formData.content"
                        class="content-field"
                        label="关怀内容"
                        label-align="top"
                        required
                        readonly
                        is-link
                        placeholder="请输入"
                        @click="openContentEditor">
                        <template #input>
                            <div class="content-preview" @click="openContentEditor">
                                <MxEditorPreview
                                    v-if="formData.content && formData.content !== '<p><br></p>'"
                                    :modelValue="formData.content"
                                    maxHeight="none" />
                                <span v-else class="content-placeholder">请输入关怀内容</span>
                            </div>
                        </template>
                    </Field>
                    <div class="field-block">
                        <div class="field-label">关怀附件</div>
                        <MxWebFileUpload
                            v-model="formData.attachmentList"
                            :limit="5"
                            :multiple="true"
                            :accept="attachmentAccept"
                            fileSize="50M" />
                    </div>
                    <Field
                        v-model="formData.feedback"
                        class="textarea-field"
                        label="客户反馈"
                        label-align="top"
                        type="textarea"
                        maxlength="250"
                        show-word-limit
                        rows="4"
                        placeholder="请输入" />
                    <Field
                        v-model="careEvaluationText"
                        label="关怀效果评价"
                        placeholder="请选择"
                        readonly
                        is-link
                        @click="evaluationVisible = true" />
                    <Field
                        v-model="formData.nextCareSuggestTime"
                        label="下次关怀建议时间"
                        placeholder="请选择"
                        readonly
                        is-link
                        @click="openDateTime('nextCareSuggestTime')" />
                    <Field
                        v-model="valueAddedText"
                        label="增值服务"
                        placeholder="请选择"
                        readonly
                        is-link
                        @click="openValueAdded" />
                    <Field
                        v-model="formData.plusServicesDetail"
                        class="textarea-field"
                        label="服务详情"
                        label-align="top"
                        type="textarea"
                        maxlength="256"
                        show-word-limit
                        rows="4"
                        placeholder="请输入" />
                    <Field
                        v-model="formData.plusServicesExecution"
                        class="textarea-field"
                        label="执行情况"
                        label-align="top"
                        type="textarea"
                        maxlength="256"
                        show-word-limit
                        rows="4"
                        placeholder="请输入" />
                </div>
            </Form>
        </template>
        <template #footer
            ><div class="footer-actions">
                <Button
                    v-if="!(isEdit && formData.status === 'COMPLETED')"
                    plain
                    type="primary"
                    :loading="submitting"
                    @click="handleSave"
                    >保存</Button
                ><Button type="primary" :loading="submitting" @click="handleSubmit">提交</Button>
            </div></template
        >
    </AppPage>

    <Popup v-model:show="dateTimeVisible" position="bottom" round>
        <DatePickerGroup
            title="选择时间"
            :tabs="['选择年月日', '选择时分秒']"
            @confirm="handleDateTimeConfirm"
            @cancel="dateTimeVisible = false"
            ><DatePicker v-model="datePickerValue" :columns-type="['year', 'month', 'day']" /><TimePicker
                v-model="timePickerValue"
                :columns-type="['hour', 'minute', 'second']"
        /></DatePickerGroup>
    </Popup>
    <ActionSheet
        v-model:show="careTypeVisible"
        title="关怀类型"
        :actions="careTypeActions"
        close-on-click-action
        @select="(item) => selectOption('careType', item)" />
    <ActionSheet
        v-model:show="careMethodVisible"
        title="执行方式"
        :actions="careMethodActions"
        close-on-click-action
        @select="(item) => selectOption('careMethod', item)" />
    <ActionSheet
        v-model:show="evaluationVisible"
        title="关怀效果评价"
        :actions="evaluationActions"
        close-on-click-action
        @select="(item) => selectOption('careEffectEvaluation', item)" />
    <Popup v-model:show="valueAddedVisible" position="bottom" round>
        <div class="value-added-popup">
            <div class="popup-title">增值服务</div>
            <CheckboxGroup v-model="valueAddedDraft"
                ><Checkbox v-for="item in valueAddedOptions" :key="item.value" :name="item.value">{{
                    item.label
                }}</Checkbox></CheckboxGroup
            ><Button type="primary" block @click="confirmValueAdded">确定</Button>
        </div>
    </Popup>
    <Popup v-model:show="contentEditorVisible" position="bottom" :style="{ height: '100%' }">
        <div class="editor-popup">
            <div class="editor-popup-header">
                <span class="editor-popup-title">编辑关怀内容</span>
                <span class="editor-popup-close" @click="contentEditorVisible = false">×</span>
            </div>
            <div class="editor-popup-body"><MxEditor v-model="contentDraft" minHeight="100%" placeholder="请输入" :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" /></div>
            <div class="editor-popup-footer"><Button type="primary" block class="editor-popup-btn submit" @click="confirmContentEditor">确定</Button></div>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import {
    ActionSheet,
    Button,
    Checkbox,
    CheckboxGroup,
    DatePicker,
    Field,
    Form,
    Popup,
    PickerGroup as DatePickerGroup,
    TimePicker,
    showConfirmDialog,
    showToast,
} from 'vant';
import { useRoute, useRouter } from 'vue-router';
import AppPage from '@/appComponents/AppPage/index.vue';
import MxEditor from '@/components/MxEditor/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import {
    createCustomerCareApi,
    getCustomerCareApi,
    getCustomerCareRuleByCustomerApi,
    updateCustomerCareApi,
    sendCustomerCareMessageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_MAP } from '@/config/customer';

const router = useRouter();
const route = useRoute();
const recordId = computed(() => route.query.id || '');
const isEdit = computed(() => Boolean(recordId.value));
const pageTitle = computed(() => (isEdit.value ? '编辑客户关怀' : '新增客户关怀'));
const formData = reactive<any>({
    status: '',
    customerId: '',
    customerName: '',
    starLevel: '',
    careType: '',
    careMethod: '',
    executorList: [],
    executorCodes: [],
    planTime: '',
    content: '',
    attachmentList: [],
    feedback: '',
    careEffectEvaluation: '',
    nextCareSuggestTime: '',
    plusServicesList: [],
    plusServicesDetail: '',
    plusServicesExecution: '',
});
const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
const customerVisible = ref(false);
const careTypeVisible = ref(false);
const careMethodVisible = ref(false);
const evaluationVisible = ref(false);
const valueAddedVisible = ref(false);
const dateTimeVisible = ref(false);
const dateTimeField = ref('planTime');
const datePickerValue = ref<string[]>([]);
const timePickerValue = ref<string[]>([]);
const executorLabels = ref<string[]>([]);
const submitting = ref(false);
const careTypeOptions = ref<any[]>([]);
const careMethodOptions = ref<any[]>([]);
const starLevelText = computed(() => STAR_LEVEL_MAP[formData.starLevel] || formData.starLevel || '');
const careTypeText = computed(
    () => careTypeOptions.value.find((item) => item.value === formData.careType)?.label || formData.careType || ''
);
const careMethodText = computed(
    () => careMethodOptions.value.find((item) => item.value === formData.careMethod)?.label || formData.careMethod || ''
);
const careEvaluationText = computed(() => formData.careEffectEvaluation || '');
const valueAddedText = computed(() =>
    (Array.isArray(formData.plusServicesList) ? formData.plusServicesList : []).join('、')
);
const careTypeActions = computed(() => careTypeOptions.value.map((item) => ({ name: item.label, value: item.value })));
const careMethodActions = computed(() =>
    careMethodOptions.value.map((item) => ({ name: item.label, value: item.value }))
);
const evaluationActions = ['优秀', '良好', '一般', '较差'].map((name) => ({ name, value: name }));
const valueAddedOptions = [
    { label: '定制化礼品', value: '定制化礼品' },
    { label: '专属价格政策', value: '专属价格政策' },
    { label: '库存预警服务', value: '库存预警服务' },
    { label: '其他', value: '其他' },
];
const valueAddedDraft = ref<string[]>([]);

const getNow = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const parsePicker = (value: string) => {
    const [date = '', time = ''] = (value || getNow()).split(' ');
    const parts = time.split(':');
    datePickerValue.value = date.split('-');
    timePickerValue.value = [parts[0] || '00', parts[1] || '00', parts[2] || '00'];
};
const readPicker = (event: any) =>
    `${(event?.[0]?.selectedValues || datePickerValue.value).join('-')} ${(
        event?.[1]?.selectedValues || timePickerValue.value
    ).join(':')}`;
const openDateTime = (field: string) => {
    dateTimeField.value = field;
    parsePicker(formData[field] || getNow());
    dateTimeVisible.value = true;
};
const handleDateTimeConfirm = (event: any) => {
    formData[dateTimeField.value] = readPicker(event);
    dateTimeVisible.value = false;
};
const selectOption = (field: string, item: any) => {
    formData[field] = item.value;
};
const openValueAdded = () => {
    valueAddedDraft.value = Array.isArray(formData.plusServicesList) ? [...formData.plusServicesList] : [];
    valueAddedVisible.value = true;
};
const confirmValueAdded = () => {
    formData.plusServicesList = [...valueAddedDraft.value];
    valueAddedVisible.value = false;
};
const contentEditorVisible = ref(false);
const contentDraft = ref('');
const openContentEditor = () => {
    contentDraft.value = formData.content || '';
    contentEditorVisible.value = true;
};
const confirmContentEditor = () => {
    formData.content = contentDraft.value;
    contentEditorVisible.value = false;
};
const handleCustomerChange = async (option: any) => {
    if (!option) {
        formData.customerId = '';
        formData.customerName = '';
        formData.starLevel = '';
        formData.careType = '';
        formData.careMethod = '';
        formData.content = '';
        return;
    }
    formData.customerId = option.id || option.value || '';
    formData.customerName = option.customerName || option.label || '';
    formData.starLevel = option.starLevel || '';
    try {
        const res: any = await getCustomerCareRuleByCustomerApi({ ...option });
        if (res?.data) {
            formData.careType = res.data.careType || '';
            formData.careMethod = res.data.careMethod || '';
            formData.content = res.data.content || '';
        }
    } catch (error) {
        console.error('获取关怀规则失败:', error);
    }
};
const handleExecutorChange = (options: any) => {
    const list = Array.isArray(options) ? options : options ? [options] : [];
    formData.executorList = list.map((item) => ({
        username: item.username,
        code: item.code,
        larkUserId: item.larkUserId,
    }));
    executorLabels.value = list.map((item) => item.username || item.label || item.code).filter(Boolean);
};
const loadDicts = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['关怀类型'], enumCfg['执行方式']] });
        careTypeOptions.value = (res?.data?.[enumCfg['关怀类型']] || []).map((item: any) => ({
            label: item.name,
            value: item.code,
        }));
        careMethodOptions.value = (res?.data?.[enumCfg['执行方式']] || []).map((item: any) => ({
            label: item.name,
            value: item.code,
        }));
    } catch (error) {
        console.error('加载关怀字典失败:', error);
    }
};
const loadDetail = async () => {
    if (!recordId.value) return;
    try {
        const res: any = await getCustomerCareApi(recordId.value);
        const data = res?.data;
        if (!data) return;
        Object.assign(formData, data, {
            executorCodes: data.executorList?.map((item: any) => item.code) || [],
            attachmentList: data.attachmentList || data.attachmentUrls || [],
            plusServicesList: Array.isArray(data.plusServicesList) ? data.plusServicesList : [],
        });
        executorLabels.value = (data.executorList || []).map((item: any) => item.username || item.code);
    } catch (error) {
        console.error('加载客户关怀详情失败:', error);
    }
};
const validate = (submit: boolean) => {
    const required: Array<[any, string]> = [
        [formData.customerId, '请选择企业单位名称'],
        [formData.executorCodes?.length, '请选择执行人'],
        [formData.planTime, '请选择计划关怀时间'],
    ];
    if (submit)
        required.push(
            [formData.starLevel, '请选择客户星级'],
            [formData.careType, '请选择关怀类型'],
            [formData.careMethod, '请选择执行方式'],
            [stripContent(formData.content), '请填写关怀内容']
        );
    const empty = required.find(([value]) => !value);
    if (empty) {
        showToast(empty[1]);
        return false;
    }
    return true;
};
const stripContent = (value: string) =>
    (value || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, '')
        .trim();
/** 从保存接口响应中提取当前记录 ID，兼容新增和编辑接口的返回结构。 */
const getSavedRecordId = (res: any) => {
    const responseData = res?.data;
    if (responseData && typeof responseData === 'object') {
        return responseData.id ?? responseData.recordId ?? responseData.data?.id ?? res?.id;
    }
    return typeof responseData === 'number' || typeof responseData === 'string' ? responseData : res?.id;
};

/** 保存成功后询问是否发起客户关怀的飞书提醒。 */
const confirmCustomerCareMessage = async (id: number | string) => {
    try {
        await showConfirmDialog({ title: '提示', message: '是否立即发起飞书提醒？' });
    } catch {
        return;
    }
    try {
        await sendCustomerCareMessageApi(id);
    } catch (error) {
        console.error('发起客户关怀飞书提醒失败:', error);
    }
};

const saveRecord = async (status: 'PENDING' | 'COMPLETED') => {
    submitting.value = true;
    try {
        const payload = {
            ...JSON.parse(JSON.stringify(formData)),
            status,
            actualTime: status === 'COMPLETED' ? getNow() : formData.actualTime,
            ...(isEdit.value ? { id: Number(recordId.value) } : {}),
        };
        delete payload.executorCodes;
        const res: any = isEdit.value ? await updateCustomerCareApi(payload) : await createCustomerCareApi(payload);
        if (res?.code === 200 || res?.success) {
            const savedId = getSavedRecordId(res) ?? recordId.value;
            if (status === 'PENDING' && savedId) {
                await confirmCustomerCareMessage(savedId);
            }
            router.back();
        }
    } catch (error) {
        console.error('保存客户关怀失败:', error);
    } finally {
        submitting.value = false;
    }
};
const handleSave = () => {
    if (validate(false)) saveRecord('PENDING');
};
const handleSubmit = () => {
    if (validate(true)) saveRecord('COMPLETED');
};
const handleBack = () => router.back();
onMounted(async () => {
    await loadDicts();
    await loadDetail();
});
</script>

<style scoped lang="less">
.care-form-card {
    margin: 12px;
    padding-bottom: 12px;
    overflow: hidden;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 3px 20px 1px rgba(132, 132, 132, 0.16);
}
.section-title {
    padding: 18px 12px 8px;
    color: #333;
    font-size: 16px;
    font-weight: 600;
}
.care-form-card :deep(.van-cell) {
    padding: 14px 12px;
}
.care-form-card :deep(.van-cell::after) {
    border-bottom: 1px solid #ededed;
}
.care-form-card :deep(.van-field__label) {
    color: #666;
    font-size: 16px;
}
.care-form-card :deep(.van-field__control),
.care-form-card :deep(.van-cell__value) {
    color: #333;
    font-size: 16px;
}
.textarea-field :deep(.van-field__control) {
    min-height: 110px;
    line-height: 22px;
}
.field-block {
    padding: 14px 12px;
    border-bottom: 1px solid #ededed;
}
.field-label {
    margin-bottom: 10px;
    color: #666;
    font-size: 16px;
}
.field-block :deep(.van-checkbox) {
    margin: 8px 16px 8px 0;
}
.footer-actions {
    display: flex;
    gap: 20px;
    padding: 4px 12px 8px;
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);
}
.footer-actions .van-button {
    flex: 1;
    height: 40px;
    border-radius: 4px;
    font-size: 16px;
}
.care-form-card :deep(.content-field .van-cell__right-icon) {
    transform: none;
}
.content-preview {
    min-height: 24px;
    line-height: 1.5;
}
.content-placeholder {
    color: #c0c4cc;
    font-size: 14px;
}
.value-added-popup {
    padding: 20px 16px 16px;
}
.value-added-popup :deep(.van-checkbox) {
    margin: 16px 0;
}
.value-added-popup .van-button {
    margin-top: 8px;
}
.editor-popup {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
}
.editor-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
}
.editor-popup-title {
    color: #303133;
    font-size: 16px;
    font-weight: 500;
}
.editor-popup-close {
    color: #909399;
    cursor: pointer;
    font-size: 24px;
}
.editor-popup-body {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow: hidden;
    background: #fff;
}
.editor-popup-body :deep(.mainEditor) {
    display: flex;
    flex: 1;
    flex-direction: column;
    border: none;
    border-radius: 0;
}
.editor-popup-body :deep(.w-e-text-container) {
    flex: 1;
    background: #fff;
}
.editor-popup-footer {
    display: flex;
    flex-shrink: 0;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    background: #fff;
}
.editor-popup-btn {
    height: 40px;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
}

.edit-content {
    :deep(.van-search__field) {
        padding: 0 !important;
        border-bottom: none !important;
    }
}
</style>
