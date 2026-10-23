import { computed, h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NDataTable, NTooltip, useMessage } from 'naive-ui';
import dayjs from 'dayjs';
import { getSalesPlanBasePricingList, getSalesPlanMonthlyPlanDetail } from '@/api/salesPlan';
import { getSalesPlanAiReportDetail } from '@/api/aiReport';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';
import { useDictStore } from '@/store/commStore';
import { storeToRefs } from 'pinia';
import { getMonthlyStatusLabel } from '../commonTs/comon';
import { AI_REPORT_TYPE_LABEL_MAP } from '../../aiPrediction/commonTs/common';

const formatDate = (value: any, pattern = 'YYYY-MM-DD') => {
    if (!value && value !== 0) return '--';
    const date = dayjs(value);
    return date.isValid() ? date.format(pattern) : String(value);
};

/**
 * 格式化详情页展示的定价月份范围。
 * @param begin 定价开始月份
 * @param end 定价结束月份
 * @returns 定价月份展示文本
 */
const formatPricingMonthRange = (begin: any, end: any) => {
    const beginText = formatDate(begin, 'YYYY-MM');
    const endText = formatDate(end, 'YYYY-MM');
    if (beginText === '--' && endText === '--') return '--';
    if (beginText === '--') return endText;
    if (endText === '--') return beginText;
    return beginText === endText ? beginText : `${beginText}-${endText}`;
};

const formatNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : value;
};
const formatPercentText = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const text = String(value).trim();
    return text.endsWith('%') ? text : `${text}%`;
};
const formatProductionStatusText = (value: any) => {
    const text = formatPercentText(value);
    return text === '--' ? text : `开工率：${text}`;
};
const renderClampText = (value: any) => {
    const text = value || '--';
    return h(
        NTooltip,
        {
            trigger: 'hover',
            placement: 'top-start',
        },
        {
            trigger: () => h('span', { class: 'monthly-add-cell-clamp' }, text),
            default: () =>
                h(
                    'div',
                    {
                        style: {
                            maxWidth: '360px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-all',
                            lineHeight: '20px',
                        },
                    },
                    text
                ),
        }
    );
};
const isEmptyValue = (value: any) => value === null || value === undefined || value === '';

/**
 * 将详情接口返回的逗号分隔编码转换为展示列表。
 * @param value 关联基准定价单编码
 * @returns 关联基准定价单编码数组
 */
const splitCodes = (value: any) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const parseListValue = (value: any) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (isEmptyValue(value)) return [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parseListValue(parsed);
        } catch {
            return value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }
    return [value].filter(Boolean);
};

const normalizeAssociatedApprovals = (value: any) =>
    parseListValue(value)
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
            approvalName: item.approvalName,
            instanceCode: item.instanceCode,
        }))
        .filter((item: any) => item.approvalName && item.instanceCode);

/**
 * 将详情接口的本月新增计划明细转换为表格结构。
 * `child` 仅用于现有展开表格展示，数据源固定为接口字段 `qtyDTOList`。
 * @param list 本月新增计划明细
 * @returns 详情表格使用的本月新增计划明细
 */
const normalizeNewItems = (list: any[] = []) => {
    return (list || []).map((item: any, index: number) => {
        const qtyDTOList = Array.isArray(item.qtyDTOList)
            ? item.qtyDTOList.map((qty: any) => ({
                  id: qty.id,
                  itemId: qty.itemId,
                  monthlyId: qty.monthlyId,
                  grade: qty.grade,
                  deliveryAddress: qty.deliveryAddress,
                  deliveryLocationName: qty.deliveryLocationName,
                  plannedQty: qty.plannedQty,
                  oreType: qty.oreType,
                  contractQty: qty.contractQty,
                  monthlyCode: qty.monthlyCode,
              }))
            : [];
        return {
            id: item.id,
            monthlyId: item.monthlyId,
            demandSource: item.demandSource,
            customerCode: item.customerCode,
            customerId: item.customerId,
            customerName: item.customerName,
            customerType: item.customerType,
            transportMode: item.transportMode,
            syncDiffReason: item.syncDiffReason,
            remark: item.remark,
            inventoryStatus: item.inventoryStatus,
            productionStatus: item.productionStatus,
            purchasePlan: item.purchasePlan,
            cooperationScaleChem: item.cooperationScaleChem,
            fundingStatus: item.fundingStatus,
            downstreamSupplyChain: item.downstreamSupplyChain,
            cooperationScaleTrade: item.cooperationScaleTrade,
            importantChanges: item.importantChanges,
            negotiationStatus: item.negotiationStatus,
            monthlyCode: item.monthlyCode,
            contractCode: item.contractCode,
            pricingCode: item.pricingCode,
            subsidiaryId: item.subsidiaryId,
            subsidiaryName: item.subsidiaryName,
            qtyDTOList,
            frontId: item.id || `new-${index}`,
            child: qtyDTOList,
        };
    });
};

