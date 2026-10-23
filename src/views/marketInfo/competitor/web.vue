<template>
    <WebPage @addEvt="handleAdd" contentPadding="0" hideAddBtn>
        <template #headerRight>
            <MxButton v-if="checkPermission(['crm:competitor:download'])" border color="#666" @click="handleDownloadTemplate">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽download1.png" alt="" style="width: 16px;height: 16px;">
                </template>
                模板下载
            </MxButton>
            <MxButton v-if="checkPermission(['crm:competitor:import'])" border color="#666" @click="handleImport">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽download2.png" alt="" style="width: 16px;height: 16px;">
                </template>
                批量导入
            </MxButton>
            <MxButton v-if="checkPermission(['crm:competitor:export'])" border color="#666" @click="handleExport">
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
            <div class="competitor-survey-container">
                <MxWebDataTable v-bind="tableConfig">
                    <template #tableSearch>
                        <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch" />
                    </template>
                </MxWebDataTable>
            </div>
        </template>
    </WebPage>

    <!-- 详情抽屉：展示单条竞争对手调研全量字段，并加载两类趋势图。 -->
    <MxDrawer v-model:show="detailVisible" title="竞争对手调研详情" size="large" :closablePop="false">
        <n-spin :show="detailLoading">
            <div class="detail-content">
                <div class="detail-header">
                    <div class="detail-header-top">
                        <span class="detail-title">{{ getCompetitorName(detailData) }}</span>
                        <StatusTag :text="detailData.statusName || getStatusText(detailData.status)" color="#5AA771" bgColor="#F0F9EB" borderColor='#E2F4D8' />
                    </div>
                    <div class="detail-header-info">
                        <div class="info-item">
                            <span class="info-label">录入人</span>
                            <span class="info-value">{{ detailData.inputPerson || '--' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">录入时间</span>
                            <span class="info-value">{{ detailData.inputTime || '--' }}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title"><span class="section-bar"></span>基础信息</div>
                    <n-descriptions label-placement="left" :column="2" :separator="false" class="detail-descriptions">
                        <n-descriptions-item label="调研月份">
                            {{ formatSurveyMonth(detailData.surveyMonth) }}
                        </n-descriptions-item>
                        <n-descriptions-item label="开工率(%)">
                            <span :class="{ 'text-error': isOperatingRateInvalid(detailData.operatingRate) }">
                                {{ detailData.operatingRate ?? '--' }}
                            </span>
                        </n-descriptions-item>
                        <n-descriptions-item :span="2" label="矿石库存(万吨)">
                            {{ formatNumber(detailData.inventory, 1) }}
                        </n-descriptions-item>
                        <n-descriptions-item :span="2" label="开工率变化原因">
                            {{ detailData.rateChangeReason || '--' }}
                        </n-descriptions-item>
                        <n-descriptions-item label="月产量(万吨)">
                            {{ formatNumber(detailData.monthlyOutput, 1) }}
                        </n-descriptions-item>
                        <n-descriptions-item label="最大产能(万吨/月)">
                            {{ formatNumber(detailData.maxOutput, 1) }}
                        </n-descriptions-item>
                        <n-descriptions-item label="产品品位(%)">
                            {{ formatNumber(detailData.productGrade, 1) }}
                        </n-descriptions-item>
                        <n-descriptions-item label="主要码头名称">
                            {{ detailData.wharfName || '--' }}
                        </n-descriptions-item>
                        <n-descriptions-item label="主要码头库存(万吨)">
                            {{ formatNumber(detailData.wharfInventory, 1) }}
                        </n-descriptions-item>
                        <n-descriptions-item :span="2" label="销售价格(元/吨)">
                            {{ detailData.salesPrice ?? '--' }}
                        </n-descriptions-item>
                        <n-descriptions-item :span="2" label="销售渠道">
                            {{ detailData.salesChannel || '--' }}
                        </n-descriptions-item>
                        <n-descriptions-item :span="2" label="价格变动原因">
                            {{ detailData.priceChangeReason || '--' }}
                        </n-descriptions-item>
                    </n-descriptions>
                </div>

                <div class="detail-section">
                    <div class="section-title"><span class="section-bar"></span>矿石供给</div>
                    <n-data-table
                        :columns="oreSupplyColumns"
                        :data="detailData.oreSupplyList || []"
                        :bordered="true"
                        :single-line="false"
                        size="small"
                        :max-height="220" />
                </div>

                <div class="detail-section chart-pair">
                    <div class="chart-block">
                        <div class="section-title"><span class="section-bar"></span>库存变化趋势</div>
                        <div class="chart-filter">
                            <n-select v-model:value="inventoryChartRange" :options="inventoryRangeOptions" size="small" style="width: 232px" @update:value="handleInventoryRangeChange" />
                        </div>
                        <div class="chart-unit">单位: 万吨</div>
                        <n-spin :show="inventoryChartLoading">
                            <n-empty v-if="!inventoryTrendData.length" class="chart-empty" description="暂无数据" />
                            <div v-show="inventoryTrendData.length" ref="inventoryChartRef" class="chart-container"></div>
                        </n-spin>
                    </div>
                    <div class="chart-block">
                        <div class="section-title"><span class="section-bar"></span>开工率vs价格对比图</div>
                        <div class="chart-filter">
                            <n-select v-model:value="rateChartRange" :options="rateRangeOptions" size="small" style="width: 232px" @update:value="handleRateRangeChange" />
                        </div>
                        <!-- <div class="chart-unit">价格: 元/吨；开工率: %</div> -->
                        <n-spin :show="rateChartLoading">
                            <n-empty v-if="!ratePriceData.length" class="chart-empty" description="暂无数据" />
                            <div v-show="ratePriceData.length" ref="rateChartRef" class="chart-container"></div>
                        </n-spin>
                    </div>
                </div>
            </div>
        </n-spin>
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
import { ref, reactive, h, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { NDataTable, NDescriptions, NDescriptionsItem, NEmpty, NModal, NSelect, NSpin, useMessage } from 'naive-ui';
import {
    queryCompetitorListApi,
    queryCompetitorDetailApi,
    queryCompetitorInventoryTrendApi,
    queryCompetitorRatePriceContrastApi,
    deleteCompetitorApi,
    importCompetitorApi,
    exportCompetitorApi,
    exportCompetitorErrorDataApi,
    downloadCompetitorTemplateApi,
} from '@/api/competitor';
import { checkPermission } from '@/utils/comm';

const router = useRouter();
const message = useMessage();

type TrendItem = {
    date: string;
    inventory: number | null;
    operatingRate: number | null;
    price: number | null;
    pendingSettlement: number | null;
    pendingCollection: number | null;
};

// ==================== 工具函数 ====================
const getStatusText = (status: string) => {
    if (status === 'ARCHIVED') return '已归档';
    if (status === 'DRAFT') return '草稿';
    return '--';
};
const getStatusColor = (status: string) => (status === 'ARCHIVED' ? '#18D851' : '#F3B51B');
const renderStatus = (row: any) => h(
    'span',
    { class: 'status-cell' },
    [
        h('span', { class: 'status-dot', style: { backgroundColor: getStatusColor(row.status) } }),
        h('span', { class: 'status-label' }, row.statusName || getStatusText(row.status)),
    ]
);
const isArchived = (row: any) => row.status === 'ARCHIVED';
const isDraft = (row: any) => row.status === 'DRAFT';
const isOperatingRateInvalid = (rate: number | string | null | undefined) => {
    const rateValue = Number(rate);
    return rate !== null && rate !== undefined && Number.isFinite(rateValue) && (rateValue < 0 || rateValue > 100);
};
const formatNumber = (val: number | string | null | undefined, digits: number) => {
    const numberValue = Number(val);
    if (val === null || val === undefined || !Number.isFinite(numberValue)) return '--';
    const formatted = numberValue.toFixed(digits);
    return digits > 0 ? formatted.replace(/\.0+$/, '') : formatted;
};
const formatInteger = (val: number | string | null | undefined) => {
    const numberValue = Number(val);
    return val !== null && val !== undefined && Number.isFinite(numberValue) ? String(Math.round(numberValue)) : '--';
};
const getFileNameFromHeader = (headers: any, fallback: string) => {
    const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
    const matched = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
    return matched ? decodeURIComponent(matched[1] || matched[2]) : fallback;
};
const normalizeSurveyMonth = (value: string) => value ? value.slice(0, 7) : '';
const formatSurveyMonth = (value: string) => value ? value.slice(0, 7) : '--';
const normalizeDateText = (value: string) => value ? value.slice(0, 10).replace(/-/g, '.') : '--';
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

// 接口字段和旧页面字段存在过渡差异，这里只在显示层兼容旧别名。
const getCompetitorName = (row: any) => row.competitorName || row.enterpriseName || '--';

// 详情「矿石供给」表格列
const oreSupplyColumns = [
    { title: '客户名称', key: 'customerName', minWidth: 200 },
    { title: '数量(万吨)', key: 'quantity', width: 140, render: (row: any) => formatNumber(row.quantity, 1) },
];
const getInventory = (row: any) => row.inventory ?? row.oreInventory;
const getWharfInventory = (row: any) => row.wharfInventory ?? row.mainTerminalInventory;

// ==================== 搜索配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'competitorName', placeholder: '企业名称' },
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
    { title: '企业名称', key: 'competitorName', width: 150, ellipsis: { tooltip: true }, render: (row: any) => getCompetitorName(row) },
    {
        title: '单据状态', key: 'status', width: 100,
        render: renderStatus
    },
    { title: '调研月份', key: 'surveyMonth', width: 100, render: (row: any) => formatSurveyMonth(row.surveyMonth) },
    {
        title: '矿石库存(万吨)', key: 'inventory', width: 140,
        render: (row: any) => formatNumber(getInventory(row), 1)
    },
    {
        title: '开工率(%)', key: 'operatingRate', width: 110,
        render: (row: any) => h('span', {
            style: { color: isOperatingRateInvalid(row.operatingRate) ? '#E34242' : undefined }
        }, formatInteger(row.operatingRate))
    },
    {
        title: '主要码头库存(万吨)', key: 'wharfInventory', width: 160,
        render: (row: any) => formatNumber(getWharfInventory(row), 1)
    },
    {
        title: '月产量(万吨)', key: 'monthlyOutput', width: 130,
        render: (row: any) => formatNumber(row.monthlyOutput, 1)
    },
    {
        title: '产品品位(%)', key: 'productGrade', width: 120,
        render: (row: any) => formatNumber(row.productGrade, 1)
    },
    {
        title: '销售价格(元/吨)', key: 'salesPrice', width: 140,
        render: (row: any) => formatInteger(row.salesPrice)
    },

];

const queryParams = ref({
    competitorName: '',
    surveyMonthStart: '',
    surveyMonthEnd: '',
    status: '',
});

// ==================== 表格配置 ====================
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        {
            btnName: '编辑',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => isDraft(row) && checkPermission(['crm:competitor:edit']),
            clickTableBtns: (row: any) => handleEdit(row),
        },
        {
            btnName: '复制',
            btnColor: '#2C65F2',
            isBtnHide: () => checkPermission(['crm:competitor:create']),
            clickTableBtns: (row: any) => handleCopy(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => isDraft(row) && checkPermission(['crm:competitor:delete']),
            isDialog: true,
            delConfig: {
                title: '确认删除',
                content: '该竞争对手数据删除后不可恢复，请确定是否删除？',
                positiveText: '确定',
                negativeText: '取消',
            },
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

// ==================== 搜索/分页 ====================
const handleSearch = (queryObj: any) => {
    const surveyMonth = queryObj.surveyMonth || [];
    queryParams.value.competitorName = queryObj.competitorName || '';
    queryParams.value.status = queryObj.status || '';
    queryParams.value.surveyMonthStart = normalizeSurveyMonth(surveyMonth[0]);
    queryParams.value.surveyMonthEnd = normalizeSurveyMonth(surveyMonth[1]);
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getPageList();
};

const getPageList = async () => {
    const pagConfig = tableConfig.value.paginationConfig.pagConfig;
    const res = await queryCompetitorListApi({
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

// ==================== 操作按钮 ====================
const handleAdd = () => {
    router.push('/marketInfo/competitor/add');
};

const handleEdit = (row: any) => {
    router.push({ path: '/marketInfo/competitor/edit', query: { id: row.id } });
};

const handleCopy = (row: any) => {
    router.push({ path: '/marketInfo/competitor/add', query: { copyId: row.id } });
};

const handleDelete = async (row: any) => {
    if (!isDraft(row)) {
        message.warning('仅草稿状态下可删除');
        return;
    }
    const res = await deleteCompetitorApi(row.id);
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
        const res = await importCompetitorApi(formData);
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

const handleExport = async () => {
    const res = await exportCompetitorApi(getQueryPayload());
    downloadBlob(res, '竞争对手调研数据.xlsx');
    message.success('导出成功');
};

const handleDownloadTemplate = async () => {
    const res = await downloadCompetitorTemplateApi();
    downloadBlob(res, '竞争对手调研导入模板.xlsx');
    message.success('模板下载成功');
};

const downloadErrorFile = async () => {
    if (!importResult.rawData) return;
    const res = await exportCompetitorErrorDataApi(importResult.rawData);
    downloadBlob(res, '竞争对手调研导入错误数据.xlsx');
};

// ==================== 详情与趋势图 ====================
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<any>({});

const inventoryChartRef = ref<HTMLElement | null>(null);
let inventoryChartInstance: echarts.ECharts | null = null;
const inventoryChartRange = ref(6);
const inventoryChartLoading = ref(false);
const inventoryTrendData = ref<TrendItem[]>([]);
const inventoryRangeOptions = [
    { label: '近3月', value: 3 },
    { label: '近6月', value: 6 },
    { label: '近12月', value: 12 },
];

const rateChartRef = ref<HTMLElement | null>(null);
let rateChartInstance: echarts.ECharts | null = null;
const rateChartRange = ref(3);
const rateChartLoading = ref(false);
const ratePriceData = ref<TrendItem[]>([]);
const rateRangeOptions = [
    { label: '近3月', value: 3 },
    { label: '近6月', value: 6 },
];

const getTrendList = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.trendList)) return data.trendList;
    return [];
};

// 趋势接口复用 MarketSurveyCountDTO，这里统一归一化给两个图表消费。
const normalizeTrendData = (data: any): TrendItem[] => {
    return getTrendList(data)
        .map((item: any) => {
            const inventory = Number(item.inventory);
            const operatingRate = Number(item.operatingRate);
            const price = Number(item.price);
            const pendingSettlement = Number(item.pendingSettlement);
            const pendingCollection = Number(item.pendingCollection);
            return {
                date: normalizeDateText(item.inputTime || item.surveyMonth || item.date || item.createdAt),
                inventory: Number.isFinite(inventory) ? inventory : null,
                operatingRate: Number.isFinite(operatingRate) ? operatingRate : null,
                price: Number.isFinite(price) ? price : null,
                pendingSettlement: Number.isFinite(pendingSettlement) ? pendingSettlement : null,
                pendingCollection: Number.isFinite(pendingCollection) ? pendingCollection : null,
            };
        })
        .filter((item: TrendItem) => item.date !== '--');
};

const initInventoryChart = (data: TrendItem[]) => {
    if (!inventoryChartRef.value || !data.length) return;
    inventoryChartInstance?.dispose();
    inventoryChartInstance = echarts.init(inventoryChartRef.value);
    inventoryChartInstance.setOption({
        color: ['#2C65F2'],
        grid: { left: 18, right: 24, top: 18, bottom: 30, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const item = params?.[0];
                return item ? `${item.axisValue}<br/>库存: ${item.value} 万吨` : '';
            },
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.map(item => item.date),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#A8ABB2', fontSize: 12 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#A8ABB2', fontSize: 12 },
            splitLine: { lineStyle: { color: '#F1F3F5' } },
        },
        series: [{
            data: data.map(item => item.inventory),
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            connectNulls: true,
            lineStyle: { color: '#8DB9FF', width: 2 },
            itemStyle: { color: '#2C65F2', borderColor: '#fff', borderWidth: 2 },
        }],
    });
};

const initRateChart = (data: TrendItem[]) => {
    if (!rateChartRef.value || !data.length) return;
    rateChartInstance?.dispose();
    rateChartInstance = echarts.init(rateChartRef.value);
    rateChartInstance.setOption({
        color: ['#2C65F2', '#18D851'],
        grid: { left: 10, right: 10, top: 46, bottom: 20, containLabel: false },
        // legend: {
        //     show: false,
        //     top: 0,
        //     right: 0,
        //     data: ['价格', '开工率'],
        //     textStyle: { color: '#999', fontSize: 12 },
        // },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                if (!Array.isArray(params) || !params.length) return '';
                const axisValue = params[0]?.axisValue || '';
                const dataIndex = params[0]?.dataIndex ?? 0;
                const trendItem = data[dataIndex];
                const lines = params.map((item: any) => {
                    const valueLabel = item.seriesName === '开工率' ? `${item.value}%` : item.value;
                    return `${item.marker} ${item.seriesName}: ${valueLabel}`;
                });
                if (trendItem?.pendingSettlement != null) {
                    lines.push(`待结算: ${trendItem.pendingSettlement}`);
                }
                if (trendItem?.pendingCollection != null) {
                    lines.push(`待回款: ${trendItem.pendingCollection}`);
                }
                return lines.reduce((prev: string, curr: string) => `${prev}<br/>${curr}`, axisValue);
            },
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.date),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#A8ABB2', fontSize: 12 },
            boundaryGap: false,
        },
        yAxis: [
            {
                type: 'value',
                name: '价格(元/吨)',
                nameTextStyle: { color: '#999', padding: [0, -12, 4, 0] },
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#999', fontSize: 12 },
                splitLine: { lineStyle: { color: '#F1F3F5' } },
            },
            {
                type: 'value',
                name: '开工率(%)',
                min: 0,
                max: 100,
                nameTextStyle: { color: '#999', padding: [0, 0, 4, 30] },
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#999', fontSize: 12, formatter: '{value}%' },
                splitLine: { show: false },
            },
        ],
        series: [
            {
                name: '价格',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                connectNulls: true,
                lineStyle: { width: 2 },
                itemStyle: { color: '#2C65F2' },
                data: data.map(item => item.price),
            },
            {
                name: '开工率',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                connectNulls: true,
                lineStyle: { width: 2 },
                itemStyle: { color: '#18D851' },
                data: data.map(item => item.operatingRate),
            },
        ],
    });
};

const getAccurateName = () => detailData.value.competitorName || detailData.value.enterpriseName || '';

const getInventoryTrend = async () => {
    if (!getAccurateName()) return;
    inventoryChartLoading.value = true;
    try {
        const res = await queryCompetitorInventoryTrendApi({
            accurateName: getAccurateName(),
            months: inventoryChartRange.value,
        });
        inventoryTrendData.value = res?.code === 200 ? normalizeTrendData(res.data).filter(item => item.inventory !== null) : [];
        await nextTick();
        initInventoryChart(inventoryTrendData.value);
    } finally {
        inventoryChartLoading.value = false;
    }
};

const getRatePriceContrast = async () => {
    if (!getAccurateName()) return;
    rateChartLoading.value = true;
    try {
        const res = await queryCompetitorRatePriceContrastApi({
            accurateName: getAccurateName(),
            months: rateChartRange.value,
        });
        ratePriceData.value = res?.code === 200 ? normalizeTrendData(res.data).filter(item => item.price !== null || item.operatingRate !== null) : [];
        await nextTick();
        initRateChart(ratePriceData.value);
    } finally {
        rateChartLoading.value = false;
    }
};

const handleInventoryRangeChange = () => {
    getInventoryTrend();
};

const handleRateRangeChange = () => {
    getRatePriceContrast();
};

const resetCharts = () => {
    inventoryTrendData.value = [];
    ratePriceData.value = [];
    inventoryChartInstance?.dispose();
    rateChartInstance?.dispose();
    inventoryChartInstance = null;
    rateChartInstance = null;
};

const handleDetail = async (row: any) => {
    detailVisible.value = true;
    detailLoading.value = true;
    resetCharts();
    inventoryChartRange.value = 6;
    rateChartRange.value = 3;
    try {
        const res = await queryCompetitorDetailApi(row.id);
        detailData.value = res?.code === 200 ? { ...row, ...res.data } : { ...row };
        await nextTick();
        await Promise.all([getInventoryTrend(), getRatePriceContrast()]);
    } finally {
        detailLoading.value = false;
    }
};

const handleChartResize = () => {
    inventoryChartInstance?.resize();
    rateChartInstance?.resize();
};

watch(
    () => detailVisible.value,
    (visible) => {
        if (!visible) {
            resetCharts();
        }
    }
);

onMounted(() => {
    getPageList();
    window.addEventListener('resize', handleChartResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleChartResize);
    resetCharts();
});
</script>

<style scoped lang="less">
.competitor-survey-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

:deep(.status-cell) {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #333;
    font-size: 14px;
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

.detail-content {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 64px);
    background: #fff;
    color: #333;

    .detail-header {
        padding: 12px 24px;
        flex-shrink: 0;
        border-bottom: 1px solid #eef0f3;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .detail-title {
                font-size: 16px;
                font-weight: 600;
            }
        }

        .detail-header-info {
            display: flex;
            align-items: center;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                margin-right: 88px;

                .info-label {
                    color: #999;
                }

                .info-value {
                    color: #333;
                }
            }
        }
    }


    .detail-section {
        padding: 24px 24px 20px 24px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 14px;

            .section-bar {
                display: inline-block;
                width: 4px;
                height: 14px;
                background-color: #2c65f2;
                border-radius: 2px;
            }
        }

        .detail-descriptions {
            font-size: 14px;
            color: #333;

            :deep(.n-descriptions-table) {
                table-layout: fixed;
            }

            :deep(.n-descriptions-table-content) {
                padding-bottom: 14px;
                vertical-align: top;
                width: 520px;
            }

            :deep(.n-descriptions-table-content__label) {
                display: inline-block;
                width: 128px !important;
                margin-right: 12px;
                color: #999;
                text-align: right;
                vertical-align: top;
                line-height: 20px;
                white-space: normal;
            }

            :deep(.n-descriptions-table-content__content) {
                color: #333;
                max-width: 420px;
                white-space: break-spaces;
            }
        }
    }

    .detail-section.chart-pair {
        display: flex;
        gap: 40px;
        padding: 0px 24px;

        .chart-block {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;

            .section-title {
                margin-bottom: 12px;
            }
        }
    }

    .chart-filter {
        margin-bottom: 10px;

        :deep(.n-base-selection) {
            --n-height: 30px !important;
        }
    }

    .chart-unit {
        color: #999;
        font-size: 12px;
        margin: 10px 0 0px 16px;
    }

    .chart-container {
        width: 100%;
        height: 246px;
    }

    .chart-empty {
        height: 246px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

:deep(.n-spin-container),
:deep(.n-spin-content) {
    height: 100%;
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
}

.text-error {
    color: #E34242;
}
</style>
