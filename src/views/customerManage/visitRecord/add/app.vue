<template>
    <AppPage :title="pageTitle" class="edit-content" :showSearch="false" :showList="false" noPadding @back="handleAppBack">
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
                                    <Radio name="TODO">
                                        <template #icon="{ checked }">
                                            <img
                                                class="todo-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" />
                                        </template>
                                        未完成
                                    </Radio>
                                    <Radio name="DONE">
                                        <template #icon="{ checked }">
                                            <img
                                                class="todo-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" />
                                        </template>
                                        已完成
                                    </Radio>
                                    <Radio name="DELAYED">
                                        <template #icon="{ checked }">
                                            <img
                                                class="todo-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" />
                                        </template>
                                        延期
                                    </Radio>
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
                            @click="openTodoDate(-1, 'dueTime')" />
                        <Field
                            v-model="todoEditorDraft.completeTime"
                            label="完成时间"
                            placeholder="请选择"
                            readonly
                            is-link
                            @click="openTodoDate(-1, 'completeTime')" />
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
            <div v-else class="visit-add-page">
                <div class="step-tabs">
                    <div :class="['step-item', { active: step === 0 }]" @click="step = 0">
                        <img :src="step === 0 ? currentSelectedIcon : finishedIcon" alt="" />
                        <em>信息填写</em>
                    </div>
                    <i :class="{ complete: step === 1 }"></i>
                    <div :class="['step-item', { active: step === 1 }]" @click="step = 1">
                        <img :src="step === 1 ? currentSelectedIcon : currentNormalIcon" alt="" />
                        <em>待办事项</em>
                    </div>
                </div>

                <Form ref="formRef" @submit="handleSubmit">
                    <div v-show="step === 0" class="form-card">
                        <div class="section-title">基础信息</div>
                        <Field
                            v-model="formData.customerName"
                            name="customerId"
                            label="企业单位名称"
                            placeholder="请选择"
                            readonly
                            is-link
                            required
                            :rules="[{ required: true, message: '请选择企业单位名称' }]"
                            @click="openCustomerSelect" />
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
                        <Field label="来访类型" required>
                            <template #input>
                                <RadioGroup
                                    v-model="formData.visitType"
                                    class="visit-type-radio"
                                    direction="horizontal">
                                    <Radio name="APPOINTMENT">
                                        <template #icon="{ checked }">
                                            <img
                                                class="visit-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" />
                                        </template>
                                        提前预约
                                    </Radio>
                                    <Radio name="TEMPORARY">
                                        <template #icon="{ checked }">
                                            <img
                                                class="visit-radio-icon"
                                                :src="checked ? choiceSelectedIcon : choiceNormalIcon"
                                                alt="" />
                                        </template>
                                        临时通知
                                    </Radio>
                                </RadioGroup>
                            </template>
                        </Field>
                        <Field
                            :model-value="starLevelText"
                            label="客户星级"
                            required
                            readonly
                            placeholder="自动匹配企业" />
                        <Field
                            v-model="formData.actualTime"
                            label="来访时间"
                            required
                            placeholder="请选择"
                            readonly
                            is-link
                            @click="openVisitDate" />
                        <Field
                            v-model="formData.visitors"
                            class="textarea-field"
                            label="来访人员"
                            label-align="top"
                            required
                            type="textarea"
                            maxlength="100"
                            show-word-limit
                            rows="4"
                            placeholder="请输入来访人员姓名及职务，如：张三-经理，李四-总监" />
                        <Field
                            v-model="receptionSpecLabel"
                            label="接待规格"
                            required
                            placeholder="请选择"
                            readonly
                            is-link
                            @click="receptionSpecVisible = true" />
                        <MxPersonSelect
                            v-model="formData.executorCodes"
                            v-model:label="executorLabels"
                            title="接待人"
                            placeholder="请选择接待人"
                            multiple
                            required
                            :rules="[{ required: true, message: '请选择接待人' }]"
                            @changeEvt="handleExecutorChange" />
                        <Field
                            v-model="receptionLocationLabel"
                            label="接待地点"
                            required
                            placeholder="请选择"
                            readonly
                            is-link
                            @click="receptionLocationVisible = true" />
                        <Field
                            v-model="formData.customerDemand"
                            class="textarea-field"
                            label="客户需求记录"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="5"
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
                        <div class="field-block">
                            <div class="field-label">接待附件</div>
                            <MxWebFileUpload
                                v-model="formData.attachmentList"
                                :limit="20"
                                :multiple="true"
                                :accept="attachmentAccept"
                                fileSize="50M" />
                        </div>
                        <Field
                            v-model="formData.feedback"
                            class="textarea-field"
                            label="评价反馈"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="5"
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
                            class="textarea-field"
                            label="增值服务详情"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="5"
                            placeholder="请输入" />
                        <Field
                            v-model="formData.plusServicesExecution"
                            class="textarea-field"
                            label="增值服务执行情况"
                            label-align="top"
                            type="textarea"
                            maxlength="255"
                            show-word-limit
                            rows="5"
                            placeholder="请输入" />
                    </div>

                    <div v-show="step === 1" class="todo-page">
                        <div v-if="!todoList.length" class="todo-empty">
                            <div class="todo-title">待办事项 <span>(非必填)</span></div>
                            <div class="todo-empty-content">
                                <img src="@/assets/images/empty.png" alt="无内容" />
                                <div class="empty-text">无内容</div>
                                <button type="button" class="add-todo-button" @click="addTodo">
                                    <img src="./assets/icon_com_add_blue@3x.png" alt="" />
                                    <span>添加事项</span>
                                </button>
                            </div>
                        </div>
                        <div v-else class="todo-list">
                            <div class="todo-title">待办事项 <span>(非必填)</span></div>
                            <div v-for="(todo, index) in todoList" :key="todo.id || index" class="todo-item">
                                <div class="todo-card-header">
                                    <span class="todo-sequence">{{ getTodoSequence(index) }}</span>
                                    <div class="todo-actions">
                                        <span class="todo-action edit" @click="toggleTodoEdit(index)">
                                            <Icon name="edit" />
                                            <span>编辑</span>
                                        </span>
                                        <span class="todo-action delete" @click="confirmRemoveTodo(index)">
                                            <Icon name="delete-o" />
                                            <span>删除</span>
                                        </span>
                                    </div>
                                </div>
                                <div class="todo-summary">
                                    <div class="todo-summary-row">
                                        <span>待办事项</span>
                                        <b>{{ formatTodoValue(todo.todoContent) }}</b>
                                    </div>
                                    <div class="todo-summary-row">
                                        <span>状态</span>
                                        <b>{{ todoStatusMap[todo.status] || formatTodoValue(todo.status) }}</b>
                                    </div>
                                    <div class="todo-summary-row">
                                        <span>负责人</span>
                                        <b>{{ getTodoPrincipalText(todo) }}</b>
                                    </div>
                                    <div class="todo-summary-row">
                                        <span>截止时间</span>
                                        <b>{{ formatTodoValue(todo.dueTime) }}</b>
                                    </div>
                                    <template v-if="todoExpandedIndex === index">
                                        <div class="todo-summary-row">
                                            <span>完成时间</span>
                                            <b>{{ formatTodoValue(todo.completeTime) }}</b>
                                        </div>
                                        <div class="todo-summary-row">
                                            <span>备注</span>
                                            <b>{{ formatTodoValue(todo.remarks) }}</b>
                                        </div>
                                        <div v-if="todo.attachmentList?.length" class="todo-summary-attachment">
                                            <span>附件</span>
                                            <MxWebFileUpload :only-show="true" :model-value="todo.attachmentList" />
                                        </div>
                                    </template>
                                    <div class="todo-expand" @click="toggleTodoExpand(index)">
                                        <span>{{ todoExpandedIndex === index ? '收起' : '展开' }}</span>
                                        <Icon :name="todoExpandedIndex === index ? 'arrow-up' : 'arrow-down'" />
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="add-todo-button" @click="addTodo">
                                <img src="./assets/icon_com_add_blue@3x.png" alt="" />
                                <span>添加事项</span>
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
                <template v-else-if="step === 1">
                    <Button plain type="primary" @click="step = 0">上一步</Button>
                    <Button
                        v-if="!(isEdit && formData.status === 'COMPLETED')"
                        plain
                        type="primary"
                        :loading="submitting"
                        @click="handleSave"
                        >保存</Button
                    >
                    <Button type="primary" :loading="submitting" @click="handleSubmit">提交</Button>
                </template>
                <Button v-else type="primary" @click="goTodo">下一步</Button>
            </div>
        </template>
    </AppPage>

    <Popup v-model:show="showDateTimePicker" position="bottom" round>
        <DatePickerGroup
            title="选择来访时间"
            :tabs="['选择年月日', '选择时分秒']"
            @confirm="handleVisitTimeConfirm"
            @cancel="showDateTimePicker = false">
            <DatePicker v-model="datePickerValue" :columns-type="['year', 'month', 'day']" />
            <TimePicker v-model="timePickerValue" :columns-type="['hour', 'minute', 'second']" />
        </DatePickerGroup>
    </Popup>
    <Popup v-model:show="todoDateVisible" position="bottom" round>
        <DatePickerGroup
            title="选择时间"
            :tabs="['选择年月日', '选择时分秒']"
            @confirm="handleTodoDateConfirm"
            @cancel="todoDateVisible = false">
            <DatePicker v-model="datePickerValue" :columns-type="['year', 'month', 'day']" />
            <TimePicker v-model="timePickerValue" :columns-type="['hour', 'minute', 'second']" />
        </DatePickerGroup>
    </Popup>
    <Popup v-model:show="contentEditorVisible" position="bottom" :style="{ height: '100%' }">
        <div class="editor-popup">
            <div class="editor-popup-header">
                <span class="editor-popup-title">编辑沟通内容</span>
                <span class="editor-popup-close" @click="contentEditorVisible = false">×</span>
            </div>
            <div class="editor-popup-body">
                <MxEditor v-model="tempContent" minHeight="100%" placeholder="请输入" :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
            </div>
            <div class="editor-popup-footer">
                <Button type="primary" block class="editor-popup-btn submit" @click="confirmContentEditor">确定</Button>
            </div>
        </div>
    </Popup>
    <ActionSheet
        v-model:show="receptionSpecVisible"
        :actions="receptionSpecActions"
        title="接待规格"
        @select="handleReceptionSpecSelect" />
    <ActionSheet
        v-model:show="receptionLocationVisible"
        :actions="receptionLocationActions"
        title="接待地点"
        @select="handleReceptionLocationSelect" />
    <Popup v-model:show="valueAddedVisible" position="bottom" round>
        <div class="value-added-popup">
            <div class="value-added-title">增值服务</div>
            <CheckboxGroup v-model="valueAddedDraft">
                <Checkbox v-for="item in valueAddedOptions" :key="item.value" :name="item.value">
                    {{ item.label }}
                </Checkbox>
            </CheckboxGroup>
            <Button type="primary" block @click="confirmValueAddedSelect">确定</Button>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
