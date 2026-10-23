import { computed, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { deleteSalesPlanContractPricing, getSalesPlanContractPricingPage } from '@/api/salesPlan';
import { getCustomerBaseDropdownApi } from '@/api/customerManage';
import dayjs from 'dayjs';
import { useMessage } from 'naive-ui';
import {
    PRICING_STATUS_APPROVAL_GEN_FAILED,
    PRICING_STATUS_DRAFT,
    statusConfig,
} from './commonTs/common';
import { checkPermission } from '@/utils/comm';

const TABLE_ACTION_COLOR = 'var(--base-color)';
const TABLE_DANGER_COLOR = 'var(--base-color-red)';

const formatMonth = (value: any) => (value ? dayjs(value).format('YYYY-MM') : '--');
const formatAmount = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const numberValue = Number(value);
    return Number.isFinite(numberValue)
        ? numberValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value;
};

/**
 * 按分页接口声明的合同定价字段组装列表记录。
 * @param item 合同定价分页记录
 * @returns 合同定价列表记录
 */
const formatContractPricingRecord = (item: any) => ({
    id: item.id,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    createdByName: item.createdByName,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
    updatedByName: item.updatedByName,
    contractPricingCode: item.contractPricingCode,
    customerId: item.customerId,
    customerType: item.customerType,
    totalTaxAmount: item.totalTaxAmount,
    status: item.status,
    pricingRemark: item.pricingRemark,
    attachmentUrls: item.attachmentUrls,
    applicantId: item.applicantId,
    applicantName: item.applicantName,
    monthlyCode: item.monthlyCode,
    contractCode: item.contractCode,
    planMonth: item.planMonth,
    customerCode: item.customerCode,
    customerName: item.customerName,
    contractPricingList: item.contractPricingList,
    approvalDTO: item.approvalDTO,
    itemIds: item.itemIds,
    subsidiaryId: item.subsidiaryId,
    subsidiaryName: item.subsidiaryName,
    isSplit: item.isSplit,
});

