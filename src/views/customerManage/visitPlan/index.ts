import { ref, reactive, h, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace } from 'naive-ui';
import { getVisitPlanPageApi, cancelVisitPlanApi, archiveVisitPlanApi } from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_OPTIONS, STAR_LEVEL_SHORT_MAP } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

export default () => {
    const router = useRouter();

    // 拜访目的字典
    const visitPurposeMap = ref<Record<string, string>>({});

    // 加载拜访目的字典
    const loadVisitPurposeDict = async () => {
        try {
            const res: any = await getDictMapApi({ parentCodes: [enumCfg['拜访目的']] });
            if (res.code === 200) {
                const purposeList: any[] = res.data?.[enumCfg['拜访目的']] || [];
                purposeList.forEach((item: any) => {
                    visitPurposeMap.value[item.code] = item.name;
                });
            }
        } catch (error) {
            console.error('加载拜访目的字典失败:', error);
        }
    };

    // ========== 搜索表单 ==========
    const searchForm = reactive({
        customerName: '',
        starLevel: null,
        status: null,
        executorCode: null,
        executorName: null,
        visitTimeRange: null,
        actualTimeStart: null,
        actualTimeEnd: null,
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
                { label: '待拜访', value: 'PENDING' },
                { label: '已拜访', value: 'COMPLETED' },
                { label: '已归档', value: 'ARCHIVED' },
                { label: '已取消', value: 'CANCELLED' },
            ],
        },
        { type: 'personSelect', label: '拜访人', value: 'executorCode', placeholder: '拜访人' },
        {
            type: 'dateTimeRange',
            value: 'visitTimeRange',
            leftPlaceholder: '实际拜访开始时间',
            rightPlaceholder: '实际拜访结束时间',
        },
    ];

    // 拜访记录单据状态映射
    const visitStatusMap: Record<string, { text: string; color: string }> = {
        PENDING: { text: '待拜访', color: '#FCBD12' },
        COMPLETED: { text: '已拜访', color: '#1890FF' },
        ARCHIVED: { text: '已归档', color: '#18D851' },
        CANCELLED: { text: '已取消', color: '#C4C4C4' },
    };

    // 客户星级映射
    const starLevelMap = STAR_LEVEL_SHORT_MAP;

    // 表格配置
    const tableConfig = ref<any>({
        columns: [
            { title: '企业单位名称', key: 'customerName', width: 150 },
            {
                title: '拜访方式',
                key: 'visitMode',
                width: 100,
                render: (row: any) => row.visitMode || '--',
            },
            {
                title: '单据状态',
                key: 'status',
                width: 100,
                render: (row: any) => {
                    const status = visitStatusMap[row.status] || { text: row.status, color: '#999' };
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
                title: '拜访目的',
                key: 'visitPurpose',
                width: 120,
                render: (row: any) => visitPurposeMap.value[row.visitPurpose] || row.visitPurpose || '--',
            },
            { title: '计划拜访时间', key: 'planTime', width: 140 },
            {
                title: '拜访人',
                key: 'executorList',
                width: 100,
                render: (row: any) => row.executorList.map((executor: any) => executor.username).join('、') || '--',
            },
            {
                title: '关键决策人',
                key: 'keyDecisionMakers',
                width: 160,
                render: (row: any) => row.keyDecisionMakers || '--',
            },
            { title: '拜访要求', key: 'visitRequirements', width: 120, render: (row: any) => row.visitRequirements || '--' },
            { title: '实际拜访时间', key: 'actualTime', width: 140, render: (row: any) => row.actualTime || '--' },
            { title: '拜访反馈', key: 'feedback', width: 120, render: (row: any) => row.feedback || '--' },
            { title: '取消原因', key: 'cancelReason', width: 150, render: (row: any) => row.cancelReason || '--' },
        ],
        tableList: [],
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => ['COMPLETED', 'PENDING'].includes(row.status) && checkPermission(["crm:visit_plan:edit"]), // 待拜访、已拜访
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/visitPlan/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '复制',
                btnColor: 'var(--base-color)',
                isBtnHide: () => checkPermission(['crm:visit_plan:create']), // 有新增权限时显示（MxWebDataTable 中该回调返回 true 为保留）
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/visitPlan/add', query: { copyId: row.id } });
                },
            },
            {
                btnName: '取消',
                btnColor: 'var(--web-error-tag-c)',
                isBtnHide: (row: any) => row.status === 'PENDING' && checkPermission(["crm:visit_plan:cancel"]), // 仅待拜访
                clickTableBtns: (row: any) => {
                    currentRow.value = row;
                    cancelPopShow.value = true;
                },
            },
            {
                btnName: '归档',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'COMPLETED' && checkPermission(["crm:visit_plan:archive"]), // 仅已拜访
                clickTableBtns: (row: any) => {
                    archiveRow.value = row;
                    archivePopShow.value = true;
                },
            },
            {
                btnName: '详情',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'ARCHIVED' || row.status === 'CANCELLED', // 已归档、已取消
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
                total: 0,
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

    // ========== 详情抽屉 ==========
    const detailPopShow = ref(false);
    const currentDetailId = ref<number | string | null>(null);
    const activeTab = ref('basic');
    const tabList = [
        { label: '基础信息', value: 'basic' },
        { label: '待办事项', value: 'todo' },
    ];

    const detailData = reactive({
        id: '',
        customerName: '',
        starLevel: '',
        planTime: '',
        status: '',
        executorNames: '',
        contactPersonNames: '',
        visitPurpose: '',
        content: '',
        visitRequirements: '',
        actualTime: '',
        createTime: '',
        updateTime: '',
        visitCycle: '',
        customerWorkPattern: '',
        customerInventoryRate: '', // 客户库存/开工率记录
        feedback: '',
        plusServices: '', // 增值服务
        plusServicesDetail: '', // 增值服务详情
        plusServicesExecution: '', // 增值服务执行情况
        attachmentUrls: [],
        cancelReason: '',
    });

    // 待办事项状态映射
    const todoStatusMap: Record<string, { text: string; color: string }> = {
        TODO: { text: '未完成', color: '#FCBD12' },
        DONE: { text: '已完成', color: '#18D851' },
        DELAYED: { text: '延期', color: '#F46B6C' },
    };

    const todoList = ref<any[]>([]);

    const todoTableColumns = computed(() => [
        { title: '序号', key: 'index', width: 60, render: (_row: any, index: number) => index + 1 },
        { title: '待办事项', key: 'todoContent', width: 200, ellipsis: { tooltip: true } },
        {
            title: '状态',
            key: 'status',
            width: 100,
            render: (row: any) => {
                const status = todoStatusMap[row.status] || { text: row.status, color: '#999' };
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
        { title: '负责人', key: 'principalNames', width: 100 },
        { title: '截止时间', key: 'dueTime', width: 150 },
        { title: '完成时间', key: 'completeTime', width: 150, render: (row: any) => row.completeTime || '--' },
        {
            title: '延期原因',
            key: 'delayReason',
            width: 150,
            ellipsis: { tooltip: true },
            render: (row: any) => row.delayReason || '--',
        },
        {
            title: '备注',
            key: 'remark',
            width: 120,
            ellipsis: { tooltip: true },
            render: (row: any) => row.remark || '--',
        },
    ]);

    const openDetail = (row: any) => {
        currentDetailId.value = row.id;
        detailPopShow.value = true;
    };
    const tableLoading = ref(false);
    // 加载列表数据
    const getList = async () => {
        tableLoading.value = true;
        try {
            const pagConfig = tableConfig.value?.paginationConfig?.pagConfig;
            const params = {
                current: pagConfig?.page || 1,
                size: pagConfig?.pageSize || 20,
                customerName: searchForm.customerName || undefined,
                starLevel: searchForm.starLevel || undefined,
                status: searchForm.status || undefined,
                executorCode: searchForm.executorCode || undefined,
                actualTimeStart: searchForm.actualTimeStart || undefined,
                actualTimeEnd: searchForm.actualTimeEnd || undefined,
            };

            const res: any = await getVisitPlanPageApi(params);
            if (res?.data) {
                tableConfig.value.tableList = res.data.records || [];
                if (pagConfig) {
                    pagConfig.total = res.data.total || 0;
                }
            }
        } catch (err) {
            console.error('获取拜访记录列表失败', err);
        } finally {
            tableLoading.value = false;
        }
    };

    // ========== 事件处理 ==========
    const addEvt = () => {
        router.push({ path: '/customerManage/visitPlan/add' });
    };

    const handleSearch = (queryObj: any) => {
        console.log('查询', queryObj);

        // 处理时间范围
        if (queryObj.visitTimeRange?.length === 2) {
            searchForm.visitTimeRange = queryObj.visitTimeRange;
            searchForm.actualTimeStart = queryObj.visitTimeRange[0];
            searchForm.actualTimeEnd = queryObj.visitTimeRange[1];
        } else {
            searchForm.visitTimeRange = null;
            searchForm.actualTimeStart = null;
            searchForm.actualTimeEnd = null;
        }

        // 处理拜访人
        searchForm.executorCode = queryObj.executorCode || null;
        searchForm.executorName = queryObj.executorName || null;

        // 同步其他字段
        searchForm.customerName = queryObj.customerName || '';
        searchForm.starLevel = queryObj.starLevel || null;
        searchForm.status = queryObj.status || null;

        // 重置页码并查询
        if (tableConfig.value?.paginationConfig?.pagConfig) {
            tableConfig.value.paginationConfig.pagConfig.page = 1;
        }
        getList();
    };

    const handleReset = () => {
        searchForm.customerName = '';
        searchForm.starLevel = null;
        searchForm.status = null;
        searchForm.executorCode = null;
        searchForm.executorName = null;
        searchForm.visitTimeRange = null;
        searchForm.actualTimeStart = null;
        searchForm.actualTimeEnd = null;
        // 重置页码
        if (tableConfig.value?.paginationConfig?.pagConfig) {
            tableConfig.value.paginationConfig.pagConfig.page = 1;
        }
        getList();
    };

    // ========== 取消拜访 ==========
    const cancelPopShow = ref(false);
    const cancelForm = reactive({ reason: '' });
    const cancelRules = { reason: { required: true, message: '请输入取消原因', trigger: 'blur' } };
    const currentRow = ref<any>(null);
    const submitCancel = async (formRef: any) => {
        formRef?.validate(async (errors: any) => {
            if (!errors) {
                try {
                    const res = await cancelVisitPlanApi({ id: currentRow.value.id, cancelReason: cancelForm.reason });
                    if (res.code === 200 && res.data === true) {
                        cancelPopShow.value = false;
                        cancelForm.reason = '';
                        currentRow.value = null;
                        getList();
                    }
                } catch (e) {
                    console.error('取消拜访失败', e);
                }
            }
        });
    };

    // ========== 归档弹窗 ==========
    const archivePopShow = ref(false);
    const archiveRow = ref<any>(null);
    const handleArchiveConfirm = async () => {
        try {
            const res = await archiveVisitPlanApi(archiveRow.value.id);
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
        loadVisitPurposeDict();
        getList();
    });

    return {
        checkPermission,
        searchForm,
        queryConfiguration,
        handleSearch,
        handleReset,
        addEvt,
        tableConfig,
        tableLoading,
        // 详情抽屉
        detailPopShow,
        currentDetailId,
        activeTab,
        tabList,
        detailData,
        todoList,
        todoTableColumns,
        todoStatusMap,
        visitStatusMap,
        starLevelMap,
        // 取消拜访
        cancelPopShow,
        cancelForm,
        cancelRules,
        submitCancel,
        // 归档弹窗
        archivePopShow,
        archiveRow,
        handleArchiveConfirm,
        handleArchiveCancel,
    };
};
