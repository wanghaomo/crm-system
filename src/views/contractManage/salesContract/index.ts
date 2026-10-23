import {
    archiveContractSale,
    exportContractSaleList,
    getContractSalePage,
    updateContractSaleStatus,
} from '@/api/contractManage';
import { h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDictStore } from '@/store/commStore';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import {
    SALES_CONTRACT_DICT,
    SALES_CONTRACT_DATE_FORMAT,
    SALES_CONTRACT_MONTH_FORMAT,
    SALES_CONTRACT_ROUTE,
    SALES_CONTRACT_STATUS_APPROVAL_GENERATING,
    SALES_CONTRACT_STATUS_APPROVAL_GEN_FAILED,
    SALES_CONTRACT_STATUS_DRAFT,
    SALES_CONTRACT_STATUS_EXECUTING,
    SALES_CONTRACT_STATUS_ARCHIVED,
    SALES_CONTRACT_STATUS_INVALID,
    SALES_CONTRACT_TEXTAREA_MAX_LENGTH,
    TABLE_ACTION_COLOR,
    TABLE_DANGER_COLOR,
    statusConfig,
} from './commonTs/conmon';
import dayjs from 'dayjs';
import { checkPermission } from '@/utils/comm';

const SALES_CONTRACT_EXPORT_PAGINATION_KEYS = ['current', 'size', 'page', 'pageSize', 'lastId', 'searchCount'];