export default () => {
    const router = useRouter();
    const message = useMessage();
    const detailRef = ref<any>(null);

    const createEvt = () => {
        router.push({ path: '/salesPlan/contractPrice/add' });
    };

    const customerOptions = ref<any[]>([]);
    const queryParams = ref<any>({});

    const renderStatus = (status: string) => {
        const item = statusConfig.find((it) => it.value === status);
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
                        backgroundColor: item?.listColor || '#c9cdd4',
                        flexShrink: 0,
                    },
                }),
                h('span', {}, item?.label || '--'),
            ]
        );
    };

    const canEdit = (status: string) =>
        status === PRICING_STATUS_DRAFT || status === PRICING_STATUS_APPROVAL_GEN_FAILED;

    const tableConfig = ref<any>({
        columns: [
            { key: 'contractPricingCode', title: '定价单号', width: 180 },
            { key: 'planMonth', title: '发货月份', width: 120, render: (row: any) => formatMonth(row.planMonth) },
            {
                key: 'status',
                title: '单据状态',
                width: 130,
                render: (row: any) => renderStatus(row.status),
            },
            { key: 'customerName', title: '企业名称', width: 180, render: (row: any) => row.customerName || '--' },
            { key: 'applicantName', title: '申请人', width: 120, render: (row: any) => row.applicantName || '--' },
            {
                key: 'totalTaxAmount',
                title: '含税总金额(万元)',
                width: 160,
                render: (row: any) => formatAmount(row.totalTaxAmount),
            },
            {
                key: 'contractCode',
                title: '关联销售合同编号',
                width: 180,
                render: (row: any) => row.contractCode || '--',
            },
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '详情',
                btnColor: TABLE_ACTION_COLOR,
                // isBtnHide: (row: any) => canViewDetail(row.status),
                clickTableBtns: (row: any) => {
                    detailRef.value?.showDialog(row.id);
                },
            },
            {
                btnName: '编辑',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => canEdit(row.status) && checkPermission(['crm:contract_price:edit']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/salesPlan/contractPrice/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '删除',
                btnColor: TABLE_DANGER_COLOR,
                isBtnHide: (row: any) => row.status === PRICING_STATUS_DRAFT && checkPermission(['crm:contract_price:delete']),
                delConfig: {
                    title: '删除合同定价',
                    content: '该定价申请删除后不可恢复，请确认是否删除？',
                    positiveText: '确认删除',
                },
                clickTableBtns: async (row: any) => {
                    try {
                        const res = await deleteSalesPlanContractPricing(row.id);
                        if (res.code === 200) await getList();
                    } catch {
                        message.error('删除合同定价失败，请稍后重试');
                    }
                },
            },
        ],
        isShowPagination: true,
        paginationConfig: {
            pagConfig: {
                total: 0,
                pageSize: 20,
                page: 1,
            },
            showHeadBorder: true,
            showTotal: true,
            onPageChange: (page: any) => {
                if (tableConfig.value?.paginationConfig?.pagConfig) {
                    tableConfig.value.paginationConfig.pagConfig.page = page;
                }
                getList();
            },
        },
        styleOption: {
            padding: '16px',
            paddingBottom: '0px',
        },
    });

    const queryConfiguration = computed(() => {
        return [
            {
                value: 'contractPricingCode',
                defaultValue: '',
                label: '定价单号',
                type: 'input',
                placeholder: '定价单号',
            },
            {
                value: 'customerName',
                defaultValue: null,
                label: '企业名称',
                type: 'select',
                placeholder: '企业名称',
                options: customerOptions.value,
            },
            {
                value: 'status',
                defaultValue: '',
                label: '状态',
                type: 'select',
                placeholder: '状态',
                options: statusConfig,
            },
            {
                value: 'planMonth',
                defaultValue: null,
                label: '发货月份',
                type: 'month',
                placeholder: '发货月份',
            },
            {
                value: 'applicantId',
                defaultValue: null,
                label: '申请人',
                type: 'personSelect',
                placeholder: '申请人',
            },
        ];
    });

    /**
     * 按合同定价分页接口字段组装查询参数。
     * @returns 合同定价分页查询参数
     */
    const buildPageParams = () => {
        const params = queryParams.value || {};
        const planMonth = params.planMonth ? dayjs(params.planMonth).format('YYYY-MM') : '';
        return {
            current: tableConfig.value.paginationConfig.pagConfig.page,
            size: tableConfig.value.paginationConfig.pagConfig.pageSize,
            contractPricingCode: params.contractPricingCode || '',
            customerName: params.customerName || '',
            status: params.status || '',
            planMonth,
            applicantId: params.applicantId || '',
        };
    };

    /**
     * 加载合同定价分页数据，列表记录只使用分页接口 data.records 原值。
     * @returns 分页查询结果
     */
    const getList = async () => {
        try {
            const res = await getSalesPlanContractPricingPage(buildPageParams());
            if (res.code === 200) {
                const pageData = res.data;
                const records = Array.isArray(pageData?.records) ? pageData.records : [];
                const pagination = tableConfig.value.paginationConfig.pagConfig;
                tableConfig.value.tableList = records.map(formatContractPricingRecord);
                pagination.total = pageData?.total ?? 0;
                pagination.page = pageData?.current ?? pagination.page;
                pagination.pageSize = pageData?.size ?? pagination.pageSize;
            }
        } catch {
            tableConfig.value.tableList = [];
            tableConfig.value.paginationConfig.pagConfig.total = 0;
            message.error('合同定价列表加载失败，请稍后重试');
        }
    };

    const queryEvt = (params: any) => {
        queryParams.value = params;
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    const loadCustomerOptions = async () => {
        try {
            const res = await getCustomerBaseDropdownApi({
                status: 'STORAGE',
            });
            if (res.code === 200) {
                customerOptions.value = (Array.isArray(res.data) ? res.data : []).map((item: any) => ({
                    label: item.customerName,
                    value: item.customerName,
                }));
            }
        } catch {
            customerOptions.value = [];
            message.error('企业名称加载失败，请稍后重试');
        }
    };

    onMounted(async () => {
        await loadCustomerOptions();
        await getList();
    });

    return {
        createEvt,
        detailRef,
        tableConfig,
        queryConfiguration,
        queryEvt,
        getList,
    };
};
