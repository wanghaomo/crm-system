<template>
    <AppPage class="edit-content" :title="pageTitle" :showSearch="false" :showList="false" noPadding @back="handleAppBack">
        <template #content>
            <div v-if="todoEditorVisible" class="todo-editor-page">
                <Form ref="todoFormRef" @submit="saveTodoEditor">
                    <div class="todo-editor-card">
                        <Field
                            v-model="todoEditorDraft.todoContent"
                            class="todo-editor-content"
                            label="待办事项"
                            label-align="top"
                            type="textarea"
                            maxlength="50"
                            show-word-limit
                            rows="8"
                            placeholder="请输入" />
                        <Field label="状态" required>
                            <template #input>
                                <RadioGroup
                                    v-model="todoEditorDraft.status"
                                    class="todo-status-radio"
                                    direction="horizontal">
                                    <Radio name="TODO"
                                        ><template #icon="{ checked }"
                                            ><img
                                                class="todo-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" /></template
                                        >未完成</Radio
                                    >
                                    <Radio name="DONE"
                                        ><template #icon="{ checked }"
                                            ><img
                                                class="todo-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" /></template
                                        >已完成</Radio
                                    >
                                    <Radio name="DELAYED"
                                        ><template #icon="{ checked }"
                                            ><img
                                                class="todo-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" /></template
                                        >延期</Radio
                                    >
                                </RadioGroup>
                            </template>
                        </Field>
                        <MxPersonSelect
                            v-model="todoEditorDraft.principalCodes"
                            v-model:label="todoEditorDraft.principalLabels"
                            title="负责人"
                            placeholder="请选择"
                            multiple
                            required
                            @changeEvt="handleTodoEditorPrincipalChange" />
                        <Field
                            v-model="todoEditorDraft.dueTime"
                            label="截止时间"
                            placeholder="请选择"
                            required
                            readonly
                            is-link
                            @click="openTodoDate('dueTime')" />
                        <Field
                            v-model="todoEditorDraft.completeTime"
                            label="完成时间"
                            placeholder="请选择"
                            readonly
                            is-link
                            @click="openTodoDate('completeTime')" />
                        <div class="field-block todo-editor-attachment">
                            <div class="field-label">附件</div>
                            <MxWebFileUpload
                                v-model="todoEditorDraft.attachmentList"
                                :limit="20"
                                :multiple="true"
                                :accept="attachmentAccept"
                                fileSize="50M" />
                        </div>
                        <Field
                            v-model="todoEditorDraft.remarks"
                            class="todo-editor-remarks"
                            label="备注"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="5"
                            placeholder="请输入" />
                    </div>
                </Form>
            </div>
            <div v-else class="visit-plan-add-page">
                <div class="step-tabs">
                    <div :class="['step-item', { active: step === 0 }]" @click="step = 0">
                        <img :src="step === 0 ? currentSelectedIcon : finishedIcon" alt="" /><em>信息填写</em>
                    </div>
                    <i :class="{ complete: step === 1 }"></i>
                    <div :class="['step-item', { active: step === 1 }]" @click="step = 1">
                        <img :src="step === 1 ? currentSelectedIcon : currentNormalIcon" alt="" /><em>待办事项</em>
                    </div>
                </div>
                <Form @submit="handleSubmit">
                    <div v-show="step === 0" class="form-card">
                        <div class="section-title">基础信息</div>
                        <Field
                            v-model="formData.customerName"
                            label="企业单位名称"
                            placeholder="请选择"
                            readonly
                            is-link
                            required
                            @click="customerSelectVisible = true" />
                        <MxCommSelect
                            v-model="formData.customerId"
                            v-model:label="formData.customerName"
                            typeName="企业客户"
                            title="企业单位名称"
                            :appShowVanField="false"
                            :show="customerSelectVisible"
                            :clearable="true"
                            @update:show="customerSelectVisible = $event"
                            @changeEvt="handleCustomerChange" />
                        <Field
                            v-model="cycleLabel"
                            label="拜访周期"
                            placeholder="请选择"
                            readonly
                            is-link
                            required
                            @click="visitCycleVisible = true" />
                        <Field
                            :model-value="starLevelText"
                            label="客户星级"
                            placeholder="选择企业后自动带出"
                            readonly
                            required />
                        <Field
                            v-model="formData.planTime"
                            label="计划拜访时间"
                            placeholder="请选择"
                            readonly
                            is-link
                            required
                            @click="openPlanTime" />
                        <MxPersonSelect
                            v-model="formData.executorCodes"
                            v-model:label="executorLabels"
                            title="拜访人"
                            placeholder="请选择"
                            multiple
                            required
                            @changeEvt="handleExecutorChange" />
                        <Field
                            v-model="purposeLabel"
                            label="拜访目的"
                            placeholder="请选择"
                            readonly
                            is-link
                            required
                            @click="visitPurposeVisible = true" />
                        <Field
                            v-model="contactPersonLabel"
                            label="客户对接人"
                            placeholder="请选择"
                            readonly
                            is-link
                            required
                            @click="openContactSelect" />
                        <Field
                            v-model="formData.customerWorkPattern"
                            label="客户工作规律"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="4"
                            placeholder="请输入" />
                        <Field
                            v-model="formData.visitRequirements"
                            label="拜访要求"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="3"
                            placeholder="请输入" />
                        <Field
                            v-model="formData.content"
                            class="content-field"
                            label="沟通内容"
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
                                    <span v-else class="content-placeholder">请输入沟通内容</span>
                                </div>
                            </template>
                        </Field>
                        <Field
                            v-model="formData.customerInventoryRate"
                            label="客户库存/开工率记录"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="4"
                            placeholder="请输入" />
                        <div class="field-block">
                            <div class="field-label">拜访附件</div>
                            <MxWebFileUpload
                                v-model="formData.attachmentList"
                                :limit="20"
                                :multiple="true"
                                :accept="attachmentAccept"
                                fileSize="50M" />
                        </div>
                        <Field
                            v-model="formData.feedback"
                            label="拜访反馈"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="4"
                            placeholder="请输入" />
                        <Field
                            :model-value="plusServicesText"
                            label="增值服务"
                            readonly
                            is-link
                            placeholder="请选择"
                            @click="openValueAddedSelect" />
                        <Field
                            v-model="formData.plusServicesDetail"
                            label="增值服务详情"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="4"
                            placeholder="请输入" />
                        <Field
                            v-model="formData.plusServicesExecution"
                            label="增值服务执行情况"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="4"
                            placeholder="请输入" />
                    </div>
                    <div v-show="step === 1" class="todo-page">
                        <div v-if="!todoList.length" class="todo-empty">
                            <div class="todo-title">待办事项 <span>(非必填)</span></div>
                            <div class="todo-empty-content">
                                <img src="@/assets/images/empty.png" alt="无内容" />
                                <div class="empty-text">无内容</div>
                                <button type="button" class="add-todo-button" @click="addTodo">
                                    <img :src="addTodoIcon" alt="" /><span>添加事项</span>
                                </button>
                            </div>
                        </div>
                        <div v-else class="todo-list">
                            <div class="todo-title">待办事项 <span>(非必填)</span></div>
                            <div v-for="(todo, index) in todoList" :key="todo.id || index" class="todo-item">
                                <div class="todo-card-header">
                                    <span class="todo-sequence">{{ getTodoSequence(index) }}</span>
                                    <div class="todo-actions">
                                        <span class="todo-action edit" @click="openTodoEditor(index)"
                                            ><Icon name="edit" /><span>编辑</span></span
                                        >
                                        <span class="todo-action delete" @click="confirmRemoveTodo(index)"
                                            ><Icon name="delete-o" /><span>删除</span></span
                                        >
                                    </div>
                                </div>
                                <div class="todo-summary">
                                    <div class="todo-summary-row">
                                        <span>待办事项</span><b>{{ formatValue(todo.todoContent) }}</b>
                                    </div>
                                    <div class="todo-summary-row">
                                        <span>状态</span
                                        ><b>{{ todoStatusMap[todo.status] || formatValue(todo.status) }}</b>
                                    </div>
                                    <div class="todo-summary-row">
                                        <span>负责人</span><b>{{ getPrincipalText(todo) }}</b>
                                    </div>
                                    <div class="todo-summary-row">
                                        <span>截止时间</span><b>{{ formatValue(todo.dueTime) }}</b>
                                    </div>
                                    <template v-if="expandedTodoIndex === index">
                                        <div class="todo-summary-row">
                                            <span>完成时间</span><b>{{ formatValue(todo.completeTime) }}</b>
                                        </div>
                                        <div class="todo-summary-row">
                                            <span>备注</span><b>{{ formatValue(todo.remarks) }}</b>
                                        </div>
                                        <div v-if="todo.attachmentList?.length" class="todo-summary-attachment">
                                            <span>附件</span
                                            ><MxWebFileUpload :only-show="true" :model-value="todo.attachmentList" />
                                        </div>
                                    </template>
                                    <div class="todo-expand" @click="toggleTodoExpand(index)">
                                        <span>{{ expandedTodoIndex === index ? '收起' : '展开' }}</span
                                        ><Icon :name="expandedTodoIndex === index ? 'arrow-up' : 'arrow-down'" />
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="add-todo-button" @click="addTodo">
                                <img :src="addTodoIcon" alt="" /><span>添加事项</span>
                            </button>
                        </div>
                    </div>
                </Form>
            </div>
        </template>
        <template #footer>
            <div class="footer-actions">
                <Button v-if="todoEditorVisible" type="primary" :loading="submitting" @click="saveTodoEditor"
                    >保存</Button
                >
                <template v-else-if="step === 1"
                    ><Button plain type="primary" @click="step = 0">上一步</Button
                    ><Button
                        v-if="!(isEdit && formData.status === 'COMPLETED')"
                        plain
                        type="primary"
                        :loading="submitting"
                        @click="handleSave"
                        >保存</Button
                    ><Button type="primary" :loading="submitting" @click="handleSubmit">提交</Button></template
                >
                <Button v-else type="primary" @click="goTodo">下一步</Button>
            </div>
        </template>
    </AppPage>
    <Popup v-model:show="planTimeVisible" position="bottom" round
        ><DatePickerGroup
            title="选择计划拜访时间"
            :tabs="['选择年月日', '选择时分秒']"
            @confirm="handlePlanTimeConfirm"
            @cancel="planTimeVisible = false"
            ><DatePicker v-model="datePickerValue" :columns-type="['year', 'month', 'day']" /><TimePicker
                v-model="timePickerValue"
                :columns-type="['hour', 'minute', 'second']" /></DatePickerGroup
    ></Popup>
    <Popup v-model:show="todoDateVisible" position="bottom" round
        ><DatePickerGroup
            title="选择时间"
            :tabs="['选择年月日', '选择时分秒']"
            @confirm="handleTodoDateConfirm"
            @cancel="todoDateVisible = false"
            ><DatePicker v-model="datePickerValue" :columns-type="['year', 'month', 'day']" /><TimePicker
                v-model="timePickerValue"
                :columns-type="['hour', 'minute', 'second']" /></DatePickerGroup
    ></Popup>
    <Popup v-model:show="contentEditorVisible" position="bottom" :style="{ height: '100%' }"
        ><div class="editor-popup">
            <div class="editor-popup-header">
                <span class="editor-popup-title">编辑沟通内容</span>
                <span class="editor-popup-close" @click="contentEditorVisible = false">×</span>
            </div>
            <div class="editor-popup-body"><MxEditor v-model="tempContent" minHeight="100%" placeholder="请输入" :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" /></div>
            <div class="editor-popup-footer"><Button type="primary" block class="editor-popup-btn submit" @click="confirmContentEditor">确定</Button></div>
        </div></Popup
    >
    <ActionSheet v-model:show="visitCycleVisible" :actions="cycleActions" title="拜访周期" @select="selectCycle" />
    <ActionSheet
        v-model:show="visitPurposeVisible"
        :actions="purposeActions"
        title="拜访目的"
        @select="selectPurpose" />
    <Popup v-model:show="contactVisible" position="bottom" round>
        <div class="selection-popup">
            <div class="selection-popup-header">
                <span class="selection-popup-title">客户对接人</span>
                <Icon name="cross" class="selection-popup-close" @click="contactVisible = false" />
            </div>
            <div class="selection-option-list">
                <CheckboxGroup v-model="contactDraft">
                    <div v-if="contactOptionsLoading" class="selection-empty">正在加载客户对接人...</div>
                    <div v-else-if="!contactPersonOptions.length" class="selection-empty">暂无可选客户对接人</div>
                    <div v-for="item in contactPersonOptions" v-else :key="String(item.value)" class="selection-option">
                        <Checkbox :name="item.value">{{ item.label }}</Checkbox>
                    </div>
                </CheckboxGroup>
            </div>
            <Button type="primary" block @click="confirmContacts">确定</Button>
        </div>
    </Popup>
    <Popup v-model:show="valueAddedVisible" position="bottom" round>
        <div class="selection-popup">
            <div class="selection-popup-header">
                <span class="selection-popup-title">增值服务</span>
                <Icon name="cross" class="selection-popup-close" @click="valueAddedVisible = false" />
            </div>
            <div class="selection-option-list">
                <CheckboxGroup v-model="valueAddedDraft">
                    <div v-for="item in valueAddedOptions" :key="item.value" class="selection-option">
                        <Checkbox :name="item.value">{{ item.label }}</Checkbox>
                    </div>
                </CheckboxGroup>
            </div>
            <Button type="primary" block @click="confirmValueAdded">确定</Button>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
    ActionSheet,
    Button,
    Checkbox,
    CheckboxGroup,
    DatePicker,
    Field,
    Form,
    Icon,
    PickerGroup as DatePickerGroup,
    Popup,
    Radio,
    RadioGroup,
    TimePicker,
    showConfirmDialog,
    showToast,
} from 'vant';
import { useRoute, useRouter } from 'vue-router';
import AppPage from '@/appComponents/AppPage/index.vue';
import MxEditor from '@/components/MxEditor/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import {
    createVisitPlanApi,
    getCustomerContactListApi,
    getVisitPlanApi,
    getVisitPlanRuleByCustomerApi,
    updateVisitPlanApi,
    sendVisitPlanMessageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { getStarLevelText } from '@/config/customer';
