<template>
    <WebPage @addEvt="handleAdd" contentPadding="0" :hideAddBtn="!checkPermission(['crm:payment_config:create'])">
        <template #content>
            <div class="payMentConfigContainer">
                <n-spin :show="tableLoading" class="table-loading">
                    <MxWebDataTable v-bind="tableConfig">
                        <template #tableSearch>
                            <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                            </MxWebSearchBar>
                        </template>
                    </MxWebDataTable>
                </n-spin>
            </div>
        </template>
    </WebPage>
    <!-- 新增/编辑/查看抽屉 -->
    <MxDrawer v-model:show="drawerShow" :title="drawerTitle" size="small" :closablePop="false">
        <div class="formMain" v-if="!isView">
            <n-form ref="formRef" :model="formData" :rules="formRules" require-mark-placement="left" label-placement="left" label-align="right" label-width="120px">
                <n-grid :cols="1" :x-gap="0">
                    <n-grid-item>
                        <n-form-item label="规则名称" path="ruleName">
                            <n-input v-model:value.trim="formData.ruleName" placeholder="请输入规则名称" :maxlength="50" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="规则类型" path="ruleType">
                            <n-select v-model:value.trim="formData.ruleType" placeholder="请选择类型" :options="typeOptions" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item :label="formData.ruleType === 'OVERDUE_COLLECTION' ? '逾期时间(日)' : '提前时间(日)'" path="advanceDays">
                            <n-input v-model:value.number="formData.advanceDays" :allow-input="onlyAllowNumber" placeholder="请输入" style="width: 100%" clearable maxlength="3" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item path="messageTemplate" class="myFormItem">
                            <template #label>
                                <div class="tips">
                                    <span>提示消息模板</span>
                                    <n-tooltip trigger="hover" placement="top" :show-arrow="true">
                                        <template #trigger>
                                            <div class="question-icon">
                                                <n-icon size="16" color="#999999">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                                    </svg>
                                                </n-icon>
                                            </div>
                                        </template>
                                        <div class="tooltip-content">
                                            <div class="tooltip-title">📋 可用字段说明</div>
                                            <div class="tooltip-fields">
                                                <div v-for="(field, index) in templateFields" :key="field.key" class="tooltip-field-item" :class="{ 'no-border': index === templateFields.length - 1 }">
                                                    <span class="field-name">{{ field.key }}</span>
                                                    <span class="field-desc">{{ field.desc }}</span>
                                                </div>
                                            </div>
                                            <div class="tooltip-title">💡 使用示例</div>
                                            <div class="tooltip-example">
                                                <span class="highlight-field">{customerName}</span>的合同<span class="highlight-field">{contractCode}</span>，应收金额<span class="highlight-field">{amountDue}</span>元，计划回款日期<span class="highlight-field">{plannedDate}</span>，请及时跟进。
                                            </div>
                                        </div>
                                    </n-tooltip>
                                </div>
                            </template>
                            <n-input v-model:value.trim="formData.messageTemplate" type="textarea" placeholder="请输入提示消息模板，如：{客户名称}的回款已逾期{天数}天" :rows="4" :maxlength="500" show-count />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="备注" path="remark">
                            <n-input v-model:value.trim="formData.remark" type="textarea" placeholder="请输入备注信息" :rows="4" :maxlength="500" show-count />
                        </n-form-item>
                    </n-grid-item>
                </n-grid>
            </n-form>
        </div>
        <!-- 查看详情 -->
        <div v-else class="detail-container">
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">编号</span>
                    <span class="detail-value">{{ detailData.configCode }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">规则名称</span>
                    <span class="detail-value">{{ detailData.ruleName }}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">类型</span>
                    <span class="detail-value">{{ getTypeLabel(detailData.ruleTypeName) }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">{{ detailData.ruleType === 'OVERDUE_COLLECTION' ? '逾期时间(日)' : '提前时间(日)' }}</span>
                    <span class="detail-value">{{ detailData.advanceDays }}</span>
                </div>
            </div>
            <div class="detail-row full-width">
                <div class="detail-item">
                    <div>
                        <span class="detail-label">提示消息模版</span>
                    </div>
                    <span class="detail-value">{{ detailData.messageTemplate }}</span>
                </div>
            </div>
            <div class="detail-row full-width">
                <div class="detail-item">
                    <span class="detail-label">备注</span>
                    <span class="detail-value">{{ detailData.remark || '--' }}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">状态</span>
                    <span class="detail-value">{{ getStatusLabel(detailData.status) }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">创建人</span>
                    <span class="detail-value">{{ detailData.createdByName || '--' }}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">创建时间</span>
                    <span class="detail-value">{{ detailData.createdAt || '--' }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">最后修改人</span>
                    <span class="detail-value">{{ detailData.updatedByName || '--' }}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">最后修改时间</span>
                    <span class="detail-value">{{ detailData.updatedAt || '--' }}</span>
                </div>
            </div>
        </div>
        <template #footer v-if="!isView">
            <div class="drawer-footer">
                <n-button color="#2C65F2" @click="handleSubmit('draft')" ghost>保 存</n-button>
                <n-button color="#2C65F2" @click="handleSubmit('submit')">提 交</n-button>
            </div>
        </template>
    </MxDrawer>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, render } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NButton, NTooltip, NIcon, NSpace, NSpin, useMessage, useDialog, } from 'naive-ui';
import { createReturnReminderApi, updateReturnReminderApi, deleteReturnReminderApi, queryReturnReminderListApi, updateReturnReminderStatusApi, queryReturnReminderApi } from '@/api/systemManage';
import { STATUS_MAP } from '../config';
import { checkPermission } from '@/utils/comm';

const message = useMessage();
const dialog = useDialog();

// 消息模板可用字段
const templateFields = [
    { key: '{reminderType}', desc: '提醒类型(到期提醒/逾期催收)' },
    { key: '{contractCode}', desc: '合同编号' },
    { key: '{plannedDate}', desc: '计划回款日期' },
    { key: '{customerName}', desc: '客户名称' },
    { key: '{receiptCode}', desc: '回款单号' },
    { key: '{amountDue}', desc: '应收金额' },
    { key: '{amountPaid}', desc: '已收金额' },
    { key: '{amountUnpaid}', desc: '未收金额' },
    { key: '{handlerName}', desc: '跟单人姓名' },
    { key: '{advanceDays}', desc: '提前/逾期时间(日)' },
    { key: '{collectionCount}', desc: '催收次数' },
];


const onlyAllowNumber = (value: string) => /^\d*$/.test(value); // 只允许输入数字
// ==================== 类型选项 ====================
const typeOptions = [
    { label: '到期提醒', value: 'DUE_REMINDER' },
    { label: '逾期提醒', value: 'OVERDUE_COLLECTION' },
];

// ==================== 搜索栏配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'ruleName', placeholder: '规则名称' },
    {
        type: 'select', label: '状态', value: 'status', placeholder: '请选择状态', options: [
            { label: '启用', value: 'ENABLE' },
            { label: '草稿', value: 'DRAFT' },
            { label: '禁用', value: 'DISABLE' },
        ]
    }
];

// ==================== 表格列配置 ====================
const tableColumns = [
    { title: '编号', key: 'configCode', width: 160 },
    { title: '规则名称', key: 'ruleName', width: 160 },
    {
        title: '状态',
        key: 'status',
        width: 100,
        render: (row: any) => {
            const statusInfo = STATUS_MAP[row.status] || { label: row.status, color: '#999' };
            return h(
                NSpace,
                { align: 'center', size: 8 },
                {
                    default: () => [
                        h('div', {
                            style: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusInfo.color },
                        }),
                        h('span', null, statusInfo.label),
                    ],
                }
            );
        }
    },
    { title: '类型', key: 'ruleTypeName', width: 100 },
    { title: '提前/逾期时间(日)', key: 'advanceDays', width: 150 },
    { title: '提示消息模板', key: 'messageTemplate', width: 150 },
    { title: '备注', key: 'remark', width: 150, render: (row: any) => { return row.remark || '--' } },
];

