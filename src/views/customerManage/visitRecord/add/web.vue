<template>
    <WebPage showBack hideAddBtn contentPadding="0" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border @click="handleSave" v-if="!(isEdit && formData.status === 'COMPLETED')" :styleOption="{ 'color': 'var(--base-color)', 'border-color': 'var(--base-color)' }"> 保 存 </MxButton>
            <MxButton @click="handleSubmit"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="visit-record-add-container">
                <n-spin :show="pageLoading" description="加载中...">
                    <h1 class="addTitle">{{ pageTitle }}</h1>
                    <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="130px">
                        <!-- 基础信息 -->
                        <n-grid :cols="2" :x-gap="24">
                            <n-grid-item>
                                <n-form-item label="企业单位名称" path="customerId">
                                    <MxCommSelect v-model="formData.customerId" typeName="企业客户" title="企业客户" placeholder="请选择" :clearable="true" :text="false" @changeEvt="handleCustomerChange" :disabled="isEdit === true"></MxCommSelect>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="来访类型" path="visitType">
                                    <n-radio-group v-model:value="formData.visitType">
                                        <n-space>
                                            <n-radio value="APPOINTMENT">提前预约</n-radio>
                                            <n-radio value="TEMPORARY">临时通知</n-radio>
                                        </n-space>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="客户星级" path="starLevel">
                                    <n-input :value="getStarLevelText(formData.starLevel)" placeholder="选择企业后自动带出" disabled />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="来访时间" path="actualTime">
                                    <n-date-picker v-model:formatted-value="formData.actualTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="请选择" style="width: 100%" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="来访人员" path="visitors">
                                    <n-input v-model:value="formData.visitors" type="textarea" placeholder="请输入来访人员姓名及职务，如：张三-经理，李四-总监" :maxlength="100" show-count :rows="2" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="接待规格" path="receptionSpec">
                                    <n-select v-model:value="formData.receptionSpec" :options="receptionSpecOptions" placeholder="选择企业后自动带出" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="接待人" path="executorCodes">
                                    <MxPersonSelect multiple v-model:modelValue="formData.executorCodes" placeholder="请选择接待人" @changeEvt="handleExecutorChange" />
                                </n-form-item>
                            </n-grid-item>

                            <n-grid-item>
                                <n-form-item label="接待地点" path="receptionLocation">
                                    <MxDict placeholder="请选择" dictType="接待地点" v-model="formData.receptionLocation"></MxDict>
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                        <!-- 沟通内容 -->
                        <n-form-item label="沟通内容" path="content">
                            <MxEditor
                                :autoFocus="false"
                                v-model="formData.content"
                                minHeight="220px"
                                :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                        </n-form-item>
                        <!-- 客户需求记录 -->
                        <n-form-item label="客户需求记录" path="customerDemand">
                            <n-input v-model:value="formData.customerDemand" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="4" />
                        </n-form-item>
                        <!-- 接待附件 -->
                        <n-form-item label="接待附件" path="attachmentList">
                            <div>
                                <MxWebFileUpload v-model="formData.attachmentList" :limit="20" :multiple="true" :accept="attachmentAccept" fileSize="50M" />
                            </div>
                        </n-form-item>

                        <!-- 评价反馈 -->
                        <n-form-item label="评价反馈" path="feedback">
                            <n-input v-model:value="formData.feedback" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="4" />
                        </n-form-item>

                        <!-- 增值服务 -->
                        <n-form-item label="增值服务" path="plusServicesList">
                            <n-checkbox-group v-model:value="formData.plusServicesList">
                                <n-space>
                                    <n-checkbox v-for="item in valueAddedOptions" :key="item.value" :value="item.value" :label="item.label" />
                                </n-space>
                            </n-checkbox-group>
                        </n-form-item>

                        <!-- 服务详情 -->
                        <n-form-item label="增值服务详情" path="plusServicesDetail">
                            <n-input v-model:value="formData.plusServicesDetail" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="4" />
                        </n-form-item>

                        <!-- 执行跟踪 -->
                        <n-form-item label="增值服务执行情况" path="plusServicesExecution">
                            <n-input v-model:value="formData.plusServicesExecution" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="4" />
                        </n-form-item>

                        <!-- 待办事项 -->
                        <div class="todo-section">
                            <div class="todo-header">
                                <span class="todo-title">待办事项</span>
                                <MxButton type="default" @click="addTodoRow" size="mini" color="#2C65F2" border>
                                    <template #leftIcon>
                                        <n-icon>
                                            <AddOutline />
                                        </n-icon>
                                    </template>
                                    新增
                                </MxButton>
                            </div>
                            <n-data-table :columns="todoColumns" :data="todoList" :bordered="true" :single-line="false" size="small" :scroll-x="contactScrollX" />
                        </div>
                    </n-form>
                </n-spin>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { AddOutline } from '@vicons/ionicons5';