import choiceNormalIcon from '../../visitRecord/add/assets/icon_com_choice_nor@3x.png';
import choiceSelectedIcon from '../../visitRecord/add/assets/icon_com_choice_sel@3x.png';
import currentNormalIcon from '../../visitRecord/add/assets/icon_com_current_nor@3x.png';
import currentSelectedIcon from '../../visitRecord/add/assets/icon_com_current_sel@3x.png';
import finishedIcon from '../../visitRecord/add/assets/icon_com_current_fis@3x.png';
import addTodoIcon from '../../visitRecord/add/assets/icon_com_add_blue@3x.png';

const router = useRouter();
const route = useRoute();
const recordId = computed(() => route.query.id || '');
const isEdit = computed(() => Boolean(recordId.value));
const step = ref(0);
const submitting = ref(false);
const todoEditorVisible = ref(false);
const pageTitle = computed(() =>
    todoEditorVisible.value
        ? todoEditingIndex.value >= 0
            ? '编辑待办事项'
            : '新增待办事项'
        : isEdit.value
        ? '编辑拜访记录'
        : '新增拜访记录'
);
const formData = reactive<any>({
    status: '',
    customerId: '',
    customerName: '',
    starLevel: '',
    planTime: '',
    actualTime: '',
    executorList: [],
    executorCodes: [],
    visitCycle: '',
    visitPurpose: '',
    contactPersonList: [],
    contactPersonIds: [],
    customerWorkPattern: '',
    visitRequirements: '',
    content: '',
    customerInventoryRate: '',
    attachmentList: [],
    feedback: '',
    plusServicesList: [],
    plusServicesDetail: '',
    plusServicesExecution: '',
});
const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
const starLevelText = computed(() => getStarLevelText(formData.starLevel) || '');
const executorLabels = ref<string[]>([]);
const customerSelectVisible = ref(false);
const contactVisible = ref(false);
const visitCycleVisible = ref(false);
const visitPurposeVisible = ref(false);
const planTimeVisible = ref(false);
const contentEditorVisible = ref(false);
const valueAddedVisible = ref(false);
const todoDateVisible = ref(false);
const tempContent = ref('');
const datePickerValue = ref<string[]>([]);
const timePickerValue = ref<string[]>([]);
const cycleOptions = ref<any[]>([]);
const purposeOptions = ref<any[]>([]);
const contactPersonOptions = ref<any[]>([]);
const contactDraft = ref<any[]>([]);
const contactOptionsLoading = ref(false);
const valueAddedDraft = ref<string[]>([]);
const todoDateField = ref('dueTime');
const valueAddedOptions = [
    { label: '定制化取样', value: '定制化取样' },
    { label: '优先供货保障', value: '优先供货保障' },
    { label: '账期支持', value: '账期支持' },
    { label: '专属定价', value: '专属定价' },
    { label: '其他', value: '其他' },
];
const todoStatusMap: Record<string, string> = { TODO: '未完成', DONE: '已完成', DELAYED: '延期' };
const todoList = ref<any[]>([]);
const todoEditingIndex = ref(-1);
const expandedTodoIndex = ref(-1);
const todoEditorDraft = reactive<any>({
    todoContent: '',
    status: 'TODO',
    principalList: [],
    principalCodes: [],
    principalLabels: [],
    dueTime: '',
    completeTime: '',
    attachmentList: [],
    remarks: '',
});
const cycleLabel = computed(
    () => cycleOptions.value.find((item) => item.value === formData.visitCycle)?.label || formData.visitCycle || ''
);
const purposeLabel = computed(
    () =>
        purposeOptions.value.find((item) => item.value === formData.visitPurpose)?.label || formData.visitPurpose || ''
);
const contactPersonLabel = computed(() =>
    (Array.isArray(formData.contactPersonList) ? formData.contactPersonList : [])
        .map((item: any) => item.contactName || item.label || item.name)
        .filter(Boolean)
        .join('、')
);
const plusServicesText = computed(() => (formData.plusServicesList || []).join('、'));
const cycleActions = computed(() => cycleOptions.value.map((item) => ({ name: item.label, value: item.value })));
const purposeActions = computed(() => purposeOptions.value.map((item) => ({ name: item.label, value: item.value })));

