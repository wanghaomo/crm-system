<template>
    <WebPage @addEvt="handleAdd" contentPadding="0">
        <template #headerRight>
            <MxButton v-if="checkPermission(['crm:chemical_company:download'])" border color="#666" @click="handleDownloadTemplate">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽download1.png" alt="" style="width: 16px;height: 16px;">
                </template>
                模板下载
            </MxButton>
            <MxButton v-if="checkPermission(['crm:chemical_company:import'])" border color="#666" @click="handleImport">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽download2.png" alt="" style="width: 16px;height: 16px;">
                </template>
                批量导入
            </MxButton>
            <MxButton v-if="checkPermission(['crm:chemical_company:export'])" border color="#666" @click="handleExport">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽import.png" alt="" style="width: 16px;height: 16px;">
                </template>
                导出数据
            </MxButton>
            <MxButton v-if="checkPermission(['crm:chemical_company:create'])" border @click="handleAdd" :styleOption="{ 'color': '#fff', 'background-color': 'var(--base-color)' }">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽add.png" alt="" style="width: 16px;height: 16px;">
                </template>
                新增
            </MxButton>
        </template>
        <template #content>
            <div class="chemical-survey-container">
                <MxWebDataTable v-bind="tableConfig">
                    <template #tableSearch>
                        <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                        </MxWebSearchBar>
                    </template>
                </MxWebDataTable>
            </div>
        </template>
    </WebPage>

    <!-- 详情抽屉：详情内容统一交给公共组件维护，列表页只负责控制显示和传入当前记录。 -->
    <MxDrawer v-model:show="detailVisible" title="化工企业调研详情" size="large" :closablePop="false">
        <ChemicalCompanyDetail :record-id="currentDetailId" :initial-data="currentDetailRow" />
    </MxDrawer>

    <!-- 导入结果弹窗 -->
    <n-modal v-model:show="importResultVisible" title="导入结果" preset="dialog" :show-icon="false" positive-text="确定" @positive-click="importResultVisible = false">
        <div class="import-result">
            <p>共计 {{ importResult.total }} 条数据</p>
            <p>成功导入 <span class="text-success">{{ importResult.success }}</span> 条</p>
            <p>导入失败 <span class="text-error">{{ importResult.fail }}</span> 条</p>
            <MxButton v-if="importResult.hasFailData" text type="info" @click="downloadErrorFile">
                错误数据下载
            </MxButton>
        </div>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NModal, useMessage } from 'naive-ui';
import ChemicalCompanyDetail from './components/ChemicalCompanyDetail.vue';
import {
    queryChemicalCompanyListApi,
    deleteChemicalCompanyApi,
    importChemicalCompanyApi,
    exportChemicalCompanyApi,
    downloadChemicalCompanyTemplateApi,
    downloadImportErrorDataApi,
} from '@/api/chemicalCompany';
import { checkPermission } from '@/utils/comm';

const router = useRouter();
const message = useMessage();

// ==================== 工具函数 ====================
const getStatusText = (status: string) => {
    if (status === 'ARCHIVED') return '已归档';
    if (status === 'DRAFT') return '草稿';
    return '--';
};
const getStatusColor = (status: string) => (status === 'ARCHIVED' ? '#18D851' : '#F3B51B');

const isOperatingRateInvalid = (rate: number | null | undefined) =>
    rate !== null && rate !== undefined && (rate < 0 || rate > 100);