import AppPage from '@/appComponents/AppPage/index.vue';
import MxEditor from '@/components/MxEditor/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import {
    createVisitRecordApi,
    getReceptionRuleByCustomerApi,
    getVisitRecordApi,
    updateVisitRecordApi,
    sendVisitRecordMessageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { getStarLevelText } from '@/config/customer';
import choiceNormalIcon from './assets/icon_com_choice_nor@3x.png';
import choiceSelectedIcon from './assets/icon_com_choice_sel@3x.png';
import currentNormalIcon from './assets/icon_com_current_nor@3x.png';
import currentSelectedIcon from './assets/icon_com_current_sel@3x.png';
import finishedIcon from './assets/icon_com_current_fis@3x.png';

const router = useRouter();
const route = useRoute();
const formRef = ref<any>(null);
const todoFormRef = ref<any>(null);
const step = ref(0);
const submitting = ref(false);
const recordId = computed(() => route.query.id || '');
const isEdit = computed(() => !!recordId.value);
const todoEditorVisible = ref(false);
const pageTitle = computed(() => {
    if (todoEditorVisible.value) return todoEditingIndex.value >= 0 ? '编辑待办事项' : '新增待办事项';
    return isEdit.value ? '编辑来访记录' : '新增来访记录';
});
const formData = reactive<any>({
    status: '',
    customerId: '',
    customerName: '',
    starLevel: '',
    visitType: 'APPOINTMENT',
    actualTime: getNow(),
    visitors: '',
    executorList: [],
    executorCodes: [],
    receptionSpec: '',
    receptionLocation: '',
    customerDemand: '',
    content: '',
    attachmentList: [],
    feedback: '',
    plusServicesList: [],
    plusServicesDetail: '',
    plusServicesExecution: '',
});
const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
const starLevelText = computed(() => getStarLevelText(formData.starLevel));
const executorLabels = ref<string[]>([]);
const customerSelectVisible = ref(false);
const receptionSpecVisible = ref(false);
const receptionLocationVisible = ref(false);
const receptionSpecLabel = ref('');
const receptionLocationLabel = ref('');
const receptionSpecOptions = ref<any[]>([]);
const receptionLocationOptions = ref<any[]>([]);
const receptionSpecActions = computed(() =>
    receptionSpecOptions.value.map((item) => ({ name: item.label, value: item.value }))
);
const receptionLocationActions = computed(() =>
    receptionLocationOptions.value.map((item) => ({ name: item.label, value: item.value }))
);
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
const todoExpandedIndex = ref(-1);
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
const todoDateVisible = ref(false);
const todoDateIndex = ref(-1);
const todoDateField = ref('dueTime');
const valueAddedVisible = ref(false);
const valueAddedDraft = ref<string[]>([]);
const showDateTimePicker = ref(false);
const contentEditorVisible = ref(false);
const tempContent = ref('');
const datePickerValue = ref<string[]>([]);
const timePickerValue = ref<string[]>([]);
const plusServicesText = computed(() => formData.plusServicesList?.join('、') || '');