/** 获取当前时间，用于日期选择器的默认值。 */
const getNow = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
        now.getMinutes()
    )}:00`;
};
/** 获取提交时刻，格式与接口的实际拜访时间字段保持一致。 */
const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
        now.getMinutes()
    )}:${pad(now.getSeconds())}`;
};
/** 清理富文本标签并返回纯文本。 */
const stripContent = (value: string) =>
    (value || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
/** 统一格式化表单和待办事项的空值。 */
const formatValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);

/** 将客户对接人详情转换为选择弹窗使用的选项。 */
const normalizeContactOption = (item: any) => ({
    ...item,
    label: item.contactName || item.name || item.label || '',
    value: item.id ?? item.contactId ?? item.value,
});

/**
 * 加载客户对接人选项。
 * @param customerId 客户 ID
 * @param initializeSelection 是否将全部联系人设置为新增页面的默认选中项
 * @returns 客户对接人选项
 */
const loadContactPersonOptions = async (customerId: any, initializeSelection = false) => {
    if (!customerId) {
        contactPersonOptions.value = [];
        if (initializeSelection) {
            formData.contactPersonIds = [];
            formData.contactPersonList = [];
            contactDraft.value = [];
        }
        return [];
    }

    contactOptionsLoading.value = true;
    try {
        const res: any = await getCustomerContactListApi(customerId);
        const options = Array.isArray(res?.data)
            ? res.data
                  .map(normalizeContactOption)
                  .filter((item: any) => item.value !== undefined && item.value !== null)
            : [];
        contactPersonOptions.value = options;
        if (initializeSelection) {
            const selectedIds = options.map((item: any) => item.value);
            formData.contactPersonIds = selectedIds;
            formData.contactPersonList = options;
            contactDraft.value = [...selectedIds];
        }
        return options;
    } catch (error) {
        console.error('加载客户对接人列表失败:', error);
        return [];
    } finally {
        contactOptionsLoading.value = false;
    }
};