import { ref, reactive, h, computed, onMounted, resolveComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
    NForm,
    NFormItem,
    NGrid,
    NGridItem,
    NInput,
    NSelect,
    NRadio,
    NRadioGroup,
    NSpace,
    NCheckbox,
    NCheckboxGroup,
    NDatePicker,
    NDataTable,
    NSpin,
    NIcon,
    NTooltip,
    useDialog,
} from 'naive-ui';
import {
    createVisitRecordApi,
    updateVisitRecordApi,
    getVisitRecordApi,
    getReceptionRuleByCustomerApi,
    sendVisitRecordMessageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { getStarLevelText } from '@/config/customer';

const router = useRouter();
const route = useRoute();
const formRef = ref<any>(null);
const dialog = useDialog();
const pageLoading = ref(false);
const recordId = computed(() => route.query.id || undefined);
const isEdit = computed(() => !!recordId.value);
const pageTitle = computed(() => (isEdit.value ? '编辑来访记录' : '新增来访记录'));

// ========== 表单数据 ==========
const formData = reactive({
    status: '',
    customerId: '', // 企业ID
    customerName: '', // 企业单位名称
    starLevel: '', // 客户星级
    visitType: 'APPOINTMENT', // 访问类型
    actualTime: new Date().toLocaleString('sv-SE'), // 访问时间，默认当前时间（yyyy-MM-dd HH:mm:ss 字符串）
    visitors: '', // 来访人员及职务，如：张三-经理，李四-总监
    executorList: [], // 接待人完整数组对象
    executorCodes: [], // 接待人code数组
    receptionSpec: undefined, // 接待规格
    receptionLocation: '', // 接待地点
    customerDemand: '', // 客户需求记录
    content: '', // 沟通内容
    attachmentList: [], // 附件URLs
    feedback: '', // 反馈
    plusServicesList: [], // 增值服务
    plusServicesDetail: '', // 增值服务详情
    plusServicesExecution: '', // 增值服务执行情况
});

// ========== 选项配置 ==========

// 客户选择变更处理
const handleCustomerChange = async (option) => {
    if (isEdit.value === true) return;
    if (option) {
        formData.customerName = option.customerName;
        formData.starLevel = option.starLevel;
        // 接待规则接口
        try {
            const res: any = await getReceptionRuleByCustomerApi({ ...option });
            if (res?.data) {
                formData.receptionSpec = res.data.receptionSpec || '';
                formData.receptionLocation = res.data.receptionLocation || '';
                formData.content = res.data.content || '';
            }
        } catch (error) {
            console.error('获取接待规则失败:', error);
        }
    } else {
        // 清除时重置关联字段
        formData.customerName = '';
        formData.starLevel = '';
        formData.receptionSpec = '';
        formData.receptionLocation = '';
        formData.content = '';
    }
};

// 接待人选择变更：拿到全字段对象数组
const handleExecutorChange = (options: any) => {
    // multiple 模式下 options 为数组，单选时为对象
    const arr = Array.isArray(options) ? options : options ? [options] : [];
    formData.executorList = arr.map((item: any) => ({ username: item.username, code: item.code, larkUserId: item.larkUserId }));
    console.log('[接待人]选中完整对象:', formData.executorList);
};

// 接待规格选项（字典来源）
const receptionSpecOptions = ref<any[]>([]);

// 接待规格字典获取
const loadReceptionSpecDict = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['接待规格']] });
        if (res.code === 200) {
            const list: any[] = res.data?.[enumCfg['接待规格']] || [];
            receptionSpecOptions.value = list.map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
        }
    } catch (error) {
        console.error('加载接待规格字典失败:', error);
    }
};

