import { ref, reactive, h, computed, onMounted, watch, resolveComponent } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace } from 'naive-ui';
import {
    getCustomerBasePageApi,
    getCustomerBaseApi,
    deleteCustomerBaseApi,
    adjustStarLevelApi,
    getVisitRecordPageApi,
    getVisitPlanPageApi,
    getCustomerCarePageApi,
    getCustomerPlusServicePageApi,
} from '@/api/customerManage';
import { queryChemicalCompanyListApi } from '@/api/chemicalCompany';
import { getContractSalePage } from '@/api/contractManage';
import { getPaymentPageApi } from '@/api/payment';
import { normalizePaymentRecord } from '@/views/settlementManage/payment/utils';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_OPTIONS, STAR_LEVEL_MAP, STAR_LEVEL_SHORT_MAP } from '@/config/customer';
import { paymentStatusMap } from '@/constants/payment';
import { checkPermission } from '@/utils/comm';
import dayjs from 'dayjs';

export default () => {
    const router = useRouter();

    let adjustStarPopShow = ref(false);
    const currentRow = ref<any>(null);
    const tableLoading = ref(false);
    const detailDrawerShow = ref(false); // 详情抽屉显示状态

    // 客户类型映射
    const customerTypeMap: Record<string, string> = {
        CHEMICAL: '化工企业',
        TRADER: '贸易商',
    };

    // 客户星级映射
    const starLevelMap = STAR_LEVEL_MAP;
    const starLevelShortMap = STAR_LEVEL_SHORT_MAP;

    // 单据状态映射
    const STATUS_MAP: Record<string, { text: string; color: string }> = {
        DRAFT: { text: '草稿', color: '#FCBD12' },
        STORAGE: { text: '已入库', color: '#18D851' },
    };

    // 区域字典映射（code → name）
    const regionMap = ref<Record<string, string>>({});
    // 产品字典映射（code → name）
    const coreProductMap = ref<Record<string, string>>({});
    // 供方单位字典映射（code → name）
    const supplierUnitMap = ref<Record<string, string>>({});
    // 加载状态
    const isLoadingRegionDict = ref(false);

    // 构建字典映射的通用函数
    const buildDictMap = (list: any[] | undefined): Record<string, string> => {
        if (!Array.isArray(list)) {
            return {};
        }
        const map: Record<string, string> = {};
        list.forEach((item: any) => {
            if (item && typeof item.code === 'string' && typeof item.name === 'string') {
                map[item.code] = item.name;
            }
        });
        return map;
    };

    // 加载区域字典xa
    const loadRegionDict = async (): Promise<{ success: boolean; error?: string }> => {
        // 防止重复请求
        if (isLoadingRegionDict.value) {
            return { success: false, error: '请求正在进行中' };
        }

        isLoadingRegionDict.value = true;
        try {
            const res = await getDictMapApi({ parentCodes: [enumCfg['区域类型'], enumCfg['核心产品类型'], enumCfg['供方单位']] });

            // 验证响应结构
            if (!res || typeof res !== 'object') {
                throw new Error('无效的响应格式');
            }

            if (res.code === 200) {
                // 验证 data 字段
                if (!res.data || typeof res.data !== 'object') {
                    throw new Error('响应数据格式错误');
                }

                const regionList = res.data[enumCfg['区域类型']];
                const coreProductList = res.data[enumCfg['核心产品类型']];
                const supplierUnitList = res.data[enumCfg['供方单位']];

                // 构建并更新映射
                regionMap.value = buildDictMap(regionList);
                coreProductMap.value = buildDictMap(coreProductList);
                supplierUnitMap.value = buildDictMap(supplierUnitList);
                console.log('regionMap', regionMap.value);

                return { success: true };
            } else {
                const errorMsg = res.message || `请求失败，错误码: ${res.code}`;
                console.error('加载区域字典失败:', errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : '未知错误';
            console.error('加载区域字典异常:', errorMessage, e);
            return { success: false, error: errorMessage };
        } finally {
            isLoadingRegionDict.value = false;
        }
    };

    // ========== 搜索表单 ==========
    const searchForm = reactive({
        customerName: '',
        starLevel: null as string | null,
        customerType: null as string | null,
        status: null as string | null,
        cooperationStatus: null as string | null,
        createTimeRange: undefined as [string, string] | undefined,
    });

    // 客户类型选项
    const customerTypeOptions = [
        { label: '化工企业', value: 'CHEMICAL' },
        { label: '贸易商', value: 'TRADER' },
    ];

    // 审核状态选项
    const auditStatusOptions = [
        { label: '草稿', value: 'DRAFT' },
        { label: '已入库', value: 'STORAGE' },
    ];

    // 合作状态选项
    const cooperationStatusOptions = [
        { label: '正常', value: 'NORMAL' },
        { label: '暂停', value: 'SUSPENDED' },
        { label: '终止', value: 'TERMINATED' },
    ];

    // 搜索栏配置
    const queryConfiguration = [
        { type: 'input', label: '', value: 'customerName', placeholder: '企业单位名称' },
        {
            type: 'select',
            label: '客户星级',
            value: 'starLevel',
            placeholder: '请选择客户星级',
            options: STAR_LEVEL_OPTIONS,
        },
        {
            type: 'select',
            label: '客户类型',
            value: 'customerType',
            placeholder: '请选择客户类型',
            options: customerTypeOptions,
        },
        {
            type: 'select',
            label: '单据状态',
            value: 'status',
            placeholder: '请选择单据状态',
            options: auditStatusOptions,
        },
        {
            type: 'select',
            label: '合作状态',
            value: 'cooperationStatus',
            placeholder: '请选择合作状态',
            options: cooperationStatusOptions,
        },
        {
            type: 'dateTimeRange',
            // label: '创建时间',
            value: 'createTimeRange',
            leftPlaceholder: '创建开始时间',
            rightPlaceholder: '创建结束时间',
        },
    ];
    let currentCustomerId = ref(''); // ，用于存储当前客户编码
    let currentDetailRecordId = ref<number | string | null>(null); // 用于存储当前打开Tab表格详情的记录ID
    let currentDetailType = ref<string>(''); // 用于存储当前打开详情的类型（visit/visitRecord/care/research）
    const currentDetailRow = ref<Record<string, any>>({}); // 缓存当前行数据，调研详情可先展示列表行信息再请求完整详情
    // 表格配置
    const tableConfig = ref<any>({
        // 表头
        columns: [
            { title: '客户编码', key: 'customerCode', width: 120 },
            { title: '企业单位名称', key: 'customerName', width: 180 },
            {
                title: '客户类型',
                key: 'customerType',
                width: 100,
                render: (row: any) => customerTypeMap[row.customerType] || row.customerTypeName || row.customerType,
            },
            {
                title: '区域',
                key: 'region',
                width: 80,
                render: (row: any) => regionMap.value[row.region] || row.region || '--',
            },
            { title: '客户经理', key: 'manager', width: 100, render: (row: any) => row.manager.map((item: any) => item.username).join('、') || '--', },
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
                        }
                    );
                },
            },
            {
                title: '核心产品',
                key: 'coreProduct',
                width: 100,
                render: (row: any) =>
                    row.coreProduct
                        ?.split(',')
                        .map((v: string) => coreProductMap.value[v])
                        .join(', ') || '--',
            },
            {
                title: '合作状态',
                key: 'cooperationStatus',
                width: 100,
                render: (row: any) => {
                    const colorMap: Record<string, string> = {
                        NORMAL: '#18D851',
                        SUSPENDED: '#FCBD12',
                        TERMINATED: '#C4C4C4',
                    };
                    const labelMap: Record<string, string> = {
                        NORMAL: '正常',
                        SUSPENDED: '暂停',
                        TERMINATED: '终止',
                    };
                    const color = colorMap[row.cooperationStatus] || '#C4C4C4';
                    const text = row.status === 'STORAGE' ? labelMap[row.cooperationStatus] || '--' : '--';
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
                                        backgroundColor: color,
                                        display: row.status === 'STORAGE' && row.cooperationStatus ? 'block' : 'none',
                                    },
                                }),
                                h('span', null, text),
                            ],
                        }
                    );
                },
            },
            {
                title: '客户星级',
                key: 'starLevel',
                width: 100,
                render: (row: any) => starLevelMap[row.starLevel] || row.starLevelName || row.starLevel,
            },
            {
                title: '合作年限',
                key: 'cooperationStartDate',
                width: 100,
                render: (row: any) => {
                    if (!row.cooperationDuration) return '--';
                    return row.cooperationDuration;
                },
            },
            {
                title: '历史合作总量（万吨）',
                key: 'cooperationTotal',
                width: 150,
                render: (row: any) => row.cooperationTotal || '--',
            },
            {
                title: '创建时间',
                key: 'createdAt',
                width: 160,
                render: (row: any) => row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '--',
            },
        ],
        // 表格数据
        tableList: [],
        // 操作按钮
        tableBtns: [
            {
                btnName: '详情',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'STORAGE',
                clickTableBtns: (row: any) => {
                    // 跳转到详情页面
                    router.push({
                        path: `/customerManage/customerArchive/detail`,
                        query: { id: row.id },
                    });
                },
            },
            {
                btnName: '编辑',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => checkPermission(["crm:customer_archive:edit"]),
                clickTableBtns: (row: any) => {
                    router.push({ path: '/customerManage/customerArchive/edit', query: { id: row.id } });
                },
            },
            {
                btnName: '删除',
                btnColor: 'var(--web-error-tag-c)',
                isBtnHide: (row: any) => row.status === 'DRAFT' && checkPermission(["crm:customer_archive:delete"]),
                clickTableBtns: async (row: any) => {
                    await deleteCustomerBaseApi(row.id);
                    getList();
                },
            },
            {
                btnName: '调整星级',
                btnColor: 'var(--web-success-tag-c)',
                isBtnHide: (row: any) => row.status === 'STORAGE' && checkPermission(["crm:customer_archive:adjustStar"]),
                clickTableBtns: (row: any) => {
                    currentRow.value = row;
                    adjustStarForm.starLevel = null;
                    adjustStarForm.reason = '';
                    adjustStarPopShow.value = true;
                },
            },
        ],
        isShowPagination: true,
        // 分页
        paginationConfig: {
            // 分页参数
            pagConfig: {
                page: 1,
                pageSize: 20,
                total: 0,
                showSizePicker: false,
                pageSizes: [10, 20, 50, 100],
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
            // 清除空值参数
            Object.keys(params).forEach((key) => {
                if (params[key] === null || params[key] === '' || params[key] === undefined) {
                    delete params[key];
                }
            });
            // 拆分创建时间范围
            if (params.createTimeRange && Array.isArray(params.createTimeRange) && params.createTimeRange.length === 2) {
                params.createTimeStart = params.createTimeRange[0];
                params.createTimeEnd = params.createTimeRange[1];
                delete params.createTimeRange;
            }
            const res: any = await getCustomerBasePageApi(params);
            if (res?.data) {
                tableConfig.value.tableList = res.data.records || [];
                pagConfig.total = res.data.total || 0;
            }
        } finally {
            tableLoading.value = false;
        }
    };

    // ========== 详情页 ==========
    const activeTab = ref('basic');
    const tabList = [
        { label: '基础信息', value: 'basic' },
        { label: '来访记录', value: 'visit' },
        { label: '拜访记录', value: 'visitRecord' },
        { label: '关怀记录', value: 'care' },
        { label: '调研记录', value: 'research' },
        { label: '合同记录', value: 'contract' },
        { label: '回款记录', value: 'payment' },
        { label: '增值服务', value: 'valueAdded' },
    ];

    // 监听tab切换，加载对应数据
    watch(activeTab, (newTab) => {
        console.log('activeTab', newTab);

        if (newTab !== 'basic') {
            loadTabData(newTab, 1, 10);
        }
    });

    // 详情数据
    const detailData = reactive<any>({
        customerName: '',
        customerCode: '',
        customerType: '',
        starLevel: '',
        region: '',
        status: '',
        cooperationStartDate: '',
        latestCooperationDate: '',
        cooperationTotal: '',
        riskInfo: '',
        cooperationProcessExplanation: '',
        remark: '',
        chemicalList: [],
        traderList: [],
        contactList: [],
    });

    // 加载详情数据
    const detailLoading = ref(false);
    const loadDetail = async (id: number) => {
        detailLoading.value = true;
        try {
            const res: any = await getCustomerBaseApi(id);
            if (res?.data) {
                Object.assign(detailData, res.data);
                // 使用id作为customerCode存储
                currentCustomerId.value = String(id);
            }
        } finally {
            detailLoading.value = false;
        }
    };

    // 详情页化工厂表格列
    const detailChemicalColumns = [
        { title: '核心产品', key: 'coreProduct', width: 120, render: (row: any) => coreProductMap.value[row.coreProduct] || row.coreProduct || '--' },
        { title: '厂区地址', key: 'factoryAddress', width: 200, render: (row: any) => row.factoryAddress || '--' },
        { title: '产能(万吨/年)', key: 'capacity', width: 120, render: (row: any) => row.capacity || '--' },
        { title: '矿石需求(万吨/年)', key: 'oreDemand', width: 140, render: (row: any) => row.oreDemand || '--' },
        {
            title: '洗选能力(万吨/日)',
            key: 'washingCapacity',
            width: 140,
            render: (row: any) => row.washingCapacity || '--',
        },
        { title: '开工率(%)', key: 'operatingRate', width: 100, render: (row: any) => row.operatingRate || '--' },
    ];

    // 详情页贸易商表格列
    const detailTraderColumns = [
        {
            title: '核心产品',
            key: 'coreProduct',
            width: 120,
            render: (row: any) => coreProductMap.value[row.coreProduct] || row.coreProduct || '--',
        },
        { title: '厂区地址', key: 'factoryAddress', width: 200, render: (row: any) => row.factoryAddress || '--' },
        { title: '贸易规模(万吨/年)', key: 'tradeScale', width: 140, render: (row: any) => row.tradeScale || '--' },
        {
            title: '可用资金(万元)',
            key: 'availableFunds',
            width: 130,
            render: (row: any) => row.availableFunds || '--',
        },
        {
            title: '下游供应企业',
            key: 'downstreamEnterprises',
            width: 150,
            render: (row: any) => row.downstreamEnterprises || '--',
        },
        {
            title: '物流合作渠道',
            key: 'logisticsChannels',
            width: 140,
            render: (row: any) => row.logisticsChannels || '--',
        },
    ];

    // 详情页联系人表格列
    const detailContactColumns = [
        { title: '姓名', key: 'contactName', width: 100, render: (row: any) => row.contactName || '--' },
        { title: '职务', key: 'position', width: 120, render: (row: any) => row.position || '--' },
        { title: '联系方式', key: 'phone', width: 140, render: (row: any) => row.phone || '--' },
        { title: '负责内容', key: 'responsibility', width: 150, render: (row: any) => row.responsibility || '--' },
        { title: '生日', key: 'birthday', width: 130, render: (row: any) => row.birthday || '--' },
        { title: '备注', key: 'remark', width: 150, render: (row: any) => row.remark || '--' },
    ];

    // 详情页动态表格配置
    const detailFactoryTableConfig = computed(() => ({
        columns: detailData.customerType === 'CHEMICAL' ? detailChemicalColumns : detailTraderColumns,
    }));

    // ========== 加载各Tab表格数据 ==========

    /**
     * 加载来访记录
     */
    const loadVisitList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await getVisitRecordPageApi({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            visitList.value = data?.records || [];
            visitPagination.itemCount = data?.total || 0;
            visitPagination.page = page;
            visitPagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载来访记录失败:', error);
        }
    };

    /**
     * 加载拜访记录
     */
    const loadVisitRecordList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await getVisitPlanPageApi({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            visitRecordList.value = data?.records || [];
            visitRecordPagination.itemCount = data?.total || 0;
            visitRecordPagination.page = page;
            visitRecordPagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载拜访记录失败:', error);
        }
    };

    /**
     * 加载关怀记录
     */
    const loadCareList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await getCustomerCarePageApi({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            careList.value = data?.records || [];
            carePagination.itemCount = data?.total || 0;
            carePagination.page = page;
            carePagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载关怀记录失败:', error);
        }
    };

    /**
     *加载调研记录
     */
    const loadResearchList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await queryChemicalCompanyListApi({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            researchList.value = data?.records || [];
            researchPagination.itemCount = data?.total || 0;
            researchPagination.page = page;
            researchPagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载调研记录失败:', error);
        }
    };
    // 加载合同记录
    const loadContractList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await getContractSalePage({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            contractList.value = data?.records || [];
            contractPagination.itemCount = data?.total || 0;
            contractPagination.page = page;
            contractPagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载合同记录失败:', error);
        }
    };

    // 加载增值服务
    const loadValueAddedList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await getCustomerPlusServicePageApi({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            valueAddedList.value = data?.records || [];
            valueAddedPagination.itemCount = data?.total || 0;
            valueAddedPagination.page = page;
            valueAddedPagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载增值服务失败:', error);
        }
    };

    /**
     * 加载回款记录
     */
    const loadPaymentList = async (page = 1, pageSize = 20) => {
        if (!currentCustomerId.value) return;
        try {
            const res: any = await getPaymentPageApi({
                current: page,
                size: pageSize,
                customerId: currentCustomerId.value,
            });
            const data = res?.data || {};
            paymentList.value = (data?.records || []).map((item: any) => normalizePaymentRecord(item));
            paymentPagination.itemCount = data?.total || 0;
            paymentPagination.page = page;
            paymentPagination.pageSize = pageSize;
        } catch (error) {
            console.error('加载回款记录失败:', error);
        }
    };

    /**
     * 根据tab切换加载对应数据
     */
    const loadTabData = (tab: string, page = 1, pageSize = 20) => {
        switch (tab) {
            case 'visit':
                loadVisitList(page, pageSize);
                break;
            case 'visitRecord':
                loadVisitRecordList(page, pageSize);
                break;
            case 'care':
                loadCareList(page, pageSize);
                break;
            case 'research':
                loadResearchList(page, pageSize);
                break;
            case 'contract':
                loadContractList(page, pageSize);
                break;
            case 'payment':
                loadPaymentList(page, pageSize);
                break;
            case 'valueAdded':
                loadValueAddedList(page, pageSize);
                break;
        }
    };
    // 访问类型
    const visitTypeMap: Record<string, string> = {
        APPOINTMENT: '提前预约',
        TEMPORARY: '临时通知',
    };

    // ========== 各Tab表格配置 ==========
    // 单据状态
    const RecordStatusMap: Record<string, { text: string; color: string }> = {
        PENDING: { text: '待接待', color: '#FCBD12' },
        COMPLETED: { text: '已接待', color: '#1890FF' },
        ARCHIVED: { text: '已归档', color: '#18D851' },
        CANCELLED: { text: '已取消', color: '#C4C4C4' },
    };
    // 来访记录
    const visitColumns = [
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
                const status = RecordStatusMap[row.status] || { text: row.status, color: '#999' };
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
        // { title: '接待地点', key: 'receptionLocation', width: 120 },
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
        { title: '取消原因', key: 'cancelReason', width: 150, ellipsis: { tooltip: true }, render: (row: any) => row.cancelReason || '--' },
    ];
    const visitList = ref<any[]>([]);
    const visitPagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });
    // 拜访记录单据状态映射
    const visitStatusMap: Record<string, { text: string; color: string }> = {
        PENDING: { text: '待拜访', color: '#FCBD12' },
        COMPLETED: { text: '已拜访', color: '#1890FF' },
        ARCHIVED: { text: '已归档', color: '#18D851' },
        CANCELLED: { text: '已取消', color: '#C4C4C4' },
    };

    // 拜访目的字典映射
    const visitPurposeMap = ref<Record<string, string>>({});

    // 关怀类型字典映射
    const careTypeMap = ref<Record<string, string>>({});

    // 执行方式字典映射
    const careMethodMap = ref<Record<string, string>>({});

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

    // 拜访记录
    const visitRecordColumns = [
        { title: '企业单位名称', key: 'customerName', width: 150 },
        {
            title: '客户星级',
            key: 'starLevel',
            width: 100,
            render: (row: any) => starLevelShortMap[row.starLevel] || row.starLevel || '--',
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
            render: (row: any) => row.executorList.map((i: any) => i.username).join('、') || '--',
        },
        {
            title: '客户对接人',
            key: 'contactPersonList',
            width: 120,
            render: (row: any) => row.contactPersonList.map((i: any) => i.label).join('、') || '--',
        },
        { title: '拜访要求', key: 'visitRequirements', width: 120, render: (row: any) => row.visitRequirements || '--' },
        { title: '实际拜访时间', key: 'actualTime', width: 140, render: (row: any) => row.actualTime || '--' },
        { title: '拜访反馈', key: 'feedback', width: 120, render: (row: any) => row.feedback || '--' },
        { title: '取消原因', key: 'cancelReason', width: 150, render: (row: any) => row.cancelReason || '--' },
    ];
    const visitRecordList = ref<any[]>([]);
    const visitRecordPagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });

    // 关怀记录
    const careStatusMap: Record<string, { text: string; color: string }> = {
        PENDING: { text: '待执行', color: '#FCBD12' },
        COMPLETED: { text: '已完成', color: '#1890FF' },
        ARCHIVED: { text: '已归档', color: '#18D851' },
        CANCELLED: { text: '已取消', color: '#C4C4C4' },
    };

    const careColumns = [
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
                const status = careStatusMap[row.status] || { text: row.status, color: '#999' };
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
            key: 'executorList',
            width: 140,
            ellipsis: { tooltip: true },
            render: (row: any) => row.executorList.map((i: any) => i.username).join('、') || '--',
        },
        { title: '实际关怀时间', key: 'actualTime', width: 140, render: (row: any) => row.actualTime || '--' },
        { title: '客户反馈', key: 'feedback', width: 120, render: (row: any) => row.feedback || '--' },
        { title: '取消原因', key: 'cancelReason', width: 150, render: (row: any) => row.cancelReason || '--' },
    ];
    const careList = ref<any[]>([]);
    const carePagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });

    // 调研记录
    const researchColumns = [
        { title: '企业单位名称', key: 'enterpriseName', width: 150 },
        {
            title: '区域',
            key: 'region',
            width: 120,
            render: (row: any) => {
                const MxDict = resolveComponent('MxDict');
                return h(MxDict as any, {
                    modelValue: row.region,
                    placeholder: '请选择',
                    size: 'small',
                    text: true,
                    dictType: '区域类型',
                });
            },
        },
        { title: '调研月份', key: 'surveyMonth', width: 100 },
        {
            title: '单据状态',
            key: 'status',
            width: 90,
            render: (row: any) => {
                const getStatusColor = (status: string) => (status === 'ARCHIVED' ? '#18D851' : '#F3B51B');
                const getStatusText = (status: string) => {
                    if (status === 'ARCHIVED') return '已归档';
                    if (status === 'DRAFT') return '草稿';
                    return '--';
                };
                return h('span', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
                    h('span', {
                        style: {
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(row.status),
                        },
                    }),
                    h('span', { style: { fontSize: '14px' } }, row.statusName || getStatusText(row.status)),
                ]);
            },
        },
        { title: '库存(万吨)', key: 'inventory', width: 120 },
        { title: '开工率', key: 'operatingRate', width: 100 },
        {
            title: '企业主要产品规模',
            key: 'mainProductScale',
            width: 160,
            render: (row: any) => row.mainProductScale || '--',
        },
        { title: '下月采购计划(万吨)', key: 'nextMonthPlan', width: 160 },
    ];
    const researchList = ref<any[]>([]);
    const researchPagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });

    // 合同记录
    const contractStatusConfig = [
        { label: '草稿', value: 'DRAFT' },
        { label: '审核中', value: 'AUDITING' },
        { label: '执行中', value: 'EXECUTING' },
        { label: '已归档', value: 'ARCHIVED' },
        { label: '已作废', value: 'INVALID' },
    ];
    const contractColumns = [
        { key: 'contractCode', title: '合同编号', width: 200 },
        { key: 'supplierUnit', title: '供方单位', width: 200, render: (row: any) => supplierUnitMap.value[row.supplierUnit] || row.supplierUnit || '--' },
        { key: 'customerName', title: '需方单位', width: 200 },
        {
            key: 'status',
            title: '合同状态',
            width: 200,
            render: (row: any) => {
                let obj = contractStatusConfig.find((item: any) => item.value === row.status);
                return obj?.label || '--';
            },
        },
        { key: 'shipmentMonth', title: '发货月份', width: 200 },
        { key: 'totalAmount', title: '含税总金额(万元)', width: 200 },
        { key: 'contractInitiatorName', title: '合同发起人', width: 200 },
        {
            key: 'changeSummary',
            title: '定价变更摘要',
            width: 200,
            render: (row): any => {
                return h('span', {}, row.changeSummary || '--');
            },
        },
        {
            key: 'terminationReason',
            title: '作废原因',
            width: 200,
            render: (row: any) => {
                return h('span', {}, row.terminationReason || '--');
            },
        },
    ];
    const contractList = ref<any[]>([]);
    const contractPagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });

    // 回款记录
    const paymentColumns = [
        {
            key: 'receiptCode',
            title: '回款单编号',
            width: 160,
        },
        {
            key: 'customerName',
            title: '企业名称',
            width: 200,
        },
        {
            key: 'handlerName',
            title: '跟单人',
            width: 80,
        },
        {
            key: 'status',
            title: '状态',
            width: 140,
            render(row: any) {
                const color = paymentStatusMap[row.status]?.iconColor || 'var(--base-grey)';
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
                                    backgroundColor: color,
                                },
                            }),
                            h('span', null, paymentStatusMap[row.status]?.label),
                        ],
                    }
                );
            },
        },
        {
            key: 'contractCode',
            title: '合同编号',
            width: 160,
        },
        {
            key: 'amountDue',
            title: '应收金额',
            width: 120,
        },
        {
            key: 'amountPaid',
            title: '已收金额',
            width: 120,
        },
        {
            key: 'amountUnpaid',
            title: '未收金额',
            width: 120,
        },
        {
            key: 'plannedDate',
            title: '计划回款日',
            width: 120,
        },
        {
            key: 'actualDate',
            title: '实际回款日',
            width: 120,
            render: (row: any) => row.actualDate || '--',
        },
        {
            key: 'collectionCount',
            title: '催收次数',
            width: 80,
        },
        {
            key: 'lastCollectionTime',
            title: '最新催收时间',
            width: 120,
            render: (row: any) => row.lastCollectionTime || '--',
        },
    ];
    const paymentList = ref<any[]>([]);
    const paymentPagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });

    // 增值服务
    const valueAddedColumns = [
        { title: '企业单位名称', key: 'customerName', ellipsis: { tooltip: true } },
        { title: '服务类型', key: 'interactionTypeName', render: (row: any) => row.interactionTypeName || '--' },
        {
            title: '增值服务',
            key: 'plusServicesList',
            ellipsis: { tooltip: true },
            render: (row: any) => row.plusServicesList?.join('、') || '--',
        },
        {
            title: '增值服务服务详情',
            key: 'plusServicesDetail',
            ellipsis: { tooltip: true },
            render: (row: any) => row.plusServicesDetail || '--',
        },
        {
            title: '增值服务执行情况',
            key: 'plusServicesExecution',
            ellipsis: { tooltip: true },
            render: (row: any) => row.plusServicesExecution || '--',
        },
        { title: '归档日期', key: 'updatedAt', render: (row: any) => row.updatedAt ? dayjs(row.updatedAt).format('YYYY-MM-DD') : '--' },
    ];
    const valueAddedList = ref<any[]>([]);
    const valueAddedPagination = reactive({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        showSizePicker: false,
        pageSizes: [10, 20, 50],
    });

    // 创建分页配置（统一格式，供各 tab 复用）
    const createPaginationConfig = (tab: string, pagination: any) => ({
        pagConfig: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.itemCount,
            showSizePicker: pagination.showSizePicker,
            pageSizes: pagination.pageSizes,
        },
        showTotal: true,
        onPageChange: (page: number) => {
            loadTabData(tab, page, pagination.pageSize);
        },
    });

    // tab 表格配置映射
    const tabTableConfig = computed(() => {
        const configMap: Record<string, any> = {
            visit: {
                flexHeight: true,
                columns: visitColumns,
                tableList: visitList.value,
                isShowIndex: true,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('visit', visitPagination),
                tableBtns: [
                    {
                        btnName: '详情',
                        btnColor: 'var(--web-success-tag-c)',
                        isBtnHide: (row: any) => row.status === 'ARCHIVED' || row.status === 'CANCELLED',
                        clickTableBtns: (row: any) => {
                            currentDetailRecordId.value = row.id;
                            currentDetailType.value = 'visit';
                            detailDrawerShow.value = true;
                        },
                    },
                ],
            },
            visitRecord: {
                columns: visitRecordColumns,
                tableList: visitRecordList.value,
                isShowIndex: true,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('visitRecord', visitRecordPagination),
                tableBtns: [
                    {
                        btnName: '详情',
                        btnColor: 'var(--web-success-tag-c)',
                        isBtnHide: (row: any) => row.status === 'CANCELLED' || row.status === 'ARCHIVED',
                        clickTableBtns: (row: any) => {
                            currentDetailRecordId.value = row.id;
                            currentDetailType.value = 'visitRecord';
                            detailDrawerShow.value = true;
                        },
                    },
                ],
            },
            care: {
                columns: careColumns,
                tableList: careList.value,
                isShowIndex: true,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('care', carePagination),
                tableBtns: [
                    {
                        btnName: '详情',
                        btnColor: 'var(--web-success-tag-c)',
                        isBtnHide: (row: any) => ['ARCHIVED', 'CANCELLED'].includes(row.status),
                        clickTableBtns: (row: any) => {
                            currentDetailRecordId.value = row.id;
                            currentDetailType.value = 'care';
                            detailDrawerShow.value = true;
                        },
                    },
                    {
                        btnName: '--',
                        btnColor: 'var(--web-default-tag-c)',
                        isBtnHide: (row: any) => !['ARCHIVED', 'CANCELLED'].includes(row.status),
                    },
                ],
            },
            research: {
                columns: researchColumns,
                tableList: researchList.value,
                isShowIndex: true,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('research', researchPagination),
                tableBtns: [
                    {
                        btnName: '详情',
                        btnColor: 'var(--web-success-tag-c)',
                        isBtnHide: (row: any) => ['ARCHIVED'].includes(row.status),
                        clickTableBtns: (row: any) => {
                            currentDetailRecordId.value = row.id;
                            currentDetailType.value = 'research';
                            currentDetailRow.value = { ...row };
                            detailDrawerShow.value = true;
                        },
                    },
                ],
            },
            contract: {
                columns: contractColumns,
                tableList: contractList.value,
                isShowIndex: false,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('contract', contractPagination),
                tableBtns: [
                    {
                        btnName: '详情',
                        btnColor: 'var(--web-success-tag-c)',
                        clickTableBtns: (row: any) =>
                            router.push({ path: '/salesContract/detail', query: { id: row.id } }),
                    },
                ],
            },
            payment: {
                columns: paymentColumns,
                tableList: paymentList.value,
                isShowIndex: true,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('payment', paymentPagination),
                tableBtns: [
                    {
                        btnName: '详情',
                        btnColor: 'var(--web-success-tag-c)',
                        clickTableBtns: (row: any) =>
                            router.push({ path: '/settlementManage/payment/detail', query: { id: row.id } }),
                    },
                ],
            },
            valueAdded: {
                columns: valueAddedColumns,
                tableList: valueAddedList.value,
                isShowIndex: true,
                isShowPagination: true,
                paginationConfig: createPaginationConfig('valueAdded', valueAddedPagination),
            },
        };
        return configMap[activeTab.value] || null;
    });

    // ========== 事件处理 ==========
    // 点击新增按钮
    const addEvt = () => {
        router.push({ path: '/customerManage/customerArchive/add' });
    };

    // 查询事件
    const handleSearch = (queryObj: any) => {
        Object.keys(searchForm).forEach((key) => {
            (searchForm as any)[key] = queryObj?.[key] ?? (key === 'customerName' ? '' : null);
        });
        console.log(searchForm);
        tableConfig.value.paginationConfig.pagConfig.page = 1;
        getList();
    };

    // ========== 调整星级 ==========
    const adjustStarForm = reactive({
        starLevel: null as string | null,
        reason: '',
    });

    const adjustStarRules = {
        starLevel: { required: true, message: '请选择客户星级', trigger: ['blur', 'change'] },
        reason: { required: true, message: '请输入调整原因', trigger: 'blur' },
    };

    const submitAdjustStar = (formRef: any) => {
        formRef?.validate(async (errors: any) => {
            if (!errors) {
                await adjustStarLevelApi({
                    id: currentRow.value.id,
                    starLevel: adjustStarForm.starLevel as any,
                    adjustReason: adjustStarForm.reason,
                });
                adjustStarPopShow.value = false;
                adjustStarForm.starLevel = null;
                adjustStarForm.reason = '';
                getList();
            }
        });
    };

    // 初始化
    onMounted(() => {
        getList();
        loadRegionDict();
        loadVisitPurposeDict();
        loadCareDicts();
    });

    return {
        checkPermission,
        // 搜索相关
        searchForm,
        queryConfiguration,
        customerTypeOptions,
        auditStatusOptions,
        cooperationStatusOptions,
        // 星级配置
        starLevelMap,
        STAR_LEVEL_OPTIONS,
        handleSearch,
        // 按钮事件
        addEvt,
        tableConfig,
        tableLoading,
        detailLoading,
        adjustStarPopShow,
        adjustStarForm,
        adjustStarRules,
        submitAdjustStar,
        // 详情页
        activeTab,
        tabList,
        detailData,
        detailFactoryTableConfig,
        detailContactColumns,
        tabTableConfig,
        customerTypeMap,
        STATUS_MAP,
        regionMap,
        coreProductMap,
        supplierUnitMap,
        visitPurposeMap,
        careTypeMap,
        careMethodMap,
        loadDetail,
        loadTabData,
        visitPagination,
        visitRecordPagination,
        carePagination,
        valueAddedPagination,
        paymentPagination,
        currentDetailRecordId,
        currentDetailType,
        currentDetailRow,
        detailDrawerShow,
    };
};