/** 返回当前时间，格式与 Web 表单保持一致。 */
function getNow() {
    const date = new Date();
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
        date.getMinutes()
    )}:${pad(date.getSeconds())}`;
}

/** 清空企业单位关联的自动回填字段。 */
const clearCustomerLinkageFields = () => {
    formData.starLevel = '';
    formData.receptionSpec = '';
    formData.receptionLocation = '';
    formData.content = '';
    receptionSpecLabel.value = '';
    receptionLocationLabel.value = '';
};

/**
 * 根据字典值取得 App 表单需要展示的文本。
 * @param options 字典选项
 * @param value 字典值
 * @returns 匹配到的字典文本
 */
const getOptionLabel = (options: any[], value: any) => {
    return options.find((item) => String(item.value) === String(value))?.label || '';
};

/**
 * 客户选择后回填企业信息、客户星级和接待规则。
 * @param option 通用企业选择组件返回的完整企业数据
 */
const handleCustomerChange = async (option: any) => {
    if (!option) {
        formData.customerId = '';
        formData.customerName = '';
        clearCustomerLinkageFields();
        return;
    }

    const customerId = option.id ?? option.customerId ?? option.value ?? '';
    formData.customerId = customerId;
    formData.customerName = option.customerName || option.label || '';
    clearCustomerLinkageFields();
    formData.starLevel = option.starLevel || '';

    try {
        const res: any = await getReceptionRuleByCustomerApi({
            ...option,
            id: customerId,
            customerId,
        });
        const rule = res?.data;
        if (!rule) return;

        formData.receptionSpec = rule.receptionSpec || '';
        formData.receptionLocation = rule.receptionLocation || '';
        formData.content = rule.content || rule.receptionProcess || '';
        receptionSpecLabel.value =
            rule.receptionSpecName || getOptionLabel(receptionSpecOptions.value, formData.receptionSpec);
        receptionLocationLabel.value =
            rule.receptionLocationName || getOptionLabel(receptionLocationOptions.value, formData.receptionLocation);
    } catch (error) {
        console.error('获取接待规则失败:', error);
    }
};

/** 客户名称字段点击入口。 */
const openCustomerSelect = () => {
    customerSelectVisible.value = true;
};

/** 保存接待人完整对象和编码数组。 */
const handleExecutorChange = (options: any) => {
    const list = Array.isArray(options) ? options : options ? [options] : [];
    formData.executorList = list.map((item: any) => ({
        username: item.username,
        code: item.code,
        larkUserId: item.larkUserId,
    }));
    executorLabels.value = list.map((item: any) => item.username || item.label || item.code).filter(Boolean);
};

/** 保存接待规格选择。 */
const handleReceptionSpecSelect = (option: any) => {
    formData.receptionSpec = option.value;
    receptionSpecLabel.value = option.name;
    receptionSpecVisible.value = false;
};

/** 保存接待地点选择。 */
const handleReceptionLocationSelect = (option: any) => {
    formData.receptionLocation = option.value;
    receptionLocationLabel.value = option.name;
    receptionLocationVisible.value = false;
};

/** 创建待办事项草稿。 */
const createTodoDraft = (todo: any = {}) => ({
    id: todo.id,
    todoContent: todo.todoContent || '',
    status: todo.status || 'TODO',
    principalList: todo.principalList || [],
    principalCodes: todo.principalCodes || [],
    principalLabels: todo.principalLabels || [],
    dueTime: todo.dueTime || '',
    completeTime: todo.completeTime || '',
    attachmentList: todo.attachmentList || [],
    remarks: todo.remarks || '',
});

/** 将待办事项复制到独立编辑页面。 */
const openTodoEditor = (index = -1) => {
    const draft = createTodoDraft(index >= 0 ? todoList.value[index] : {});
    Object.assign(todoEditorDraft, draft);
    todoEditingIndex.value = index;
    todoExpandedIndex.value = -1;
    todoEditorVisible.value = true;
};

/** 新增待办事项。 */
const addTodo = () => {
    openTodoEditor();
};

/** 保存独立待办事项编辑页。 */
const saveTodoEditor = () => {
    if (!todoEditorDraft.principalList?.length) {
        showToast('请选择负责人');
        return;
    }
    if (!todoEditorDraft.dueTime) {
        showToast('请选择截止时间');
        return;
    }
    const todo = JSON.parse(JSON.stringify(todoEditorDraft));
    if (todoEditingIndex.value >= 0) {
        todoList.value.splice(todoEditingIndex.value, 1, todo);
    } else {
        todoList.value.push(todo);
    }
    todoEditorVisible.value = false;
    todoEditingIndex.value = -1;
};

/** 处理 AppPage 返回按钮，独立待办页面返回待办列表。 */
const handleAppBack = () => {
    if (todoEditorVisible.value) {
        todoEditorVisible.value = false;
        todoEditingIndex.value = -1;
        return;
    }
    router.back();
};

/** 同步待办编辑页的负责人字段。 */
const handleTodoEditorPrincipalChange = (options: any) => {
    handleTodoPrincipalChange(todoEditorDraft, options);
};

/** 删除待办事项。 */
const removeTodo = (index: number) => {
    todoList.value.splice(index, 1);
    if (todoExpandedIndex.value === index) todoExpandedIndex.value = -1;
    else if (todoExpandedIndex.value > index) todoExpandedIndex.value -= 1;
};

/** 确认后删除待办事项，取消时保留列表数据。 */
const confirmRemoveTodo = async (index: number) => {
    try {
        await showConfirmDialog({
            title: '确认删除',
            message: '确定删除该待办事项吗？',
            confirmButtonText: '删除',
            cancelButtonText: '取消',
        });
        removeTodo(index);
    } catch {
        return;
    }
};

/** 进入待办事项独立编辑页。 */
const toggleTodoEdit = (index: number) => {
    openTodoEditor(index);
};

/** 切换待办事项摘要的展开状态。 */
const toggleTodoExpand = (index: number) => {
    todoExpandedIndex.value = todoExpandedIndex.value === index ? -1 : index;
};

/** 将待办事项序号转换为设计稿中的中文序号。 */
const getTodoSequence = (index: number) => {
    const sequenceMap = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    return `序号${sequenceMap[index] || index + 1}`;
};

/** 格式化待办事项摘要中的空值。 */
const formatTodoValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);

/** 将负责人字段转换为待办事项摘要文本。 */
const getTodoPrincipalText = (todo: any) => {
    if (todo.principalLabels?.length) return todo.principalLabels.join('、');
    const list = Array.isArray(todo.principalList) ? todo.principalList : [];
    return (
        list
            .map((item: any) => item.username || item.name || item.label || item.code)
            .filter(Boolean)
            .join('、') || '--'
    );
};

/** 保存待办负责人。 */
const handleTodoPrincipalChange = (todo: any, options: any) => {
    const list = Array.isArray(options) ? options : options ? [options] : [];
    todo.principalList = list.map((item: any) => ({
        username: item.username,
        code: item.code,
        larkUserId: item.larkUserId,
    }));
    todo.principalLabels = list.map((item: any) => item.username || item.label || item.code).filter(Boolean);
};

/** 打开增值服务多选弹窗，使用草稿值避免取消弹窗时直接修改表单。 */
const openValueAddedSelect = () => {
    valueAddedDraft.value = [...(formData.plusServicesList || [])];
    valueAddedVisible.value = true;
};

/** 确认增值服务选择并回写表单。 */
const confirmValueAddedSelect = () => {
    formData.plusServicesList = [...valueAddedDraft.value];
    valueAddedVisible.value = false;
};

/** 进入待办日期选择器。 */
const openTodoDate = (index: number, field: string) => {
    todoDateIndex.value = index;
    todoDateField.value = field;
    const currentValue = index >= 0 ? todoList.value[index]?.[field] : todoEditorDraft[field];
    const pickerValue = currentValue || getNow();
    const [date = '', time = ''] = pickerValue.split(' ');
    datePickerValue.value = date.split('-').filter(Boolean);
    const timeParts = time.split(':').filter(Boolean);
    timePickerValue.value = [timeParts[0] || '00', timeParts[1] || '00', timeParts[2] || '00'];
    todoDateVisible.value = true;
};

/** 打开来访时间选择器，并按已有值或当前时间初始化年月日及时分秒。 */
const openVisitDate = () => {
    const pickerValue = formData.actualTime || getNow();
    const [date = '', time = ''] = pickerValue.split(' ');
    datePickerValue.value = date.split('-').filter(Boolean);
    const timeParts = time.split(':').filter(Boolean);
    timePickerValue.value = [timeParts[0] || '00', timeParts[1] || '00', timeParts[2] || '00'];
    showDateTimePicker.value = true;
};

/** 处理通用日期时间选择器返回值。 */
const readPickerValue = (event: any) => {
    const date = event?.[0]?.selectedValues || datePickerValue.value;
    const time = event?.[1]?.selectedValues || timePickerValue.value;
    return `${date.join('-')} ${time.join(':')}`;
};
const handleVisitTimeConfirm = (event: any) => {
    formData.actualTime = readPickerValue(event);
    showDateTimePicker.value = false;
};
const handleTodoDateConfirm = (event: any) => {
    const value = readPickerValue(event);
    if (todoDateIndex.value >= 0) todoList.value[todoDateIndex.value][todoDateField.value] = value;
    else todoEditorDraft[todoDateField.value] = value;
    todoDateVisible.value = false;
};

/** 打开沟通内容编辑器。 */
const openContentEditor = () => {
    tempContent.value = formData.content || '';
    contentEditorVisible.value = true;
};

/** 确认沟通内容编辑。 */
const confirmContentEditor = () => {
    formData.content = tempContent.value;
    contentEditorVisible.value = false;
};

/** 将富文本内容转换为表单字段预览文本。 */
const getContentPreview = (content: string) => {
    if (!content) return '';
    return content
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
        .slice(0, 50);
};

/** 基础信息校验，保存校验企业、接待人和来访时间，提交再补充其余字段。 */
const validateBase = (submit = false) => {
    if (!formData.customerId) {
        showToast('请选择企业单位名称');
        return false;
    }
    if (!formData.executorCodes?.length) {
        showToast('请选择接待人');
        return false;
    }
    if (!formData.actualTime) {
        showToast('请选择来访时间');
        return false;
    }
    if (submit) {
        const requiredFields = [
            [formData.visitType, '请选择来访类型'],
            [formData.starLevel, '请选择客户星级'],
            [formData.visitors, '请填写来访人员'],
            [formData.receptionSpec, '请选择接待规格'],
            [formData.receptionLocation, '请选择接待地点'],
        ];
        const emptyField = requiredFields.find(([value]) => !value);
        if (emptyField) {
            showToast(emptyField[1] as string);
            return false;
        }
        const contentText = getContentPreview(formData.content);
        if (!contentText) {
            showToast('请填写沟通内容');
            return false;
        }
    }
    return true;
};

/** 将表单和待办数据转换为接口提交结构。 */
const buildPayload = (status: string) => {
    const payload = JSON.parse(JSON.stringify(formData));
    delete payload.executorCodes;
    if (isEdit.value) payload.id = Number(recordId.value);
    return {
        ...payload,
        status,
        todoList: todoList.value.map((item: any) => ({
            ...(item.id ? { id: item.id } : {}),
            todoContent: item.todoContent || '',
            status: item.status || 'TODO',
            principalList: item.principalList || [],
            dueTime: item.dueTime || '',
            completeTime: item.completeTime || '',
            attachmentList: item.attachmentList || [],
            remarks: item.remarks || '',
        })),
    };
};

/** 从保存接口响应中提取当前记录 ID，兼容新增和编辑接口的返回结构。 */
const getSavedRecordId = (res: any) => {
    const responseData = res?.data;
    if (responseData && typeof responseData === 'object') {
        return responseData.id ?? responseData.recordId ?? responseData.data?.id ?? res?.id;
    }
    return typeof responseData === 'number' || typeof responseData === 'string' ? responseData : res?.id;
};

/** 保存成功后询问是否发起来访记录的飞书提醒。 */
const confirmVisitRecordMessage = async (id: number | string) => {
    try {
        await showConfirmDialog({ title: '提示', message: '是否立即发起飞书提醒？' });
    } catch {
        return;
    }
    try {
        await sendVisitRecordMessageApi(id);
    } catch (error) {
        console.error('发起来访记录飞书提醒失败:', error);
    }
};

/** 保存或提交来访记录。 */
const saveRecord = async (status: string) => {
    submitting.value = true;
    try {
        const payload = buildPayload(status);
        const res: any = isEdit.value ? await updateVisitRecordApi(payload) : await createVisitRecordApi(payload);
        if (res?.code === 200 || res?.success) {
            const savedId = getSavedRecordId(res) ?? recordId.value;
            if (status === 'PENDING' && savedId) {
                await confirmVisitRecordMessage(savedId);
            }
            router.back();
        }
    } catch (error) {
        console.error('保存来访记录失败:', error);
    } finally {
        submitting.value = false;
    }
};

/** 保存草稿。 */
const handleSave = () => {
    if (!validateBase(false)) return;
    const invalidTodo = todoList.value.findIndex((item) => !item.dueTime);
    if (invalidTodo >= 0) {
        showToast(`请填写第${invalidTodo + 1}条待办事项的截止时间`);
        return;
    }
    saveRecord('PENDING');
};

/** 从基础信息进入待办步骤。 */
const goTodo = () => {
    step.value = 1;
};

/** 提交完整来访记录。 */
const handleSubmit = () => {
    if (!validateBase(true)) return;
    const invalidTodo = todoList.value.findIndex(
        (item) => !item.status || !item.principalList?.length || !item.dueTime
    );
    if (invalidTodo >= 0) {
        showToast(`请完善第${invalidTodo + 1}条待办事项`);
        return;
    }
    saveRecord('COMPLETED');
};

/** 加载接待规格字典。 */
const loadReceptionSpec = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['接待规格'], enumCfg['接待地点']] });
        receptionSpecOptions.value = (res?.data?.[enumCfg['接待规格']] || []).map((item: any) => ({
            label: item.name || item.label,
            value: item.code || item.value,
        }));
        receptionLocationOptions.value = (res?.data?.[enumCfg['接待地点']] || []).map((item: any) => ({
            label: item.name || item.label,
            value: item.code || item.value,
        }));
    } catch (error) {
        console.error('加载接待规格字典失败:', error);
    }
};

/** 加载编辑详情并回显表单、待办事项。 */
const loadDetail = async () => {
    if (!recordId.value) return;
    try {
        const res: any = await getVisitRecordApi(Number(recordId.value));
        const data = res?.data;
        if (!data) return;
        Object.assign(formData, data, {
            executorCodes: data.executorList?.map((item: any) => item.code) || [],
            plusServicesList: data.plusServicesList || [],
            attachmentList: data.attachmentList || [],
        });
        executorLabels.value = (data.executorList || []).map((item: any) => item.username || item.label || item.code);
        receptionSpecLabel.value =
            data.receptionSpecName ||
            receptionSpecOptions.value.find((item) => item.value === data.receptionSpec)?.label ||
            '';
        receptionLocationLabel.value =
            data.receptionLocationName ||
            receptionLocationOptions.value.find((item) => item.value === data.receptionLocation)?.label ||
            '';
        todoList.value = (data.todoList || []).map((item: any) => ({
            ...item,
            principalCodes: item.principalList?.map((person: any) => person.code) || [],
            principalLabels:
                item.principalList?.map((person: any) => person.username || person.label || person.code) || [],
            attachmentList: item.attachmentList || [],
        }));
        todoEditingIndex.value = -1;
        todoExpandedIndex.value = -1;
    } catch (error) {
        console.error('加载来访记录详情失败:', error);
    }
};

onMounted(async () => {
    await loadReceptionSpec();
    if (isEdit.value) await loadDetail();
});
</script>

<style lang="less" scoped>
.visit-add-page {
    padding: 0 0 8px;
}

.step-tabs {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 58px;
    padding-top: 4px;
    box-sizing: border-box;
    background: #ffffff;
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
    padding: 0 0 12px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
}

.todo-editor-page {
    min-height: 100%;
    padding: 0 0 8px;
}

.todo-editor-card {
    margin: 12px;
    padding: 0 0 12px;
    overflow: hidden;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
}

.todo-editor-card :deep(.van-cell) {
    padding: 14px 12px;
}

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
.todo-page {
    padding-bottom: 0;
}

.section-title {
    padding: 18px 12px 8px;
    color: #333333;
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
}

.form-card :deep(.van-cell),
.todo-page :deep(.van-cell) {
    padding: 14px 12px;
}

.form-card :deep(.van-cell::after),
.todo-page :deep(.van-cell::after) {
    border-bottom: 1px solid #ededed;
}

.form-card :deep(.van-field__label),
.todo-page :deep(.van-field__label) {
    color: var(--base-grey2);
    font-size: 16px;
}

.form-card :deep(.van-field__control),
.form-card :deep(.van-field__value),
.form-card :deep(.van-cell__value),
.todo-page :deep(.van-field__control),
.todo-page :deep(.van-field__value),
.todo-page :deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}

.form-card :deep(.van-field__word-limit),
.form-card :deep(.van-field__word-num),
.todo-page :deep(.van-field__word-limit),
.todo-page :deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}

.form-card :deep(.van-cell__right-icon),
.todo-page :deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}

.form-card :deep(.content-field .van-cell__right-icon) {
    transform: none;
}

.form-card :deep(.van-cell:last-child),
.todo-page :deep(.van-cell:last-child) {
    padding-bottom: 0;
}

.textarea-field :deep(.van-field__control) {
    min-height: 126px;
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
    color: #666666;
    font-size: 16px;
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

.todo-page {
    // min-height: 420px;
    // padding-bottom: 20px;
}

.todo-empty {
    display: flex;
    flex-direction: column;
    // min-height: 420px;
}

.todo-title {
    padding: 16px 12px 0;
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
}

.todo-title span {
    color: #999999;
    font-weight: 400;
}

.todo-empty-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0 16px;
    color: #999999;
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
    background: #ffffff;
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
    color: #333333;
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
    color: #999999;
}

.todo-summary-row b {
    flex: 1;
    min-width: 0;
    color: #444444;
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

.todo-expand .van-icon {
    font-size: 14px;
}

.add-todo-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    // margin: 2px 16px 0;
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

.value-added-popup {
    padding: 20px 16px 16px;
}

.value-added-title {
    margin-bottom: 18px;
    color: #333333;
    font-size: 18px;
    font-weight: 500;
    text-align: center;
}

.value-added-popup .van-checkbox {
    padding: 12px 0;
}

.value-added-popup .van-button {
    margin-top: 16px;
}

.form-card :deep(.van-field__control::placeholder),
.todo-page :deep(.van-field__control::placeholder) {
    color: #999999;
    opacity: 1;
}

.form-card :deep(.van-radio) {
    margin-right: 16px;
}

.visit-radio-icon {
    display: block;
    width: 16px;
    height: 16px;
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