/** 客户变化后回填客户信息、对接人和拜访规则。 */
const handleCustomerChange = async (option: any) => {
    if (!option) {
        formData.customerId = '';
        formData.customerName = '';
        formData.starLevel = '';
        formData.contactPersonIds = [];
        formData.contactPersonList = [];
        contactPersonOptions.value = [];
        contactDraft.value = [];
        return;
    }
    formData.customerName = option.customerName || option.label || '';
    formData.customerId = option.id ?? option.value ?? '';
    formData.starLevel = option.starLevel || '';
    await loadContactPersonOptions(formData.customerId, true);
    try {
        const res: any = await getVisitPlanRuleByCustomerApi({ ...option });
        if (res?.data) {
            formData.visitCycle = res.data.visitCycle || '';
            formData.planTime = res.data.planTime || '';
        }
    } catch (error) {
        console.error('获取拜访规则失败:', error);
    }
};
/** 保存拜访人员字段。 */
const handleExecutorChange = (options: any) => {
    const list = Array.isArray(options) ? options : options ? [options] : [];
    formData.executorList = list.map((item) => ({
        username: item.username,
        code: item.code,
        larkUserId: item.larkUserId,
    }));
    executorLabels.value = list.map((item) => item.username || item.label || item.code).filter(Boolean);
};
/** 选择拜访周期。 */
const selectCycle = (item: any) => {
    formData.visitCycle = item.value;
    visitCycleVisible.value = false;
};
/** 选择拜访目的。 */
const selectPurpose = (item: any) => {
    formData.visitPurpose = item.value;
    visitPurposeVisible.value = false;
};
/** 打开客户对接人选择弹窗，并使用当前已选值作为草稿。 */
const openContactSelect = async () => {
    contactDraft.value = [...(formData.contactPersonIds || [])];
    contactVisible.value = true;
    if (formData.customerId && !contactPersonOptions.value.length) {
        await loadContactPersonOptions(formData.customerId);
    }
};
/** 确认客户对接人。 */
const confirmContacts = () => {
    formData.contactPersonIds = [...contactDraft.value];
    formData.contactPersonList = contactPersonOptions.value.filter((item) =>
        contactDraft.value.some((value) => String(value) === String(item.value))
    );
    contactVisible.value = false;
};
/** 打开内容编辑器。 */
const openContentEditor = () => {
    tempContent.value = formData.content || '';
    contentEditorVisible.value = true;
};
/** 保存内容编辑器的富文本。 */
const confirmContentEditor = () => {
    formData.content = tempContent.value;
    contentEditorVisible.value = false;
};
/** 解析日期选择器返回值。 */
const readPickerValue = (event: any) =>
    `${(event?.[0]?.selectedValues || datePickerValue.value).join('-')} ${(
        event?.[1]?.selectedValues || timePickerValue.value
    ).join(':')}`;
