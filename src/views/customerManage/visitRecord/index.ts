import { ref, reactive, h, computed, onMounted, resolveComponent } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace } from 'naive-ui';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { getVisitRecordPageApi, cancelVisitRecordApi, archiveVisitRecordApi } from '@/api/customerManage';
import { STAR_LEVEL_OPTIONS, STAR_LEVEL_MAP } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

export default () => {
    const router = useRouter();

    const tableLoading = ref(false);
    const detailLoading = ref(false);

    // ========== 搜索表单 ==========
    const searchForm = reactive({
        customerName: '', // 企业单位名称
        starLevel: undefined, // 客户星级
        status: undefined, // 单据状态
        executorCode: undefined, // 接待人
        visitTimeRange: undefined, // 来访时间范围
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
                { label: '待接待', value: 'PENDING' },
                { label: '已接待', value: 'COMPLETED' },
                { label: '已归档', value: 'ARCHIVED' },
                { label: '已取消', value: 'CANCELLED' },
            ],
        },
        { type: 'personSelect', label: '接待人', value: 'executorCode', placeholder: '接待人' },
        {
            type: 'dateTimeRange',
            value: 'visitTimeRange',
            leftPlaceholder: '来访开始时间',
            rightPlaceholder: '来访结束时间',
        },
    ];

    // ========== 枚举映射 ==========
    // 单据状态
    const visitStatusMap: Record<string, { text: string; color: string }> = {
        PENDING: { text: '待接待', color: '#FCBD12' },
        COMPLETED: { text: '已接待', color: '#1890FF' },
        ARCHIVED: { text: '已归档', color: '#18D851' },
        CANCELLED: { text: '已取消', color: '#C4C4C4' },
    };

    // 客户星级映射
    const starLevelMap = STAR_LEVEL_MAP;

    // 访问类型
    const visitTypeMap: Record<string, string> = {
        APPOINTMENT: '提前预约',
        TEMPORARY: '临时通知',
    };

    // 待办事项状态
    const todoStatusMap: Record<string, { text: string; color: string }> = {
        TODO: { text: '未完成', color: '#FCBD12' },
        DONE: { text: '已完成', color: '#18D851' },
        DELAYED: { text: '延期', color: '#F46B6C' },
    };

    // ========== 表格配置 ==========
    const tableConfig = ref<any>({
        columns: [
            { title: '企业单位名称', key: 'customerName', width: 160, ellipsis: { tooltip: true } },
            {
                title: '来访类型',
                key: 'visitType',
                width: 100,
                render: (row: any) => visitTypeMap[row.visitType] || row.visitType || '--',
            },
            {
                title: '客户星级',
                key: 'starLevel',
                width: 100,
                render: (row: any) => starLevelMap[row.starLevel] || row.starLevel || '--',
            },
            { title: '来访时间', key: 'actualTime', width: 160 },
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
                title: '接待人',
                key: 'executorList',
                width: 140,
                ellipsis: { tooltip: true },
                render: (row: any) => row.executorList.map((i: any) => i.username).join('、') || '--',
            },
            {
                title: '接待地点',
                key: 'receptionLocation',
                width: 140,
                ellipsis: { tooltip: true },
                render: (row: any) => {
                    const MxDict = resolveComponent('MxDict');
                    return h(MxDict as any, {
                        modelValue: row.receptionLocation,
                        placeholder: '请选择',
                        size: 'small',
                        text: true,
                        dictType: '接待地点',
                    });
                },
            },
            { title: '评价反馈', key: 'feedback', width: 140, ellipsis: { tooltip: true }, render: (row: any) => row.feedback || '--' },
            { title: '取消原因', key: 'cancelReason', width: 150, render: (row: any) => row.cancelReason || '--' },
        ],
        tableList: [] as any[],
        // 操作按钮：待接待=编辑+取消，已接待=编辑+归档+详情，已归档=详情，已取消=详情
        tableBtns: [
            {
                btnName: '编辑',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => ['PENDING', 'COMPLETED'].includes(row.status) && checkPermission(["crm:visit_record:edit"]), // 待接待、已接待
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/visitRecord/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '取消',
                btnColor: 'var(--web-error-tag-c)',
                isBtnHide: (row: any) => row.status === 'PENDING'&& checkPermission(["crm:visit_record:cancel"]), // 仅待接待
                clickTableBtns: (row: any) => {
                    currentRow.value = row;
                    cancelPopShow.value = true;
                },
            },
            {
                btnName: '归档',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'COMPLETED'&& checkPermission(["crm:visit_record:archive"]), // 仅已接待
                clickTableBtns: (row: any) => {
                    archiveRow.value = row;
                    archivePopShow.value = true;
                },
            },
            {
                btnName: '详情',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'CANCELLED' || row.status === 'ARCHIVED', // 已归档、已取消
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
                if (tableConfig.value?.paginationConfig?.pagConfig) {
                    tableConfig.value.paginationConfig.pagConfig.page = page;
                    getList();
                }
            },
            onPageSizeChange: (pageSize: number) => {
                if (tableConfig.value?.paginationConfig?.pagConfig) {
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
            if (params.visitTimeRange && Array.isArray(params.visitTimeRange) && params.visitTimeRange.length === 2) {
                params.actualTimeStart = params.visitTimeRange[0];
                params.actualTimeEnd = params.visitTimeRange[1];
                delete params.visitTimeRange;
            }
            const res: any = await getVisitRecordPageApi(params);
            if (res?.data) {
                tableConfig.value.tableList = res.data.records || [];
                pagConfig.total = res.data.total || 0;
            }
        } finally {
            tableLoading.value = false;
        }
    };

    // ========== 详情抽屉 ==========
    const detailPopShow = ref(false);
    const currentDetailId = ref<number | string | null>(null);
    const activeTab = ref('basic');
    const tabList = [
        { label: '基础信息', value: 'basic' },
        { label: '待办事项', value: 'todo' },
    ];

    // 接待规格字典映射
    const receptionSpecMap = ref<any[]>([]);

    // 接待规格字典获取
    const loadReceptionSpecDict = async () => {
        try {
            const res: any = await getDictMapApi({ parentCodes: [enumCfg['接待规格']] });
            if (res.code === 200) {
                const list: any[] = res.data?.[enumCfg['接待规格']] || [];
                list.forEach((item: any) => {
                    receptionSpecMap.value[item.code] = item.name;
                });
            }
        } catch (error) {
            console.error('加载接待规格字典失败:', error);
        }
    };

    // 详情数据（字段与新增页 formData 对齐）
    const detailData = reactive<any>({
        id: '',
        customerId: null,
        customerName: '',
        visitType: '',
        starLevel: '',
        actualTime: '',
        status: '',
        visitors: '',
        receptionSpec: '',
        receptionLocation: '',
        customerDemand: '',
        content: '', // 沟通内容（富文本 HTML）
        attachmentList: [], // 接待附件（解析后的对象数组）
        feedback: '',
        plusServicesList: [],
        plusServicesDetail: '',
        plusServicesExecution: '',
        createTime: '',
        updateTime: '',
        cancelReason: '',
    });

    // 待办事项数据
    const todoList = ref<any[]>([]);

    // 待办事项表格列配置（只读）
    const todoTableColumns = computed(() => [
        {
            title: '序号',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_row: any, index: number) => index + 1,
        },
        {
            title: '待办事项',
            key: 'todoContent',
            minWidth: 180,
            ellipsis: { tooltip: true },
            render: (row: any) => row.todoContent || '--',
        },
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
        {
            title: '延期原因',
            key: 'delayReason',
            width: 140,
            ellipsis: { tooltip: true },
            render: (row: any) => row.delayReason || '--',
        },
        {
            title: '负责人',
            key: 'principalList',
            width: 140,
            ellipsis: { tooltip: true },
            render: (row: any) => {
                const names = row.principalList.map((item: any) => item.username).join('、');
                return names || '--';
            },
        },
        { title: '截止时间', key: 'dueTime', width: 160, render: (row: any) => row.dueTime || '--' },
        { title: '完成时间', key: 'completeTime', width: 160, render: (row: any) => row.completeTime || '--' },
        {
            title: '附件',
            key: 'attachmentList',
            width: 200,
            render: (row: any) => {
                const files = row.attachmentList;
                if (!files.length) return '--';
                return h(
                    NSpace,
                    { vertical: true, size: 4 },
                    {
                        default: () =>
                            files.map((f: any) =>
                                h(
                                    'a',
                                    {
                                        href: f.url,
                                        target: '_blank',
                                        style: { color: '#2C65F2', cursor: 'pointer' },
                                    },
                                    f.name
                                )
                            ),
                    }
                );
            },
        },
        {
            title: '备注',
            key: 'remarks',
            width: 150,
            ellipsis: { tooltip: true },
            render: (row: any) => row.remarks || '--',
        },
    ]);

    // 打开详情抽屉
    const openDetail = (row: any) => {
        currentDetailId.value = row.id;
        detailPopShow.value = true;
    };

    // ========== 事件处理 ==========
    const addEvt = () => {
        router.push({ path: '/customerManage/visitRecord/add' });
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
            (searchForm as any)[key] = key === 'customerName' ? '' : null;
        });
        handleSearch({});
    };

    // ========== 取消来访 ==========
    const cancelPopShow = ref(false);
    const cancelForm = reactive({ reason: '' });
    const cancelRules = {
        reason: { required: true, message: '请输入取消原因', trigger: 'blur' },
    };
    const currentRow = ref<any>(null);
    const submitCancel = (formRef: any) => {
        formRef?.validate(async (errors: any) => {
            if (!errors) {
                try {
                    let res = await cancelVisitRecordApi({ id: currentRow.value.id, cancelReason: cancelForm.reason });
                    if (res.code === 200 && res.data === true) {
                        cancelPopShow.value = false;
                        cancelForm.reason = '';
                        currentRow.value = null;
                        getList();
                    }
                } catch (e) {
                    console.error('取消来访失败', e);
                }
            }
        });
    };

    // ========== 归档弹窗 ==========
    const archivePopShow = ref(false);
    const archiveRow = ref<any>(null);
    const handleArchiveConfirm = async () => {
        try {
            let res = await archiveVisitRecordApi(archiveRow.value.id);
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
        loadReceptionSpecDict();
        getList();
    });

    return {
        checkPermission,
        // 搜索相关
        searchForm,
        queryConfiguration,
        // 数据加载
        tableLoading,
        detailLoading,
        getList,
        handleSearch,
        handleReset,
        // 按钮事件
        addEvt,
        tableConfig,
        // 详情抽屉
        receptionSpecMap,
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
        visitTypeMap,
        // 取消来访
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
