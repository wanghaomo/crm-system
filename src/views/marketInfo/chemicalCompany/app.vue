<template>
    <AppPage title="化工企业调研" :showList="true" :loading="loading" :finished="finished" :disableLoadMore="disableLoadMore" :searchConfig="searchConfig" filterTitle="筛选" @loadEvt="onLoad" @refreshEvt="onRefresh" @searchEvt="onSearch" @searchFilterReset="onSearchFilterReset"
        @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="chemical-list">
                <template v-if="listData.length">
                    <MxAppListItem v-for="item in listData" :key="item.id" :actions="item.actions" @action="(btn) => onAction(btn, item)">
                        <template #header>
                            <div class="item-header">
                                <div class="card-title">{{ item.enterpriseName || '--' }}</div>
                                <AppTag :text="item.statusName" :type="item.statusClass === 'archived' ? 'success' : 'warning'" />
                            </div>
                        </template>
                        <div class="chemical-item-descs">
                            <div class="desc-item" v-for="(info, index) in item.infos" :key="index">
                                <span class="desc-label">{{ info.label }}</span>
                                <span class="desc-value">{{ info.value }}</span>
                            </div>
                        </div>
                    </MxAppListItem>
                </template>
                <template v-else>
                    <div class="no-data" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 80px;; color: #999;">
                        <img width="180" height="146" src="@/assets/images/empty.png" />
                        <!-- <span>暂无数据</span> -->
                    </div>
                </template>
            </div>
        </template>
        <template #filter>
            <div class="chemical-filter-form">
                <Field label="状态" label-align="top">
                    <template #input>
                        <div class="status-tags">
                            <span v-for="item in statusOptions" :key="item.value" :class="['status-filter-tag', { active: queryParams.status === item.value }]" @click="queryParams.status = item.value">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>
                <Field label="调研月份" label-align="top">
                    <template #input>
                        <div class="month-range">
                            <div class="month-field" :class="{ selected: queryParams.surveyMonthStart }" @click="openMonthPicker('start')">
                                {{ queryParams.surveyMonthStart || '开始月份' }}
                            </div>
                            <span class="month-separator">至</span>
                            <div class="month-field" :class="{ selected: queryParams.surveyMonthEnd }" @click="openMonthPicker('end')">
                                {{ queryParams.surveyMonthEnd || '结束月份' }}
                            </div>
                        </div>
                    </template>
                </Field>
            </div>
            <Popup v-model:show="showMonthPicker" position="bottom">
                <DatePicker v-model="monthPickerValue" :title="activeMonthField === 'start' ? '开始月份' : '结束月份'" :columns-type="['year', 'month']" @confirm="onMonthConfirm" @cancel="showMonthPicker = false" />
            </Popup>
        </template>
        <template #footer>
            <div class="add-btn-container" v-if="checkPermission(['crm:chemical_company:create'])">
                <Button class="add-btn" type="primary" block @click="handleAdd">新增</Button>
            </div>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { showConfirmDialog, showToast, Button, DatePicker, Field, Popup } from 'vant';
import dayjs from 'dayjs';
import AppPage from '@/appComponents/AppPage/index.vue';
import MxAppListItem from '@/appComponents/MxAppListItem/index.vue';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import { deleteChemicalCompanyApi, queryChemicalCompanyListApi } from '@/api/chemicalCompany';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { checkPermission } from '@/utils/comm';

const router = useRouter();

interface ISearchForm {
    searchValue?: string;
}

interface IQueryParams {
    status: string;
    surveyMonthStart: string;
    surveyMonthEnd: string;
}

interface IListPageState {
    searchValue?: string;
    queryParams?: Partial<IQueryParams> & { surveyMonth?: string };
    listData?: any[];
    current?: number;
    total?: number;
    finished?: boolean;
    disableLoadMore?: boolean;
    scrollTop?: number;
}

const LIST_PAGE_STATE_KEY = 'crm:chemical_company:list_page_state';
const PRESERVE_LIST_ROUTE_NAMES = ['crm:chemical_company:detail'];

// 读取列表页快照，用于从详情页返回时恢复筛选和列表状态。
const readListPageState = (): IListPageState | null => {
    try {
        if (typeof window === 'undefined') return null;
        const cache = window.sessionStorage.getItem(LIST_PAGE_STATE_KEY);
        return cache ? JSON.parse(cache) : null;
    } catch {
        return null;
    }
};

