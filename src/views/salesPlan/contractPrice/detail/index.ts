import { computed, h, ref } from 'vue';
import dayjs from 'dayjs';
import { useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { getContractSalesAdjustRecordByPricingCode, getSalesPlanContractPricingDetail } from '@/api/salesPlan';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';
import { useDictStore } from '@/store/commStore';
import { statusConfig } from '../commonTs/common';

const CUSTOMER_TYPE_CHEMICAL = 'CHEMICAL';
const CUSTOMER_TYPE_TRADER = 'TRADER';

const ATTACHMENT_ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const getFirstValue = (row: any, keys: string[]) =>
    keys.map((key) => row?.[key]).find((value) => !isEmptyValue(value));

const normalizeCustomerType = (value: any) => {
    if (!value) return '';
    const text = String(value).trim().toUpperCase();
    if (['TRADER', 'TRADE', '贸易商'].includes(text)) return CUSTOMER_TYPE_TRADER;
    if (['CHEMICAL', 'CHEMICAL_COMPANY', '化工企业', '化工厂'].includes(text)) return CUSTOMER_TYPE_CHEMICAL;
    return text;
};

const formatMonth = (value: any) => (value ? dayjs(value).format('YYYY-MM') : '--');

const formatDateTime = (value: any, pattern = 'YYYY-MM-DD HH:mm:ss') => {
    if (isEmptyValue(value)) return '--';
    const date = dayjs(value);
    return date.isValid() ? date.format(pattern) : String(value);
};

const formatNumber = (value: any, precision = 2, minimumFractionDigits = 0) => {
    if (isEmptyValue(value)) return '--';
    const numberValue = Number(value);
    return Number.isFinite(numberValue)
        ? numberValue.toLocaleString(undefined, {
              minimumFractionDigits,
              maximumFractionDigits: precision,
          })
        : value;
};

/**
 * 格式化是否拆分合同枚举。
 * @param value 是否拆分合同，1 表示是，2 表示否
 * @returns 对应的中文展示文案
 */
const formatSplitContract = (value: any) => {
    if (isEmptyValue(value)) return '--';
    if (Number(value) === 1) return '是';
    if (Number(value) === 2) return '否';
    return '--';
};

const normalizeAttachmentList = (value: any) => {
    if (!value) return [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return normalizeAttachmentList(parsed);
        } catch {
            return value
                .split(',')
                .map((url) => url.trim())
                .filter(Boolean)
                .map((url) => ({
                    name: decodeURIComponent(url.split('/').pop() || '附件'),
                    url,
                }));
        }
    }
    if (!Array.isArray(value)) return normalizeAttachmentList([value]);
    return value
        .map((item) => {
            if (typeof item === 'string') {
                return {
                    name: decodeURIComponent(item.split('/').pop() || '附件'),
                    url: item,
                };
            }
            const url = getFirstValue(item, ['url', 'fileUrl', 'ossUrl', 'path', 'attachmentUrl']);
            const name = getFirstValue(item, ['name', 'fileName', 'originalName']) || (url ? String(url).split('/').pop() : '附件');
            return {
                ...item,
                name,
                url,
            };
        })
        .filter((item) => item.url);
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

export default () => {
    const message = useMessage();
    const { dictMap } = storeToRefs(useDictStore());
    const show = ref(false);
    const tab = ref('basic');
    const detail = ref<any>({
        attachmentUrls: [],
        pricingDetailList: [],
        adjustHistoryList: [],
        approvalLogs: [],
        associatedApprovals: [],
        commentList: [],
    });

    const tabs = [
        { name: '基础信息', key: 'basic' },
        { name: '调整历史', key: 'adjust' },
        { name: '审批流程', key: 'approval' },
    ];

    const formatOreType = (value: any) => {
        if (isEmptyValue(value)) return '--';
        const option = (dictMap.value?.['矿种'] || dictMap.value?.['矿石种类'] || []).find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) => !isEmptyValue(optionValue) && String(optionValue) === String(value)
            )
        );
        return option?.label || option?.name || value;
    };

    /**
     * 将详情接口的合同定价明细转换为详情表格数据。
     * @param item 合同定价明细接口数据
     * @param index 明细在接口数组中的下标
     * @returns 详情表格使用的明细数据
     */
    const normalizePricingDetail = (item: any, index: number) => ({
        id: item.id,
        contractPricingId: item.contractPricingId,
        contractPricingCode: item.contractPricingCode,
        customerType: normalizeCustomerType(item.customerType),
        customerCode: item.customerCode,
        grade: item.grade,
        deliveryAddress: item.deliveryAddress,
        deliveryLocationName: item.deliveryLocationName,
        oreType: item.oreType,
        plannedWeight: item.plannedWeight,
        actualWeight: item.actualWeight,
        basePrice: item.basePrice,
        traderBillMinPrice: item.traderBillMinPrice,
        traderCashMinPrice: item.traderCashMinPrice,
        taxUnitPrice: item.taxUnitPrice,
        subAmount: item.subAmount,
        sortOrder: item.sortOrder ?? index + 1,
        transportMode: item.transportMode,
    });

    const normalizeAdjustHistory = (list: any[] = []) =>
        (list || []).map((item: any, index: number) => ({
            ...item,
            sortOrder: index + 1,
            adjustTime: getFirstValue(item, ['adjustTime', 'operationTime', 'createdAt', 'createTime', 'updatedAt']),
            adjusterName: getFirstValue(item, ['adjusterName', 'operatorName', 'createdByName', 'creatorName']),
            grade: getFirstValue(item, ['grade', 'oreGrade', 'plannedGrade', 'mineralGrade']),
            adjustField: getFirstValue(item, ['adjustField', 'fieldName', 'fieldLabel', 'changeField']),
            oldValue: getFirstValue(item, ['oldValue', 'originalValue', 'beforeValue']),
            newValue: getFirstValue(item, ['newValue', 'afterValue', 'currentValue']),
            adjustReason: getFirstValue(item, ['adjustReason', 'reason', 'remark', 'remarks']),
        }));

    const normalizeComments = (value: any = []) =>
        parseListValue(value).map((item: any) => ({
            ...item,
            userName: getFirstValue(item, ['userName', 'operatorName', 'createdByName', 'commentatorName']) || '--',
            content: getFirstValue(item, ['content', 'comment', 'remark', 'remarks']) || '--',
            time: formatDateTime(getFirstValue(item, ['time', 'createdAt', 'createTime', 'commentTime'])),
        }));

    /**
     * 按合同定价详情接口的固定字段组装详情展示数据。
     * @param data 合同定价详情接口 data 节点
     * @returns 详情页展示数据
     */
    const formatDetail = (data: any = {}) => {
        const approvalDTO = data.approvalDTO || {};
        const pricingDetailList = (data.contractPricingList || []).map((item: any, index: number) =>
            normalizePricingDetail(item, index)
        );
        return {
            id: data.id,
            contractPricingCode: data.contractPricingCode,
            status: data.status,
            customerId: data.customerId,
            customerCode: data.customerCode,
            customerName: data.customerName,
            customerDisplayName: data.customerName,
            customerType: normalizeCustomerType(data.customerType),
            subsidiaryId: data.subsidiaryId,
            subsidiaryName: data.subsidiaryName,
            monthlyCode: data.monthlyCode,
            monthlyPlanLabel: data.monthlyCode,
            contractCode: data.contractCode,
            planMonth: data.planMonth,
            totalTaxAmount: data.totalTaxAmount,
            isSplit: data.isSplit,
            pricingRemark: data.pricingRemark,
            attachmentUrls: normalizeAttachmentList(data.attachmentUrls),
            applicantId: data.applicantId,
            applicantName: data.applicantName,
            applyDeptId: approvalDTO.applyDeptId,
            applyDeptName: approvalDTO.applyDeptName,
            companyId: approvalDTO.companyId,
            companyName: approvalDTO.companyName,
            instruction: approvalDTO.instruction,
            associatedApprovals: normalizeAssociatedApprovals(approvalDTO.associatedApproval),
            pricingDetailList,
            adjustHistoryList: [],
            approvalLogs: [],
            commentList: normalizeComments(approvalDTO.commentList || []),
            approvalDTO,
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

    const loadApproval = async () => {
        const approvalDTO = detail.value.approvalDTO || {};
        await loadApprovalLogs(approvalDTO?.id);
    };

    const loadAdjustHistory = async () => {
        detail.value.adjustHistoryList = [];
        const pricingCode = detail.value.contractPricingCode;
        if (!pricingCode) return;
        try {
            const res = await getContractSalesAdjustRecordByPricingCode(pricingCode);
            if (res.code === 200) {
                detail.value.adjustHistoryList = normalizeAdjustHistory(res.data || []);
            }
        } catch {
            detail.value.adjustHistoryList = [];
        }
    };

    const statusInfo = computed(() => statusConfig.find((item) => item.value === detail.value.status));
    const statusName = computed(() => statusInfo.value?.label || '--');
    const statusTagStyle = computed(() => ({
        color: statusInfo.value?.color || '#999999',
        backgroundColor: statusInfo.value?.backgroudColor || '#f2f3f5',
        bdColor: statusInfo.value?.bdColor ,
    }));

    const chemicalPricingDetailList = computed(() =>
        detail.value.customerType === CUSTOMER_TYPE_CHEMICAL ? detail.value.pricingDetailList || [] : []
    );

    const traderPricingDetailList = computed(() =>
        detail.value.customerType === CUSTOMER_TYPE_TRADER ? detail.value.pricingDetailList || [] : []
    );

    const showChemicalPricingDetail = computed(() => chemicalPricingDetailList.value.length > 0);

    const showTraderPricingDetail = computed(() => traderPricingDetailList.value.length > 0);

    const text = (value: any) => (isEmptyValue(value) ? '--' : value);

    const formatCommentTime = (item: any) => text(item?.time || formatDateTime(getFirstValue(item, ['createdAt', 'createTime', 'commentTime'])));

    const createTableConfig = (columns: any[], tableList: any[]) => ({
        columns,
        tableList,
        tableBtns: [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        isShowPagination: false,
        styleOption: {
            padding: '0px',
        },
    });

    const chemicalPricingDetailConfig = computed(() =>
        createTableConfig(
            [
                { key: 'grade', title: '矿石品位(%)', width: 110, render: (row: any) => formatNumber(row.grade) },
                {
                    key: 'deliveryLocationName',
                    title: '交货地址',
                    width: 128,
                    render: (row: any) => text(row.deliveryLocationName),
                },
                { key: 'oreType', title: '矿石种类', width: 130, render: (row: any) => formatOreType(row.oreType) },
                { key: 'plannedWeight', title: '计划重量(吨)', width: 130, render: (row: any) => formatNumber(row.plannedWeight) },
                { key: 'actualWeight', title: '实际重量(吨)', width: 130, render: (row: any) => formatNumber(row.actualWeight) },
                { key: 'basePrice', title: '基准定价', width: 120, render: (row: any) => formatNumber(row.basePrice) },
                { key: 'taxUnitPrice', title: '含税单价(元/吨)', width: 135, render: (row: any) => formatNumber(row.taxUnitPrice) },
                { key: 'subAmount', title: '分项金额(万元)', width: 130, render: (row: any) => formatNumber(row.subAmount) },
            ],
            chemicalPricingDetailList.value
        )
    );

    const traderPricingDetailConfig = computed(() =>
        createTableConfig(
            [
                { key: 'grade', title: '矿石品位(%)', width: 96, render: (row: any) => formatNumber(row.grade) },
                {
                    key: 'deliveryLocationName',
                    title: '交货地址',
                    width: 128,
                    render: (row: any) => text(row.deliveryLocationName),
                },
                { key: 'oreType', title: '矿石种类', width: 108, render: (row: any) => formatOreType(row.oreType) },
                { key: 'plannedWeight', title: '计划重量(吨)', width: 112, render: (row: any) => formatNumber(row.plannedWeight) },
                { key: 'actualWeight', title: '实际重量(吨)', width: 112, render: (row: any) => formatNumber(row.actualWeight) },
                {
                    key: 'traderBillMinPrice',
                    title: '贸易商汇票最低报价(元/吨)',
                    width: 170,
                    render: (row: any) => formatNumber(row.traderBillMinPrice),
                },
                {
                    key: 'traderCashMinPrice',
                    title: '贸易商现金最低报价(元/吨)',
                    width: 170,
                    render: (row: any) => formatNumber(row.traderCashMinPrice),
                },
                { key: 'taxUnitPrice', title: '含税单价(元/吨)', width: 125, render: (row: any) => formatNumber(row.taxUnitPrice) },
                { key: 'subAmount', title: '分项金额(万元)', width: 125, render: (row: any) => formatNumber(row.subAmount) },
            ],
            traderPricingDetailList.value
        )
    );

    const adjustHistoryConfig = computed(() =>
        createTableConfig(
            [
                { key: 'adjustTime', title: '调整时间', width: 165, render: (row: any) => formatDateTime(row.adjustTime) },
                { key: 'adjusterName', title: '调整人', width: 110, render: (row: any) => text(row.adjusterName) },
                { key: 'grade', title: '矿石品位(%)', width: 110, render: (row: any) => formatNumber(row.grade) },
                { key: 'adjustField', title: '调整字段', width: 150, render: (row: any) => text(row.adjustField) },
                { key: 'oldValue', title: '原数值', width: 130, render: (row: any) => text(row.oldValue) },
                { key: 'newValue', title: '新数值', width: 130, render: (row: any) => text(row.newValue) },
                {
                    key: 'adjustReason',
                    title: '调整原因',
                    width: 260,
                    render: (row: any) =>
                        h(
                            'span',
                            {
                                title: text(row.adjustReason),
                            },
                            text(row.adjustReason)
                        ),
                },
            ],
            detail.value.adjustHistoryList || []
        )
    );

    const showDialog = async (id: number | string) => {
        if (!id) {
            message.warning('缺少详情ID');
            return;
        }
        show.value = true;
        tab.value = 'basic';
        try {
            const res = await getSalesPlanContractPricingDetail(id);
            if (res.code === 200) {
                detail.value = formatDetail(res.data || {});
                await Promise.all([loadAdjustHistory(), loadApproval()]);
            }
        } catch {
            message.error('合同定价详情加载失败，请稍后重试');
        }
    };

    return {
        show,
        tab,
        tabs,
        detail,
        statusName,
        statusTagStyle,
        ATTACHMENT_ACCEPT,
        chemicalPricingDetailConfig,
        traderPricingDetailConfig,
        showChemicalPricingDetail,
        showTraderPricingDetail,
        adjustHistoryConfig,
        chemicalPricingDetailList,
        traderPricingDetailList,
        showDialog,
        text,
        formatMonth,
        formatNumber,
        formatSplitContract,
        formatCommentTime,
    };
};
