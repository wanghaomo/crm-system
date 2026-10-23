<template>
    <WebPage @addEvt="handleAdd" contentPadding="0" :hideAddBtn="!checkPermission(['crm:service_rule_config:create'])">
        <template #content>
            <div class="serviceRuleConfigContainer">
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
    <!-- 详情抽屉 -->
    <MxDrawer v-model:show="drawerShow" title="服务规则详情" size="large" :closablePop="false">
        <div class="detail-content" v-if="currentRow">
            <!-- 顶部标题 -->
            <div class="detail-header">
                <div class="detail-header-top">
                    <span class="detail-title">{{ currentRow.ruleName }}</span>
                    <span class="status-text" :style="{ backgroundColor: BILL_STATUS_MAP[currentRow.status]?.bgColor, color: BILL_STATUS_MAP[currentRow.status]?.color, borderColor: BILL_STATUS_MAP[currentRow.status]?.bdColor }">
                        {{ BILL_STATUS_MAP[currentRow.status]?.text }}
                    </span>
                </div>
                <div class="detail-header-info">
                    <div class="info-item">
                        <span class="info-label">服务类型</span>
                        <span class="info-value">{{
                            serviceTypeMap[currentRow.serviceType] || currentRow.serviceType
                            }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">客户星级</span>
                        <span class="info-value">{{ getStarLevelText(currentRow.customerStar) }}</span>
                    </div>
                </div>
            </div>
            <!-- 灰色间隔 -->
            <div class="gray-separator"></div>
            <div style="padding: 0 24px;">
                <!-- 基础信息 -->
                <div class="detail-body">
                    <div class="section-title">
                        <span class="title-line"></span>
                        <span class="title-text">基础信息</span>
                    </div>
                    <div class="info-section">
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">费用标准(元)</span>
                                <span class="cell-value">{{ currentRow.feeStandard }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">执行提醒</span>
                                <span class="cell-value">{{ reminderMap[currentRow.executeRemind] || '--' }}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell full-width">
                                <span class="cell-label">费用分摊部门</span>
                                <div class="cell-value">
                                    {{currentRow.feeDeptList ? currentRow.feeDeptList.map((dept: any) => dept.name).join('，') : '--'}}
                                </div>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell full-width">
                                <span class="cell-label">备注</span>
                                <span class="cell-value">{{ currentRow.remark || '--' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 服务内容配置 -->
                <div class="detail-body">
                    <div class="section-title">
                        <span class="title-line"></span>
                        <span class="title-text">服务内容配置</span>
                    </div>
                    <!-- 接待规则 -->
                    <template v-if="currentRow.serviceContentDTO?.receptionSpec">
                        <div class="info-section">
                            <div class="info-row">
                                <div class="info-cell">
                                    <span class="cell-label">接待规格</span>
                                    <MxDict placeholder="请选择" dictType="接待规格" v-model="currentRow.serviceContentDTO.receptionSpec" text></MxDict>
                                </div>
                                <div class="info-cell">
                                    <span class="cell-label">接待地点</span>
                                    <MxDict placeholder="请选择" dictType="接待地点" v-model="currentRow.serviceContentDTO.receptionLocation" text></MxDict>
                                </div>
                            </div>
                        </div>
                        <div class="info-block">
                            <div class="block-label">接待流程</div>
                            <div class="block-value rich-text-preview">
                                <MxEditorPreview :modelValue="currentRow.serviceContentDTO.receptionProcess || ''" minHeight="150px" />
                            </div>
                        </div>
                    </template>
                    <!-- 关怀规则 -->
                    <template v-if="currentRow.serviceContentDTO?.careType">
                        <div class="info-section">
                            <div class="info-row">
                                <div class="info-cell">
                                    <span class="cell-label">关怀类型</span>
                                    <MxDict placeholder="请选择" dictType="关怀类型" v-model="currentRow.serviceContentDTO.careType" text></MxDict>
                                </div>
                                <div class="info-cell">
                                    <span class="cell-label">执行方式</span>
                                    <MxDict placeholder="请选择" dictType="执行方式" v-model="currentRow.serviceContentDTO.careMethod" text></MxDict>
                                </div>
                            </div>
                        </div>
                        <div class="info-section">
                            <div class="info-row">
                                <div class="info-cell full-width">
                                    <span class="cell-label">关怀周期</span>
                                    <MxDict placeholder="请选择" dictType="关怀周期" v-model="currentRow.serviceContentDTO.careCycle" text></MxDict>
                                </div>
                            </div>
                        </div>
                        <div class="info-block">
                            <div class="block-label">关怀内容</div>
                            <div class="block-value rich-text-preview">
                                <MxEditorPreview :modelValue="currentRow.serviceContentDTO.content || ''" minHeight="150px" />
                            </div>
                        </div>
                    </template>
                    <!-- 拜访规则 -->
                    <template v-if="currentRow.serviceContentDTO?.visitCycle">
                        <div class="info-section">
                            <div class="info-row">
                                <div class="info-cell full-width">
                                    <span class="cell-label">拜访周期</span>
                                    <MxDict placeholder="请选择" dictType="关怀周期" v-model="currentRow.serviceContentDTO.visitCycle" text></MxDict>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </MxDrawer>
</template>

<script setup lang="ts">
import { ref, h, onMounted, } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NSpin, useMessage, useDialog, NSpace } from 'naive-ui';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import { STAR_LEVEL_OPTIONS, getStarLevelText } from '@/config/customer';
import { queryServiceRuleListApi, deleteServiceRuleApi, updateServiceRuleConfigApi, queryServiceRuleApi } from '@/api/systemManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STATUS_MAP, BILL_STATUS_MAP } from '../config.js';
import { checkPermission } from '@/utils/comm';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

// ==================== 字典映射 ====================
const serviceTypeMap = ref<Record<string, string>>({});
const reminderMap = ref<Record<string, string>>({});
// 加载字典数据
const loadDictData = async () => {
    try {
        const res = await getDictMapApi({
            parentCodes: [
                enumCfg['服务类型'],
                enumCfg['执行提醒'],
            ]
        });
        if (res.code === 200) {
            serviceTypeMap.value = (res.data?.[enumCfg['服务类型']] || []).reduce((map: any, item: any) => {
                map[item.code] = item.name;
                return map;
            }, {});
            reminderMap.value = (res.data?.[enumCfg['执行提醒']] || []).reduce((map: any, item: any) => {
                map[item.code] = item.name;
                return map;
            }, {});
        }
    } catch (e) {
        console.error('加载字典失败', e);
    }
};

// ==================== 搜索栏配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'ruleName', placeholder: '规则名称' },
    { type: 'select', label: '', value: 'customerStar', placeholder: '客户星级', options: STAR_LEVEL_OPTIONS },
    {
        type: 'select', label: '状态', value: 'status', placeholder: '请选择状态', options: [
            { label: '启用', value: 'ENABLE' },
            { label: '草稿', value: 'DRAFT' },
            { label: '禁用', value: 'DISABLE' },
        ]
    }
];

// 搜索参数
const searchParams = ref<any>({
    ruleName: '',
    customerStar: '',
    status: '',
});



// ==================== 表格列配置 ====================
const tableColumns = [
    { title: '编号', key: 'ruleCode', width: 150 },
    { title: '规则名称', key: 'ruleName', width: 120, ellipsis: { tooltip: true } },
    {
        title: '服务类型',
        key: 'serviceType',
        width: 120,
        render: (row: any) => serviceTypeMap.value[row.serviceType] || row.serviceType,
    },
    { title: '客户星级', key: 'customerStar', width: 120, render: (row: any) => getStarLevelText(row.customerStar) },
    // { title: '核心服务内容', key: 'serviceContent', width: 120, render: (row: any) => row.serviceContent },
    {
        title: '状态',
        key: 'status',
        width: 100,
        render: (row: any) => {

            return h(
                NSpace,
                { align: 'center', size: 8 },
                {
                    default: () => [
                        h('div', {
                            style: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: STATUS_MAP[row.status].color },
                        }),
                        h('span', null, STATUS_MAP[row.status].label),
                    ],
                }
            );
        }
    },
    { title: '费用标准（元）', key: 'feeStandard', width: 120, },
    { title: '最后修改时间', key: 'updatedAt', width: 180, render: (row: any) => row.updatedAt || '--' },
];

// ==================== 表格配置 ====================
const tableLoading = ref(true);
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        {
            btnName: '详情',
            btnColor: '#2C65F2',
            clickTableBtns: (row: any) => handleDetail(row),
        },
        {
            btnName: '编辑',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status !== 'ENABLE' && checkPermission(['crm:service_rule_config:edit']),
            clickTableBtns: (row: any) => handleEdit(row),
        },
        {
            btnName: '启用',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => (row.status === 'DISABLE' || row.status === 'DRAFT') && checkPermission(['crm:service_rule_config:enable']),
            clickTableBtns: (row: any) => handleEnable(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status !== 'ENABLE' && checkPermission(['crm:service_rule_config:delete']),
            clickTableBtns: (row: any) => handleDelete(row),
        },
        {
            btnName: '禁用',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status === 'ENABLE' && checkPermission(['crm:service_rule_config:enable']),
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
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                loadTableData();
            }
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

// ==================== 详情抽屉 ====================
const drawerShow = ref(false);
const currentRow = ref<any>(null);

// 加载详情
const handleDetail = async (row: any) => {
    try {
        const res = await queryServiceRuleApi(row.id);
        if (res.code === 200 && res.data) {
            currentRow.value = res.data;
            drawerShow.value = true;
        }
    } catch (e) {
        console.error('加载详情失败', e);
        message.error('加载详情失败');
    }
};

// 加载表格数据
const loadTableData = async () => {
    try {
        tableLoading.value = true;
        const pagination = tableConfig.value?.paginationConfig?.pagConfig;
        const params = {
            current: pagination?.page || 1,
            size: pagination?.pageSize || 20,
            ...searchParams.value,
        };

        const res = await queryServiceRuleListApi(params);
        if (res.code === 200) {
            const newList = res.data?.records || [];
            const newTotal = res.data?.total || 0;

            // 直接修改属性确保响应式更新
            if (tableConfig.value) {
                tableConfig.value.tableList = newList;
                if (tableConfig.value.paginationConfig?.pagConfig) {
                    tableConfig.value.paginationConfig.pagConfig.total = newTotal;
                }
            }
        }
    } catch (e) {
        console.error('加载列表失败', e);
        message.error('加载列表失败');
    } finally {
        tableLoading.value = false;
    }
};

// 删除
const handleDelete = async (row: any) => {
    console.log('row', row);

    try {
        const res = await deleteServiceRuleApi(row.id);
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

// 搜索
const handleSearch = (queryObj: any) => {
    searchParams.value = {
        ruleName: queryObj.ruleName || '',
        customerStar: queryObj.customerStar || '',
        status: queryObj.status || '',
    };
    if (tableConfig.value?.paginationConfig?.pagConfig) {
        tableConfig.value.paginationConfig.pagConfig.page = 1;
    }
    loadTableData();
};

const handleAdd = () => {
    router.push({ path: '/systemManage/serviceRuleConfig/add', query: { isAdd: true } });
};

const handleEdit = (row: any) => {
    router.push({ path: '/systemManage/serviceRuleConfig/edit', query: { id: row.id, isAdd: false } });
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
                const res = await updateServiceRuleConfigApi({
                    id: row.id,
                    status: 'ENABLE',
                });
                if (res.code === 200) {
                    message.success('启用成功');
                    loadTableData();
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
    try {
        const res = await updateServiceRuleConfigApi({
            id: row.id,
            status: 'DISABLE',
        });
        if (res.code === 200) {
            message.success('禁用成功');
            loadTableData();
        } else {
            message.error(res.msg || '禁用失败');
        }
    } catch (e) {
        console.error('禁用失败', e);
        message.error('禁用失败');
    }
};

onMounted(async () => {
    await loadDictData();
    loadTableData();
});
</script>

<style scoped lang="less">
.serviceRuleConfigContainer {
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

.detail-content {

    .detail-header {

        padding: 12px 24px;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;

            .detail-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .status-text {
                font-size: 14px;
                padding: 1px 4px;
                border-radius: 4px;
                color: #5AA771;
            }
        }

        .detail-header-info {
            display: flex;
            gap: 120px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;

                .info-label {
                    color: #999;
                }

                .info-value {
                    color: #333;
                }
            }
        }
    }

    .gray-separator {
        height: 1px;
        background: #efeff5;
        margin-bottom: 24px;
    }

    .detail-body {
        margin-bottom: 16px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;

            .title-line {
                width: 4px;
                height: 16px;
                background: var(--base-color);
                border-radius: 2px;
            }

            .title-text {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
        }

        .info-section {
            .info-row {
                display: flex;
                gap: 24px;
                margin-bottom: 16px;

                .info-cell {
                    flex: 1;
                    display: flex;
                    gap: 10px;

                    &.full-width {
                        flex: 1 1 100%;
                    }

                    .cell-label {
                        font-size: 14px;
                        color: #999;
                        width: 90px;
                        text-align: right;
                    }

                    .cell-value {
                        font-size: 14px;
                        color: #333;
                    }
                }
            }
        }

        .info-block {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 16px;

            .block-label {
                font-size: 14px;
                color: #999;
                width: 90px;
                text-align: right;
            }

            .block-value {
                font-size: 14px;
                color: #333;
                flex: 1;

                &.rich-text-preview {
                    border: 1px solid #eee;
                    border-radius: 6px;
                    padding: 12px;
                    background: #fafafa;
                }
            }
        }
    }
}
</style>