const valueAddedOptions = [
    { label: '定制化取样', value: '定制化取样' },
    { label: '优先供货保障', value: '优先供货保障' },
    { label: '账期支持', value: '账期支持' },
    { label: '专属定价', value: '专属定价' },
    { label: '其他', value: '其他' },
];

// ========== 接待附件 ==========
// 支持的文件类型：PDF / 图片 / Word / Excel
const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
// ========== 待办事项表格 ==========
const createEmptyTodoRow = () => ({
    todoContent: '',
    status: 'TODO',
    delayReason: '',
    principalList: [], // 负责人完整数组对象
    principalCodes: [], // 负责人code数组
    dueTime: null,
    completeTime: null,
    attachmentList: [],
    remarks: '',
});

const todoList = ref<any[]>([]);

const todoStatusOptions = [
    { label: '未完成', value: 'TODO' },
    { label: '已完成', value: 'DONE' },
    { label: '延期', value: 'DELAYED' },
];
// 添加待办事项行
const addTodoRow = () => {
    todoList.value.push(createEmptyTodoRow());
};
// 删除待办事项行
const deleteTodoRow = (index: number) => {
    todoList.value.splice(index, 1);
};

const todoColumns = computed(() => {
    const baseColumns: any[] = [
        {
            title: '序号',
            key: 'index',
            width: 60,
            render: (_row: any, index: number) => index + 1,
        },
        {
            title: '待办事项',
            width: 160,
            key: 'todoContent',
            render: (row: any, index: number) => {
                return h(NInput, {
                    value: row.todoContent,
                    placeholder: '请输入',
                    size: 'small',
                    maxlength: 50,
                    type: 'textarea',
                    rows: 1,
                    clearable: true,
                    onUpdateValue: (val: string) => {
                        todoList.value[index].todoContent = val;
                    },
                });
            },
        },
        {
            title: '状态',
            key: 'status',
            width: 160,
            render: (row: any, index: number) => {
                return h(NSelect, {
                    value: row.status,
                    options: todoStatusOptions,
                    placeholder: '请选择',
                    size: 'small',
                    clearable: true,
                    onUpdateValue: (val: string) => {
                        todoList.value[index].status = val;
                    },
                });
            },
        },
        {
            title: () =>
                h(
                    NSpace,
                    { align: 'center', size: 4 },
                    {
                        default: () => [h('span', { style: { color: '#F46B6C' } }, '*'), h('span', null, '负责人')],
                    }
                ),
            key: 'principalCodes',
            width: 180,
            render: (row: any, index: number) => {
                const MxPersonSelect = resolveComponent('MxPersonSelect');
                return h(MxPersonSelect as any, {
                    multiple: true,
                    modelValue: row.principalCodes,
                    placeholder: '请选择',
                    size: 'small',
                    'onUpdate:modelValue': (val: string[]) => {
                        todoList.value[index].principalCodes = val || [];
                    },
                    onChangeEvt: (options: any[]) => {
                        // 拿到选中人员的完整对象数组（含 username/code/userDeptList 等全字段）
                        const arr = Array.isArray(options) ? options : [];
                        todoList.value[index].principalList = arr.map((item: any) => ({ username: item.username, code: item.code, larkUserId: item.larkUserId }));
                        console.log('[负责人]选中完整对象:', todoList.value[index].principalList);
                    },
                });
            },
        },
        {
            title: () =>
                h(
                    NSpace,
                    { align: 'center', size: 4 },
                    {
                        default: () => [h('span', { style: { color: '#F46B6C' } }, '*'), h('span', null, '截止时间')],
                    }
                ),
            key: 'dueTime',
            width: 180,
            render: (row: any, index: number) => {
                return h(NDatePicker, {
                    formattedValue: row.dueTime,
                    type: 'datetime',
                    valueFormat: 'yyyy-MM-dd HH:mm:ss',
                    placeholder: '请选择',
                    size: 'small',
                    style: { width: '100%' },
                    clearable: true,
                    onUpdateFormattedValue: (val: string | null) => {
                        todoList.value[index].dueTime = val;
                    },
                });
            },
        },
        {
            title: '完成时间',
            key: 'completeTime',
            width: 180,
            render: (row: any, index: number) => {
                return h(NDatePicker, {
                    formattedValue: row.completeTime,
                    type: 'datetime',
                    valueFormat: 'yyyy-MM-dd HH:mm:ss',
                    placeholder: '请选择',
                    size: 'small',
                    style: { width: '100%' },
                    clearable: true,
                    onUpdateFormattedValue: (val: string | null) => {
                        todoList.value[index].completeTime = val;
                    },
                });
            },
        },
        {
            title: h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                [
                    h('span', '附件'),
                    h(
                        NTooltip,
                        { trigger: 'hover', placement: 'top' },
                        {
                            trigger: () =>
                                h(
                                    'div',
                                    { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#faad14', flexShrink: '0', verticalAlign: 'middle' } },
                                    h(NIcon, { size: 16, color: '#999999' }, {
                                        default: () =>
                                            h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', style: { display: 'block' } },
                                                h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' })
                                            ),
                                    })
                                ),
                            default: () =>
                                h('div', { style: { fontSize: '13px', lineHeight: '1.6' } }, [
                                    h('div', { style: { whiteSpace: 'nowrap' } }, "支持上传.pdf, .jpg, .jpeg, .png, .doc, .docx, .xls, .xlsx"),
                                    h('div', { style: { whiteSpace: 'nowrap' } }, '单文件最大不超过50MB'),
                                    h('div', { style: { whiteSpace: 'nowrap' } }, '最多可上传20个文件'),
                                ]),
                        }
                    ),
                ]
            ),
            key: 'attachmentList',
            width: 200,
            render: (row: any) => {
                const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                return h(MxWebFileUpload as any, {
                    modelValue: row.attachmentList,
                    limit: 20,
                    multiple: true,
                    accept: attachmentAccept,
                    forceAppSize: true,
                    appSizeWidth: 80,
                    fileSize: "50M"
                });
            },
        },
        {
            title: '备注',
            key: 'remarks',
            width: 180,
            render: (row: any, index: number) => {
                return h(NInput, {
                    value: row.remarks,
                    placeholder: '请输入',
                    size: 'small',
                    type: 'textarea',
                    rows: 1,
                    clearable: true,
                    onUpdateValue: (val: string) => {
                        todoList.value[index].remarks = val;
                    },
                });
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_row: any, index: number) => {
                return h(
                    NSpace,
                    { justify: 'center', size: 12 },
                    {
                        default: () => [
                            h(
                                'span',
                                {
                                    style: { color: '#E34242', cursor: 'pointer' },
                                    onClick: () => deleteTodoRow(index),
                                },
                                '删除'
                            ),
                        ],
                    }
                );
            },
        },
    ];
    return baseColumns;
});