// 加载状态
const tableLoading = ref(false);

// ==================== 表格配置 ====================
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        {
            btnName: '编辑',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status !== 'ENABLE' && checkPermission(['crm:payment_config:edit']),
            clickTableBtns: (row: any) => handleEdit(row),
        },
        {
            btnName: '详情',
            btnColor: '#2C65F2',
            clickTableBtns: (row: any) => handleView(row)
        },
        {
            btnName: '启用',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => (row.status === 'DRAFT' || row.status === 'DISABLE') && checkPermission(['crm:payment_config:enable']),
            clickTableBtns: (row: any) => handleEnable(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status !== 'ENABLE' && checkPermission(['crm:payment_config:delete']),
            clickTableBtns: (row: any) => handleDelete(row),
        },

        {
            btnName: '禁用',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status === 'ENABLE' && checkPermission(['crm:payment_config:enable']),
            clickTableBtns: (row: any) => handleDisable(row),
        },

    ],
    isShowPagination: true,
    flexHeight: true,
    paginationConfig: {
        pagConfig: {
            page: 1,
            pageSize: 20,
            total: 0,
            showSizePicker: false,
            pageSizes: [10, 20, 50, 100],
        },
        showHeadBorder: true,
        showTotal: true,
        onPageChange: (page: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                loadTableData();
            }
        },
        onPageSizeChange: (pageSize: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                loadTableData();
            }
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