/** 打开计划拜访时间选择器。 */
const openPlanTime = () => {
    const value = formData.planTime || getNow();
    const [date, time] = value.split(' ');
    const timeParts = time.split(':').filter(Boolean);
    datePickerValue.value = date.split('-');
    timePickerValue.value = [timeParts[0] || '00', timeParts[1] || '00', timeParts[2] || '00'];
    planTimeVisible.value = true;
};
/** 保存计划拜访时间。 */
const handlePlanTimeConfirm = (event: any) => {
    formData.planTime = readPickerValue(event);
    planTimeVisible.value = false;
};
/** 打开待办时间选择器。 */
const openTodoDate = (field: string) => {
    todoDateField.value = field;
    const value = todoEditorDraft[field] || getNow();
    const [date, time] = value.split(' ');
    const timeParts = time.split(':').filter(Boolean);
    datePickerValue.value = date.split('-');
    timePickerValue.value = [timeParts[0] || '00', timeParts[1] || '00', timeParts[2] || '00'];
    todoDateVisible.value = true;
};
/** 保存待办时间。 */
const handleTodoDateConfirm = (event: any) => {
    todoEditorDraft[todoDateField.value] = readPickerValue(event);
    todoDateVisible.value = false;
};
/** 打开或编辑待办事项。 */
const openTodoEditor = (index = -1) => {
    Object.assign(
        todoEditorDraft,
        index >= 0
            ? JSON.parse(JSON.stringify(todoList.value[index]))
            : {
                  todoContent: '',
                  status: 'TODO',
                  principalList: [],
                  principalCodes: [],
                  principalLabels: [],
                  dueTime: '',
                  completeTime: '',
                  attachmentList: [],
                  remarks: '',
              }
    );
    todoEditingIndex.value = index;
    todoEditorVisible.value = true;
};
const addTodo = () => openTodoEditor();
/** 同步待办事项负责人。 */
const handleTodoPrincipalChange = (todo: any, options: any) => {
    const list = Array.isArray(options) ? options : options ? [options] : [];
    todo.principalList = list.map((item) => ({
        username: item.username,
        code: item.code,
        larkUserId: item.larkUserId,
    }));
    todo.principalCodes = list.map((item) => item.code);
    todo.principalLabels = list.map((item) => item.username || item.label || item.code).filter(Boolean);
};
/** 同步待办事项编辑页的负责人字段。 */
const handleTodoEditorPrincipalChange = (options: any) => handleTodoPrincipalChange(todoEditorDraft, options);
/** 保存待办事项编辑。 */
const saveTodoEditor = () => {
    if (!todoEditorDraft.principalList?.length) return showToast('请选择负责人');
    if (!todoEditorDraft.dueTime) return showToast('请选择截止时间');
    const todo = JSON.parse(JSON.stringify(todoEditorDraft));
    if (todoEditingIndex.value >= 0) todoList.value.splice(todoEditingIndex.value, 1, todo);
    else todoList.value.push(todo);
    todoEditorVisible.value = false;
    todoEditingIndex.value = -1;
};
/** 删除待办事项。 */
const confirmRemoveTodo = async (index: number) => {
    try {
        await showConfirmDialog({
            title: '确认删除',
            message: '确定删除该待办事项吗？',
            confirmButtonText: '删除',
            cancelButtonText: '取消',
        });
        todoList.value.splice(index, 1);
    } catch (error) {
        console.debug('取消删除待办事项', error);
    }
};
/** 切换待办事项展开状态。 */
const toggleTodoExpand = (index: number) => {
    expandedTodoIndex.value = expandedTodoIndex.value === index ? -1 : index;
};
/** 将待办事项序号转换为中文序号。 */
const getTodoSequence = (index: number) =>
    `序号${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || index + 1}`;