const formatNumber = (val: number | string | null | undefined, digits: number) => {
    const numberValue = Number(val);
    if (val === null || val === undefined || !Number.isFinite(numberValue)) return '--';
    const formatted = numberValue.toFixed(digits);
    return digits > 0 ? formatted.replace(/\.0+$/, '') : formatted;
};
const getFileNameFromHeader = (headers: any, fallback: string) => {
    const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
    const matched = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
    return matched ? decodeURIComponent(matched[1] || matched[2]) : fallback;
};
const normalizeSurveyMonth = (value: string) => value ? value.slice(0, 7) : '';
const downloadBlob = (res: any, fallbackName: string) => {
    const blob = res?.data instanceof Blob ? res.data : new Blob([res?.data]);
    const fileName = getFileNameFromHeader(res?.headers, fallbackName);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
const isArchived = (row: any) => { return row.status === 'ARCHIVED' };
const isDraft = (row: any) => { return row.status === 'DRAFT' };

// ==================== 搜索配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'enterpriseName', placeholder: '企业名称' },
    { type: 'monthrange', label: '调研月份', value: 'surveyMonth', placeholder: '请选择调研月份' },
    {
        type: 'select', label: '状态', value: 'status', placeholder: '请选择状态', options: [
            { label: '草稿', value: 'DRAFT' },
            { label: '已归档', value: 'ARCHIVED' },
        ]
    },
];

// ==================== 表格列 ====================
const tableColumns = [
    { title: '企业单位名称', key: 'enterpriseName', width: 150 },
    { title: '调研月份', key: 'surveyMonth', width: 100 },
    {
        title: '单据状态',
        key: 'status',
        width: 90,
        render: (row: any) => {
            const getStatusColor = (status: string) => (status === 'ARCHIVED' ? '#18D851' : '#F3B51B');
            const getStatusText = (status: string) => {
                if (status === 'ARCHIVED') return '已归档';
                if (status === 'DRAFT') return '草稿';
                return '--';
            };
            return h('span', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
                h('span', {
                    style: {
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(row.status),
                    },
                }),
                h('span', { style: { fontSize: '14px' } }, row.statusName || getStatusText(row.status)),
            ]);
        },
    },
    {
        title: '库存(万吨)', key: 'inventory', width: 120,
        render: (row: any) => formatNumber(row.inventory, 1)
    },
    {
        title: '开工率(%)', key: 'operatingRate', width: 100,
        render: (row: any) => h('span', {
            style: { color: isOperatingRateInvalid(row.operatingRate) ? '#E34242' : undefined }
        }, row.operatingRate ?? '--')
    },
    {
        title: '企业主要产品规模',
        key: 'mainProductScale',
        width: 160,
        render: (row: any) => row.mainProductScale || '--',
    },

    {
        title: '下月采购计划(万吨)', key: 'nextMonthPlan', width: 140,
        render: (row: any) => formatNumber(row.nextMonthPlan, 1)
    },
];

const queryParams = ref({
    enterpriseName: '',
    status: '',
    surveyMonthStart: '',
    surveyMonthEnd: '',
});

// ==================== 表格配置 ====================
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        {
            btnName: '编辑',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => isDraft(row) && checkPermission(['crm:chemical_company:edit']),
            clickTableBtns: (row: any) => handleEdit(row),
        },
        {
            btnName: '复制',
            btnColor: '#2C65F2',
            isBtnHide: () => checkPermission(['crm:chemical_company:create']),
            clickTableBtns: (row: any) => handleCopy(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => isDraft(row) && checkPermission(['crm:chemical_company:delete']),
            clickTableBtns: (row: any) => handleDelete(row),
        },
        {
            btnName: '详情',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => isArchived(row),
            clickTableBtns: (row: any) => handleDetail(row),
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
                getPageList();
            }
        },
        onPageSizeChange: (pageSize: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                getPageList();
            }
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

// ==================== 搜索/重置 ====================
const handleSearch = (queryObj: any) => {
    const surveyMonth = queryObj.surveyMonth || [];
    queryParams.value.enterpriseName = queryObj.enterpriseName || '';
    queryParams.value.status = queryObj.status || '';
    queryParams.value.surveyMonthStart = normalizeSurveyMonth(surveyMonth[0]);
    queryParams.value.surveyMonthEnd = normalizeSurveyMonth(surveyMonth[1]);
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getPageList();
};

const getPageList = async () => {
    const pagConfig = tableConfig.value.paginationConfig.pagConfig;
    const res = await queryChemicalCompanyListApi({
        ...queryParams.value,
        current: pagConfig.page,
        size: pagConfig.pageSize,
    });
    if (res?.code === 200) {
        tableConfig.value.tableList = res.data?.records || [];
        tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
    }
};