const searchParams = ref<any>({});

// ==================== 事件处理 ====================
// 加载表格数据
const loadTableData = async () => {
    try {
        tableLoading.value = true;
        const pagConfig = tableConfig.value?.paginationConfig?.pagConfig;
        const res = await queryReturnReminderListApi({
            current: pagConfig?.page || 1,
            size: pagConfig?.pageSize || 20,
            ...searchParams.value,
        });
        if (res.code === 200 && res.data) {
            tableConfig.value.tableList = res.data.records || [];
            if (pagConfig) {
                pagConfig.total = res.data.total || 0;
            }
        }
    } catch (e) {
        console.error('加载列表失败', e);
        message.error('加载列表失败');
    } finally {
        tableLoading.value = false;
    }
};



const handleSearch = async (queryObj: any) => {
    try {
        tableLoading.value = true;
        searchParams.value = { ...queryObj };
        const res = await queryReturnReminderListApi({
            current: 1,
            size: tableConfig.value?.paginationConfig?.pagConfig?.pageSize || 20,
            ...searchParams.value,
        });
        if (res.code === 200 && res.data) {
            tableConfig.value.tableList = res.data.records || [];
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                tableConfig.value.paginationConfig.pagConfig.total = res.data.total || 0;
            }
        }
    } catch (e) {
        console.error('查询失败', e);
        message.error('查询失败');
    } finally {
        tableLoading.value = false;
    }
};

// 删除
const handleDelete = async (row: any) => {
    if (row.status === 'ENABLE') {
        message.warning('仅草稿状态下可删除');
        return;
    }
    try {
        const res = await deleteReturnReminderApi(row.id);
        if (res.code === 200) {
            message.success('删除成功');
            loadTableData();
        } else {
            message.error(res.msg || '删除失败');
        }
    } catch (e) {
        console.error('删除失败', e);
        message.error('删除失败');
    }
};

// 启用
const handleEnable = async (row: any) => {
    dialog.warning({
        title: '确认启用',
        content: '同类型配置只能存在一个启用，是否确认启用？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const res = await updateReturnReminderStatusApi({
                    id: row.id,
                    status: 'ENABLE'
                });
                if (res.code === 200) {
                    message.success('启用成功');
                    await loadTableData();
                } else {
                    message.error(res.msg || '启用失败');
                }
            } catch (e) {
                console.error('启用失败', e);
                message.error('启用失败');
            }
        },
    });
};

// 禁用
const handleDisable = async (row: any) => {
    if (row.status !== 'ENABLE') {
        message.warning('仅启用状态下可禁用');
        return;
    }
    try {
        const res = await updateReturnReminderStatusApi({
            id: row.id,
            status: 'DISABLE'
        });
        if (res.code === 200) {
            message.success('禁用成功');
            await loadTableData();
        } else {
            message.error(res.msg || '禁用失败');
        }
    } catch (e) {
        console.error('禁用失败', e);
        message.error('禁用失败');
    }
};

// ==================== 抽屉表单 ====================
const drawerShow = ref(false);
const isEdit = ref(false);
const isView = ref(false); // 查看模式
const editId = ref<string | null>(null);
const formRef = ref<any>(null);

const drawerTitle = computed(() => {
    if (isView.value) return '回款提醒详情';
    return isEdit.value ? '编辑回款提醒' : '新增回款提醒';
});

const formData = ref({
    id: '' as string | undefined,
    ruleName: '', // 规则名称
    ruleType: '', // 规则类型
    advanceDays: null as number | null, // 提前时间(日)
    messageTemplate: '', // 提示消息模板
    remark: '', // 备注
});

// 详情数据
const detailData = ref<any>({});

const formRules = {
    ruleName: {
        required: true,
        message: '请输入规则名称',
        trigger: 'blur',
    },
    ruleType: {
        required: true,
        message: '请选择类型',
        trigger: 'change',
    },
    advanceDays: {
        required: true,
        message: '请输入提前时间',
        trigger: 'blur',
        validator: (rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入提前时间');
            }
            if (typeof value === 'string' && value.trim() === '') {
                return new Error('请输入提前时间');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            return true;
        },
    },
    messageTemplate: {
        required: true,
        message: '请输入提示消息模板',
        trigger: 'blur',
    },
};

// 打开新增抽屉
const handleAdd = () => {
    isEdit.value = false;
    isView.value = false;
    editId.value = null;
    resetForm();
    drawerShow.value = true;
};

// 打开编辑抽屉
const handleEdit = (row: any) => {
    isEdit.value = true;
    isView.value = false;
    editId.value = row.id;
    formData.value = {
        id: row.id,
        ruleName: row.ruleName,
        ruleType: row.ruleType,
        advanceDays: row.advanceDays || null,
        messageTemplate: row.messageTemplate,
        remark: row.remark || '',
    };
    drawerShow.value = true;
};