const contactScrollX = computed(() => {
    return todoColumns.value.reduce(
        (sum: number, col: any) => sum + (col.width || 0),
        0
    );
});

// ========== 表单验证规则 ==========
const rules = {
    customerId: { required: true, message: '请选择企业名称', trigger: ['change'], saveOnly: true },
    visitType: { required: true, message: '请选择来访类型', trigger: ['change'] },
    starLevel: { required: true, message: '请选择客户星级', trigger: ['change'] },
    actualTime: { required: true, message: '请选择来访时间', trigger: ['change'], saveOnly: true },
    visitors: { required: true, message: '请添加来访人员', trigger: ['change'] },
    receptionSpec: { required: true, message: '请选择接待规格', trigger: ['change'] },
    executorCodes: {
        required: true,
        message: '请选择接待人',
        trigger: ['change'],
        type: 'array' as const,
        saveOnly: true,
    },
    receptionLocation: { required: true, message: '请选择接待地点', trigger: ['change'] },
    content: {
        required: true,
        trigger: ['change', 'blur'],
        validator: (_rule: any, value: string) => {
            // 过滤富文本空标签（如 <p><br></p>、<p></p>）
            const pureText = (value || '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, '')
                .trim();
            if (!pureText) {
                return new Error('请填写沟通内容');
            }
            return true;
        },
    },
};

// ========== 保存与提交 ==========
/** 从保存接口响应中提取当前记录 ID，兼容新增和编辑接口的返回结构。 */
const getSavedRecordId = (res: any) => {
    const responseData = res?.data;
    if (responseData && typeof responseData === 'object') {
        return responseData.id ?? responseData.recordId ?? responseData.data?.id ?? res?.id;
    }
    return typeof responseData === 'number' || typeof responseData === 'string' ? responseData : res?.id;
};

/** 保存成功后询问是否发起来访记录的飞书提醒。 */
const confirmVisitRecordMessage = (id: number | string) =>
    new Promise<void>((resolve) => {
        let positivePending = false;
        let pageExited = false;
        const exitPage = () => {
            if (pageExited) return;
            pageExited = true;
            resolve();
            router.back();
        };
        dialog.warning({
            title: '提示',
            content: '是否立即发起飞书提醒？',
            closable: true,
            maskClosable: false,
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                positivePending = true;
                try {
                    await sendVisitRecordMessageApi(id);
                } catch (error) {
                    console.error('发起来访记录飞书提醒失败:', error);
                } finally {
                    positivePending = false;
                    exitPage();
                }
            },
            onNegativeClick: exitPage,
            onClose: () => {
                if (!positivePending) exitPage();
            },
        });
    });

