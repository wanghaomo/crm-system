import { deleteContractFramework, getContractFrameworkPage, terminateContractFramework } from '@/api/contractManage';
import { useDictStore } from '@/store/commStore';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';

import {
    FRAMEWORK_STATUS_APPROVAL_GENERATING,
    FRAMEWORK_STATUS_APPROVAL_GEN_FAILED,
    FRAMEWORK_STATUS_DRAFT,
    FRAMEWORK_STATUS_EFFECTIVE,
    statusConfig,
    TABLE_ACTION_COLOR,
    TABLE_DANGER_COLOR,
} from './commonTs/common';
import { checkPermission } from '@/utils/comm';

export default () => {
    const router = useRouter();
    const message = useMessage();
    const { dictMap } = storeToRefs(useDictStore());

    const terminateDrawerShow = ref(false);
    const terminateFormRef = ref<any>(null);
    const terminateSubmitLoading = ref(false);
    const terminateCurrentRow = ref<any>(null);
    const terminateForm = reactive({
        terminationReason: '',
    });
    const terminateRules = {
        terminationReason: [{ required: true, message: '请输入终止原因', trigger: ['blur', 'input'] }],
    };

    const getDictEnum = computed(() => {
        return (name: string) => {
            if (dictMap.value) {
                return dictMap.value[name] || [];
            }
            return [];
        };
    });

    const getDictLabel = (dictName: string, value: any) => {
        const obj = getDictEnum.value(dictName)?.find((item: any) => item.value === value || item.label === value);
        return obj?.label || value || '--';
    };

    const getStatusItem = (status: string) => {
        return statusConfig.find((item: any) => item.value === status);
    };

    const isStatus = (row: any, status: string) => {
        return row.status === status;
    };

    const canEdit = (row: any) => [FRAMEWORK_STATUS_DRAFT, FRAMEWORK_STATUS_APPROVAL_GEN_FAILED].includes(row.status);

    const canViewDetail = (row: any) =>
        ![FRAMEWORK_STATUS_DRAFT, FRAMEWORK_STATUS_APPROVAL_GENERATING, FRAMEWORK_STATUS_APPROVAL_GEN_FAILED].includes(
            row.status
        );

    const renderText = (value: any) => {
        if (value === 0) return 0;
        return value || '--';
    };

    const renderCustomerName = (row: any) => {
        const name = row.customerName || '--';
        if (!row.customerId) return name;
        return h(
            'span',
            {
                style: {
                    color: TABLE_ACTION_COLOR,
                    cursor: 'pointer',
                },
                onClick: () => {
                    router.push({
                        path: '/customerManage/customerArchive/detail',
                        query: { id: row.customerId },
                    });
                },
            },
            name
        );
    };

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
                        backgroundColor: statusItem.dotColor,
                        flexShrink: 0,
                    },
                }),
                h('span', statusItem.label),
            ]
        );
    };

    const renderContractPeriod = (row: any) => {
        if (!row.startDate && !row.endDate) return '--';
        const startDate = row.startDate ? dayjs(row.startDate).format('YYYY.MM.DD') : '--';
        const endDate = row.endDate ? dayjs(row.endDate).format('YYYY.MM.DD') : '--';
        return `${startDate}-${endDate}`;
    };

    const queryConfiguration = ref<any>([
        {
            value: 'customerName',
            defaultValue: '',
            label: '企业名称',
            type: 'input',
            placeholder: '企业名称',
        },
        {
            value: 'contractCode',
            defaultValue: '',
            label: '合同编号',
            type: 'input',
            placeholder: '合同编号',
        },
        {
            value: 'timer',
            leftPlaceholder: '合同开始日期',
            rightPlaceholder: '结束日期',
            type: 'dateRange',
        },
        {
            value: 'mineralType',
            defaultValue: '',
            type: 'dict',
            dictType: '矿种',
            placeholder: '矿种',
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

    const createEvt = () => {
        router.push({ path: '/frameworkContract/add' });
    };

    const tableConfig = ref<any>({
        columns: [
            { key: 'contractCode', title: '合同编号', width: 170, render: (row: any) => renderText(row.contractCode) },
            { key: 'customerName', title: '企业名称', width: 200, render: renderCustomerName },
            {
                key: 'status',
                title: '合同状态',
                width: 140,
                render: (row: any) => renderStatus(row.status),
            },
            {
                key: 'mineralType',
                title: '矿种',
                width: 150,
                render: (row: any) => getDictLabel('矿种', row.mineralType),
            },
            { key: 'grade', title: '矿石品位（P₂O₅含量）', width: 180, render: (row: any) => renderText(row.grade) },
            { key: 'annualQuantity', title: '年度约定总量（万吨）', width: 180, render: (row: any) => renderText(row.annualQuantity) },
            { key: 'executedQuantity', title: '已执行量（万吨）', width: 160, render: (row: any) => renderText(row.executedQuantity) },
            { key: 'remainingQuantity', title: '剩余量（万吨）', width: 160, render: (row: any) => renderText(row.remainingQuantity) },
            { key: 'aiReportCode', title: '关联AI分析报告编号', width: 200, render: (row: any) => renderText(row.aiReportCode) },
            { key: 'salesContractCount', title: '关联销售合同数量', width: 180, render: (row: any) => renderText(row.salesContractCount) },
            {
                key: 'priceMechanism',
                title: '价格机制',
                width: 150,
                render: (row: any) => getDictLabel('价格机制', row.priceMechanism),
            },
            { key: 'contractPeriod', title: '合同期限', width: 230, render: renderContractPeriod },
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: TABLE_ACTION_COLOR,
                isBtnHide: (row: any) => canEdit(row) && checkPermission(['crm:framework_contract:edit']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/frameworkContract/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '详情',
                btnColor: TABLE_ACTION_COLOR,
                // isBtnHide: (row: any) => canViewDetail(row),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/frameworkContract/detail', query: { id: row.id } });
                },
            },
            {
                btnName: '删除',
                btnColor: TABLE_DANGER_COLOR,
                isBtnHide: (row: any) => isStatus(row, FRAMEWORK_STATUS_DRAFT) && checkPermission(['crm:framework_contract:delete']),
                delConfig: {
                    content: '该框架合同删除后不可恢复，请确认是否删除？',
                },
                clickTableBtns: async (row: any) => {
                    const res = await deleteContractFramework(row.id);
                    if (res.code === 200) getList();
                },
            },
            {
                btnName: '终止',
                btnColor: TABLE_DANGER_COLOR,
                isBtnHide: (row: any) => isStatus(row, FRAMEWORK_STATUS_EFFECTIVE),
                clickTableBtns: (row: any) => {
                    openTerminateDrawer(row);
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

    const searchParams = ref<any>({});

    const queryEvt = (searchData: any) => {
        const params = { ...searchData };
        if (Array.isArray(params.timer) && params.timer.length === 2) {
            params.startDate = params.timer[0];
            params.endDate = params.timer[1];
        }
        delete params.timer;
        searchParams.value = params;
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    const openTerminateDrawer = (row: any) => {
        terminateCurrentRow.value = row;
        terminateForm.terminationReason = '';
        terminateDrawerShow.value = true;
    };

    const closeTerminateDrawer = () => {
        terminateDrawerShow.value = false;
        terminateCurrentRow.value = null;
        terminateForm.terminationReason = '';
        terminateFormRef.value?.restoreValidation?.();
    };

    const submitTerminate = () => {
        terminateFormRef.value?.validate(async (errors: any) => {
            if (errors) {
                message.error(errors[0]?.[0]?.message || '请输入终止原因');
                return;
            }
            if (!terminateCurrentRow.value?.id || terminateSubmitLoading.value) return;
            terminateSubmitLoading.value = true;
            try {
                const res = await terminateContractFramework({
                    id: terminateCurrentRow.value.id,
                    terminationReason: terminateForm.terminationReason,
                });
                if (res.code === 200) {
                    closeTerminateDrawer();
                    getList();
                }
            } finally {
                terminateSubmitLoading.value = false;
            }
        });
    };

    const getList = async () => {
        const res = await getContractFrameworkPage({
            ...searchParams.value,
            current: tableConfig.value.paginationConfig.pagConfig.page,
            size: tableConfig.value.paginationConfig.pagConfig.pageSize,
        });
        if (res.code === 200) {
            tableConfig.value.tableList = res.data?.records || [];
            tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
        }
    };

    onMounted(() => {
        getList();
    });

    return {
        tableConfig,
        createEvt,
        queryConfiguration,
        queryEvt,
        terminateDrawerShow,
        terminateFormRef,
        terminateForm,
        terminateRules,
        terminateSubmitLoading,
        submitTerminate,
    };
};
