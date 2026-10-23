<template>
    <AppView v-if="isAppPage" />
    <WebPage v-else showBack hideAddBtn contentPadding="0" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border @click="handleSave" v-if="!(isEdit && formData.status === 'COMPLETED')" :styleOption="{ 'color': 'var(--base-color)', 'border-color': 'var(--base-color)' }"> 保 存 </MxButton>
            <MxButton @click="handleSubmit"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="visit-plan-add-container">
                <n-spin :show="pageLoading" description="加载中...">
                    <h1 class="addTitle">{{ pageTitle }}</h1>
                    <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="150px">
                        <!-- 基础信息 -->
                        <n-grid :cols="2" :x-gap="24">
                            <n-grid-item>
                                <n-form-item label="企业单位名称" path="customerId">
                                    <MxCommSelect v-model="formData.customerId" typeName="企业客户" title="企业客户" placeholder="请选择" :clearable="true" :text="false" @changeEvt="handleCustomerChange" :disabled="isEdit === true"></MxCommSelect>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="拜访周期" path="visitCycle">
                                    <n-select v-model:value="formData.visitCycle" :options="visitCycleOptions" placeholder="选择企业后自动带出" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="客户星级" path="starLevel">
                                    <n-input :value="getStarLevelText(formData.starLevel)" placeholder="选择企业后自动带出" disabled />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="计划拜访时间" path="planTime">
                                    <n-date-picker v-model:formatted-value="formData.planTime" type="datetime" format="yyyy-MM-dd HH:mm:ss" value-format="yyyy-MM-dd HH:mm:ss" placeholder="请选择" style="width: 100%" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="拜访人" path="executorCodes">
                                    <MxPersonSelect multiple v-model:modelValue="formData.executorCodes" placeholder="请选择拜访人" @changeEvt="handleExecutorChange" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="拜访目的" path="visitPurpose">
                                    <n-select v-model:value="formData.visitPurpose" :options="visitPurposeOptions" placeholder="请选择" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="客户对接人" path="contactPersonIds">
                                    <n-select v-model:value="formData.contactPersonIds" :options="contactPersonOptions" placeholder="请选择" clearable multiple @update:value="handleContactPersonIdsChange" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>

                        <!-- 客户工作规律 -->
                        <n-form-item label="客户工作规律" path="customerWorkPattern">
                            <n-input v-model:value="formData.customerWorkPattern" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="4" />
                        </n-form-item>

                        <n-form-item label="拜访要求" path="visitRequirements">
                            <n-input v-model:value="formData.visitRequirements" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="2" />
                        </n-form-item>


                        <!-- 沟通内容 -->
                        <n-form-item label="沟通内容" path="content">
                        <MxEditor
                            :autoFocus="false"
                            v-model="formData.content"
                            minHeight="220px"
                            :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                        </n-form-item>

                        <!-- 客户库存/开工率记录 -->
                        <n-form-item label="客户库存/开工率记录" path="customerInventoryRate">
                            <n-input v-model:value="formData.customerInventoryRate" type="textarea" placeholder="请输入" :maxlength="255" show-count :rows="4" />
                        </n-form-item>

                        <!-- 拜访附件 -->
                        <n-form-item label="拜访附件" path="attachmentList">
                            <div>
                        <MxWebFileUpload v-model="formData.attachmentList" :limit="20" :multiple="true" :accept="attachmentAccept" fileSize="50M" />
                            </div>
                        </n-form-item>

                        <!-- 拜访反馈 -->
                        <n-form-item label="拜访反馈" path="feedback">
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

                        <!-- 执行情况 -->
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
import { isApp } from '@/utils/comm';
import AppView from './app.vue';
import dayjs from 'dayjs';
import {
    NForm,
    NFormItem,
    NGrid,
    NGridItem,
    NInput,
    NSelect,
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
    createVisitPlanApi,
    updateVisitPlanApi,
    getVisitPlanApi,
    getVisitPlanRuleByCustomerApi,
    getCustomerContactListApi,
    sendVisitPlanMessageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { getStarLevelText } from '@/config/customer';

const router = useRouter();
const route = useRoute();
const isAppPage = isApp();
const formRef = ref<any>(null);
const dialog = useDialog();
const pageLoading = ref(false);
const recordId = computed(() => route.query.id || undefined);
const isEdit = computed(() => !!recordId.value);
const pageTitle = computed(() => (isEdit.value ? '编辑拜访记录' : '新增拜访记录'));



// ========== 表单数据 ==========
const formData = reactive({
    status: '',
    customerId: null, // 企业ID
    customerName: '', // 企业单位名称
    starLevel: '', // 客户星级
    planTime: null, // 计划拜访时间
    executorList: [], // 拜访人完整数组对象
    executorCodes: [], // 拜访人code数组
    visitCycle: undefined, // 拜访周期
    visitPurpose: undefined, // 拜访目的
    contactPersonList: [], // 客户对接人
    contactPersonIds: [], // 客户对接人ID数组
    customerWorkPattern: '', // 客户工作规律
    visitRequirements: '', // 拜访要求
    content: '', // 沟通内容
    customerInventoryRate: '', // 客户库存/开工率记录
    attachmentList: [], // 附件列表
    feedback: '', // 客户反馈
    plusServicesList: [], // 增值服务
    plusServicesDetail: '', // 增值服务详情
    plusServicesExecution: '', // 增值服务执行情况
    // cancelReason: '', // 取消原因
});

// ========== 选项配置 ==========

// 客户对接人选项
const contactPersonOptions = ref<any[]>([]);

// 加载客户对接人列表
const loadContactPersonOptions = async (customerId: number) => {
    try {
        const res: any = await getCustomerContactListApi(customerId);
        if (res?.data) {
            contactPersonOptions.value = res.data.map((item: any) => ({
                label: item.contactName,
                value: item.id,
                ...item,
            }));
            // 设置默认选中客户对接人ID数组
            formData.contactPersonIds = contactPersonOptions.value.map((person: any) => person.id) || [];
            formData.contactPersonList = contactPersonOptions.value;
        }
    } catch (error) {
        console.error('加载客户对接人列表失败:', error);
    }
};

// 客户选择变更处理
const handleCustomerChange = async (option: any) => {
    if (isEdit.value === true) return;
    if (option) {
        formData.customerName = option.customerName;
        formData.starLevel = option.starLevel;

        // 加载客户对接人列表
        await loadContactPersonOptions(option.id);

        // 拜访规则接口
        try {
            const res: any = await getVisitPlanRuleByCustomerApi({ ...option });
            if (res?.data) {
                formData.visitCycle = res.data.visitCycle || null;
                formData.planTime = res.data.planTime || null;
            }
        } catch (error) {
            console.error('获取拜访规则失败:', error);
        }
    } else {
        // 清除时重置关联字段
        formData.customerName = '';
        formData.starLevel = '';
        formData.visitCycle = '';
        contactPersonOptions.value = [];
    }
};

// 拜访人选择变更：拿到全字段对象数组
const handleExecutorChange = (options: any) => {
    // multiple 模式下 options 为数组，单选时为对象
    const arr = Array.isArray(options) ? options : options ? [options] : [];
    formData.executorList = arr.map((item: any) => ({ username: item.username, code: item.code, larkUserId: item.larkUserId }));
    console.log('[拜访人]选中完整对象:', formData.executorList);
};

// 客户对接人ID变更处理
const handleContactPersonIdsChange = (selectedIds: number[], selectedOptions: any[]) => {
    console.log('[客户对接人]选中ID:', selectedIds, '选中选项:', selectedOptions);
    formData.contactPersonList = selectedOptions;
};



// 拜访周期选项（字典来源）
const visitCycleOptions = ref<any[]>([]);

// 拜访目的选项（字典来源）
const visitPurposeOptions = ref<any[]>([]);

// 加载拜访相关字典
const loadVisitDicts = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['关怀周期'], enumCfg['拜访目的']] });
        if (res.code === 200) {
            // 拜访周期（统一用关怀周期字典）
            const cycleList: any[] = res.data?.[enumCfg['关怀周期']] || [];
            visitCycleOptions.value = cycleList.map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
            // 拜访目的
            const purposeList: any[] = res.data?.[enumCfg['拜访目的']] || [];
            visitPurposeOptions.value = purposeList.map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
        }
    } catch (error) {
        console.error('加载拜访字典失败:', error);
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
    remark: '',
});

