import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import dayjs from 'dayjs';
import { getSalesPlanBasePricingDetail } from '@/api/salesPlan';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';
import { statusConfig } from '../../commonTs/conmon';

const isEmptyValue = (value: any) => value === null || value === undefined || value === '';

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

const getFileNameFromUrl = (url: string) => {
    const cleanUrl = String(url || '').split('?')[0];
    return decodeURIComponent(cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1)) || '附件';
};

const normalizeFiles = (value: any) => {
    return parseListValue(value)
        .map((item: any, index: number) => {
            if (typeof item === 'string') {
                return {
                    name: getFileNameFromUrl(item) || `附件${index + 1}`,
                    url: item,
                };
            }
            const url = item.url || item.fileUrl || item.ossUrl || item.path || item.filePath || item.attachmentUrl || '';
            return {
                ...item,
                name: item.name || item.fileName || item.originalName || getFileNameFromUrl(url) || `附件${index + 1}`,
                url,
            };
        })
        .filter((item: any) => item.url);
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
    const show = ref<boolean>(false);

    const detail = ref<any>({
        extTraderDTO: {},
        logistics: [],
        logisticsDTOList: [],
        refDTOList: [],
        traderItemDTOList: [],
        attendees: [],
        approvalLogs: [],
        associatedApprovals: [],
        attachments: [],
        commentList: [],
    });

    const tabs = ref<any[]>([
        { name: '基础信息', key: 1 },
        { name: '审批流程', key: 2 },
    ]);
    const tab = ref<any>(1);

    const statusName = computed(() => {
        return statusConfig.find((item: any) => item.value === detail.value.status)?.label || '--';
    });

    /**
     * 详情头部状态标签样式。
     */
    const statusStyle = computed(() => {
        const statusItem = statusConfig.find((item: any) => item.value === detail.value.status);
        return {
            color: statusItem?.color || '#999999',
            backgroundColor: statusItem?.backgroudColor || '#f2f3f5',
            bdColor: statusItem?.bdColor
        };
    });

    /**
     * 格式化贸易商基准定价详情数据。
     * 主表字段只取详情根节点，审批字段只取 approvalDTO，避免同名字段互相覆盖。
     * @param data 详情接口 res.data
     * @returns 详情展示数据
     */
    const formatDetail = (data: any) => {
        const approvalDTO = data.approvalDTO || {};
        return {
            id: data.id,
            createdAt: data.createdAt,
            createdByName: data.createdByName,
            pricingCode: data.pricingCode,
            pricingMonth: data.pricingMonth ? dayjs(data.pricingMonth).format('YYYY-MM') : '',
            status: data.status,
            customerType: data.customerType,
            projectName: data.projectName,
            attendees: Array.isArray(data?.attendees)
                ? data.attendees.map((item: any) => item.username).filter(Boolean).join('、')
                : data.attendees,
            extTraderDTO: data.extTraderDTO || {},
            logistics: normalizeFiles(data.logistics),
            refDTOList: data.refDTOList || [],
            traderItemDTOList: data.traderItemDTOList || [],
            applicantName: data.applicantName,
            applyDeptName: approvalDTO.applyDeptName,
            companyName: approvalDTO.companyName,
            approvalRemark: approvalDTO.remark,
            instruction: data.instruction,
            attachments: normalizeFiles(approvalDTO.approveUrl),
            associatedApprovals: normalizeAssociatedApprovals(approvalDTO.associatedApproval),
            approvalLogs: [],
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

    /**
     * 打开详情弹窗并拉取详情。
     */
    const showDialog = async (id: number) => {
        show.value = true;
        tab.value = 1;
        try {
            const res = await getSalesPlanBasePricingDetail(id);
            if (res.code === 200) {
                detail.value = formatDetail(res.data);
                await loadApprovalLogs(detail.value.approvalDTO?.id);
            }
        } catch {
            message.error('详情加载失败，请稍后重试');
        }
    };

    return {
        show,
        detail,
        tabs,
        tab,
        statusName,
        statusStyle,
        showDialog,
    };
};