const buildSubmitData = (status: string) => {
    const restFormData = JSON.parse(JSON.stringify(formData));
    restFormData.plusServicesList = restFormData.plusServicesList.length > 0 ? restFormData.plusServicesList : [];
    delete restFormData.executorCodes;
    // 根据实际接口字段调整提交数据结构
    const data: any = {
        ...restFormData,
        status: status,
        todoList: todoList.value.map((item: any) => ({
            ...(item.id ? { id: item.id } : {}),
            todoContent: item.todoContent,
            status: item.status,
            delayReason: item.delayReason || '',
            principalList: item.principalList || null,
            dueTime: item.dueTime || '',
            completeTime: item.completeTime || '',
            attachmentList: item.attachmentList || '',
            remarks: item.remarks,
        })),
    };
    if (isEdit.value) {
        data.id = Number(recordId.value);
    }

    console.log('提交数据', data);
    return data;
};

const handleSubmitData = async (status: string) => {
    const data = buildSubmitData(status);
    let res: any;
    try {
        if (isEdit.value) {
            res = await updateVisitRecordApi(data);
        } else {
            res = await createVisitRecordApi(data);
        }
        if (res?.code === 200 || res?.success) {
            const savedId = getSavedRecordId(res) ?? recordId.value;
            if (status === 'PENDING' && savedId) {
                await confirmVisitRecordMessage(savedId);
            } else {
                router.back();
            }
        }
    } catch (err) {
        console.error('提交失败', err);
    }
};

const handleSave = () => {
    validateSave(() => handleSubmitData('PENDING')); // 保存 -- 单据状态更新为“待接待”
};

const handleSubmit = () => {
    validateAll(() => handleSubmitData('COMPLETED')); // 提交 -- 单据状态更新为“已接待”
};