const initialListPageState = readListPageState();

const config: IAppSearchConfig = {
    type: 'input',
    placeholder: '企业名称',
    showFilter: true,
    defaultValue: initialListPageState?.searchValue || '',
};

const { searchForm, searchConfig, changeForm, onSearch, onSearchChange, onSearchFilterComfirm } =
    useAppSearch<ISearchForm>(config);

if (initialListPageState?.searchValue) {
    searchForm.searchValue = initialListPageState.searchValue;
}

const statusOptions = [
    { label: '全部', value: '' },
    { label: '草稿', value: 'DRAFT' },
    { label: '已归档', value: 'ARCHIVED' },
];

// 创建筛选项初始值，重置筛选时会回到这里。
const createQueryParams = (): IQueryParams => ({
    status: '',
    surveyMonthStart: '',
    surveyMonthEnd: '',
});

// 兼容历史单月份缓存，避免旧缓存导致起止月份丢失。
const normalizeCachedQueryParams = (params?: IListPageState['queryParams']): IQueryParams => ({
    status: params?.status || '',
    surveyMonthStart: params?.surveyMonthStart || params?.surveyMonth || '',
    surveyMonthEnd: params?.surveyMonthEnd || params?.surveyMonth || '',
});

const queryParams = ref<IQueryParams>(normalizeCachedQueryParams(initialListPageState?.queryParams));
const showMonthPicker = ref(false);
const monthPickerValue = ref<string[]>(dayjs().format('YYYY-MM').split('-'));
const activeMonthField = ref<'start' | 'end'>('start');

const loading = ref(false);
const finished = ref(initialListPageState?.finished ?? false);
const disableLoadMore = ref(initialListPageState?.disableLoadMore ?? true);
const listData = ref<any[]>(Array.isArray(initialListPageState?.listData) ? initialListPageState.listData : []);
const current = ref(initialListPageState?.current || 1);
const size = ref(20);
const total = ref(initialListPageState?.total || 0);
const purchaseProductTypeMap = ref<Record<string, string>>({});

// 获取 AppPage 内部滚动容器，列表滚动位置保存和恢复都依赖它。
const getListScroller = () => document.querySelector<HTMLElement>('.app-page-container .app-page-content');

// 读取当前滚动高度，离开列表页前写入快照。
const getCurrentScrollTop = () => getListScroller()?.scrollTop || 0;

// 恢复列表滚动位置，等待列表 DOM 渲染完成后再设置 scrollTop。
const restoreScrollTop = async (scrollTop = 0) => {
    await nextTick();
    window.requestAnimationFrame(() => {
        const scroller = getListScroller();
        if (scroller) scroller.scrollTop = scrollTop;
    });
};

// 判断目标路由是否需要保留列表状态，只在详情跳转场景保存快照。
const shouldPreserveListState = (routeName: unknown) => PRESERVE_LIST_ROUTE_NAMES.includes(String(routeName || ''));

// 保存列表页快照，返回列表时直接恢复，避免筛选、分页和滚动位置丢失。
const saveListPageState = () => {
    if (typeof window === 'undefined') return;
    const state: IListPageState = {
        searchValue: searchForm.searchValue || '',
        queryParams: { ...queryParams.value },
        listData: listData.value,
        current: current.value,
        total: total.value,
        finished: finished.value,
        disableLoadMore: disableLoadMore.value,
        scrollTop: getCurrentScrollTop(),
    };
    window.sessionStorage.setItem(LIST_PAGE_STATE_KEY, JSON.stringify(state));
};

// 清理列表页快照，重置筛选、下拉刷新或离开到其他模块时回到初始列表状态。
const clearListPageState = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(LIST_PAGE_STATE_KEY);
};

const normalizeSurveyMonth = (value: any) => (value ? `${value}`.slice(0, 7) : '');
const formatNumber = (value: any, digits = 0) => {
    const num = Number(value);
    return value !== null && value !== undefined && value !== '' && Number.isFinite(num) ? num.toFixed(digits) : '--';
};
const getStatusName = (status: string, statusName?: string) =>
    statusName || (status === 'ARCHIVED' ? '已归档' : '草稿');
