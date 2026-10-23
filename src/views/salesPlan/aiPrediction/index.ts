import { computed, h, onMounted, ref } from 'vue';
import { NButton, useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import {
    AI_REPORT_STATUS_CONFIG,
    AI_REPORT_TYPE_LABEL_MAP,
    AI_REPORT_TYPE_OPTIONS,
    ReportStatus,
    TABLE_ACTION_COLOR,
} from './commonTs/common';
import { exportMarkdownToPdf } from './commonTs/pdfExport';
import {
    generateSalesPlanAiReport,
    getSalesPlanAiReportDetail,
    getSalesPlanAiReportPage,
} from '@/api/aiReport';
import { useDictStore } from '@/store/commStore';
import { checkPermission } from '@/utils/comm';

export default () => {
    const message = useMessage();
    const { dictMap } = storeToRefs(useDictStore());
    const queryParams = ref<any>({});
    const ruleDrawerVisible = ref(false);
    const detailDrawerVisible = ref(false);
    const currentReport = ref<any>({});
    const exportingReportId = ref<any>(null);

    const renderStatus = (status: ReportStatus) => {
        const current = AI_REPORT_STATUS_CONFIG[status] || AI_REPORT_STATUS_CONFIG.RUNNING;
        return h('div', { class: 'ai-report-status' }, [
            h('span', {
                class: 'ai-report-status-dot',
                style: {
                    backgroundColor: current?.color,
                },
            }),
            h('span', current?.label),
        ]);
    };

    const formatReportType = (value?: string) => (value ? AI_REPORT_TYPE_LABEL_MAP[value] || value : '--');
    const aiModelOptions = computed(() => dictMap.value?.['AI模型'] || []);
    const formatAiModel = (value?: string) => {
        if (!value) return '--';
        const option = aiModelOptions.value.find((item: any) => item.value === value);
        return option?.label || value;
    };

    const formatReportDetail = (row: any) => {
        return {
            ...row,
            reportType: formatReportType(row.reportType),
            generatedAt: row.generationTime,
            historyRange: row.historicalSpan,
            dataSource: row.dataSources,
            modelName: formatAiModel(row.aiModel),
            conclusion: row.summaryConclusion,
        };
    };

    const openReportDetail = async (row: any) => {
        if (!row?.id) return;
        try {
            currentReport.value = {};
            const res = await getSalesPlanAiReportDetail(row.id);
            if (res.code === 200) {
                currentReport.value = formatReportDetail(res.data || {});
                detailDrawerVisible.value = true;
            } else {
                message.error(res.msg || '获取详情失败');
            }
        } catch {
            message.error('获取详情失败');
        }
    };

    const exportMarkdownReport = async (detail: any) => {
        if (!detail.contentData) {
            message.warning('暂无可导出的报告内容');
            return;
        }
        await exportMarkdownToPdf(
            detail.contentData,
            `${detail.reportName || detail.reportCode || 'AI预测报告'}.pdf`
        );
    };

    const downloadReport = async (row: any) => {
        if (!row?.id) return;
        if (exportingReportId.value) return;
        try {
            exportingReportId.value = row.id;
            const res = await getSalesPlanAiReportDetail(row.id);
            if (res.code === 200) {
                await exportMarkdownReport(res.data || {});
            } else {
                message.error(res.msg || '获取报告内容失败');
            }
        } catch {
            message.error('获取报告内容失败');
        } finally {
            exportingReportId.value = null;
        }
    };

    const regenerateReport = async (row: any) => {
        try {
            const res = await generateSalesPlanAiReport({ ruleId: row.ruleId, reportCode: row.reportCode });
            if (res.code === 200) {
                message.success('重新生成任务已发起');
                getList();
            }
        } catch {
            message.error('重新生成失败');
        }
    };

    const tableConfig = ref<any>({
        columns: [
            { key: 'reportCode', title: '报告编号', width: 140 },
            { key: 'reportName', title: '报告名称', width: 220 },
            {
                key: 'reportType',
                title: '报告类型',
                width: 120,
                render: (row: any) => formatReportType(row.reportType),
            },
            { key: 'generationTime', title: '生成时间', width: 190 },
            {
                key: 'status',
                title: '单据状态',
                width: 120,
                render: (row: any) => renderStatus(row.status),
            },
            { key: 'dataSources', title: '数据来源', width: 150 },
            { key: 'summaryConclusion', title: '主要结论', width: 200, render: (row: any) => h('span', {}, row.summaryConclusion || '--') },
            {
                key: 'aiModel',
                title: 'AI模型',
                width: 150,
                render: (row: any) => formatAiModel(row.aiModel),
            },
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '下载',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => row.status === 'COMPLETED' && checkPermission(['crm:ai_prediction:download']),
                render: (row: any) => {
                    const isLoading = exportingReportId.value === row.id;
                    return h(
                        NButton,
                        {
                            size: 'tiny',
                            type: 'primary',
                            quaternary: true,
                            focusable: false,
                            loading: isLoading,
                            disabled: Boolean(exportingReportId.value),
                            style: {
                                color: TABLE_ACTION_COLOR,
                                fontSize: '14px',
                            },
                            onClick: () => downloadReport(row),
                        },
                        { default: () => (isLoading ? '导出中' : '下载') }
                    );
                },
                clickTableBtns: (row: any) => downloadReport(row),
            },
            {
                btnName: '详情',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => row.status === 'COMPLETED',
                clickTableBtns: (row: any) => openReportDetail(row),
            },
            {
                btnName: '重新生成',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => row.status === 'FAILED' && checkPermission(['crm:ai_prediction:rebuild']),
                clickTableBtns: (row: any) => regenerateReport(row),
            },
        ],
        isShowPagination: true,
        bordered: false,
        bottomBordered: false,
        singleLine: true,
        paginationConfig: {
            pagConfig: {
                total: 0,
                pageSize: 20,
                page: 1,
            },
            showHeadBorder: false,
            showTotal: true,
            onPageChange: (page: number) => {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                getList();
            },
        },
        styleOption: {
            padding: '16px',
            paddingBottom: '0px',
        },
    });

    const queryConfiguration = computed(() => [
        {
            value: 'reportName',
            defaultValue: '',
            label: '报告名称',
            type: 'input',
            placeholder: '报告名称',
        },
        {
            value: 'reportType',
            defaultValue: null,
            label: '报告类型',
            type: 'select',
            placeholder: '报告类型',
            options: AI_REPORT_TYPE_OPTIONS,
        },
        {
            value: 'reportTimeRange',
            defaultValue: null,
            label: '报告时间',
            type: 'dateTimeRange',
            leftPlaceholder: '报告开始时间',
            rightPlaceholder: '报告结束时间',
        },
    ]);

    const getQueryParams = () => {
        const { reportName, reportType, reportTimeRange } = queryParams.value;
        const params = {
            reportName: reportName || '',
            reportType: reportType || '',
            reportStartTime: '',
            reportEndTime: '',
        };
        if (Array.isArray(reportTimeRange) && reportTimeRange.length === 2) {
            params.reportStartTime = reportTimeRange[0];
            params.reportEndTime = reportTimeRange[1];
        }
        return params;
    };

    const getList = async () => {
        try {
            let res = await getSalesPlanAiReportPage({
                current: tableConfig.value.paginationConfig.pagConfig.page,
                size: tableConfig.value.paginationConfig.pagConfig.pageSize,
                ...getQueryParams(),
            });
            if (res.code === 200) {
                tableConfig.value.tableList = res.data.records;
                tableConfig.value.paginationConfig.pagConfig.total = res.data.total;
            }
        } catch { }
    };

    const queryEvt = (params: any) => {
        queryParams.value = params;
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    onMounted(() => {
        getList();
    });

    const createRule = () => {
        ruleDrawerVisible.value = true;
    };

    return {
        tableConfig,
        queryConfiguration,
        queryEvt,
        getList,
        createRule,
        ruleDrawerVisible,
        detailDrawerVisible,
        currentReport,
    };
};
