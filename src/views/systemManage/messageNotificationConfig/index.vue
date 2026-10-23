<template>
    <WebPage @addEvt="handleAdd" contentPadding="0" :hideAddBtn="!checkPermission(['crm:message_config:create'])">
        <template #content>
            <div class="messageConfigContainer">
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
                        <n-form-item label="模板名称" path="templateName">
                            <n-input v-model:value="formData.templateName" placeholder="请输入模板名称，长度≤30字符" :maxlength="30" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="系统模块" path="module">
                            <n-select v-model:value="formData.module" placeholder="请选择系统模块" :options="moduleOptions" @update:value="handleModuleChange" :loading="moduleLoading" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="节点" path="node">
                            <n-select v-model:value="formData.node" placeholder="请选择节点" :options="nodeOptions" :disabled="!formData.module" :loading="nodeLoading" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="消息模板" path="messageTemplate">
                            <!-- <template #label>
                                <div class="tips">
                                    <span>消息模板</span>
                                    <n-tooltip trigger="hover" placement="top" :show-arrow="true">
                                        <template #trigger>
                                            <div class="question-icon">
                                                <n-icon size="16" color="#E59222">
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
                            </template> -->
                            <n-input v-model:value.trim="formData.messageTemplate" type="textarea" placeholder="请输入消息模板内容，可包含变量，长度≤500字符" :rows="4" :maxlength="500" show-count />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="固定推送人员" path="fixedUsersList">
                            <MxPersonSelect multiple v-model:modelValue="formData.fixedUsersList" v-model:label="formData.fixedUsersName" placeholder="请选择固定推送人员" isUseOutOptions :options="filteredPersonOptions" />
                        </n-form-item>

                    </n-grid-item>
                </n-grid>
            </n-form>
        </div>
        <!-- 查看详情 -->
        <div v-else class="detail-container">
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">配置编号</span>
                    <span class="detail-value">{{ detailData.configCode }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">模板名称</span>
                    <span class="detail-value">{{ detailData.templateName }}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <span class="detail-label">系统模块</span>
                    <span class="detail-value">{{ detailData.moduleName || detailData.module }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">节点</span>
                    <span class="detail-value">{{ detailData.nodeName || detailData.node }}</span>
                </div>
            </div>
            <div class="detail-row full-width">
                <div class="detail-item">
                    <span class="detail-label">消息模板</span>
                    <span class="detail-value">{{ detailData.messageTemplate }}</span>
                </div>
            </div>
            <div class="detail-row full-width">
                <div class="detail-item">
                    <span class="detail-label">固定推送人员</span>
                    <span class="detail-value">{{detailData.fixedUsersList.map((item: any) => item.username).join(', ') || '--'}}</span>
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
import { ref, computed, h, onMounted, } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NButton, NSpace, NSpin, useMessage, useDialog, } from 'naive-ui';
import { createMessageConfigApi, updateMessageConfigApi, deleteMessageConfigApi, queryMessageConfigListApi, updateMessageConfigStatusApi, queryMessageConfigApi, queryAllMessageModuleApi, queryMessageNodeListApi } from '@/api/systemManage';
import { getUserListApi } from '@/api/comm';
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
    { key: '{overdueDays}', desc: '逾期天数' },
    { key: '{collectionCount}', desc: '催收次数' },
];

// ==================== 系统模块选项 ====================
const moduleOptions = ref<any[]>([]);
const moduleLoading = ref(false);

// ==================== 节点选项 ====================
const nodeOptions = ref<any[]>([]);
const nodeLoading = ref(false);

// 加载模块选项
const loadModuleOptions = async () => {
    moduleLoading.value = true;
    try {
        const res = await queryAllMessageModuleApi();
        if (res.code === 200 && res.data) {
            moduleOptions.value = res.data.map((item: any) => ({
                label: item.moduleName,
                value: item.moduleCode,
            }));
        }
    } catch (e) {
        console.error('加载模块选项失败', e);
    } finally {
        moduleLoading.value = false;
    }
};