const todoList = ref<any[]>([]);

const todoStatusOptions = [
    { label: '未完成', value: 'TODO' },
    { label: '已完成', value: 'DONE' },
    { label: '延期', value: 'DELAYED' },
];

const addTodoRow = () => {
    todoList.value.push(createEmptyTodoRow());
};

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
                    maxlength: 200,
                    clearable: true,
                    type: 'textarea',
                    rows: 1,
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
        // {
        //     title: '延期原因',
        //     key: 'delayReason',
        //     width: 180,
        //     render: (row: any, index: number) => {
        //         return h(NInput, {
        //             value: row.delayReason,
        //             placeholder: '请填写延期原因',
        //             size: 'small',
        //             maxlength: 200,
        //             clearable: true,
        //             onUpdateValue: (val: string) => {
        //                 todoList.value[index].delayReason = val;
        //             },
        //         });
        //     },
        // },
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
                    modelValue: row.attachmentList || [],
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
            key: 'remark',
            width: 180,
            render: (row: any, index: number) => {
                return h(NInput, {
                    value: row.remark,
                    placeholder: '请输入',
                    size: 'small',
                    maxlength: 200,
                    type: 'textarea',
                    rows: 1,
                    clearable: true,
                    onUpdateValue: (val: string) => {
                        todoList.value[index].remark = val;
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
    planTime: { required: true, message: '请选择计划拜访时间', trigger: ['change'], saveOnly: true },
    contactPersonIds: {
        required: true,
        message: '请选择客户对接人',
        trigger: ['change'],
        type: 'array' as const,
    },
    starLevel: { required: true, message: '请选择客户星级', trigger: ['change'] },
    executorCodes: {
        required: true,
        message: '请选择拜访人',
        trigger: ['change'],
        type: 'array' as const,
        saveOnly: true,
    },
    visitCycle: { required: true, message: '请选择拜访周期', trigger: ['change'] },
    visitPurpose: { required: true, message: '请选择拜访目的', trigger: ['change'] },
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

/** 保存成功后询问是否发起拜访记录的飞书提醒。 */
const confirmVisitPlanMessage = (id: number | string) =>
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
                    await sendVisitPlanMessageApi(id);
                } catch (error) {
                    console.error('发起拜访记录飞书提醒失败:', error);
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


    // 剔除不需要提交的字段
    const restFormData: any = JSON.parse(JSON.stringify(formData)) || {};
    delete restFormData.executorCodes;
    delete restFormData.contactPersonIds;

    // 根据实际接口字段调整提交数据结构
    const data: any = {
        ...restFormData,
        status: status,
        todoList: todoList.value.map((item: any) => ({
            ...(item.id ? { id: item.id } : {}),
            todoContent: item.todoContent,
            status: item.status,
            delayReason: item.delayReason || '',
            principalList: item.principalList || [],
            dueTime: item.dueTime || '',
            completeTime: item.completeTime || '',
            attachmentList: item.attachmentList || '',
            remark: item.remark,
        })),
    };

    if (status === 'COMPLETED') {
        data.actualTime = dayjs().format('YYYY-MM-DD HH:mm:ss');  // 提交时设置实际时间
    }
    if (isEdit.value) data.id = recordId.value; // 编辑时设置 ID

    console.log('提交数据', data);
    return data;
};

const handleSubmitData = async (status: string) => {
    const data = buildSubmitData(status);
    try {
        let res: any;
        if (isEdit.value) {
            res = await updateVisitPlanApi(data);
        } else {
            res = await createVisitPlanApi(data);
        }
        if (res?.code === 200 || res?.success) {
            const savedId = getSavedRecordId(res) ?? recordId.value;
            if (status === 'PENDING' && savedId) {
                await confirmVisitPlanMessage(savedId);
            } else {
                router.back();
            }
        }

    } catch (err) {
        console.error('提交失败', err);
    }
};

const handleSave = () => {
    validateSave(() => handleSubmitData('PENDING')); // 保存 -- 单据状态更新为"待拜访"
};

const handleSubmit = () => {
    validateAll(() => handleSubmitData('COMPLETED')); // 提交 -- 单据状态更新为"已拜访"
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

// 统一验证：基础表单 + 拜访人员 + 待办事项表格
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
                if (!Array.isArray(row.principalCodes) || row.principalCodes.length === 0) {
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



const loadDetailData = async () => {
    if (!recordId.value) return;
    pageLoading.value = true;
    try {
        const res: any = await getVisitPlanApi(Number(recordId.value));
        const d = res?.data;
        if (!d) return;

        // 如果有客户ID，先加载客户对接人下拉选项feedback
        if (d.customerId) {
            await loadContactPersonOptions(d.customerId);
        }

        Object.assign(formData, {
            status: d.status || '',
            customerId: d.customerId ?? null,
            customerName: d.customerName || '',
            starLevel: d.starLevel || '',
            planTime: d.planTime || null,
            executorCodes: d.executorList.map((item: any) => item.code) || [],
            executorList: d.executorList || [],
            contactPersonIds: d.contactPersonList.map((item: any) => item.id) || [],
            contactPersonList: d.contactPersonList || [],
            visitCycle: d.visitCycle || '',
            visitPurpose: d.visitPurpose || '',
            customerWorkPattern: d.customerWorkPattern || '',
            visitRequirements: d.visitRequirements || '',
            content: d.content || '',
            customerInventoryRate: d.customerInventoryRate || '',
            attachmentList: d.attachmentList,
            feedback: d.feedback || '',
            plusServicesList: d.plusServicesList,
            plusServicesDetail: d.plusServicesDetail || '',
            plusServicesExecution: d.plusServicesExecution || '',
            cancelReason: d.cancelReason || '',
        });

        // 待办事项回显
        const rawList: any[] = Array.isArray(d.todoList) ? d.todoList : [];
        todoList.value =
            rawList.length > 0
                ? rawList.map((item: any) => ({
                    id: item.id,
                    todoContent: item.todoContent || '',
                    status: item.status || 'TODO',
                    principalCodes: item.principalList.map((p) => p.code) || [],
                    principalList: item.principalList || [],
                    dueTime: item.dueTime || null,
                    completeTime: item.completeTime || null,
                    attachmentList: item.attachmentList || [],
                    delayReason: item.delayReason || '',
                    remark: item.remark || '',
                }))
                : [];
    } catch (err) {
        console.error('加载详情失败', err);
    } finally {
        pageLoading.value = false;
    }
};

onMounted(() => {
    loadVisitDicts(); // 加载拜访相关字典
    if (isEdit.value) {
        loadDetailData();
    }
});
</script>

<style scoped lang="less">
.visit-plan-add-container {
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

    .editor-wrapper {
        height: 200px;
        width: 100%;
        border-radius: 4px;
        overflow: hidden;
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