/** 获取待办事项负责人文案。 */
const getPrincipalText = (todo: any) =>
    (todo.principalLabels?.length
        ? todo.principalLabels.join('、')
        : (todo.principalList || [])
              .map((item) => item.username || item.name || item.code)
              .filter(Boolean)
              .join('、')) || '--';
/** 确认增值服务。 */
const confirmValueAdded = () => {
    formData.plusServicesList = [...valueAddedDraft.value];
    valueAddedVisible.value = false;
};
/** 打开增值服务选择弹窗，并使用当前已选值作为草稿。 */
const openValueAddedSelect = () => {
    valueAddedDraft.value = Array.isArray(formData.plusServicesList) ? [...formData.plusServicesList] : [];
    valueAddedVisible.value = true;
};
/** 返回上一级或关闭待办编辑页。 */
const handleAppBack = () => {
    if (todoEditorVisible.value) {
        todoEditorVisible.value = false;
        todoEditingIndex.value = -1;
        return;
    }
    router.back();
};

/** 校验基础表单。 */
const validateForm = (submit = false) => {
    const required = [
        [formData.customerId, '请选择企业单位名称'],
        [formData.planTime, '请选择计划拜访时间'],
        [formData.executorCodes?.length, '请选择拜访人'],
    ];
    if (submit)
        required.push(
            [formData.starLevel, '请选择客户星级'],
            [formData.executorCodes?.length, '请选择拜访人'],
            [formData.visitCycle, '请选择拜访周期'],
            [formData.visitPurpose, '请选择拜访目的'],
            [formData.contactPersonIds?.length, '请选择客户对接人'],
            [stripContent(formData.content), '请填写沟通内容']
        );
    const empty = required.find(([value]) => !value);
    if (empty) {
        showToast(empty[1] as string);
        return false;
    }
    return true;
};
/** 生成拜访记录接口提交数据。 */
const buildPayload = (status: string) => ({
    ...JSON.parse(JSON.stringify(formData)),
    ...(isEdit.value ? { id: Number(recordId.value) } : {}),
    status,
    actualTime: status === 'COMPLETED' ? getCurrentDateTime() : formData.actualTime,
    todoList: todoList.value.map((item) => ({
        ...(item.id ? { id: item.id } : {}),
        todoContent: item.todoContent || '',
        status: item.status || 'TODO',
        principalList: item.principalList || [],
        dueTime: item.dueTime || '',
        completeTime: item.completeTime || '',
        attachmentList: item.attachmentList || [],
        remarks: item.remarks || '',
    })),
});
/** 从保存接口响应中提取当前记录 ID，兼容新增和编辑接口的返回结构。 */
const getSavedRecordId = (res: any) => {
    const responseData = res?.data;
    if (responseData && typeof responseData === 'object') {
        return responseData.id ?? responseData.recordId ?? responseData.data?.id ?? res?.id;
    }
    return typeof responseData === 'number' || typeof responseData === 'string' ? responseData : res?.id;
};

/** 保存成功后询问是否发起拜访记录的飞书提醒。 */
const confirmVisitPlanMessage = async (id: number | string) => {
    try {
        await showConfirmDialog({ title: '提示', message: '是否立即发起飞书提醒？' });
    } catch {
        return;
    }
    try {
        await sendVisitPlanMessageApi(id);
    } catch (error) {
        console.error('发起拜访记录飞书提醒失败:', error);
    }
};

/** 保存拜访记录。 */
const saveRecord = async (status: string) => {
    submitting.value = true;
    try {
        const payload = buildPayload(status);
        const res: any = isEdit.value ? await updateVisitPlanApi(payload) : await createVisitPlanApi(payload);
        if (res?.code === 200 || res?.success) {
            const savedId = getSavedRecordId(res) ?? recordId.value;
            if (status === 'PENDING' && savedId) {
                await confirmVisitPlanMessage(savedId);
            }
            router.back();
        }
    } catch (error) {
        console.error('保存拜访记录失败:', error);
    } finally {
        submitting.value = false;
    }
};
const handleSave = () => {
    if (!validateForm(false)) return;
    const invalidTodo = todoList.value.findIndex((item) => !item.dueTime);
    if (invalidTodo >= 0) return showToast(`请填写第${invalidTodo + 1}条待办事项的截止时间`);
    saveRecord('PENDING');
};
/** 从基础信息进入待办步骤，不在步骤切换时执行必填校验。 */
const goTodo = () => {
    step.value = 1;
};
const handleSubmit = () => {
    if (!validateForm(true)) return;
    const invalid = todoList.value.findIndex((item) => !item.status || !item.principalList?.length || !item.dueTime);
    if (invalid >= 0) return showToast(`请完善第${invalid + 1}条待办事项`);
    saveRecord('COMPLETED');
};

