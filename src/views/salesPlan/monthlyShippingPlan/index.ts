import { computed, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { useMessage } from 'naive-ui';
import { deleteSalesPlanMonthlyPlan, getSalesPlanMonthlyPlanPage } from '@/api/salesPlan';
import {
    MONTHLY_STATUS_APPROVAL_GEN_FAILED,
    MONTHLY_STATUS_DRAFT,
    getMonthlyStatusConfig,
    getMonthlyStatusLabel,
    statusConfig,
} from './commonTs/comon';
import { getSalesPlanAiReportDetail } from '@/api/aiReport';
import { getSalesPlanAiReportPage } from '@/api/aiReport';
import { AI_REPORT_TYPE_LABEL_MAP } from '../aiPrediction/commonTs/common';
import { checkPermission } from '@/utils/comm';

const TABLE_ACTION_COLOR = 'var(--base-color)';
const TABLE_DANGER_COLOR = 'var(--base-color-red)';

const formatMonth = (value: any) => (value ? dayjs(value).format('YYYY-MM') : '--');

/**
 * 格式化列表中的定价月份范围。
 * @param begin 定价开始月份
 * @param end 定价结束月份
 * @returns 定价月份展示文本
 */
const formatPricingMonthRange = (begin: any, end: any) => {
    const beginText = formatMonth(begin);
    const endText = formatMonth(end);
    if (beginText === '--' && endText === '--') return '--';
    if (beginText === '--') return endText;
    if (endText === '--') return beginText;
    return beginText === endText ? beginText : `${beginText}-${endText}`;
};

const formatNumber = (value: any) => {
    if (value === undefined || value === null || value === '') return '--';
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue.toLocaleString();
};

/**
 * 格式化分页返回的品位汇总明细。
 * @param list 分页接口返回的品位汇总列表
 * @returns 品位及计划总量展示文本
 */
const formatGradeSummary = (list: any[] = []) => {
    if (!Array.isArray(list) || !list.length) return '--';
    return list
        .map((item) => {
            const grade = item.grade ?? '--';
            const qty = item.totalPlannedQty;
            return `品位${grade}：${formatNumber(qty)}吨`;
        })
        .join('；');
};

export default () => {
    const router = useRouter();
    const message = useMessage();
    const queryParams = ref<any>({});
    const detailDrawerVisible = ref(false);
    const currentReport = ref<any>({});

    const renderStatus = (status: string) => {
        const statusItem = getMonthlyStatusConfig(status);
        return h(
            'span',
            {
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#333333',
                    fontSize: '14px',
                    lineHeight: '22px',
                },
            },
            [
                h('span', {
                    style: {
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: statusItem?.color || '#c9cdd4',
                        flexShrink: 0,
                    },
                }),
                h('span', getMonthlyStatusLabel(status)),
            ]
        );
    };

    const renderLink = (text: string, onClick?: () => void) => {
        if (!text || text === '--') return '--';
        return h(
            'span',
            {
                style: {
                    color: TABLE_ACTION_COLOR,
                    cursor: onClick ? 'pointer' : 'default',
                },
                onClick,
            },
            text
        );
    };

    const formatReportDetail = (row: any) => ({
        ...row,
        reportType: row.reportType ? AI_REPORT_TYPE_LABEL_MAP[row.reportType] || row.reportType : '--',
        generatedAt: row.generationTime,
        historyRange: row.historicalSpan,
        dataSource: row.dataSources,
        modelName: row.aiModelName || row.aiModel || '--',
        conclusion: row.summaryConclusion,
    });

    const openReportDetail = async (row: any) => {
        let reportId = row.aiReportId || row.reportId;
        if (!reportId && row.aiReportCode) {
            try {
                const pageRes = await getSalesPlanAiReportPage({
                    current: 1,
                    size: 1,
                    reportCode: row.aiReportCode,
                });
                reportId = pageRes.data?.records?.[0]?.id;
            } catch {
                reportId = null;
            }
        }
        if (!reportId) {
            message.warning('暂无关联AI分析报告详情');
            return;
        }
        try {
            currentReport.value = {};
            const res = await getSalesPlanAiReportDetail(reportId);
            if (res.code === 200) {
                currentReport.value = formatReportDetail(res.data || {});
                detailDrawerVisible.value = true;
            } else {
                message.error(res.msg || '获取AI分析报告详情失败');
            }
        } catch {
            message.error('获取AI分析报告详情失败');
        }
    };

    const openCustomerDetailById = (customerId: any) => {
        if (!customerId) return;
        router.push({
            path: '/customerManage/customerArchive/detail',
            query: { id: customerId },
        });
    };

    const buildSummary = (row: any) => {
        if (row.summaryByGrade) return row.summaryByGrade;
        return formatGradeSummary(row.gradeSummaryList || []);
    };

    /**
     * 获取分页记录中的客户名称列表。
     * @param row 月发货计划分页记录
     * @returns 去重后的客户信息
     */
    const getMonthlyAddCustomers = (row: any) => {
        const map = new Map<string, any>();
        const detailList = Array.isArray(row.monthlyAddDetailList) ? row.monthlyAddDetailList : [];
        detailList.forEach((item: any) => {
            const customerName = item.customerName;
            if (!customerName) return;
            const customerId = item.customerId;
            const key = customerId ? String(customerId) : customerName;
            if (!map.has(key)) {
                map.set(key, {
                    customerId,
                    customerName,
                });
            }
        });
        return Array.from(map.values());
    };

    const renderCustomerLinks = (row: any) => {
        const customers = getMonthlyAddCustomers(row);
        if (!customers.length) return '--';

        return h(
            'span',
            {},
            customers.flatMap((customer: any, index: number) => [
                renderLink(
                    customer.customerName,
                    customer.customerId ? () => openCustomerDetailById(customer.customerId) : undefined
                ),
                index === customers.length - 1 ? null : '、',
            ])
        );
    };

    const buildApplicantName = (row: any) => row.applicantName || '--';

    const canEdit = (status: string) => status === MONTHLY_STATUS_DRAFT || status === MONTHLY_STATUS_APPROVAL_GEN_FAILED;

    /**
     * 按月发货计划分页接口 DTO 字段组装列表记录。
     * @param item 分页接口返回的单条月发货计划记录
     * @returns 页面展示及操作使用的月发货计划记录
     */
    const normalizeRecord = (item: any) => {
        const normalizedStatus = item.status || '';
        return {
            id: item.id,
            createdAt: item.createdAt,
            createdBy: item.createdBy,
            createdByName: item.createdByName,
            updatedAt: item.updatedAt,
            updatedBy: item.updatedBy,
            updatedByName: item.updatedByName,
            monthlyCode: item.monthlyCode,
            monthlyId: item.monthlyId,
            pricingMonthBegin: item.pricingMonthBegin,
            pricingMonthEnd: item.pricingMonthEnd,
            basePricingCodes: item.basePricingCodes,
            contractDiffSummary: item.contractDiffSummary,
            applicantId: item.applicantId,
            applyDeptId: item.applyDeptId,
            companyId: item.companyId,
            instruction: item.instruction,
            remark: item.remark,
            status: normalizedStatus,
            statusName: getMonthlyStatusLabel(normalizedStatus),
            approvalInstanceId: item.approvalInstanceId,
            companyName: item.companyName,
            applicantName: buildApplicantName(item),
            aiReportCode: item.aiReportCode,
            aiReportId: item.aiReportId,
            histRemainDetailList: item.histRemainDetailList,
            monthlyAddDetailList: item.monthlyAddDetailList,
            gradeSummaryList: item.gradeSummaryList,
            approvalDTO: item.approvalDTO,
            monthlyMonth: item.monthlyMonth ? dayjs(item.monthlyMonth).format('YYYY-MM') : item.monthlyMonth,
            pricingMonth: formatPricingMonthRange(item.pricingMonthBegin, item.pricingMonthEnd),
            summaryByGrade: buildSummary(item),
        };
    };

    const tableConfig = ref<any>({
        columns: [
            { key: 'monthlyCode', title: '计划编号', width: 150, render: (row: any) => row.monthlyCode || '--' },
            {
                key: 'monthlyMonth',
                title: '计划发货月份',
                width: 130,
                render: (row: any) => formatMonth(row.monthlyMonth),
            },
             {
                key: 'applicantName',
                title: '申请人',
                width: 120,
                render: (row: any) => row.applicantName || '--',
            },
            {
                key: 'pricingMonth',
                title: '定价月份',
                width: 160,
                render: (row: any) => row.pricingMonth || '--',
            },
            {
                key: 'companyName',
                title: '企业名称',
                width: 190,
                render: (row: any) => renderCustomerLinks(row),
            },
            {
                key: 'summaryByGrade',
                title: '计划总量',
                width: 280,
                render: (row: any) => buildSummary(row),
            },
            {
                key: 'status',
                title: '单据状态',
                width: 120,
                render: (row: any) => renderStatus(row.status),
            },
            {
                key: 'aiReportCode',
                title: '关联AI分析报告编号',
                width: 180,
                render: (row: any) =>
                    renderLink(
                        row.aiReportCode || '--',
                        row.aiReportCode || row.aiReportId || row.reportId ? () => openReportDetail(row) : undefined
                    ),
            },
            // {
            //     key: 'contractDiffSummary',
            //     title: '合同同步差异说明',
            //     width: 200,
            //     render: (row: any) => h('span', {}, row.contractDiffSummary || '--'),
            // },

           
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => canEdit(row.status) && checkPermission(['crm:monthly_shipping_plan:edit']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/monthlyShippingPlan/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '详情',
                btnColor: TABLE_ACTION_COLOR,
                clickTableBtns: (row: any) => {
                    router.push({ path: '/monthlyShippingPlan/detail', query: { id: row.id } });
                },
            },
            {
                btnName: '删除',
                btnColor: TABLE_DANGER_COLOR,
                isBtnHide: (row: any) => row.status === MONTHLY_STATUS_DRAFT && checkPermission('crm:monthly_shipping_plan:delete'),
                delConfig: {
                    title: '删除月发货计划',
                    content: '该计划删除后不可恢复，请确认是否删除？',
                    positiveText: '确认删除',
                },
                clickTableBtns: async (row: any) => {
                    try {
                        const res = await deleteSalesPlanMonthlyPlan(row.id);
                        if (res.code === 200) {
                            message.success('删除成功');
                            await getList();
                        }
                    } catch {
                        message.error('删除失败，请稍后重试');
                    }
                },
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
            value: 'applicantId',
            defaultValue: null,
            label: '申请人',
            type: 'personSelect',
            placeholder: '申请人',
        },
        {
            value: 'monthlyMonth',
            defaultValue: null,
            label: '计划发货月份',
            type: 'month',
            placeholder: '计划发货月份',
        },
        {
            value: 'status',
            defaultValue: '',
            label: '状态',
            type: 'select',
            placeholder: '状态',
            options: statusConfig,
        },
    ]);

    const buildQuery = () => {
        const params = queryParams.value || {};
        const monthlyMonth = params.monthlyMonth ? dayjs(params.monthlyMonth).format('YYYY-MM') : '';
        return {
            applicantId: params.applicantId || '',
            monthlyMonth,
            status: params.status || '',
        };
    };

    /**
     * 获取月发货计划分页列表。
     */
    const getList = async () => {
        try {
            const res = await getSalesPlanMonthlyPlanPage({
                current: tableConfig.value.paginationConfig.pagConfig.page,
                size: tableConfig.value.paginationConfig.pagConfig.pageSize,
                ...buildQuery(),
            });
            if (res.code !== 200) return;

            const pageData = res.data;
            const records = Array.isArray(pageData?.records) ? pageData.records : [];
            const pagination = tableConfig.value.paginationConfig.pagConfig;
            tableConfig.value.tableList = records.map(normalizeRecord);
            pagination.total = pageData?.total ?? 0;
            pagination.page = pageData?.current ?? pagination.page;
            pagination.pageSize = pageData?.size ?? pagination.pageSize;
        } catch {
            tableConfig.value.tableList = [];
            tableConfig.value.paginationConfig.pagConfig.total = 0;
            message.error('月发货计划列表加载失败，请稍后重试');
        }
    };

    const queryEvt = (params: any) => {
        queryParams.value = params;
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    const createEvt = () => {
        router.push('/monthlyShippingPlan/add');
    };

    onMounted(() => {
        getList();
    });

    return {
        createEvt,
        tableConfig,
        queryEvt,
        queryConfiguration,
        currentReport,
        detailDrawerVisible,
    };
};