export default () => {
    const route = useRoute();
    const message = useMessage();
    const { dictMap } = storeToRefs(useDictStore());
    const currentReport = ref<any>({});
    const detailDrawerVisible = ref(false);
    const reportDetailLoading = ref(false);
    const detail = ref<any>({
        histRemainDetailList: [],
        monthlyAddDetailList: [],
        gradeSummaryList: [],
        executionChartList: [],
        executionDetailList: [],
        basePricingCodes: [],
        basePricingDisplayList: [],
        basePricingLoading: false,
        approvalLogs: [],
    });

    const tabs = [
        { name: '基础信息', key: 'basic' },
        { name: '审批流程', key: 'approval' },
        // { name: '执行进度', key: 'progress' },
    ];

    const formatTransportMode = (value: any) => {
        if (isEmptyValue(value)) return '--';
        const option = (dictMap.value?.['运输方式'] || []).find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
            )
        );
        return option?.label || option?.name || value;
    };
    const formatOreType = (value: any) => {
        if (isEmptyValue(value)) return '--';
        const option = (dictMap.value?.['矿种'] || []).find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
            )
        );
        return option?.label || option?.name || value;
    };
    const aiModelOptions = computed<any[]>(() => dictMap.value?.['AI模型'] || []);
    const formatReportType = (value?: string) => (value ? AI_REPORT_TYPE_LABEL_MAP[value] || value : '--');
    const formatAiModel = (value?: string) => {
        if (!value) return '--';
        const option = aiModelOptions.value.find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
            )
        );
        return option?.label || value;
    };
    const formatReportDetail = (row: any) => ({
        ...row,
        reportType: formatReportType(row.reportType),
        generatedAt: row.generationTime,
        historyRange: row.historicalSpan,
        dataSource: row.dataSources,
        modelName: row.aiModelName || formatAiModel(row.aiModel),
        conclusion: row.summaryConclusion,
    });

    /**
     * 将月发货计划详情接口的 data 节点转换为详情页展示模型。
     * 详情页业务字段只从详情接口对应字段读取，避免使用历史字段或计算值覆盖接口返回值。
     * @param data 月发货计划详情接口的 data 节点
     * @returns 详情页展示模型
     */
    const formatDetail = (data: any) => {
        const approvalDTO = data.approvalDTO || {};
        const approveUrl = Array.isArray(approvalDTO.approveUrl) ? approvalDTO.approveUrl : [];
        const gradeSummaryList = Array.isArray(data.gradeSummaryList) ? data.gradeSummaryList : [];
        const basePricingCodes = splitCodes(data.basePricingCodes);
        return {
            id: data.id,
            monthlyCode: data.monthlyCode,
            monthlyId: data.monthlyId,
            planCode: data.monthlyCode,
            pricingMonthBegin: data.pricingMonthBegin,
            pricingMonthEnd: data.pricingMonthEnd,
            pricingMonth: formatPricingMonthRange(data.pricingMonthBegin, data.pricingMonthEnd),
            monthlyMonth: formatDate(data.monthlyMonth, 'YYYY-MM'),
            basePricingCodes,
            summaryByGrade: data.summaryByGrade,
            contractDiffSummary: data.contractDiffSummary,
            applicantId: data.applicantId,
            applyDeptId: data.applyDeptId,
            companyId: data.companyId,
            instruction: data.instruction,
            remark: data.remark,
            status: data.status,
            statusName: getMonthlyStatusLabel(data.status),
            approvalInstanceId: approvalDTO.approvalInstanceId,
            companyName: data.companyName,
            applicantName: data.applicantName,
            submitter: data.createdByName,
            aiReportCode: data.aiReportCode,
            aiReportId: data.aiReportId,
            histRemainDetailList: Array.isArray(data.histRemainDetailList) ? data.histRemainDetailList : [],
            monthlyAddDetailList: Array.isArray(data.monthlyAddDetailList)
                ? normalizeNewItems(data.monthlyAddDetailList)
                : [],
            gradeSummaryList,
            executionDetailList: [],
            executionChartList: [],
            basePricingDisplayList: [],
            basePricingLoading: false,
            approvalRemark: approvalDTO.remark,
            attachments: approveUrl,
            associatedApprovals: normalizeAssociatedApprovals(approvalDTO.associatedApproval),
            approvalLogs: [],
            approvalDTO: {
                id: approvalDTO.id,
                approvalInstanceId: approvalDTO.approvalInstanceId,
                applyDeptName: approvalDTO.applyDeptName,
                companyName: approvalDTO.companyName,
                remark: approvalDTO.remark,
                approveUrl,
                associatedApproval: approvalDTO.associatedApproval,
                larkUserId: approvalDTO.larkUserId,
            },
        };
    };

    const loadApprovalLogs = async (approvalId: any) => {
        detail.value.approvalLogs = [];
        if (!approvalId) return;
        try {
            const logsRes = await getCommonApprovalLogsNewMap(approvalId);
            if (logsRes.code === 200) {
                const userNameMap = await getApprovalUserNameMap();
                detail.value.approvalLogs = normalizeApprovalDetailsNewMap(logsRes.data || [], userNameMap);
            }
        } catch {
            // 审批日志是详情补充信息，失败时保留主表详情。
        }
    };

    const loadBasePricingDisplayList = async () => {
        const codeList = detail.value.basePricingCodes || [];
        detail.value.basePricingDisplayList = codeList.map((pricingCode: string) => ({
            pricingCode,
            label: pricingCode,
        }));
        if (!codeList.length) return;

        detail.value.basePricingLoading = true;
        try {
            const res = await getSalesPlanBasePricingList({ codeList });
            if (res.code === 200) {
                const pricingDetailMap = new Map<string, any>(
                    (res.data || []).map((item: any) => [String(item.pricingCode), item])
                );
                detail.value.basePricingDisplayList = codeList.map((pricingCode: string) => {
                    const item = pricingDetailMap.get(String(pricingCode));
                    return {
                        id: item?.id,
                        customerType: item?.customerType,
                        pricingCode,
                        label: pricingCode,
                    };
                });
            }
        } catch {
            // 基准定价详情接口失败时仍保留详情接口返回的编码，并禁用对应跳转。
        } finally {
            detail.value.basePricingLoading = false;
        }
    };

    const openReportDetail = async () => {
        if (!detail.value.aiReportId) {
            message.warning('暂无关联AI分析报告详情');
            return;
        }
        if (reportDetailLoading.value) return;

        reportDetailLoading.value = true;
        try {
            const res = await getSalesPlanAiReportDetail(detail.value.aiReportId);
            if (res.code === 200) {
                currentReport.value = formatReportDetail({
                    ...(res.data || {}),
                    reportCode: detail.value.aiReportCode || res.data?.reportCode,
                });
                detailDrawerVisible.value = true;
            } else {
                message.error(res.msg || '获取AI分析报告详情失败');
            }
        } catch {
            message.error('获取AI分析报告详情失败');
        } finally {
            reportDetailLoading.value = false;
        }
    };

    const loadApproval = async () => {
        try {
            const approvalDTO = detail.value.approvalDTO || {};
            await loadApprovalLogs(approvalDTO?.id);
        } catch {
            // 审批信息是附加数据，失败时保留主表详情。
        }
    };

    const loadDetail = async () => {
        const id = route.query.id as string;
        if (!id) {
            message.warning('缺少月发货计划ID');
            return;
        }
        try {
            const res = await getSalesPlanMonthlyPlanDetail(id);
            if (res.code === 200) {
                detail.value = formatDetail(res.data || {});
                await loadBasePricingDisplayList();
                await loadApproval();
            }
        } catch {
            message.error('月发货计划详情加载失败，请稍后重试');
        }
    };

    const historyColumns = [
        { key: 'contractCode', width: 150, title: '关联合同编号', render: (row: any) => row.contractCode || '--' },
        { key: 'customerName', width: 210, title: '企业名称', render: (row: any) => row.customerName || '--' },
        {
            key: 'deliveryLocationName',
            width: 180,
            title: '交货地点',
            render: (row: any) => row.deliveryLocationName || '--',
        },
        { key: 'contractDate', width: 150, title: '合同签订日期', render: (row: any) => formatDate(row.contractDate) },
        { key: 'grade', width: 140, title: '合同品位(%)', render: (row: any) => formatNumber(row.grade) },
        { key: 'totalQty', width: 150, title: '合同总数量(吨)', render: (row: any) => formatNumber(row.totalQty) },
        { key: 'shippedQty', width: 190, title: '累计已发货量(吨)', render: (row: any) => formatNumber(row.shippedQty) },
        { key: 'remainQty', width: 170, title: '本月剩余量(吨)', render: (row: any) => formatNumber(row.remainQty) },
        { key: 'remark', width: 180, title: '备注', render: (row: any) => row.remark || '--' },
    ];

    const createChildColumns = () => {
        const columns: any[] = [
            { title: '序号', key: 'index', width: 80, render: (_row: any, index: number) => index + 1 },
            { title: '计划品位(%)', key: 'grade', width: 180, render: (row: any) => formatNumber(row.grade) },
        ];

        columns.push({
            title: '交货地址',
            key: 'deliveryLocationName',
            width: 220,
            render: (row: any) => row.deliveryLocationName || '--',
        });

        columns.push(
            {
                title: '本月新增计划量(吨)',
                key: 'plannedQty',
                width: 220,
                render: (row: any) => formatNumber(row.plannedQty),
            },
            { title: '所属矿种', key: 'oreType', width: 180, render: (row: any) => formatOreType(row.oreType) },
            {
                title: '本月新增合同量(吨)',
                key: 'contractQty',
                width: 220,
                render: (row: any) => formatNumber(row.contractQty),
            }
        );

        return columns;
    };

    const baseAddPlanColumns = [
        {
            type: 'expand',
            width: 40,
            expandable: (row: any) => row.child?.length,
            renderExpand: (row: any) =>
                h('div', { class: 'monthly-add-plan-child' }, [
                    h('div', { class: 'monthly-add-plan-child-title' }, '计划量'),
                    h(NDataTable, {
                        class: 'child-data-table',
                        columns: createChildColumns(),
                        data: row.child,
                        pagination: false,
                        bordered: false,
                        singleLine: false,
                    }),
                ]),
        },
        { title: '序号', key: 'index', width: 60, render: (_row: any, index: number) => index + 1 },
        { title: '需求来源', key: 'demandSource', width: 170, render: (row: any) => row.demandSource || '客户新增需求' },
        { title: '关联新增合同编号', key: 'contractCode', width: 180, render: (row: any) => row.contractCode || '--' },
    ];

    const chemicalAddPlanColumns = [
        ...baseAddPlanColumns,
        {
            title: '子公司贸易商',
            key: 'subsidiaryName',
            width: 200,
            render: (row: any) => row.subsidiaryName || '--',
        },
        { title: '企业名称', key: 'customerName', width: 200, render: (row: any) => row.customerName || '--' },
        { title: '运输方式要求', key: 'transportMode', width: 150, render: (row: any) => formatTransportMode(row.transportMode) },
        {
            title: '合同同步差异原因',
            key: 'syncDiffReason',
            width: 240,
            render: (row: any) => renderClampText(row.syncDiffReason),
        },
        { title: '库存情况(万吨)', key: 'inventoryStatus', width: 160, render: (row: any) => row.inventoryStatus || '--' },
        { title: '生产情况', key: 'productionStatus', width: 140, render: (row: any) => formatProductionStatusText(row.productionStatus) },
        { title: '本月采购计划', key: 'purchasePlan', width: 160, render: (row: any) => row.purchasePlan || '--' },
        {
            title: '合作规模',
            key: 'cooperationScale',
            width: 240,
            render: (row: any) => renderClampText(row.cooperationScaleChem || row.cooperationScaleTrade),
        },
        { title: '重要变化', key: 'importantChanges', width: 240, render: (row: any) => renderClampText(row.importantChanges) },
        { title: '谈判情况', key: 'negotiationStatus', width: 240, render: (row: any) => renderClampText(row.negotiationStatus) },
        { title: '备注', key: 'remark', width: 240, render: (row: any) => renderClampText(row.remark) },
    ];

    const traderAddPlanColumns = [
        ...baseAddPlanColumns,
        {
            title: '子公司贸易商',
            key: 'subsidiaryName',
            width: 200,
            render: (row: any) => row.subsidiaryName || '--',
        },
        { title: '企业名称', key: 'customerName', width: 200, render: (row: any) => row.customerName || '--' },
        { title: '运输方式要求', key: 'transportMode', width: 150, render: (row: any) => formatTransportMode(row.transportMode) },
        {
            title: '合同同步差异原因',
            key: 'syncDiffReason',
            width: 240,
            render: (row: any) => renderClampText(row.syncDiffReason),
        },
        { title: '资金情况(万元)', key: 'fundingStatus', width: 180, render: (row: any) => row.fundingStatus || '--' },
        { title: '下游供应企业', key: 'downstreamSupplyChain', width: 200, render: (row: any) => row.downstreamSupplyChain || '--' },
        { title: '合作规模', key: 'cooperationScaleTrade', width: 240, render: (row: any) => renderClampText(row.cooperationScaleTrade) },
        { title: '重要变化', key: 'importantChanges', width: 240, render: (row: any) => renderClampText(row.importantChanges) },
        { title: '谈判情况', key: 'negotiationStatus', width: 240, render: (row: any) => renderClampText(row.negotiationStatus) },
        { title: '备注', key: 'remark', width: 240, render: (row: any) => renderClampText(row.remark) },
    ];

    const summaryColumns = [
        { key: 'grade', title: '计划品位(%)', width: 180, render: (row: any) => formatNumber(row.grade) },
        { key: 'histRemainQty', title: '历史合同剩余量(吨)', width: 280, render: (row: any) => formatNumber(row.histRemainQty) },
        { key: 'newPlannedQty', title: '本月新增计划量(吨)', width: 280, render: (row: any) => formatNumber(row.newPlannedQty) },
        { key: 'totalPlannedQty', title: '本月计划总量(吨)', width: 240, render: (row: any) => formatNumber(row.totalPlannedQty) },
    ];

    const executionColumns = [
        { key: 'grade', title: '矿石品位(%)', width: 160, render: (row: any) => formatNumber(row.grade) },
        { key: 'totalPlannedQty', title: '计划总数量(吨)', width: 200, render: (row: any) => formatNumber(row.totalPlannedQty) },
        { key: 'actualShippedQty', title: '已实际发货量(吨)', width: 200, render: (row: any) => formatNumber(row.actualShippedQty) },
        { key: 'remainingQty', title: '剩余可拆分量(吨)', width: 200, render: (row: any) => formatNumber(row.remainingQty) },
        {
            key: 'executionRate',
            title: '计划执行率(%)',
            width: 190,
            render: (row: any) => (row.executionRate === '--' ? '--' : `${row.executionRate || '0.00'}%`),
        },
        { key: 'executorName', title: '执行人', width: 180, render: (row: any) => row.executorName || '--' },
    ];

    const historyTableConfig = computed<any>(() => ({
        columns: historyColumns,
        tableList: detail.value.histRemainDetailList || [],
        flexHeight: false,
        bordered: true,
        bottomBordered: true,
        singleLine: false,
        tableBtns: [],
        isShowPagination: false,
        styleOption: { padding: '0px' },
    }));

    const summaryTableConfig = computed<any>(() => ({
        columns: summaryColumns,
        tableList: detail.value.gradeSummaryList || [],
        flexHeight: false,
        bordered: true,
        bottomBordered: true,
        singleLine: false,
        tableBtns: [],
        isShowPagination: false,
        styleOption: { padding: '0px' },
    }));

    const executionTableConfig = computed<any>(() => ({
        columns: executionColumns,
        tableList: detail.value.executionDetailList || [],
        flexHeight: false,
        bordered: true,
        bottomBordered: true,
        singleLine: false,
        tableBtns: [],
        isShowPagination: false,
        styleOption: { padding: '0px' },
    }));

    onMounted(() => {
        loadDetail();
    });

    return {
        detail,
        tabs,
        chemicalAddPlanColumns,
        traderAddPlanColumns,
        historyTableConfig,
        summaryTableConfig,
        executionTableConfig,
        currentReport,
        detailDrawerVisible,
        reportDetailLoading,
        openReportDetail,
        loadDetail,
    };
};
