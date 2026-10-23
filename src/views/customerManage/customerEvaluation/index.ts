import { ref, reactive, onMounted } from 'vue';
import dayjs from 'dayjs';
import {
    getCustomerEvaluationPageApi,
    reevaluateCustomerEvaluationApi,
    getCustomerEvaluationApi,
    getCustomerEvaluationByCodeApi,
} from '@/api/customerManage';
import { STAR_LEVEL_OPTIONS } from '@/config/customer';
import { QueryItem } from '@/types/web-search-bar';

// ==================== 状态 ====================
const showLoading = ref(false); // 加载状态
// 搜索表单数据
const searchForm = reactive({
    companyName: '',
    customerLevel: null as string | null,
    scoreMin: '',
    scoreMax: '',
    evaluationDateRange: null as [number, number] | null,
});

// 评估数据列表
const customerEvaluations = ref<any[]>([]);

// 分页配置
const pagination = reactive({
    page: 1,
    pageSize: 18,
    itemCount: 0,
    showSizePicker: false,
    pageSizes: [12, 24, 36],
    prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
});

// 详情抽屉
const detailPopShow = ref(false);
const currentDetail = ref<any>({});
const detailLoading = ref(false);

// 评估记录详情抽屉
const recordDetailShow = ref(false);
const recordDetailData = ref<any>({});
const recordDetailLoading = ref(false);

// ==================== 方法 ====================

// 加载客户评估列表
const loadCustomerEvaluations = async () => {
    showLoading.value = true;
    try {
        const params: any = {
            current: pagination.page,
            size: pagination.pageSize,
        };

        if (searchForm.companyName?.trim()) {
            params.customerName = searchForm.companyName.trim();
        }
        if (searchForm.customerLevel) {
            params.evaluationLevel = searchForm.customerLevel;
        }
        if (searchForm.scoreMin) {
            params.evaluationScoreMin = Number(searchForm.scoreMin);
        }
        if (searchForm.scoreMax) {
            params.evaluationScoreMax = Number(searchForm.scoreMax);
        }
        if (searchForm.evaluationDateRange && searchForm.evaluationDateRange.length === 2) {
            params.evaluationTimeStart = dayjs(searchForm.evaluationDateRange[0]).format('YYYY-MM-DD 00:00:00');
            params.evaluationTimeEnd = dayjs(searchForm.evaluationDateRange[1]).format('YYYY-MM-DD 23:59:59');
        }

        const res: any = await getCustomerEvaluationPageApi(params);
        const data = res?.data || {};
        customerEvaluations.value = data?.records || [];
        pagination.itemCount = data?.total || 0;
    } catch (error) {
        console.error('加载客户评估列表失败:', error);
    } finally {
        showLoading.value = false;
    }
};

// 查询 - 接收搜索栏组件发出的查询对象
const handleSearch = async (queryObj: any) => {
    searchForm.companyName = queryObj.companyName || '';
    searchForm.customerLevel = queryObj.customerLevel || null;
    if (queryObj.evaluationDateRange && Array.isArray(queryObj.evaluationDateRange) && queryObj.evaluationDateRange.length === 2) {
        searchForm.evaluationDateRange = queryObj.evaluationDateRange as any;
    } else {
        searchForm.evaluationDateRange = null;
    }
    pagination.page = 1;
    await loadCustomerEvaluations();
};

// 搜索栏重置时同步清空分数范围
const handleSearchBarReset = () => {
    searchForm.scoreMin = '';
    searchForm.scoreMax = '';
};

// 分页改变
const handlePageChange = (page: number) => {
    pagination.page = page;
    loadCustomerEvaluations();
};

const handlePageSizeChange = (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    loadCustomerEvaluations();
};

// 重新评估
const handleReassess = async (item: any) => {
    showLoading.value = true;
    try {
        // window.$message.info('正在提交重估请求...');
        const res: any = await reevaluateCustomerEvaluationApi(item.id);
        if (res?.code === 200) {
            // window.$message.success('评估需要一定的时间，请稍候查看！');
            await loadCustomerEvaluations();
        }
    } catch (error) {
        console.error('重估失败:', error);
        window.$message.error('重估请求失败');
    } finally {
        showLoading.value = false;
    }
};

// 打开详情
const openDetail = async (item: any) => {
    // 先打开抽屉
    detailPopShow.value = true;
    detailLoading.value = true;

    try {
        const res: any = await getCustomerEvaluationApi(item.id);
        const d = res?.data;
        if (d) {
            currentDetail.value = d || {};
        }
    } catch (error) {
        console.error('加载评估详情失败:', error);
        window.$message.error('加载详情失败');
    } finally {
        detailLoading.value = false;
    }
};

/**
 * 打开评估记录详情抽屉并加载对应评估编码的数据。
 * @param row 评估记录表格行
 * @returns 异步加载任务
 */
const openRecordDetail = async (row: Record<string, any>) => {
    if (!row?.evaluationCode) return;
    recordDetailShow.value = true;
    recordDetailLoading.value = true;
    recordDetailData.value = {};

    try {
        const res: any = await getCustomerEvaluationByCodeApi(row.evaluationCode);
        recordDetailData.value = res?.data || {};
    } catch (error) {
        console.error('加载评估记录详情失败:', error);
        window.$message.error('加载评估记录详情失败');
    } finally {
        recordDetailLoading.value = false;
    }
};

// 页面初始化
const init = () => {
    onMounted(() => {
        loadCustomerEvaluations();
    });
};

// 客户星级选项
const customerLevelOptions = STAR_LEVEL_OPTIONS;

// 搜索栏查询配置
const queryConfiguration: QueryItem[] = [
    { type: 'input', value: 'companyName', placeholder: '企业单位名称' },
    { type: 'select', value: 'customerLevel', placeholder: '客户星级', options: customerLevelOptions },
    { type: 'dateRange', value: 'evaluationDateRange', leftPlaceholder: '评估开始时间', rightPlaceholder: '评估结束时间' },
];

// ==================== 导出 ====================

export {
    showLoading,
    // 状态
    searchForm,
    customerEvaluations,
    pagination,
    detailPopShow,
    currentDetail,
    detailLoading,
    recordDetailShow,
    recordDetailData,
    recordDetailLoading,
    customerLevelOptions,
    queryConfiguration,
    // 方法
    handleSearch,
    handleSearchBarReset,
    handlePageChange,
    handlePageSizeChange,
    handleReassess,
    openDetail,
    openRecordDetail,
    init,
};