// 查看详情
const handleView = async (row: any) => {
    isEdit.value = false;
    isView.value = true;
    editId.value = row.id;

    try {
        const res = await queryReturnReminderApi(row.id);
        if (res.code === 200 && res.data) {
            detailData.value = res.data;
        } else {
            message.error('获取详情失败');
        }
    } catch (e) {
        console.error('获取详情失败', e);
        message.error('获取详情失败');
    }

    drawerShow.value = true;
};

// 获取类型标签
const getTypeLabel = (value: string) => {
    const option = typeOptions.find(item => item.value === value);
    return option ? option.label : value;
};

// 获取状态标签
const getStatusLabel = (value: string) => STATUS_MAP[value]?.label || value;


// 重置表单
const resetForm = () => {
    formData.value = {
        id: undefined,
        ruleName: '',
        ruleType: '',
        advanceDays: null,
        messageTemplate: '',
        remark: '',
    };
    formRef.value?.restoreValidation();
};



// 提交表单
const handleSubmit = async (action: 'draft' | 'submit' = 'draft') => {
    try {
        await formRef.value?.validate();
    } catch (error) {
        console.error('表单验证失败', error);
        return;
    }

    const doSubmit = async () => {
        const submitData: any = {
            ruleName: formData.value.ruleName,
            ruleType: formData.value.ruleType,
            advanceDays: formData.value.advanceDays,
            messageTemplate: formData.value.messageTemplate,
            remark: formData.value.remark,
            status: action === 'submit' ? 'ENABLE' : 'DRAFT',
        };

        // 编辑时需要带上id
        if (editId.value) {
            submitData.id = editId.value;
        }

        let res: any;
        if (editId.value) {
            // 编辑
            res = await updateReturnReminderApi(submitData);
        } else {
            // 新增
            res = await createReturnReminderApi(submitData);
        }

        if (res.code === 200) {
            message.success(action === 'submit' ? '提交成功' : '保存成功');
            drawerShow.value = false;
            // 重新加载列表
            await loadTableData();
        } else {
            message.error(res.msg || (action === 'submit' ? '提交失败' : '保存失败'));
        }
    };

    if (action === 'submit') {
        dialog.warning({
            title: '确认提交',
            content: '同类型配置只能存在一个启用，是否确认提交并启用？',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: () => doSubmit(),
        });
    } else {
        await doSubmit();
    }
};
// 组件挂载时加载数据
onMounted(() => {
    loadTableData();
});
</script>

<style scoped lang="less">
:deep(.myFormItem) {
    .n-form-item-label__text {
        width: 110px;
    }

    .tips {
        display: flex;
        align-items: center;

        .question-icon {
            display: flex;
            align-items: center;
            margin-left: 4px;
        }
    }
}

// Tooltip 样式
.tooltip-content {
    max-width: 420px;

    .tooltip-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #fff;
        font-size: 14px;
    }

    .tooltip-fields {
        margin-bottom: 14px;
        line-height: 1.8;

        .tooltip-field-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dashed #e8e8e8;

            &.no-border {
                border-bottom: none;
            }

            .field-name {
                font-family: monospace;
                color: #2C65F2;
                font-weight: 600;
            }

            .field-desc {
                color: #fff;
            }
        }
    }

    .tooltip-example {
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 14px;
        background-color: #fff;
        color: #333;

        .highlight-field {
            color: #2C65F2;
            font-weight: 600;
        }
    }
}

.payMentConfigContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

:deep(.table-loading),
:deep(.table-loading .n-spin-content) {
    height: 100%;
    min-width: 0;
    min-height: 0;
}

:deep(.table-loading) {
    flex: 1;
}

:deep(.table-loading .n-spin-content) {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.formMain {
    padding: 16px;
}

.rule-tips {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;

    .n-tag {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            opacity: 0.8;
            transform: translateY(-1px);
        }
    }
}

.drawer-footer {
    width: 100%;
    display: flex;
    justify-content: center !important;
    gap: 12px;
}

/* 详情页样式 */
.detail-container {
    padding: 24px 32px;

    .detail-row {
        display: flex;
        margin-bottom: 20px;

        &.full-width {
            .detail-item {
                flex: 1;
            }
        }

        .detail-item {
            display: flex;
            flex: 1;
            align-items: flex-start;
            min-height: 22px;

            .detail-label {
                color: #999;
                font-size: 14px;
                width: 100px;
                flex-shrink: 0;
                text-align: right;
                padding-right: 12px;
                line-height: 22px;
            }

            .detail-value {
                color: #333;
                font-size: 14px;
                flex: 1;
                line-height: 22px;
                word-break: break-all;
            }
        }
    }
}
</style>