const isDraft = (row: any) => row.status === 'DRAFT';
const isArchived = (row: any) => row.status === 'ARCHIVED';

const formatListItem = (row: any) => ({
    ...row,
    statusName: getStatusName(row.status, row.statusName),
    statusClass: isArchived(row) ? 'archived' : 'draft',
    infos: [
        { label: '调研月份', value: normalizeSurveyMonth(row.surveyMonth) || '--' },
        { label: '开工率', value: row.operatingRate+'%' || '--' },
        { label: '下月采购计划', value: `${formatNumber(row.nextMonthPlan, 1)}万吨` },
        { label: '主要产品规模', value: row.mainProductScale || '--' },
    ],
    actions: [
        { text: '删除', type: 'danger', action: 'delete', show: isDraft(row) && checkPermission(["crm:chemical_company:delete"]) },
        { text: '编辑', type: 'primary', action: 'edit', show: isDraft(row) && checkPermission(["crm:chemical_company:edit"]) },
        { text: '复制', type: 'primary', action: 'copy', show: checkPermission(["crm:chemical_company:create"]) },
        { text: '详情', type: 'primary', action: 'detail', show: isArchived(row) },
    ].filter((item) => item.show),
});

// 组装列表查询参数，统一承接搜索框和筛选弹层的状态。
const buildQueryPayload = () => ({
    enterpriseName: searchForm.searchValue || '',
    status: queryParams.value.status,
    surveyMonthStart: queryParams.value.surveyMonthStart,
    surveyMonthEnd: queryParams.value.surveyMonthEnd,
    current: current.value,
    size: size.value,
});

// 拉取列表数据；reset 为 true 时清空分页并重新请求第一页。
const getPageList = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        total.value = 0;
        listData.value = [];
    }

    loading.value = true;
    try {
        const res = await queryChemicalCompanyListApi(buildQueryPayload());
        if (res?.code === 200) {
            const records = res.data?.records || [];
            total.value = Number(res.data?.total || 0);
            const newList = records.map(formatListItem);
            listData.value = reset ? newList : [...listData.value, ...newList];

            const noMoreBySize = records.length < size.value;
            const noMoreByTotal = total.value > 0 && listData.value.length >= total.value;
            finished.value = noMoreBySize || noMoreByTotal;
            if (!finished.value) current.value += 1;
            return;
        }
        finished.value = true;
    } finally {
        loading.value = false;
    }
};

// 搜索或确认筛选后重新查询第一页，同时清掉旧快照，避免返回时恢复过期条件。
onSearchChange(async () => {
    clearListPageState();
    await getPageList(true);
    disableLoadMore.value = false;
}, false);

// 触底加载下一页，分页指针由 getPageList 成功后推进。
const onLoad = async () => {
    if (!finished.value) await getPageList();
};

// 下拉刷新会清理旧快照并回到第一页，但保留当前搜索和筛选条件。
const onRefresh = async (done?: () => void) => {
    clearListPageState();
    await getPageList(true);
    await restoreScrollTop(0);
    done?.();
};

// 重置筛选时清理缓存并恢复筛选默认值，再按初始筛选条件重新查询。
const onSearchFilterReset = () => {
    clearListPageState();
    queryParams.value = createQueryParams();
    searchForm.searchValue = '';
    restoreScrollTop(0);
    changeForm();
};

// 打开月份选择器，并把当前点击的起止字段作为回填目标。
const openMonthPicker = (field: 'start' | 'end') => {
    activeMonthField.value = field;
    const selectedMonth = field === 'start' ? queryParams.value.surveyMonthStart : queryParams.value.surveyMonthEnd;
    monthPickerValue.value = (selectedMonth || dayjs().format('YYYY-MM')).split('-');
    showMonthPicker.value = true;
};

// 确认月份后，根据当前激活字段写入开始月份或结束月份。
const onMonthConfirm = ({ selectedValues }: any) => {
    const selectedMonth = selectedValues.join('-');
    if (activeMonthField.value === 'start') {
        queryParams.value.surveyMonthStart = selectedMonth;
    } else {
        queryParams.value.surveyMonthEnd = selectedMonth;
    }
    monthPickerValue.value = selectedValues;
    showMonthPicker.value = false;
};

