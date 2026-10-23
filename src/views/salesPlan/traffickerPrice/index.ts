import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import dayjs from 'dayjs';
import {
    CUSTOMER_TYPE_TRADER,
    PRICING_STATUS_APPROVAL_GEN_FAILED,
    PRICING_STATUS_CANCELLED,
    PRICING_STATUS_DRAFT,
    TABLE_ACTION_COLOR,
    TABLE_DANGER_COLOR,
    statusConfig,
} from './commonTs/conmon';
import { cancelSalesPlanBasePricing, getSalesPlanBasePricingPage } from '@/api/salesPlan';
import { checkPermission } from '@/utils/comm';

/**
 * 贸易商基准定价列表页数据与事件。
 */
export default () => {
    const router = useRouter();
    const message = useMessage();

    // 详情弹窗实例。
    const detailRef = ref<any>(null);
    // 作废抽屉展示状态。
    const cancelDrawerShow = ref(false);
    // 作废表单实例。
    const cancelFormRef = ref<any>(null);
    // 作废接口提交状态，防止重复提交。
    const cancelSubmitLoading = ref(false);
    // 当前准备作废的行数据。
    const cancelCurrentRow = ref<any>(null);
    // 作废表单数据。
    const cancelForm = reactive({
        cancelReason: '',
    });
    // 作废表单校验规则。
    const cancelRules = {
        cancelReason: [{ required: true, message: '请输入作废原因', trigger: ['blur', 'input'] }],
    };

    /**
     * 跳转贸易商基准定价新增页。
     */
    const createEvt = () => {
        router.push({ path: '/traffickerPrice/add' });
    };

    /**
     * 渲染表格单据状态。
     */
    const renderStatus = (status: string) => {
        const statusItem = statusConfig.find((item) => item.value === status);
        if (!statusItem) return '--';
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
                        backgroundColor: statusItem.listColor,
                        flexShrink: 0,
                    },
                }),
                h('span', statusItem.label),
            ]
        );
    };

    const canEdit = (status: string) =>
        status === PRICING_STATUS_DRAFT || status === PRICING_STATUS_APPROVAL_GEN_FAILED;

    const canViewDetail = (status: string) => !!status && status !== PRICING_STATUS_DRAFT

    // 列表表格配置。
    const tableConfig = ref<any>({
        columns: [
            { key: 'pricingCode', title: '基准定价单号', width: 200 },
            { key: 'pricingMonth', title: '定价月份', width: 160 },
            {
                key: 'status',
                title: '单据状态',
                width: 160,
                render: (row: any) => renderStatus(row.status),
            },
            { key: 'applicantName', title: '申请人', width: 160, render: (row: any) => row.applicantName || '--' },
            { key: 'instruction', title: '事项说明', width: 260, render: (row: any) => row.instruction || '--' },
            { key: 'cancelReason', title: '作废原因', width: 220, render: (row: any) => row.cancelReason || '--' },
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => canEdit(row.status) && checkPermission(['crm:trafficker_rice:edit']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/traffickerPrice/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '复制',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: () => checkPermission(['crm:trafficker_rice:create']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/traffickerPrice/add', query: { copyId: row.id } });
                },
            },
            {
                btnName: '详情',
                btnColor: TABLE_ACTION_COLOR,
                // isBtnHide: (row: any) => canViewDetail(row.status),
                clickTableBtns: (row: any) => {
                    detailRef.value?.showDialog(row.id);
                },
            },
            {
                btnName: '作废',
                btnColor: TABLE_DANGER_COLOR,
                isBtnHide: (row: any) => row.status === PRICING_STATUS_DRAFT && checkPermission(['crm:trafficker_rice:cancellation']),
                clickTableBtns: (row: any) => {
                    openCancelDrawer(row);
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
                tableConfig.value.paginationConfig.pagConfig.page = page;
                getList();
            },
        },
        styleOption: {
            padding: '16px',
            paddingBottom: '0px',
        },
    });

    // 搜索表单参数。
    const queryParams = ref<any>({});
    // 搜索栏配置。
    const queryConfiguration = computed(() => [
        {
            value: 'pricingCode',
            defaultValue: '',
            label: '基准定价单号',
            type: 'input',
            placeholder: '基准定价单号',
        },
        {
            value: 'applicantId',
            defaultValue: null,
            label: '申请人',
            type: 'personSelect',
            placeholder: '申请人',
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
            value: 'pricingMonth',
            defaultValue: '',
            label: '定价月份',
            type: 'month',
            placeholder: '定价月份',
        },
    ]);

    /**
     * 组装贸易商基准定价分页查询参数。
     */
    const buildPageParams = () => {
        const params = queryParams.value || {};
        return {
            current: tableConfig.value.paginationConfig.pagConfig.page,
            size: tableConfig.value.paginationConfig.pagConfig.pageSize,
            customerType: CUSTOMER_TYPE_TRADER,
            pricingCode: params.pricingCode || '',
            status: params.status || '',
            pricingMonth: params.pricingMonth ? dayjs(params.pricingMonth).format('YYYY-MM') : '',
            applicantId: params.applicantId || '',
        };
    };

    /**
     * 按分页接口返回字段组装贸易商基准定价记录。
     * @param item 分页接口返回的单条记录
     * @returns 页面使用的基准定价记录
     */
    const formatTableRecord = (item: any) => ({
        id: item.id,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        createdByName: item.createdByName,
        updatedAt: item.updatedAt,
        updatedBy: item.updatedBy,
        updatedByName: item.updatedByName,
        pricingCode: item.pricingCode,
        pricingMonth: item.pricingMonth ? dayjs(item.pricingMonth).format('YYYY-MM') : item.pricingMonth,
        status: item.status,
        customerType: item.customerType,
        customerId: item.customerId,
        customerName: item.customerName,
        projectName: item.projectName,
        applicantId: item.applicantId,
        applyDeptId: item.applyDeptId,
        companyId: item.companyId,
        attendees: item.attendees,
        instruction: item.instruction,
        cancelReason: item.cancelReason,
        totalAmount: item.totalAmount,
        applicantName: item.applicantName,
        extChemicalDTO: item.extChemicalDTO,
        extTraderDTO: item.extTraderDTO,
        logistics: item.logistics,
        refDTOList: item.refDTOList,
        itemDTOList: item.itemDTOList,
        traderItemDTOList: item.traderItemDTOList,
        customerCode: item.customerCode,
        approvalDTO: item.approvalDTO,
        subsidiaryId: item.subsidiaryId,
        subsidiaryName: item.subsidiaryName,
    });

    /**
     * 获取贸易商基准定价分页列表。
     */
    const getList = async () => {
        try {
            const res = await getSalesPlanBasePricingPage(buildPageParams());
            if (res.code !== 200) return;

            const pageData = res.data;
            const records = Array.isArray(pageData?.records) ? pageData.records : [];
            const pagination = tableConfig.value.paginationConfig.pagConfig;
            tableConfig.value.tableList = records.map(formatTableRecord);
            pagination.total = pageData?.total ?? 0;
            pagination.page = pageData?.current ?? pagination.page;
            pagination.pageSize = pageData?.size ?? pagination.pageSize;
        } catch {
            tableConfig.value.tableList = [];
            tableConfig.value.paginationConfig.pagConfig.total = 0;
            message.error('基准定价列表加载失败，请稍后重试');
        }
    };

    /**
     * 搜索事件。
     */
    const queryEvt = (query: any) => {
        queryParams.value = query;
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    /**
     * 打开作废抽屉。
     */
    const openCancelDrawer = (row: any) => {
        cancelCurrentRow.value = row;
        cancelForm.cancelReason = '';
        cancelDrawerShow.value = true;
    };

    /**
     * 关闭作废抽屉。
     */
    const closeCancelDrawer = () => {
        cancelDrawerShow.value = false;
        cancelCurrentRow.value = null;
        cancelForm.cancelReason = '';
        cancelFormRef.value?.restoreValidation?.();
    };

    /**
     * 提交作废。
     */
    const submitCancel = () => {
        cancelFormRef.value?.validate(async (errors: any) => {
            if (errors) {
                message.error(errors[0]?.[0]?.message || '请完善作废原因');
                return;
            }
            if (!cancelCurrentRow.value?.id || cancelSubmitLoading.value) return;
            cancelSubmitLoading.value = true;
            try {
                const res = await cancelSalesPlanBasePricing({
                    id: cancelCurrentRow.value.id,
                    pricingCode: cancelCurrentRow.value.pricingCode,
                    cancelReason: cancelForm.cancelReason,
                    status: PRICING_STATUS_CANCELLED,
                    customerType: CUSTOMER_TYPE_TRADER,
                });
                if (res.code === 200) {
                    closeCancelDrawer();
                    getList();
                }
            } finally {
                cancelSubmitLoading.value = false;
            }
        });
    };

    /**
     * 页面初始化。
     */
    onMounted(() => {
        getList();
    });

    return {
        createEvt,
        tableConfig,
        queryConfiguration,
        queryEvt,
        detailRef,
        cancelDrawerShow,
        cancelFormRef,
        cancelForm,
        cancelRules,
        cancelSubmitLoading,
        closeCancelDrawer,
        submitCancel,
        getList,
    };
};