export default () => {
    const router = useRouter();
    const message = useMessage();
    const { dictMap } = storeToRefs(useDictStore());
    const invalidateDrawerShow = ref(false);
    const invalidateFormRef = ref<any>(null);
    const invalidateSubmitLoading = ref(false);
    const invalidateCurrentRow = ref<any>(null);
    const invalidateForm = reactive({
        terminationReason: '',
    });
    const invalidateRules = {
        terminationReason: [{ required: true, message: '请输入作废原因', trigger: ['blur', 'input'] }],
    };

    const renderText = (value: any) => {
        if (value === 0) return 0;
        return value || '--';
    };

    const getDictLabel = (dictName: string, value: any) => {
        if (value === 0) return 0;
        if (!value) return '--';
        const option = dictMap.value?.[dictName]?.find((item: any) => item.value === value || item.label === value);
        return option?.label || value;
    };

    const getStatusItem = (status: string) => statusConfig.find((item: any) => item.value === status);

    const renderStatus = (status: string) => {
        const statusItem = getStatusItem(status);
        if (!statusItem) return status || '--';
        return h(
            'span',
            {
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
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
                        backgroundColor: statusItem.dotColor || statusItem.tableColor,
                        flexShrink: 0,
                    },
                }),
                h('span', statusItem.label),
            ]
        );
    };

    const isStatus = (row: any, status: string) => row.status === status;

    const canEdit = (row: any) =>
        [SALES_CONTRACT_STATUS_DRAFT, SALES_CONTRACT_STATUS_APPROVAL_GEN_FAILED].includes(row.status);

    const canViewDetail = (row: any) =>
        ![
            SALES_CONTRACT_STATUS_DRAFT,
            SALES_CONTRACT_STATUS_APPROVAL_GENERATING,
            SALES_CONTRACT_STATUS_APPROVAL_GEN_FAILED,
        ].includes(row.status);

    const gotoDetail = (row: any) => {
        router.push({ path: SALES_CONTRACT_ROUTE.DETAIL, query: { id: row.id } });
    };

    const gotoEdit = (row: any) => {
        router.push({ path: SALES_CONTRACT_ROUTE.EDIT, query: { id: row.id } });
    };

    const gotoSupplement = (row: any) => {
        router.push({ path: SALES_CONTRACT_ROUTE.ADD, query: { supplementId: row.id } });
    };

    const openInvalidateDrawer = (row: any) => {
        invalidateCurrentRow.value = row;
        invalidateForm.terminationReason = '';
        invalidateDrawerShow.value = true;
    };

    const closeInvalidateDrawer = () => {
        invalidateDrawerShow.value = false;
        invalidateCurrentRow.value = null;
        invalidateForm.terminationReason = '';
        invalidateFormRef.value?.restoreValidation?.();
    };

    const queryConfiguration = ref<any>([
        {
            value: 'contractCode',
            defaultValue: '',
            label: '合同编号',
            type: 'input',
            placeholder: '合同编号',
        },
        {
            value: 'customerName',
            defaultValue: '',
            label: '需方单位',
            type: 'input',
            placeholder: '需方单位',
        },
        {
            value: 'supplierUnit',
            defaultValue: '',
            type: 'dict',
            dictType: SALES_CONTRACT_DICT.SUPPLIER_UNIT,
            placeholder: '供方单位',
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
            value: 'signDateRange',
            label: '签订时间',
            type: 'dateRange',
            leftPlaceholder: '签订开始日期',
            rightPlaceholder: '签订结束日期',
        },
        {
            value: 'directorId',
            defaultValue: '',
            label: '业务人员',
            type: 'personSelect',
            placeholder: '业务人员',
        },
    ]);
    const createEvt = () => {
        router.push({ path: SALES_CONTRACT_ROUTE.ADD });
    };

    const tableConfig = ref<any>({
        isShowIndex: true,
        columns: [
            { key: 'contractCode', title: '合同编号', width: 170, render: (row: any) => renderText(row.contractCode) },
            { key: 'supplierUnit', title: '供方单位', width: 210, render: (row: any) => getDictLabel(SALES_CONTRACT_DICT.SUPPLIER_UNIT, row.supplierUnit) },
            { key: 'customerName', title: '需方单位', width: 210, render: (row: any) => renderText(row.customerName) },
            { key: 'subsidiaryName', title: '子公司贸易商', width: 210, render: (row: any) => renderText(row.subsidiaryName) },
            {
                key: 'status',
                title: '合同状态',
                width: 130,
                render: (row: any) => renderStatus(row.status),
            },
            {
                key: 'signDate',
                title: '签订日期',
                width: 130,
                render: (row: any) =>
                    row.signDate ? dayjs(row.signDate).format(SALES_CONTRACT_DATE_FORMAT) : '--',
            },
            { key: 'directorName', title: '业务人员', width: 140, render: (row: any) => renderText(row.directorName) },
            { key: 'contractQuantity', title: '合同总量（吨）', width: 150, render: (row: any) => renderText(row.contractQuantity) },
            { key: 'subItemAmount', title: '含税总金额(万元)', width: 170, render: (row: any) => renderText(row.subItemAmount) },
            { key: 'shippedQuantity', title: '已发货数量（吨）', width: 170, render: (row: any) => renderText(row.shippedQuantity) },
            { key: 'unshippedNum', title: '未发货数量（吨）', width: 170, render: (row: any) => renderText(row.unshippedNum) },
            { key: 'transitQuantity', title: '在途数量（吨）', width: 150, render: (row: any) => renderText(row.transitQuantity) },
            { key: 'deliveryQuantity', title: '交割数量（吨）', width: 150, render: (row: any) => renderText(row.deliveryQuantity) },
            { key: 'settleWeight', title: '已结算量（吨）', width: 150, render: (row: any) => renderText(row.settleWeight) },
            { key: 'receivedAmount', title: '已结算金额（万元）', width: 180, render: (row: any) => renderText(row.receivedAmount) },
            { key: 'unReceivedAmount', title: '待结算金额（万元）', width: 180, render: (row: any) => renderText(row.unReceivedAmount) },
            { key: 'amountPaid', title: '已回款金额（万元）', width: 180, render: (row: any) => renderText(row.amountPaid) },
            { key: 'amountUnpaid', title: '待回款金额（万元）', width: 180, render: (row: any) => renderText(row.amountUnpaid) },
            { key: 'amountShouldBeReceived', title: '应回款总金额（万元）', width: 190, render: (row: any) => renderText(row.amountShouldBeReceived) },
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => canEdit(row) && checkPermission(['crm:sales_contract:edit']),
                clickTableBtns: (row: any) => {
                    gotoEdit(row);
                },
            },

            {
                btnName: '详情',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => canViewDetail(row),
                clickTableBtns: (row: any) => {
                    gotoDetail(row);
                },
            },
            // {
            //     btnName: '补充合同',
            //     btnColor: TABLE_ACTION_COLOR,
            //     isBtnHide: (row: any) => isStatus(row, SALES_CONTRACT_STATUS_EXECUTING) && checkPermission(['cancellation:supplement']),
            //     clickTableBtns: (row: any) => {
            //         gotoSupplement(row);
            //     },
            // },
            {
                btnName: '归档',
                btnColor: TABLE_ACTION_COLOR,
                isDialog: true,
                delConfig: {
                    title: '确认归档改销售合同',
                    content: '归档后销售合同状态将变更为归档且不能发货',
                    positiveText: '确定',
                    negativeText: '取消',
                },
                isBtnHide: (row: any) => isStatus(row, SALES_CONTRACT_STATUS_EXECUTING) && checkPermission(['crm:sales_contract:archiving']),
                clickTableBtns: (row: any) => {
                    handleArchive(row);
                },
            },
            {
                btnName: '作废',
                btnColor: TABLE_DANGER_COLOR,
                isBtnHide: (row: any) => isStatus(row, SALES_CONTRACT_STATUS_DRAFT) && checkPermission(['crm:sales_contract:cancellation']),
                clickTableBtns: (row: any) => {
                    openInvalidateDrawer(row);
                },
            },
        ],
        isShowPagination: true,
        // 分页
        paginationConfig: {
            // 分页参数
            pagConfig: {
                total: 0,
                pageSize: 20,
                page: 1,
            },
            // 是否展示头部border
            showHeadBorder: true,
            // 是否展示总条数
            showTotal: true,
            // 分页方法
            onPageChange: (page: any) => {
                if (
                    tableConfig.value &&
                    tableConfig.value.paginationConfig &&
                    tableConfig.value.paginationConfig.pagConfig
                ) {
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

    const searchParams = ref<any>({});
    const exportLoading = ref(false);

    const queryEvt = (searchData: any) => {
        const params = { ...searchData };
        if (Array.isArray(params.signDateRange) && params.signDateRange.length === 2) {
            params.signDateStart = dayjs(params.signDateRange[0]).format(SALES_CONTRACT_DATE_FORMAT);
            params.signDateEnd = dayjs(params.signDateRange[1]).format(SALES_CONTRACT_DATE_FORMAT);
        }
        delete params.signDateRange;
        searchParams.value = params;
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    const getList = async () => {
        let res = await getContractSalePage({
            ...searchParams.value,
            current: tableConfig.value.paginationConfig.pagConfig.page,
            size: tableConfig.value.paginationConfig.pagConfig.pageSize,
        });
        if (res.code === 200) {
            tableConfig.value.tableList = (res.data?.records || []).map((item: any) => ({
                ...item,
                shipmentMonth: item.shipmentMonth ? dayjs(item.shipmentMonth).format(SALES_CONTRACT_MONTH_FORMAT) : '',
            }));
            tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
        }
    };

    /**
     * 生成销售合同导出请求参数，仅保留当前筛选条件。
     * @returns 不包含分页参数的销售合同筛选条件
     */
    const getExportParams = () => {
        const params = { ...searchParams.value };
        SALES_CONTRACT_EXPORT_PAGINATION_KEYS.forEach((key) => {
            delete params[key];
        });
        return params;
    };

    /**
     * 导出销售合同列表，并提示后端返回的结果内容。
     * @returns 异步导出处理结果
     */
    const exportEvt = async () => {
        if (exportLoading.value) return;
        const total = tableConfig.value.paginationConfig?.pagConfig?.total;
        if (Number(total) === 0) {
            message.warning('当前筛选条件暂无数据，不能导出');
            return;
        }
        const exportParams = getExportParams();
        exportLoading.value = true;
        try {
            const res = await exportContractSaleList(exportParams);
            if (res?.code === 200) {
                const responseMessage = res.data !== null && res.data !== undefined && String(res.data).trim()
                    ? String(res.data)
                    : res.msg || '导出成功';
                message.success(responseMessage);
            }
        } catch (error) {
            console.error('销售合同导出失败:', error);
        } finally {
            exportLoading.value = false;
        }
    };

    /**
     * 归档执行中的销售合同并刷新列表。
     * @param row 当前销售合同列表行
     * @returns 无返回值
     */
    const handleArchive = async (row: any) => {
        if (!row?.id) {
            message.warning('缺少销售合同ID');
            return;
        }
        try {
            const res = await archiveContractSale({
                id: row.id,
                contractCode: row.contractCode,
            });
            if (res?.code === 200) {
                getList();
            }
        } catch (error) {
            console.error('销售合同归档失败:', error);
        }
    };

    const submitInvalidate = () => {
        invalidateFormRef.value?.validate(async (errors: any) => {
            if (errors) {
                message.error(errors[0]?.[0]?.message || '请输入作废原因');
                return;
            }
            if (!invalidateCurrentRow.value?.id || invalidateSubmitLoading.value) return;
            invalidateSubmitLoading.value = true;
            try {
                const res = await updateContractSaleStatus({
                    id: invalidateCurrentRow.value.id,
                    status: SALES_CONTRACT_STATUS_INVALID,
                    terminationReason: invalidateForm.terminationReason,
                });
                if (res.code === 200) {
                    closeInvalidateDrawer();
                    getList();
                }
            } finally {
                invalidateSubmitLoading.value = false;
            }
        });
    };

    onMounted(() => {
        getList();
    });

    return {
        tableConfig,
        createEvt,
        queryConfiguration,
        queryEvt,
        exportEvt,
        exportLoading,
        invalidateDrawerShow,
        invalidateFormRef,
        invalidateForm,
        invalidateRules,
        invalidateSubmitLoading,
        submitInvalidate,
        INVALIDATE_REASON_MAX_LENGTH: SALES_CONTRACT_TEXTAREA_MAX_LENGTH,
    };
};