// 保存校验标记为 saveOnly 的基础字段，提交继续使用完整校验。
const validateSave = (onSuccess: () => void) => {
    formRef.value?.validate(
        (errors: any) => {
            if (errors) {
                console.log('保存表单验证失败', errors);
                return;
            }
            const invalidTodoIndex = todoList.value.findIndex((item: any) => !item.dueTime);
            if (invalidTodoIndex >= 0) {
                window.$message.warning(`待办事项第${invalidTodoIndex + 1}行「截止完成时间」未填写`);
                return;
            }
            onSuccess();
        },
        (rule: any) => rule.saveOnly === true,
    );
};

// 统一验证：基础表单 + 来访人员 + 待办事项表格
const validateAll = (onSuccess: () => void) => {
    formRef.value?.validate((errors: any) => {
        if (errors) {
            console.log('表单验证失败', errors);
            return;
        }
        // 校验待办事项
        if (todoList.value && todoList.value.length > 0) {
            for (let i = 0; i < todoList.value.length; i++) {
                const row = todoList.value[i];
                if (!row.status) {
                    window.$message.warning(`待办事项第${i + 1}行「状态」未选择`);
                    return;
                }
                if (!Array.isArray(row.principalList) || row.principalList.length === 0) {
                    window.$message.warning(`待办事项第${i + 1}行「负责人」未选择`);
                    return;
                }
                if (!row.dueTime) {
                    window.$message.warning(`待办事项第${i + 1}行「截止完成时间」未填写`);
                    return;
                }
            }
        }
        onSuccess();
    });
};

// ========== 编辑回显数据 ==========

const loadDetailData = async () => {
    if (!recordId.value) return;
    pageLoading.value = true;
    try {
        const res: any = await getVisitRecordApi(Number(recordId.value));
        const d = res?.data;
        if (!d) return;
        Object.assign(formData, {
            status: d.status || '',
            customerId: d.customerId ?? null,
            customerName: d.customerName || '',
            visitType: d.visitType || 'APPOINTMENT',
            starLevel: d.starLevel || '',
            actualTime: d.actualTime || '',
            visitors: d.visitors || '',
            executorList: d.executorList || '',
            executorCodes: d.executorList.map((item: any) => item.code) || [],
            receptionSpec: d.receptionSpec || '',
            receptionLocation: d.receptionLocation || '',
            customerDemand: d.customerDemand || '',
            content: d.content || '',
            attachmentList: d.attachmentList,
            feedback: d.feedback || '',
            plusServicesList: d.plusServicesList || [],
            plusServicesDetail: d.plusServicesDetail || '',
            plusServicesExecution: d.plusServicesExecution || '',
        });

        // 待办事项回显
        const rawList: any[] = Array.isArray(d.todoList) ? d.todoList : [];

        todoList.value =
            rawList.length > 0
                ? rawList.map((item: any) => {
                    return {
                        id: item.id,
                        todoContent: item.todoContent || '',
                        status: item.status || 'TODO',
                        delayReason: item.delayReason || '',
                        principalList: item.principalList || [],
                        principalCodes: item.principalList?.map((p: any) => p.code) || [],
                        dueTime: item.dueTime || null,
                        completeTime: item.completeTime || null,
                        attachmentList: item.attachmentList || [],
                        remarks: item.remarks || '',
                    };
                })
                : [];
    } catch (err) {
        console.error('加载详情失败', err);
    } finally {
        pageLoading.value = false;
    }
};

onMounted(() => {
    loadReceptionSpecDict(); // 加载接待规格字典
    if (isEdit.value) {
        loadDetailData();
    }
});
</script>

<style scoped lang="less">
.visit-record-add-container {
    height: 100%;
    overflow-y: auto;
    padding: 16px;

    .addTitle {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
    }

    :deep(.n-form-item-label) {
        font-weight: 400;
    }

    .upload-tip {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
    }

    .todo-section {
        margin-top: 16px;

        .todo-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .todo-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }
    }
}
</style>