/** 加载字典选项。 */
const loadDicts = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['关怀周期'], enumCfg['拜访目的']] });
        cycleOptions.value = (res?.data?.[enumCfg['关怀周期']] || []).map((item) => ({
            label: item.name || item.label,
            value: item.code || item.value,
        }));
        purposeOptions.value = (res?.data?.[enumCfg['拜访目的']] || []).map((item) => ({
            label: item.name || item.label,
            value: item.code || item.value,
        }));
    } catch (error) {
        console.error('加载拜访字典失败:', error);
    }
};
/** 加载编辑详情，并按客户 ID 初始化完整的客户对接人选项。 */
const loadDetail = async () => {
    if (!recordId.value) return;
    try {
        const res: any = await getVisitPlanApi(Number(recordId.value));
        const data = res?.data;
        if (!data) return;

        const detailContacts = Array.isArray(data.contactPersonList)
            ? data.contactPersonList.map(normalizeContactOption)
            : [];
        if (data.customerId) {
            await loadContactPersonOptions(data.customerId);
        }
        // 接口失败时至少保留详情中的已选联系人，避免编辑弹窗没有任何选项。
        if (!contactPersonOptions.value.length) contactPersonOptions.value = detailContacts;
        const selectedContactIds = detailContacts
            .map((item: any) => item.value)
            .filter((value: any) => value !== undefined && value !== null);

        Object.assign(formData, data, {
            executorCodes: data.executorList?.map((item: any) => item.code) || [],
            contactPersonIds: selectedContactIds,
            contactPersonList: detailContacts,
            attachmentList: data.attachmentList || [],
            plusServicesList: Array.isArray(data.plusServicesList) ? data.plusServicesList : [],
        });
        contactDraft.value = [...selectedContactIds];
        executorLabels.value = (data.executorList || []).map((item: any) => item.username || item.code);
        todoList.value = (data.todoList || []).map((item: any) => ({
            ...item,
            principalCodes: item.principalList?.map((person: any) => person.code) || [],
            principalLabels: item.principalList?.map((person: any) => person.username || person.code) || [],
            attachmentList: item.attachmentList || [],
        }));
    } catch (error) {
        console.error('加载拜访记录详情失败:', error);
    }
};
onMounted(async () => {
    await loadDicts();
    if (isEdit.value) await loadDetail();
});
</script>

