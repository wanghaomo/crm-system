import { ref, reactive, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace, useDialog } from 'naive-ui';
import {
    queryCompetitorBaseListApi,
    deleteCompetitorBaseApi,
    queryCompetitorBaseDetailApi,
} from '@/api/competitorBase';
import { checkPermission } from '@/utils/comm';

export default () => {
    const router = useRouter();
    const dialog = useDialog();
    const tableLoading = ref(false);

    // 单据状态映射
    const STATUS_MAP: Record<string, { text: string; color: string }> = {
        DRAFT: { text: '草稿', color: '#FCBD12' },
        STORAGE: { text: '已入库', color: '#18D851' },
    };

    // ========== 搜索表单（支持企业名称模糊查询） ==========
    const searchForm = reactive({
        enterpriseName: '',
    });

    // 搜索栏配置
    const queryConfiguration = [
        { type: 'input', label: '', value: 'enterpriseName', placeholder: '企业名称' },
    ];

    // 表格配置
    const tableConfig = ref<any>({
        columns: [
            { title: '企业名称', key: 'enterpriseName', width: 190, ellipsis: { tooltip: true } },
            { title: '矿山名称', key: 'mineName', width: 150, ellipsis: { tooltip: true } },
            {
                title: '资源储存量（万吨）',
                key: 'resourceReserves',
                width: 150,
                render: (row: any) => row.resourceReserves ?? '--',
            },
            {
                title: '设计开采能力（万吨/年）',
                key: 'designCapacity',
                width: 180,
                render: (row: any) => row.designCapacity ?? '--',
            },
            {
                title: '矿山类型',
                key: 'mineType',
                width: 110,
                render: (row: any) => row.mineType || '--',
            },
            {
                title: '年产量（万吨）',
                key: 'yearOutput',
                width: 120,
                render: (row: any) => row.yearOutput ?? '--',
            },
            {
                title: '矿石库存（万吨）',
                key: 'oreStock',
                width: 130,
                render: (row: any) => row.oreStock ?? '--',
            },
            {
                title: '开工率（%）',
                key: 'operatingRate',
                width: 100,
                render: (row: any) => row.operatingRate ?? '--',
            },
            { title: '区域', key: 'region', width: 80, render: (row: any) => row.region || '--' },
            {
                title: '地址',
                key: 'addressRegion',
                width: 200,
                ellipsis: { tooltip: true },
                render: (row: any) => row.addressRegion || '--',
            },
            {
                title: '详细地址',
                key: 'detailAddress',
                width: 180,
                ellipsis: { tooltip: true },
                render: (row: any) => row.detailAddress || '--',
            },
            {
                title: '备注',
                key: 'remark',
                width: 160,
                ellipsis: { tooltip: true },
                render: (row: any) => row.remark || '--',
            },
            {
                title: '单据状态',
                key: 'status',
                width: 100,
                render(row: any) {
                    const st = STATUS_MAP[row.status];
                    const color = st?.color || '#999';
                    const text = st?.text || row.statusName || row.status;
                    return h(
                        NSpace,
                        { align: 'center', size: 8 },
                        {
                            default: () => [
                                h('div', {
                                    style: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color },
                                }),
                                h('span', null, text),
                            ],
                        },
                    );
                },
            },
        ],
        tableList: [],
        // 操作按钮（isBtnHide 返回 true 表示保留显示）
        tableBtns: [
            {
                btnName: '详情',
                btnColor: 'var(--web-success-tag-c)',
                // 已入库可查看详情与调研数据记录
                isBtnHide: (row: any) => row.status === 'STORAGE',
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/competitor/detail', query: { id: row.id } });
                },
            },
            {
                btnName: '编辑',
                btnColor: 'var(--web-success-tag-c)',
                // 草稿与已入库均可编辑（已入库不可修改企业名称、矿山名称）
                isBtnHide: () => checkPermission(['crm:competitor_manage:edit']),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/competitor/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '删除',
                btnColor: 'var(--web-error-tag-c)',
                // 仅草稿状态可删除
                isBtnHide: (row: any) =>
                    row.status === 'DRAFT' && checkPermission(['crm:competitor_manage:delete']),
                clickTableBtns: (row: any) => handleDelete(row),
            },
        ],
        isShowIndex: true,
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
            onPageChange: (page: number) => {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                getList();
            },
            onPageSizeChange: (pageSize: number) => {
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                getList();
            },
        },
        styleOption: {
            padding: '16px',
            paddingBottom: '0px',
        },
    });

    /**
     * 删除竞争对手（二次确认，同步删除调研记录）。
     * @param row 当前行数据
     * @returns 无返回值
     */
    const handleDelete = (row: any) => {
        dialog.warning({
            title: '删除确认',
            content: '该操作会同步删除该对手的调研记录，删除后数据不可恢复，请确认是否删除？',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    await deleteCompetitorBaseApi(row.id);
                    getList();
                } catch (error) {
                    console.error('删除竞争对手失败:', error);
                }
            },
        });
    };

    // ========== 列表数据请求 ==========
    const getList = async () => {
        tableLoading.value = true;
        try {
            const pagConfig = tableConfig.value.paginationConfig.pagConfig;
            const params: any = {
                current: pagConfig.page,
                size: pagConfig.pageSize,
                ...searchForm,
            };
            Object.keys(params).forEach((key) => {
                if (params[key] === null || params[key] === '' || params[key] === undefined) {
                    delete params[key];
                }
            });
            const res: any = await queryCompetitorBaseListApi(params);
            if (res?.data) {
                tableConfig.value.tableList = res.data.records || [];
                pagConfig.total = res.data.total || 0;
            }
        } catch (error) {
            console.error('加载竞争对手列表失败:', error);
        } finally {
            tableLoading.value = false;
        }
    };

    // 点击新增按钮
    const addEvt = () => {
        router.push({ path: '/customerManage/competitor/add' });
    };

    // 查询事件
    const handleSearch = (queryObj: any) => {
        searchForm.enterpriseName = queryObj?.enterpriseName ?? '';
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    // 详情数据加载（供详情页使用，列表页导出便于复用）
    const loadCompetitorDetail = async (id: number) => {
        try {
            const res: any = await queryCompetitorBaseDetailApi(id);
            return res?.data || null;
        } catch (error) {
            console.error('加载竞争对手详情失败:', error);
            return null;
        }
    };

    onMounted(() => {
        getList();
    });

    return {
        queryConfiguration,
        handleSearch,
        tableConfig,
        addEvt,
        tableLoading,
        getList,
        STATUS_MAP,
        loadCompetitorDetail,
        checkPermission,
    };
};
