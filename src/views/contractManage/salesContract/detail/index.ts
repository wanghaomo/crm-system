import { getContractFrameworkPage, getContractSaleDetail } from '@/api/contractManage';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getSalesPlanContractPricingPage, getSalesPlanMonthlyPlanPage } from '@/api/salesPlan';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';
import dayjs from 'dayjs';
import { useMessage } from 'naive-ui';
import { onMounted, ref, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    SALES_CONTRACT_DATE_FORMAT,
    SALES_CONTRACT_DATE_TIME_FORMAT,
    SALES_CONTRACT_MONTH_FORMAT,
    SALES_CONTRACT_ROUTE,
} from '../commonTs/conmon';

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const text = (value: any) => (isEmptyValue(value) ? '--' : value);

const formatDate = (value: any, pattern = SALES_CONTRACT_DATE_FORMAT) => {
    if (!value) return '';
    const date = dayjs(value);
    return date.isValid() ? date.format(pattern) : String(value);
};

const formatDateTime = (value: any) => formatDate(value, SALES_CONTRACT_DATE_TIME_FORMAT);

const formatMonth = (value: any) => {
    if (!value) return '';
    const date = dayjs(value);
    return date.isValid() ? date.format(SALES_CONTRACT_MONTH_FORMAT) : String(value);
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

const normalizeApprovalList = (value: any) => {
    return parseList(value)
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
            approvalName: item.approvalName,
            instanceCode: item.instanceCode,
        }))
        .filter((item: any) => item.approvalName && item.instanceCode);
};

const normalizeComments = (value: any) => {
    return parseList(value).map((item: any) => ({
        ...item,
        userName: item?.userName || item?.createdByName || item?.operatorName || '--',
        content: item?.content || item?.comment || item?.remark || item?.remarks || '--',
        time: formatDateTime(item?.time || item?.createdAt || item?.createTime || item?.commentTime),
    }));
};

const normalizeDetailRows = (value: any) => {
    return parseList(value).map((item: any, index: number) => ({
        ...item,
        id: item?.id || index + 1,
        deliveryLocationName: item?.deliveryLocationName,
        startDate: formatDate(item?.startDate),
        endDate: formatDate(item?.endDate),
        deliveryPeriod: item?.startDate || item?.endDate ? `${formatDate(item?.startDate)}至${formatDate(item?.endDate)}` : '',
    }));
};

const normalizeDetail = (data: any = {}) => {
    return {
        ...data,
        contractSalesId: data.contractCode || data.contractSalesId,
        shipmentMonth: formatMonth(data.shipmentMonth),
        createdAt: formatDateTime(data.createdAt),
        signDate: formatDate(data.signDate),
        startDate: formatDate(data.startDate),
        endDate: formatDate(data.endDate),
        contractPricingDetailGradeDTOS: normalizeDetailRows(data.contractPricingDetailGradeDTOS),
        contractFileUrlObject: data.contractFileUrlObject || [],
        contractFinalFileUrlObject: data.contractFinalFileUrlObject || [],
        scannedCopyFileUrlList: data.scannedCopyFileUrlList || [],
        fileUrlList: data.fileUrlList || [],
        associatedApprovalObjects: normalizeApprovalList(data.associatedApprovalObjects),
        approvalLogs: [],
        commentList: normalizeComments(data.commentList || data.comments || data.remarkList),
    };
};

interface DetailDrawerRefs {
    pricingDetailRef?: Ref<any>;
}