// 处理列表卡片操作；跳转前的状态由路由离开守卫统一保存。
const onAction = (action: any, item: any) => {
    if (action.action === 'delete') {
        showConfirmDialog({
            title: '确定要删除这条数据吗？',
            message: '删除后数据将不可恢复，请谨慎删除。',
            confirmButtonColor: '#E34242',
        }).then(async () => {
            const res = await deleteChemicalCompanyApi(item.id);
            if (res?.code === 200) {
                showToast('删除成功');
                await getPageList(true);
            }
        });
    }
    if (action.action === 'edit') {
        router.push({ name: 'crm:chemical_company:edit', query: { id: item.id } });
    }
    if (action.action === 'copy') {
        router.push({ name: 'crm:chemical_company:create', query: { copyId: item.id } });
    }
    if (action.action === 'detail') {
        router.push({ name: 'crm:chemical_company:detail', query: { id: item.id } });
    }
};

// 新增入口；新增返回列表时不保留快照，列表会重新请求。
const handleAdd = () => {
    router.push({ name: 'crm:chemical_company:create' });
};

// 加载字典数据，供列表字段展示兜底使用。
const loadDictData = async () => {
    const res = await getDictMapApi({ parentCodes: [enumCfg['采购产品类型']] });
    if (res?.code === 200) {
        purchaseProductTypeMap.value = (res.data?.[enumCfg['采购产品类型']] || []).reduce(
            (map: Record<string, string>, item: any) => {
                map[item.code] = item.name;
                return map;
            },
            {}
        );
    }
};

// 初始化列表：优先恢复缓存，没有缓存时首次请求第一页。
const initPage = async () => {
    await loadDictData();
    if (initialListPageState) {
        await restoreScrollTop(initialListPageState.scrollTop || 0);
        return;
    }
    await getPageList(true);
    disableLoadMore.value = false;
};

// 离开到详情时保存快照；新增、编辑或其他页面会清掉快照，返回后重新请求。
onBeforeRouteLeave((to) => {
    if (shouldPreserveListState(to.name)) {
        saveListPageState();
        return;
    }
    clearListPageState();
});

onMounted(initPage);
</script>

<style lang="less" scoped>
:deep(.mx-list-item .card-footer) {
    margin-top: 4px !important;
}
.chemical-list {
    padding-bottom: 54px;
}

.item-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .card-title {
        min-width: 0;
        flex: 1;
        font-size: 16px;
        font-weight: 500;
        line-height: 22px;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }


}

.chemical-filter-form {
    :deep(.van-cell) {
        padding: 8px 0;
    }

    :deep(.van-cell::after) {
        display: none;
    }

    :deep(.van-field__label) {
        font-size: 16px;
        font-weight: 500;
        color: #333;
    }

    .status-tags {
        margin-top: 8px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .status-filter-tag {
        width: 80px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border: 1px solid #eaeaea;
        color: #666;
        font-size: 14px;
        background: #fff;

        &.active {
            color: #2c65f2;
            background: #ecf1fc;
            border-color: #ecf1fc;
        }
    }

    .month-range {
        width: 100%;
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .month-field {
        flex: 1;
        min-width: 0;
        width: 100%;
        height: 36px;
        padding: 0 12px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        border: 1px solid #eaeaea;
        border-radius: 4px;
        color: #999;
        font-size: 14px;

        &.selected {
            color: #333;
        }
    }

    .month-separator {
        flex-shrink: 0;
        color: #999;
        font-size: 14px;
    }
}

.add-btn-container {
    padding: 4px 12px 8px;
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);

    .add-btn {
        height: 40px;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        --van-button-primary-background: #2c65f2;
        --van-button-primary-border-color: #2c65f2;
    }
}

.chemical-item-descs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 18px;
    margin-top: 10px;

    .desc-item {
        display: flex;
        align-items: center;
        min-width: 0;
        font-size: 14px;
        line-height: 20px;
        white-space: nowrap;

        &:nth-child(n + 3) {
            grid-column: 1 / -1;
        }

        .desc-label {
            color: #999;
            margin-right: 8px;
            flex-shrink: 0;
        }

        .desc-value {
            min-width: 0;
            color: #333;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

:deep(.mx-list-item) {
    border-radius: 8px;
    padding: 16px 12px;
    margin-bottom: 12px;
}

:deep(.mx-list-item .card-footer .van-button) {
    min-width: 62px;
    border-radius: 16px;
}
</style>
