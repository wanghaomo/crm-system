import { ref, reactive, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace } from 'naive-ui';
import { getCustomerCarePageApi, cancelCustomerCareApi, archiveCustomerCareApi } from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_OPTIONS, STAR_LEVEL_MAP } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

export default () => {
    const router = useRouter();

    const tableLoading = ref(false);

    // 关怀类型字典映射
    const careTypeMap = ref<Record<string, string>>({});

    // 执行方式字典映射
    const careMethodMap = ref<Record<string, string>>({});

    // 加载关怀相关字典
    const loadCareDicts = async () => {
        try {
            const res: any = await getDictMapApi({ parentCodes: [enumCfg['关怀类型'], enumCfg['执行方式']] });
            if (res.code === 200) {
                // 关怀类型
                const careTypeList: any[] = res.data?.[enumCfg['关怀类型']] || [];
                careTypeList.forEach((item: any) => {
                    careTypeMap.value[item.code] = item.name;
                });
                // 执行方式
                const careMethodList: any[] = res.data?.[enumCfg['执行方式']] || [];
                careMethodList.forEach((item: any) => {
                    careMethodMap.value[item.code] = item.name;
                });
            }
        } catch (error) {
            console.error('加载关怀字典失败:', error);
        }
    };

    // ========== 搜索表单 ==========
    const searchForm = reactive({
        customerName: '', // 企业单位名称
        starLevel: undefined, // 客户星级
        status: undefined, // 单据状态
        executorCode: undefined, // 执行人
        careTimeRange: undefined, // 关怀时间范围
        careType: undefined, // 关怀类型
    });

    // 搜索栏配置
    const queryConfiguration = [
        { type: 'input', label: '', value: 'customerName', placeholder: '企业单位名称' },
        { type: 'select', label: '客户星级', value: 'starLevel', placeholder: '客户星级', options: STAR_LEVEL_OPTIONS },
        {
            type: 'select',
            label: '状态',
            value: 'status',
            placeholder: '状态',
            options: [
                { label: '待执行', value: 'PENDING' },
                { label: '已完成', value: 'COMPLETED' },
                { label: '已归档', value: 'ARCHIVED' },
                { label: '已取消', value: 'CANCELLED' },
            ],
        },
        { type: 'personSelect', label: '执行人', value: 'executorCode', placeholder: '执行人' },
        {
            type: 'dateTimeRange',
            value: 'careTimeRange',
            leftPlaceholder: '实际关怀开始时间',
            rightPlaceholder: '实际关怀结束时间',
        },

        { type: 'dict', dictType: '关怀类型', value: 'careType', placeholder: '关怀类型' },
    ];

    // 单据状态映射
    const STATUS_MAP: Record<string, { text: string; color: string }> = {
        PENDING: { text: '待执行', color: '#FCBD12' },
        COMPLETED: { text: '已完成', color: '#1890FF' },
        ARCHIVED: { text: '已归档', color: '#18D851' },
        CANCELLED: { text: '已取消', color: '#C4C4C4' },
    };

    // 客户星级映射
    const starLevelMap = STAR_LEVEL_MAP;

    // 表格配置
    const tableConfig = ref<any>({
        columns: [
            { title: '企业单位名称', key: 'customerName', width: 160, ellipsis: { tooltip: true } },
            {
                title: '客户星级',
                key: 'starLevel',
                width: 100,
                render: (row: any) => starLevelMap[row.starLevel] || row.starLevel || '--',
            },
            {
                title: '单据状态',
                key: 'status',
                width: 100,
                render: (row: any) => {
                    const status = STATUS_MAP[row.status] || { text: row.status, color: '#999' };
                    return h(
                        NSpace,
                        { align: 'center', size: 8 },
                        {
                            default: () => [
                                h('div', {
                                    style: {
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: status.color,
                                    },
                                }),
                                h('span', null, status.text),
                            ],
                        }
                    );
                },
            },
            {
                title: '关怀类型',
                key: 'careType',
                width: 120,
                render: (row: any) => careTypeMap.value[row.careType] || row.careType || '--',
            },
            {
                title: '执行方式',
                key: 'careMethod',
                width: 120,
                render: (row: any) => careMethodMap.value[row.careMethod] || row.careMethod || '--',
            },
            // { title: '关怀内容', key: 'content', width: 150, ellipsis: { tooltip: true } },
            { title: '计划关怀时间', key: 'planTime', width: 140 },
            {
                title: '执行人',
                key: 'executorNames',
                width: 140,
                ellipsis: { tooltip: true },
                render: (row: any) => row.executorList.map((i: any) => i.username).join('、') || '--',
            },
            { title: '实际关怀时间', key: 'actualTime', width: 140, render: (row: any) => row.actualTime || '--' },
            { title: '客户反馈', key: 'feedback', width: 120, render: (row: any) => row.feedback || '--' },
            { title: '取消原因', key: 'cancelReason', width: 150, render: (row: any) => row.cancelReason || '--' },
        ],
        tableList: [] as any[],
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => ['PENDING', 'COMPLETED'].includes(row.status) && checkPermission(['crm:customer_car:edit']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/customerCare/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '取消',
                btnColor: 'var(--web-error-tag-c)',
                isBtnHide: (row: any) => row.status === 'PENDING' && checkPermission(['crm:customer_car:cancel']),
                clickTableBtns: (row: any) => {
                    currentRow.value = row;
                    cancelPopShow.value = true;
                },
            },
            {
                btnName: '归档',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'COMPLETED' && checkPermission(['crm:customer_car:archive']),
                clickTableBtns: (row: any) => {
                    archiveRow.value = row;
                    archivePopShow.value = true;
                },
            },
            {
                btnName: '详情',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => ['ARCHIVED', 'CANCELLED'].includes(row.status),
                clickTableBtns: (row: any) => {
                    openDetail(row);
                },
            },
        ],
        isShowPagination: true,
        paginationConfig: {
            pagConfig: {
                page: 1,
                pageSize: 20,
                total: 10,
                showSizePicker: false,
                pageSizes: [10, 20, 50, 100],
            },
            showHeadBorder: true,
            showTotal: true,
            onPageChange: (page: any) => {
                if (
                    tableConfig.value &&
                    tableConfig.value.paginationConfig &&
                    tableConfig.value.paginationConfig.pagConfig
                ) {
                    tableConfig.value.paginationConfig.pagConfig.page = page;
                    getList();
                }
            },
            onPageSizeChange: (pageSize: number) => {
                if (
                    tableConfig.value &&
                    tableConfig.value.paginationConfig &&
                    tableConfig.value.paginationConfig.pagConfig
                ) {
                    tableConfig.value.paginationConfig.pagConfig.page = 1;
                    tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                    getList();
                }
            },
        },
        styleOption: {
            padding: '16px',
            paddingBottom: '0px',
        },
    });

    // ========== 详情抽屉（无Tab） ==========
    const detailPopShow = ref(false);
    const currentDetailId = ref<number | string | null>(null);

    const openDetail = (row: any) => {
        currentDetailId.value = row.id;
        detailPopShow.value = true;
    };

    // ========== 事件处理 ==========
    const addEvt = () => {
        router.push({ path: '/customerManage/customerCare/add' });
    };

    const handleSearch = (queryObj: any) => {
        if (queryObj) {
            Object.keys(queryObj).forEach((key) => {
                (searchForm as any)[key] = queryObj[key];
            });
        }
        if (tableConfig.value?.paginationConfig?.pagConfig) {
            tableConfig.value.paginationConfig.pagConfig.page = 1;
        }
        getList();
    };

    const handleReset = () => {
        Object.keys(searchForm).forEach((key) => {
            (searchForm as any)[key] = key === 'customerName' ? '' : undefined;
        });
        handleSearch({});
    };

    // ========== 获取列表数据 ==========
    const getList = async () => {
        tableLoading.value = true;
        try {
            const pagConfig = tableConfig.value.paginationConfig.pagConfig;
            const params: any = {
                current: pagConfig.page,
                size: pagConfig.pageSize,
                ...searchForm,
            };
            // 清除空值参数
            Object.keys(params).forEach((key) => {
                if (params[key] === null || params[key] === '' || params[key] === undefined) {
                    delete params[key];
                }
            });
            // 拆分时间范围
            if (params.careTimeRange && Array.isArray(params.careTimeRange) && params.careTimeRange.length === 2) {
                params.actualTimeStart = params.careTimeRange[0];
                params.actualTimeEnd = params.careTimeRange[1];
                delete params.careTimeRange;
            }
            const res: any = await getCustomerCarePageApi(params);
            if (res?.data) {
                tableConfig.value.tableList = res.data.records || [];
                pagConfig.total = res.data.total || 0;
            }
        } finally {
            tableLoading.value = false;
        }
    };

    // ========== 取消关怀 ==========
    const cancelPopShow = ref(false);
    const cancelForm = reactive({ reason: '' });
    const cancelRules = { reason: { required: true, message: '请输入取消原因', trigger: 'blur' } };
    const currentRow = ref<any>(null);
    const submitCancel = (formRef: any) => {
        formRef?.validate(async (errors: any) => {
            if (!errors) {
                try {
                    let res = await cancelCustomerCareApi({ id: currentRow.value.id, cancelReason: cancelForm.reason });
                    if (res.code === 200 && res.data === true) {
                        cancelPopShow.value = false;
                        cancelForm.reason = '';
                        currentRow.value = null;
                        getList();
                    }
                } catch (e) {
                    console.error('取消关怀失败', e);
                }
            }
        });
    };

    // ========== 归档弹窗 ==========
    const archivePopShow = ref(false);
    const archiveRow = ref<any>(null);
    const handleArchiveConfirm = async () => {
        try {
            let res = await archiveCustomerCareApi(archiveRow.value.id);
            if (res.code === 200 && res.data === true) {
                archivePopShow.value = false;
                archiveRow.value = null;
                getList();
            }
        } catch (e) {
            console.error('归档失败', e);
        }
    };
    const handleArchiveCancel = () => {
        archivePopShow.value = false;
        archiveRow.value = null;
    };

    onMounted(() => {
        loadCareDicts();
        getList();
    });

    return {
        searchForm,
        queryConfiguration,
        STAR_LEVEL_OPTIONS,
        handleSearch,
        handleReset,
        addEvt,
        tableConfig,
        tableLoading,
        // 详情抽屉
        detailPopShow,
        currentDetailId,
        STATUS_MAP,
        starLevelMap,
        careTypeMap,
        careMethodMap,
        // 取消关怀
        cancelPopShow,
        cancelForm,
        cancelRules,
        submitCancel,
        // 归档弹窗
        archivePopShow,
        archiveRow,
        handleArchiveConfirm,
        handleArchiveCancel,
        checkPermission
    };
};