export default (drawerRefs: DetailDrawerRefs = {}) => {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const detail = ref<any>({
        contractPricingDetailGradeDTOS: [],
        contractFileUrlObject: [],
        contractFinalFileUrlObject: [],
        scannedCopyFileUrlList: [],
        fileUrlList: [],
        associatedApprovalObjects: [],
        approvalLogs: [],
        commentList: [],
    });
    const loading = ref(false);

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

    const getDetail = async () => {
        const id = route.query.id as string;
        if (!id) {
            message.warning('缺少销售合同ID');
            return;
        }
        loading.value = true;
        try {
            const res = await getContractSaleDetail(id);
            if (res.code === 200) {
                detail.value = normalizeDetail(res.data || {});
                await loadApprovalLogs(detail.value.approvalId);
            }
        } catch {
            message.error('销售合同详情加载失败，请稍后重试');
        } finally {
            loading.value = false;
        }
    };

    onMounted(() => {
        getDetail();
    });

    const getRecordId = (records: any[], code: any, keys: string[]) => {
        const matched = records.find((item) => keys.some((key) => String(item?.[key] || '') === String(code || '')));
        return matched?.id || records[0]?.id;
    };

    const openPricingDrawer = (drawerRef: Ref<any> | undefined, id: any) => {
        if (!id) return false;
        if (!drawerRef?.value?.showDialog) return false;
        drawerRef.value.showDialog(id);
        return true;
    };

    const openPricingDetail = async () => {
        const pricingId = detail.value.pricingId || detail.value.contractPricingId;
        if (pricingId) {
            if (!openPricingDrawer(drawerRefs.pricingDetailRef, pricingId)) {
                message.warning('未找到关联定价单详情');
            }
            return;
        }
        if (!detail.value.pricingCode) return;
        const res = await getSalesPlanContractPricingPage({
            current: 1,
            size: 1,
            contractPricingCode: detail.value.pricingCode,
        });
        const id = getRecordId(res.data?.records || [], detail.value.pricingCode, [
            'contractPricingCode',
            'pricingCode',
            'pricingNo',
        ]);
        if (id) {
            if (!openPricingDrawer(drawerRefs.pricingDetailRef, id)) {
                message.warning('未找到关联定价单详情');
            }
            return;
        }
        message.warning('未找到关联定价单详情');
    };

    const openFrameworkDetail = async () => {
        const frameworkId = detail.value.frameworkId || detail.value.contractFrameworkId;
        if (frameworkId) {
            router.push({ path: SALES_CONTRACT_ROUTE.FRAMEWORK_DETAIL, query: { id: frameworkId } });
            return;
        }
        if (!detail.value.frameworkCode) return;
        const res = await getContractFrameworkPage({
            current: 1,
            size: 1,
            contractCode: detail.value.frameworkCode,
        });
        const id = getRecordId(res.data?.records || [], detail.value.frameworkCode, [
            'contractCode',
            'frameworkCode',
            'frameworkContractCode',
        ]);
        if (id) {
            router.push({ path: SALES_CONTRACT_ROUTE.FRAMEWORK_DETAIL, query: { id } });
            return;
        }
        message.warning('未找到关联框架合同详情');
    };

    const openMonthlyPlanDetail = async () => {
        const monthlyPlanId = detail.value.monthlyPlanId || detail.value.monthlyDispatchId;
        if (monthlyPlanId) {
            router.push({ path: SALES_CONTRACT_ROUTE.MONTHLY_PLAN_DETAIL, query: { id: monthlyPlanId } });
            return;
        }
        if (!detail.value.monthlyPlanCode) return;
        const res = await getSalesPlanMonthlyPlanPage({
            current: 1,
            size: 1,
            monthlyCode: detail.value.monthlyPlanCode,
        });
        const id = getRecordId(res.data?.records || [], detail.value.monthlyPlanCode, [
            'monthlyCode',
            'monthlyPlanCode',
            'planCode',
            'dispatchCode',
            'monthlyDispatchCode',
        ]);
        if (id) {
            router.push({ path: SALES_CONTRACT_ROUTE.MONTHLY_PLAN_DETAIL, query: { id } });
            return;
        }
        message.warning('未找到关联月发货计划详情');
    };

    return {
        detail,
        loading,
        getDetail,
        openPricingDetail,
        openFrameworkDetail,
        openMonthlyPlanDetail,
        text,
        formatDate,
        formatDateTime,
        formatMonth,
    };
};