<style scoped lang="less">
.visit-plan-add-page {
    padding-bottom: 8px;
    background: #f5f6f8;
    min-height: 100%;
}
.step-tabs {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 58px;
    padding-top: 4px;
    box-sizing: border-box;
    background: #fff;
}
.step-tabs > i {
    width: 52px;
    height: 4px;
    margin: 10px 8px 0;
    background: linear-gradient(90deg, #2c65f2 0 50%, #dbe5f4 50% 100%);
}
.step-tabs > i.complete {
    background: #2c65f2;
}
.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 76px;
    color: #999;
    font-size: 13px;
}
.step-item img {
    display: block;
    width: 16px;
    height: 16px;
}
.step-item.active {
    color: #2c65f2;
}
.step-item em {
    font-style: normal;
}
.form-card,
.todo-page {
    margin: 12px;
    padding-bottom: 12px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 3px 20px 1px rgba(132, 132, 132, 0.16);
}
.section-title,
.todo-title {
    padding: 18px 12px 8px;
    color: #333;
    font-size: 16px;
    font-weight: 600;
}
.todo-title span {
    color: #999;
    font-weight: 400;
}
.form-card :deep(.van-cell),
.todo-page :deep(.van-cell),
.todo-editor-card :deep(.van-cell) {
    padding: 14px 12px;
}
.form-card :deep(.van-cell::after),
.todo-page :deep(.van-cell::after),
.todo-editor-card :deep(.van-cell::after) {
    border-bottom: 1px solid #ededed;
}
.form-card :deep(.van-field__label),
.todo-page :deep(.van-field__label),
.todo-editor-card :deep(.van-field__label) {
    color: var(--base-grey2);
    font-size: 16px;
}
.form-card :deep(.van-field__control),
.form-card :deep(.van-field__value),
.form-card :deep(.van-cell__value),
.todo-page :deep(.van-field__control),
.todo-page :deep(.van-field__value),
.todo-page :deep(.van-cell__value),
.todo-editor-card :deep(.van-field__control),
.todo-editor-card :deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}
.textarea-field :deep(.van-field__control) {
    min-height: 110px;
    line-height: 22px;
}
.content-preview {
    min-height: 24px;
    line-height: 1.5;
}
.content-placeholder {
    color: #c0c4cc;
    font-size: 14px;
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
.form-card :deep(.van-field__control::placeholder),
.todo-page :deep(.van-field__control::placeholder),
.todo-editor-card :deep(.van-field__control::placeholder) {
    color: #999;
    opacity: 1;
}
.field-block :deep(.app-custom-file-upload .upload-thumbnail),
.field-block :deep(.app-custom-file-upload .app-file-item) {
    width: 104px;
    height: 104px;
}
.field-block :deep(.app-custom-file-upload .tips) {
    margin-top: 8px;
    line-height: 18px;
    white-space: normal;
}
.todo-empty {
    display: flex;
    flex-direction: column;
}
.todo-title {
    padding: 16px 12px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
}
.todo-title span {
    color: #999;
    font-weight: 400;
}
.todo-empty-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0 16px;
    color: #999;
    font-size: 13px;
}
.todo-empty-content img {
    width: 180px;
    height: auto;
    margin-bottom: 2px;
}
.empty-text {
    margin-bottom: 8px;
}
.todo-list {
    padding-bottom: 16px;
}
.todo-item {
    margin-bottom: 16px;
    overflow: hidden;
}
.todo-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 4px 16px;
    color: #333;
    font-size: 15px;
    background: #fff;
}
.todo-sequence {
    font-weight: 500;
}
.todo-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}
.todo-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    line-height: 20px;
}
.todo-action .van-icon {
    font-size: 18px;
}
.todo-action.edit {
    color: #2c65f2;
}
.todo-action.delete {
    color: #f04f55;
}
.todo-summary {
    margin: 0 16px;
    padding: 12px 14px 0;
    border-radius: 4px;
    background: #f7f7f7;
    color: #333;
}
.todo-summary-row {
    display: flex;
    align-items: flex-start;
    min-height: 34px;
    font-size: 14px;
    line-height: 22px;
}
.todo-summary-row > span,
.todo-summary-attachment > span {
    flex: 0 0 72px;
    color: #999;
}
.todo-summary-row b {
    flex: 1;
    min-width: 0;
    color: #444;
    font-weight: 400;
    word-break: break-all;
}
.todo-summary-attachment {
    display: flex;
    align-items: flex-start;
    padding: 4px 0 8px;
    font-size: 14px;
}
.todo-summary-attachment :deep(.app-custom-file-upload) {
    flex: 1;
    min-width: 0;
}
.todo-expand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 36px;
    color: #2c65f2;
    font-size: 14px;
}
.add-todo-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 4px 0;
    border: 0;
    border-radius: 0;
    outline: 0;
    background: transparent;
    color: #2c65f2;
    font-family: inherit;
    font-size: 15px;
    line-height: 22px;
    appearance: none;
    cursor: pointer;
}
.add-todo-button img {
    display: block;
    width: 16px;
    height: 16px;
    margin-right: 4px;
}
.todo-editor-page {
    min-height: 100%;
    padding: 0 0 8px;
    background: #f5f6f8;
}
.todo-editor-card {
    margin: 12px;
    padding: 0 0 12px;
    overflow: hidden;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 3px 20px 1px rgba(132, 132, 132, 0.16);
}
.todo-editor-card :deep(.van-field__word-limit),
.todo-editor-card :deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}
.todo-editor-card :deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}
.todo-editor-card :deep(.van-cell:last-child) {
    padding-bottom: 0;
}
.todo-editor-content :deep(.van-field__control) {
    min-height: 220px;
    line-height: 22px;
}
.todo-editor-remarks :deep(.van-field__control) {
    min-height: 126px;
    line-height: 22px;
}
.todo-status-radio :deep(.van-radio) {
    margin-right: 0;
}
.todo-radio-icon {
    display: block;
    width: 16px;
    height: 16px;
}
.todo-editor-attachment {
    padding: 14px 12px;
}
.todo-page {
    padding-bottom: 0;
}
// .todo-editor-card :deep(.van-cell) { padding: 14px 12px; }
.todo-editor-card :deep(.van-cell::after) {
    border-bottom: 1px solid #ededed;
}
.todo-editor-card :deep(.van-field__label) {
    color: var(--base-grey2);
    font-size: 16px;
}
.todo-editor-card :deep(.van-field__control),
.todo-editor-card :deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}
.todo-editor-card :deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}
.todo-editor-card :deep(.van-cell:last-child) {
    padding-bottom: 0;
}
.todo-editor-content :deep(.van-field__control) {
    min-height: 220px;
    line-height: 22px;
}
.todo-editor-remarks :deep(.van-field__control) {
    min-height: 126px;
    line-height: 22px;
}
.todo-status-radio {
    display: flex;
    justify-content: space-between;
    width: 100%;
}
.todo-status-radio :deep(.van-radio) {
    margin-right: 0;
}
.todo-radio-icon {
    display: block;
    width: 16px;
    height: 16px;
}
.todo-editor-attachment {
    padding: 14px 12px;
}
.selection-popup {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
    box-sizing: border-box;
}
.selection-popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 28px;
    margin-bottom: 12px;
}
.selection-popup-title {
    color: #333;
    font-size: 18px;
    font-weight: 500;
    line-height: 28px;
}
.selection-popup-close {
    position: absolute;
    top: 2px;
    right: 0;
    color: #969aa3;
    font-size: 18px;
    cursor: pointer;
}
.selection-option-list {
    max-height: 45vh;
    margin: 0 -4px 16px;
    overflow-y: auto;
}
.selection-option {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 0 8px;
    border-bottom: 1px solid #f0f1f3;
    box-sizing: border-box;
}
.selection-option :deep(.van-checkbox) {
    width: 100%;
    color: #333;
    font-size: 15px;
}
.selection-option :deep(.van-checkbox__label) {
    flex: 1;
    margin-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.selection-empty {
    padding: 36px 0;
    color: #999;
    font-size: 14px;
    line-height: 22px;
    text-align: center;
}
.selection-popup > :deep(.van-button) {
    flex-shrink: 0;
    height: 40px;
    border-radius: 4px;
    font-size: 16px;
}
.footer-actions {
    display: flex;
    gap: 20px;
    padding: 4px 12px 8px;
    background-color: var(--base-white);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);
}
.footer-actions .van-button {
    flex: 1;
    height: 40px;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
}
.footer-actions .van-button:only-child {
    width: 100%;
}

.edit-content {
    :deep(.van-search__field) {
        padding: 0 !important;
        border-bottom: none !important;
    }
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
    flex-shrink: 0;
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
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
    overflow: hidden;
    padding: 12px;
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

</style>