// 模块变化时更新节点选项
const handleModuleChange = async (moduleCode: string,) => {
    formData.value.node = '';
    nodeOptions.value = [];
    nodeLoading.value = true;
    try {
        const res = await queryMessageNodeListApi(moduleCode);
        if (res.code === 200 && res.data) {
            nodeOptions.value = res.data.map((node: any) => ({
                label: node.nodeName,
                value: node.nodeCode,
                ...node,
            }));
        }
    } catch (e) {
        console.error('加载节点选项失败', e);
    } finally {
        nodeLoading.value = false;
    }
};



// ==================== 搜索栏配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'templateName', placeholder: '模板名称' },
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
    { title: '配置编号', key: 'configCode', width: 150 },
    { title: '模板名称', key: 'templateName', width: 150 },
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
    { title: '系统模块', key: 'moduleName', width: 150 },
    { title: '节点', key: 'nodeName', width: 150 },
    { title: '消息模板', key: 'messageTemplate', width: 200 },
    { title: '固定推送人员', key: 'fixedUsersList', width: 150, render: (row: any) => row.fixedUsersList?.map((item: any) => item.username).join(', ') || '--' },

];

// ==================== 表格配置 ====================
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        {
            btnName: '编辑',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => (row.status === 'DRAFT' || row.status === 'DISABLE') && checkPermission(['crm:message_config:edit']),
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
            isBtnHide: (row: any) => (row.status === 'DISABLE' || row.status === 'DRAFT') && checkPermission(['crm:message_config:enable']),
            clickTableBtns: (row: any) => handleEnable(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => (row.status === 'DRAFT' || row.status === 'DISABLE') && checkPermission(['crm:message_config:delete']),
            clickTableBtns: (row: any) => handleDelete(row),
        },
        {
            btnName: '禁用',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status === 'ENABLE' && checkPermission(['crm:message_config:enable']),
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


// 加载状态
const tableLoading = ref(false);
const searchParams = ref<any>({});

// ==================== 事件处理 ====================
// 加载表格数据
const loadTableData = async () => {
    try {
        tableLoading.value = true;
        const pagConfig = tableConfig.value?.paginationConfig?.pagConfig;
        const res = await queryMessageConfigListApi({
            page: pagConfig?.page || 1,
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
        const res = await queryMessageConfigListApi({
            page: 1,
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
    console.log(row);
    let res = await deleteMessageConfigApi(row.id);
    if (res.code === 200) {
        message.success('删除成功');
        loadTableData();
    } else {
        message.error(res.msg || '删除失败');

    }
}
// 启用
const handleEnable = async (row: any) => {
    dialog.warning({
        title: '确认启用',
        content: '同类型配置只能存在一个启用，是否确认启用？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const res = await updateMessageConfigStatusApi({
                    id: row.id,
                    status: 'ENABLE'
                });
                if (res.code === 200) {
                    message.success('启用成功');
                }
            } catch (e) {
                console.error('启用失败', e);
                message.error('启用失败');
            } finally {
                await loadTableData();
            }
        },
    });
}
// 禁用
const handleDisable = async (row: any) => {
    if (row.status !== 'ENABLE') {
        message.warning('仅启用状态下可禁用');
        return;
    }
    try {
        const res = await updateMessageConfigStatusApi({
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
const isView = ref(false);
const editId = ref<string | null>(null);
const formRef = ref<any>(null);

const drawerTitle = computed(() => {
    if (isView.value) return '消息通知配置详情';
    return isEdit.value ? '编辑消息通知配置' : '新增消息通知配置';
});

const formData = ref({
    id: '' as string | undefined,
    templateName: '',
    module: '',
    node: '',
    messageTemplate: '',
    fixedUsersList: [], // 固定推送人员列表
    fixedUsersName: [] // 固定推送人员名称（逗号分隔）
});


// 前端过滤方案：获取所有人员并根据权限过滤
const allPersonList = ref<any[]>([]);
const filteredPersonOptions = ref<any[]>([]);

// 获取所有人员列表
const loadAllPersonList = async () => {
    if (allPersonList.value.length > 0) {
        // 如果已经加载过，不再重复加载
        filterPersonByPermission();
        return;
    }

    try {
        const res = await getUserListApi({
            status: 'WORKING',
            needDept: true,
        });
        if (res.code === 200 && res.data) {
            allPersonList.value = res.data;
            filterPersonByPermission();
        }
    } catch (e) {
        console.error('加载人员列表失败', e);
        message.error('加载人员列表失败');
    }
};

// 根据模块和节点权限过滤人员
const filterPersonByPermission = () => {
    // if (!formData.value.module && !formData.value.node) {
    // 如果没有选择模块和节点，显示所有人员
    filteredPersonOptions.value = allPersonList.value.map((item: any) => ({
        ...item,
        label: item.username,
        value: item.code,
    }));
    return;
    // }

};



const formRules = {
    templateName: {
        required: true,
        message: '请输入模板名称',
        trigger: 'blur',
    },
    module: {
        required: true,
        message: '请选择系统模块',
        trigger: 'change',
    },
    node: {
        required: true,
        message: '请选择节点',
        trigger: 'change',
    },
    messageTemplate: {
        required: true,
        message: '请输入消息模板',
        trigger: 'blur',
    },
    fixedUsersList: {
        type: 'array' as const,
        required: true,
        message: '请选择固定推送人员',
        trigger: 'change',
    },
};

// 打开新增抽屉
const handleAdd = async () => {
    isEdit.value = false;
    isView.value = false;
    editId.value = null;
    resetForm();

    // 打开抽屉后再加载人员列表
    drawerShow.value = true;
    await loadAllPersonList();
};

// 打开编辑抽屉
const handleEdit = async (row: any) => {
    isEdit.value = true;
    isView.value = false;
    editId.value = row.id;

    // 先从详情接口获取完整数据
    try {
        const res = await queryMessageConfigApi(row.id);
        if (res.code === 200 && res.data) {
            const detailData = res.data;

            // 解析 fixedUsers 字符串为数组
            const fixedUsersList = detailData.fixedUsersList.map((item: any) => item.code);
            const fixedUsersName = detailData.fixedUsersList.map((item: any) => item.username);
            try {
                await handleModuleChange(detailData.module);

                // 等待节点选项加载完成后，再统一赋值表单数据
                formData.value = {
                    id: detailData.id,
                    templateName: detailData.templateName,
                    module: detailData.module,
                    node: detailData.node,
                    messageTemplate: detailData.messageTemplate,
                    fixedUsersList: fixedUsersList,
                    fixedUsersName: fixedUsersName || [],
                };
            } catch (error) {
                console.error('获取节点数据失败', error);
            }
            // 打开抽屉后再加载人员列表
            drawerShow.value = true;
            await loadAllPersonList();
        } else {
            message.error('获取详情失败');
        }
    } catch (e) {
        console.error('获取详情失败', e);
        message.error('获取详情失败');
    }
};

// 查看详情
const handleView = async (row: any) => {
    isEdit.value = false;
    isView.value = true;
    editId.value = row.id;

    try {
        const res = await queryMessageConfigApi(row.id);
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

// 详情数据
const detailData = ref<any>({});

// 获取状态标签
const getStatusLabel = (value: string) => STATUS_MAP[value]?.label || value;


// 重置表单
const resetForm = () => {
    formData.value = {
        id: undefined,
        templateName: '',
        module: '',
        node: '',
        messageTemplate: '',
        fixedUsersList: [],
        fixedUsersName: [],
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
        // 处理 fixedUsersList 和 fixedUsersName
        const fixedUsersList = formData.value.fixedUsersList.map((item: any, index: number) => {
            return { username: formData.value.fixedUsersName[index], code: item };
        });
        const fixedUsersIds = formData.value.fixedUsersList.map((item: any) => item);

        const submitData: any = {
            templateName: formData.value.templateName,
            module: formData.value.module,
            node: formData.value.node,
            messageTemplate: formData.value.messageTemplate,
            fixedUsers: fixedUsersIds.join(','),
            fixedUsersList: fixedUsersList,
            status: action === 'submit' ? 'ENABLE' : 'DRAFT',
        };

        // 编辑时需要带上id
        if (editId.value) {
            submitData.id = editId.value;
        }

        let res: any;
        if (editId.value) {
            res = await updateMessageConfigApi(submitData);
        } else {
            res = await createMessageConfigApi(submitData);
        }

        if (res.code === 200) {
            message.success(action === 'submit' ? '提交成功' : '保存成功');
            drawerShow.value = false;
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
    loadModuleOptions();
    loadTableData();
    // 不在这里加载人员列表，改为打开抽屉时加载
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
                color: #666;
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

.messageConfigContainer {
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
</style>
