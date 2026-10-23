import { computed, h, ref, resolveComponent } from 'vue';
import { useMessage } from 'naive-ui';
import dayjs from 'dayjs';
import { getSalesPlanBasePricingDetail } from '@/api/salesPlan';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';
import { ATTACHMENT_ACCEPT, FIRM_PRICE_ATTACHMENT_LIMIT, LOGISTICS_ATTACHMENT_ACCEPT, statusConfig } from '../commonTs/conmon';

const formatDate = (value: any, pattern = 'YYYY-MM-DD HH:mm:ss') => {
    if (!value && value !== 0) return '--';
    const date = dayjs(value);
    return date.isValid() ? date.format(pattern) : String(value);
};

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
    const cleanUrl = url.split('?')[0];
    return decodeURIComponent(cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1)) || '附件';
};

const normalizeFiles = (value: any) => {
    return parseListValue(value).map((item: any, index: number) => {
        if (typeof item === 'string') {
            return {
                name: getFileNameFromUrl(item) || `附件${index + 1}`,
                url: item,
            };
        }
        return {
            ...item,
            name: item.name || item.fileName || getFileNameFromUrl(item.url || item.fileUrl || '') || `附件${index + 1}`,
            url: item.url || item.fileUrl || item.path || item.filePath || '',
        };
    });
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
    const show = ref(false);
    const tab = ref(1);
    const detail = ref<any>({
        extChemicalDTO: {},
        logistics: [],
        logisticsDTOList: [],
        refDTOList: [],
        itemDTOList: [],
        approvalLogs: [],
        associatedApprovals: [],
        attachments: [],
        commentList: [],
    });

    const tabs = [
        { name: '基础信息', key: 1 },
        { name: '审批流程', key: 2 },
    ];

    const statusInfo = computed(() => {
        return statusConfig.find((item) => item.value === detail.value.status);
    });

    const statusName = computed(() => statusInfo.value?.label || '--');

    const statusTagStyle = computed(() => ({
        color: statusInfo.value?.color || '#999999',
        backgroundColor: statusInfo.value?.backgroudColor || '#f2f3f5',
        bdColor: statusInfo.value?.bdColor
    }));

    const rightContentStyle = {
        padding: '24px',
    };

    /**
     * 格式化化工企业基准定价详情。
     * 主表字段只取详情根节点，审批字段只取 approvalDTO，避免同名字段相互覆盖。
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
            pricingMonth: data.pricingMonth ? dayjs(data.pricingMonth).format('YYYY-MM') : data.pricingMonth,
            status: data.status,
            customerType: data.customerType,
            customerId: data.customerId,
            customerCode: data.customerCode,
            customerName: data.customerName,
            subsidiaryId: data.subsidiaryId,
            subsidiaryName: data.subsidiaryName,
            projectName: data.projectName,
            attendees: data.attendees || [],
            totalAmount: data.totalAmount,
            extChemicalDTO: data.extChemicalDTO || {},
            logistics: normalizeFiles(data.logistics),
            refDTOList: data.refDTOList || [],
            itemDTOList: data.itemDTOList || [],
            applicantName: data.applicantName,
            applyDeptName: approvalDTO.applyDeptName,
            companyName: approvalDTO.companyName,
            isTwoApprove: approvalDTO.isTwoApprove,
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
     * 打开详情抽屉并请求详情数据
     */
    const showDialog = async (id: number | string) => {
        if (!id) {
            message.warning('缺少详情ID');
            return;
        }
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

    /**
     * 格式化空文本
     */
    const text = (value: any) => {
        if (value === null || value === undefined || value === '') return '--';
        return value;
    };

    /**
     * 格式化人员数组
     */
    const formatAttendees = (attendees: any[]) => {
        if (!Array.isArray(attendees) || attendees.length === 0) return '--';
        return attendees.map((item) => item.username).filter(Boolean).join('、') || '--';
    };

    const formatCommentTime = (item: any) => {
        const time = item?.time || item?.createdAt || item?.createTime || item?.actionTime;
        return text(formatDate(time));
    };

    /**
     * 格式化数字
     */
    const numberText = (value: any) => {
        if (value === null || value === undefined || value === '') return '--';
        return value;
    };

    const logisticsColumns = computed(() => [
        { key: 'routeInfo', title: '路线', width: 200 },
        { key: 'freightFee', title: '运费(元/吨)', width: 160, render: (row: any) => numberText(row.freightFee) },
        {
            key: 'loadingUnloadingFee',
            title: '装卸费(元/吨)',
            width: 160,
            render: (row: any) => numberText(row.loadingUnloadingFee),
        },
        { key: 'transferFee', title: '翻坝费(元/吨)', width: 160, render: (row: any) => numberText(row.transferFee) },
        { key: 'terminalFee', title: '码头费(元/吨)', width: 160, render: (row: any) => numberText(row.terminalFee) },
        { key: 'totalFee', title: '合计(元/吨)', width: 160, render: (row: any) => numberText(row.totalFee) },
    ]);

    const marketColumns = computed(() => [
        { key: 'refCompanyName', title: '化工企业名称', width: 200 },
        { key: 'grade', title: '品位(%)', width: 120, render: (row: any) => numberText(row.grade) },
        {
            key: 'deliveryLocationName',
            title: '交货地点',
            width: 220,
            render: (row: any) => text(row.deliveryLocationName),
        },
        { key: 'currentPrice', title: '当前采购价(元/吨)', width: 180, render: (row: any) => numberText(row.currentPrice) },
        { key: 'remark', title: '备注', width: 220 },
        {
            key: 'attachmentUrls',
            title: '附件',
            width: 120,
            render: (row: any) => {
                const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                if (!row.attachmentUrls?.length) return '--';
                return h(MxWebFileUpload, {
                    modelValue: row.attachmentUrls || [],
                    limit: 9,
                    onlyShow: true,
                    forceAppSize: true,
                    appSizeWidth: 80,
                });
            },
        },
    ]);

    const itemColumns = computed(() => [
        { key: 'grade', title: '矿石品位(%)', width: 180, render: (row: any) => numberText(row.grade) },
        { key: 'planWeight', title: '计划重量(吨)', width: 180, render: (row: any) => numberText(row.planWeight) },
        {
            key: 'deliveryLocationName',
            title: '交货地址',
            width: 240,
            render: (row: any) => text(row.deliveryLocationName),
        },
        {
            key: 'taxIncludedPrice',
            title: '含税单价(元/吨)',
            width: 200,
            render: (row: any) => numberText(row.taxIncludedPrice),
        },
        { key: 'pitPrice', title: '坑口价(元/吨)', width: 180, render: (row: any) => numberText(row.pitPrice) },
    ]);

    return {
        show,
        detail,
        tabs,
        tab,
        statusName,
        statusTagStyle,
        rightContentStyle,
        // logisticsColumns,
        marketColumns,
        itemColumns,
        attachmentAccept: ATTACHMENT_ACCEPT,
        logisticsAttachmentAccept: LOGISTICS_ATTACHMENT_ACCEPT,
        attachmentLimit: FIRM_PRICE_ATTACHMENT_LIMIT,
        showDialog,
        text,
        formatAttendees,
        formatCommentTime,
    };
};
