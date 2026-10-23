import { getContractFramework, getContractSalesListByFrameworkCode } from '@/api/contractManage';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMessage } from 'naive-ui';
import { FRAMEWORK_DETAIL_TABS } from '../commonTs/common';

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const getFirstValue = (row: any, keys: string[]) =>
    keys.map((key) => row?.[key]).find((value) => !isEmptyValue(value));

const formatDate = (value: any, pattern = 'YYYY-MM-DD') => {
    if (!value) return '';
    const date = dayjs(value);
    return date.isValid() ? date.format(pattern) : value;
};

const parseList = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parseList(parsed);
        } catch {
            return value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }
    return [value];
};

const normalizeFileList = (value: any) => {
    return parseList(value)
        .map((item: any) => {
            if (typeof item === 'string') {
                return {
                    fileName: decodeURIComponent(item.split('/').pop() || '附件'),
                    fileUrl: item,
                };
            }
            const fileUrl = getFirstValue(item, ['fileUrl', 'url', 'ossUrl', 'path', 'attachmentUrl']);
            const fileName =
                getFirstValue(item, ['fileName', 'name', 'originalName']) ||
                (fileUrl ? decodeURIComponent(String(fileUrl).split('/').pop() || '附件') : '附件');
            return {
                ...item,
                fileName,
                fileUrl,
            };
        })
        .filter((item: any) => item.fileUrl);
};

const normalizeComments = (list: any[] = []) => {
    return (list || []).map((item: any) => ({
        ...item,
        userName: getFirstValue(item, ['userName', 'createdByName', 'operatorName', 'commentatorName']) || '--',
        content: getFirstValue(item, ['content', 'comment', 'remark', 'remarks']) || '--',
        time: formatDate(getFirstValue(item, ['time', 'createdAt', 'createTime', 'commentTime']), 'YYYY-MM-DD HH:mm:ss'),
    }));
};

const normalizeApprovalList = (value: any) => {
    return parseList(value)
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
            approvalName: item.approvalName,
            instanceCode: item.instanceCode,
        }))
        .filter((item: any) => item.approvalName && item.instanceCode);
};

const normalizeSalesContractList = (list: any) => {
    return parseList(list).map((item: any, index: number) => ({
        ...item,
        id: item.id || item.contractSalesId || item.salesContractId || index + 1,
        contractSalesId: getFirstValue(item, ['id', 'contractSalesId', 'salesContractId']),
        contractCode: getFirstValue(item, ['contractCode', 'contractSalesCode', 'salesContractCode', 'contractSalesId']),
        customerName: getFirstValue(item, ['customerName', 'enterpriseName', 'companyName']),
        month: getFirstValue(item, ['month', 'shipmentMonth', 'correspondingMonth', 'monthlyMonth']),
        contractAmount: getFirstValue(item, ['contractAmount', 'totalAmount', 'totalTaxAmount']),
        paidAmount: getFirstValue(item, ['receivedAmount']),
        fileUrlList: normalizeFileList(item.fileUrlList || item.fileUrl || item.contractFileUrlObject || item.contractFileUrl),
        child: parseList(item.contractSalesDetailRespDTOList).map((child: any, childIndex: number) => ({
            ...child,
            id: child.id || `${index + 1}-${childIndex + 1}`,
            grade: child.grade,
            contractQty: child.contractQuantity,
            unitPrice: child.contractPrice,
            shippedQty: child.shippedQuantity,
            paidQty: child.deliveredQuantity,
        })),
    }));
};

const normalizeDetail = (data: any) => {
    return {
        ...data,
        signDate: formatDate(data?.signDate),
        startDate: formatDate(data?.startDate),
        endDate: formatDate(data?.endDate),
        contractFileUrlObject: normalizeFileList(data?.contractFileUrlObject || data?.contractFileUrl),
        contractFinalFileUrlObject: normalizeFileList(data?.contractFinalFileUrlObject || data?.contractFinalFileUrl),
        scannedCopyFileUrlList: normalizeFileList(data?.scannedCopyFileUrlList || data?.scannedCopyFileUrl),
        fileUrlList: normalizeFileList(data?.fileUrlList || data?.fileUrl),
        associatedApprovalObjects: normalizeApprovalList(data?.associatedApprovalObjects),
        approvalLogs: [],
        commentList: normalizeComments(data?.commentList || data?.comments || data?.remarkList || []),
        salesContractList: [],
    };
};

export default () => {
    const route = useRoute();
    const message = useMessage();
    const detail = ref<any>({
        contractFileUrlObject: [],
        contractFinalFileUrlObject: [],
        scannedCopyFileUrlList: [],
        fileUrlList: [],
        associatedApprovalObjects: [],
        approvalLogs: [],
        commentList: [],
        salesContractList: [],
    });

    const tabs = FRAMEWORK_DETAIL_TABS;

    const loadApprovalLogs = async (approvalId: any) => {
        detail.value.approvalLogs = [];
        if (!approvalId) return;
        try {
            const res = await getCommonApprovalLogsNewMap(approvalId);
            if (res.code === 200) {
                const userNameMap = await getApprovalUserNameMap();
                detail.value.approvalLogs = normalizeApprovalDetailsNewMap(res.data || [], userNameMap);
            }
        } catch {
            // 审批日志是详情补充信息，失败时保留主表详情。
        }
    };

    const loadSalesContractList = async (contractCode: any) => {
        detail.value.salesContractList = [];
        if (!contractCode) return;
        const res = await getContractSalesListByFrameworkCode(contractCode);
        if (res.code === 200) {
            detail.value.salesContractList = normalizeSalesContractList(res.data || []);
        }
    };

    const getDetail = async () => {
        const id = route.query.id as string;
        if (!id) {
            message.warning('缺少框架合同ID');
            return;
        }
        const res = await getContractFramework(Number(id));
        if (res.code === 200) {
            detail.value = normalizeDetail(res.data || {});
            await loadSalesContractList(detail.value.contractCode);
            await loadApprovalLogs(detail.value.approvalId);
        }
    };

    onMounted(() => {
        getDetail();
    });

    return {
        detail,
        tabs,
        getDetail,
    };
};