const getQueryPayload = () => ({
    ...queryParams.value,
});

// ==================== 操作 ====================
const handleAdd = () => {
    router.push('/marketInfo/chemicalCompany/add');
};

const handleEdit = (row: any) => {
    router.push({ path: '/marketInfo/chemicalCompany/edit', query: { id: row.id } });
};

const handleCopy = (row: any) => {
    router.push({ path: '/marketInfo/chemicalCompany/add', query: { copyId: row.id } });
};

const handleDelete = async (row: any) => {
    if (!isDraft(row)) {
        message.warning('仅草稿状态下可删除');
        return;
    }
    const res = await deleteChemicalCompanyApi(row.id);
    if (res?.code === 200) {
        message.success('删除成功');
        getPageList();
    }
};

// ==================== 导入/导出 ====================
const importResultVisible = ref(false);
const importResult = reactive({
    total: 0,
    success: 0,
    fail: 0,
    hasFailData: false,
    rawData: null as any,
});

const resetImportResult = () => {
    importResult.total = 0;
    importResult.success = 0;
    importResult.fail = 0;
    importResult.hasFailData = false;
    importResult.rawData = null;
};

const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        resetImportResult();
        const formData = new FormData();
        formData.append('file', file);
        const res = await importChemicalCompanyApi(formData);
        if (res?.code === 200) {
            const data = res.data || {};
            importResult.total = data.totalCount ?? data.total ?? 0;
            importResult.success = data.successCount ?? data.success ?? 0;
            importResult.fail = data.failCount ?? data.fail ?? data.failureCount ?? 0;
            importResult.hasFailData = !!data.hasFailData || importResult.fail > 0;
            importResult.rawData = data;
            importResultVisible.value = true;
            getPageList();
        }
    };
    input.click();
};

// 下载导入错误数据文件
const downloadErrorFile = async () => {
    if (!importResult.rawData) return;
    const res = await downloadImportErrorDataApi(importResult.rawData);
    downloadBlob(res, '化工企业调研导入错误数据.xlsx');
};
const handleExport = async () => {
    const res = await exportChemicalCompanyApi(getQueryPayload());
    downloadBlob(res, '化工企业调研数据.xlsx');
    message.success('导出成功');
};

const handleDownloadTemplate = async () => {
    const res = await downloadChemicalCompanyTemplateApi();
    downloadBlob(res, '化工企业调研导入模板.xlsx');
    message.success('模板下载成功');
};



// ==================== 详情抽屉 ====================
// 当前页复用 ChemicalCompanyDetail，父组件只保留抽屉开关与当前行信息。
const detailVisible = ref(false);
const currentDetailId = ref<number | string | null>(null);
const currentDetailRow = ref<Record<string, any>>({});

const handleDetail = (row: any) => {
    detailVisible.value = true;
    currentDetailId.value = row.id;
    currentDetailRow.value = { ...row };
};

onMounted(() => {
    getPageList();
});
</script>

<style scoped lang="less">
.chemical-survey-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

:deep(.n-data-table-th.n-data-table-th--fixed-right.n-data-table-th--last) {
    width: 100px !important;
}

:deep(.status-cell) {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #333;
    font-size: 12px;
    line-height: 20px;
}

:deep(.status-dot) {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

:deep(.status-label) {
    white-space: nowrap;
}

.import-result {
    p {
        margin: 8px 0;
        font-size: 14px;
    }

    .text-success {
        color: #18D851;
        font-weight: 600;
    }

    .text-error {
        color: #E34242;
        font-weight: 600;
    }

    .error-details {
        max-height: 220px;
        margin: 12px 0;
        padding: 8px 10px;
        overflow: auto;
        border-radius: 4px;
        background: #fff7f7;
        border: 1px solid #ffd6d6;

        p {
            margin: 4px 0;
            color: #E34242;
            line-height: 20px;
            word-break: break-all;
        }
    }
}
</style>
