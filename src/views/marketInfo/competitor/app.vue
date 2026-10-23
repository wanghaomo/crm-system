<template>
    <AppPage title="竞争对手调研" :showList="true" :loading="loading" :finished="finished" :disableLoadMore="disableLoadMore" :searchConfig="searchConfig" filterTitle="筛选" @loadEvt="onLoad" @refreshEvt="onRefresh" @searchEvt="onSearch" @searchFilterReset="onSearchFilterReset"
        @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="competitor-list">
                <!-- 有数据时展示列表卡片 -->
                <template v-if="listData.length">
                    <MxAppListItem v-for="item in listData" :key="item.id" :actions="item.actions" @action="(btn) => onAction(btn, item)">
                        <template #header>
                            <div class="item-header">
                                <div class="card-title">{{ item.competitorName || '--' }}</div>
                                <AppTag :text="item.statusName" :type="item.statusClass === 'archived' ? 'success' : 'warning'" />
                            </div>
                        </template>
                        <MxAppDescriptions :data="item.infos" :column="2" label-width="auto" />
                    </MxAppListItem>
                </template>
                <!-- 无数据时展示空状态图片 -->
                <template v-else>
                    <div class="no-data">
                        <img width="180" height="146" src="@/assets/images/empty.png" />
                    </div>
                </template>
            </div>
        </template>

        <template #filter>
            <div class="competitor-filter-form">
                <!-- 状态筛选 -->
                <Field label="状态" label-align="top">
                    <template #input>
                        <div class="status-tags">
                            <span v-for="item in statusOptions" :key="item.value" :class="['filter-tag', { active: queryParams.status === item.value }]" @click="queryParams.status = item.value">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>

                <!-- 调研月份筛选（起止月份） -->
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

                <!-- 区域筛选 -->
                <Field label="区域" label-align="top">
                    <template #input>
                        <div class="select-field" :class="{ selected: regionLabel }" @click="showRegionPicker = true">
                            {{ regionLabel || '请选择' }}
                        </div>
                    </template>
                </Field>

                <!-- 矿山类型筛选 -->
                <Field label="矿山类型" label-align="top">
                    <template #input>
                        <div class="mine-tags">
                            <span v-for="item in mineTypeFilterOptions" :key="item.value" :class="['filter-tag', { active: queryParams.mineType === item.value }]" @click="selectMineType(item)">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>
            </div>

            <!-- 月份选择器 -->
            <Popup v-model:show="showMonthPicker" position="bottom">
                <DatePicker v-model="monthPickerValue" :title="activeMonthField === 'start' ? '开始月份' : '结束月份'" :columns-type="['year', 'month']" @confirm="onMonthConfirm" @cancel="showMonthPicker = false" />
            </Popup>

            <!-- 区域选择器 -->
            <ActionSheet v-model:show="showRegionPicker" title="区域">
                <div class="option-list">
                    <div class="select-row" @click="selectRegion({ label: '全部', value: '' })">全部</div>
                    <div v-for="item in regionOptions" :key="item.value" class="select-row" @click="selectRegion(item)">
                        {{ item.label }}
                    </div>
                </div>
            </ActionSheet>
        </template>

        <template #footer>
            <div class="add-btn-container" v-if="checkPermission(['crm:competitor:create'])">
                <Button class="add-btn" type="primary" block @click="handleAdd">新增</Button>
            </div>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ActionSheet, Button, DatePicker, Field, Popup, showConfirmDialog, showToast } from 'vant';
import dayjs from 'dayjs';
import AppPage from '@/appComponents/AppPage/index.vue';
import MxAppListItem from '@/appComponents/MxAppListItem/index.vue';
// import MxAppDescriptions from '@/appComponents/MxAppDescriptions/index.vue';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import { deleteCompetitorApi, queryCompetitorListApi } from '@/api/competitor';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { checkPermission } from '@/utils/comm';

type OptionItem = { label: string; value: string };

// ---------- 类型定义 ----------

interface ISearchForm {
    searchValue?: string;
}

/** 筛选参数 */
interface IQueryParams {
    status: string;
    surveyMonthStart: string;
    surveyMonthEnd: string;
    region: string;
    mineType: string;
}

/** 列表页快照，用于从详情页返回时恢复筛选、分页和滚动位置 */
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

// ---------- 常量 ----------

const router = useRouter();

/** sessionStorage 缓存 key */
const LIST_PAGE_STATE_KEY = 'crm:competitor:list_page_state';
/** 需要保留列表状态的跳转目标路由名 */
const PRESERVE_LIST_ROUTE_NAMES = ['crm:competitor:detail'];

// ---------- 快照读写（参考化工企业调研模式） ----------

/** 读取列表页快照，用于从详情页返回时恢复筛选和列表状态 */
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

// ---------- 搜索配置 ----------

const config: IAppSearchConfig = {
    type: 'input',
    placeholder: '竞争对手名称',
    showFilter: true,
    defaultValue: initialListPageState?.searchValue || '',
};

const { searchForm, searchConfig, changeForm, onSearch, onSearchChange, onSearchFilterComfirm } =
    useAppSearch<ISearchForm>(config);

// 恢复缓存中的搜索关键字
if (initialListPageState?.searchValue) {
    searchForm.searchValue = initialListPageState.searchValue;
}

// ---------- 筛选选项 ----------

const statusOptions = [
    { label: '全部', value: '' },
    { label: '草稿', value: 'DRAFT' },
    { label: '已归档', value: 'ARCHIVED' },
];

const regionOptions = ref<OptionItem[]>([]);
const mineTypeOptions = ref<OptionItem[]>([]);

/** 区域中文名称映射 */
const regionMap = computed(() =>
    regionOptions.value.reduce((map: Record<string, string>, item) => {
        map[item.value] = item.label;
        return map;
    }, {})
);

/** 矿山类型中文名称映射 */
const mineTypeMap = computed(() =>
    mineTypeOptions.value.reduce((map: Record<string, string>, item) => {
        map[item.value] = item.label;
        return map;
    }, {})
);

const regionLabel = computed(() => regionOptions.value.find((item) => item.value === queryParams.value.region)?.label || '');
const mineTypeFilterOptions = computed(() => [{ label: '全部', value: '' }, ...mineTypeOptions.value]);

// ---------- 筛选参数（兼容旧单月份缓存） ----------

/** 创建筛选项初始值，重置筛选时会回到这里 */
const createQueryParams = (): IQueryParams => ({
    status: '',
    surveyMonthStart: '',
    surveyMonthEnd: '',
    region: '',
    mineType: '',
});

/** 兼容历史单月份缓存，避免旧缓存导致起止月份丢失 */
const normalizeCachedQueryParams = (params?: IListPageState['queryParams']): IQueryParams => ({
    status: params?.status || '',
    surveyMonthStart: params?.surveyMonthStart || params?.surveyMonth || '',
    surveyMonthEnd: params?.surveyMonthEnd || params?.surveyMonth || '',
    region: params?.region || '',
    mineType: params?.mineType || '',
});

const queryParams = ref<IQueryParams>(normalizeCachedQueryParams(initialListPageState?.queryParams));
const showMonthPicker = ref(false);
const monthPickerValue = ref<string[]>(dayjs().format('YYYY-MM').split('-'));
const activeMonthField = ref<'start' | 'end'>('start');
const showRegionPicker = ref(false);

// ---------- 列表分页状态 ----------

const loading = ref(false);
const finished = ref(initialListPageState?.finished ?? false);
const disableLoadMore = ref(initialListPageState?.disableLoadMore ?? true);
const listData = ref<any[]>(Array.isArray(initialListPageState?.listData) ? initialListPageState.listData : []);
const current = ref(initialListPageState?.current || 1);
const size = ref(20);
const total = ref(initialListPageState?.total || 0);

// ---------- 滚动位置保存与恢复 ----------

/** 获取 AppPage 内部滚动容器 */
const getListScroller = () => document.querySelector<HTMLElement>('.app-page-container .app-page-content');

/** 读取当前滚动高度 */
const getCurrentScrollTop = () => getListScroller()?.scrollTop || 0;

/** 恢复列表滚动位置，等待列表 DOM 渲染完成后再设置 scrollTop */
const restoreScrollTop = async (scrollTop = 0) => {
    await nextTick();
    window.requestAnimationFrame(() => {
        const scroller = getListScroller();
        if (scroller) scroller.scrollTop = scrollTop;
    });
};

/** 判断目标路由是否需要保留列表状态 */
const shouldPreserveListState = (routeName: unknown) => PRESERVE_LIST_ROUTE_NAMES.includes(String(routeName || ''));

/** 保存列表页快照，返回列表时直接恢复 */
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

/** 清理列表页快照，重置筛选、下拉刷新或离开到其他模块时回到初始列表状态 */
const clearListPageState = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(LIST_PAGE_STATE_KEY);
};

// ---------- 格式化工具函数 ----------

const normalizeSurveyMonth = (value: any) => (value ? `${value}`.slice(0, 7) : '');
const formatNumber = (value: any, digits = 0) => {
    const num = Number(value);
    return value !== null && value !== undefined && value !== '' && Number.isFinite(num) ? num.toFixed(digits) : '--';
};
const getStatusName = (status: string, statusName?: string) =>
    statusName || (status === 'ARCHIVED' ? '已归档' : '草稿');
const isDraft = (row: any) => row.status === 'DRAFT';
const isArchived = (row: any) => row.status === 'ARCHIVED';
const getRegionName = (value: any) => regionMap.value[value] || value || '--';
const getMineTypeName = (value: any) => mineTypeMap.value[value] || value || '--';

/** 将接口数据格式化为列表卡片所需结构 */
const formatListItem = (row: any) => ({
    ...row,
    competitorName: row.competitorName || row.enterpriseName || '--',
    statusName: getStatusName(row.status, row.statusName),
    statusClass: isArchived(row) ? 'archived' : 'draft',
    infos: [
        { label: '调研月份', value: normalizeSurveyMonth(row.surveyMonth) || '--' },
        { label: '矿山类型', value: getMineTypeName(row.mineType) },
        { label: '区域', value: getRegionName(row.region) },
        { label: '开工率', value: `${formatNumber(row.operatingRate, 0)}%` },
        { label: '月产量', value: `${formatNumber(row.monthlyOutput, 0)}万吨` },
        { label: '产品品位', value: `${formatNumber(row.productGrade, 0)}%` },
    ],
    // 草稿态显示删除和编辑，已归档显示详情
    actions: [
        { text: '删除', type: 'danger', action: 'delete', show: isDraft(row) && checkPermission(["crm:competitor:delete"]) },
        { text: '编辑', type: 'primary', action: 'edit', show: isDraft(row) && checkPermission(["crm:competitor:delete"]) },
        { text: '复制', type: 'primary', action: 'copy', show: checkPermission(["crm:competitor:create"]) },
        { text: '详情', type: 'primary', action: 'detail', show: isArchived(row) },
    ].filter((item) => item.show),
});

// ---------- 列表查询 ----------

/** 组装列表查询参数 */
const buildQueryPayload = () => ({
    competitorName: searchForm.searchValue || '',
    status: queryParams.value.status,
    surveyMonthStart: queryParams.value.surveyMonthStart,
    surveyMonthEnd: queryParams.value.surveyMonthEnd,
    region: queryParams.value.region,
    mineType: queryParams.value.mineType,
    current: current.value,
    size: size.value,
});

/** 拉取列表数据；reset 为 true 时清空分页并重新请求第一页 */
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
        const res = await queryCompetitorListApi(buildQueryPayload());
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

// ---------- 搜索、加载、刷新 ----------

/** 搜索或确认筛选后重新查询第一页，同时清掉旧快照 */
onSearchChange(async () => {
    clearListPageState();
    await getPageList(true);
    disableLoadMore.value = false;
}, false);

/** 触底加载下一页 */
const onLoad = async () => {
    if (!finished.value) await getPageList();
};

/** 下拉刷新会清理旧快照并回到第一页 */
const onRefresh = async (done?: () => void) => {
    clearListPageState();
    await getPageList(true);
    await restoreScrollTop(0);
    done?.();
};

/** 重置筛选时清理缓存并恢复筛选默认值 */
const onSearchFilterReset = () => {
    clearListPageState();
    queryParams.value = createQueryParams();
    searchForm.searchValue = '';
    restoreScrollTop(0);
    changeForm();
};

// ---------- 月份选择 ----------

/** 打开月份选择器，并把当前点击的起止字段作为回填目标 */
const openMonthPicker = (field: 'start' | 'end') => {
    activeMonthField.value = field;
    const selectedMonth = field === 'start' ? queryParams.value.surveyMonthStart : queryParams.value.surveyMonthEnd;
    monthPickerValue.value = (selectedMonth || dayjs().format('YYYY-MM')).split('-');
    showMonthPicker.value = true;
};

/** 确认月份后，根据当前激活字段写入开始月份或结束月份 */
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

// ---------- 区域和矿山类型选择 ----------

const selectRegion = (option: OptionItem) => {
    queryParams.value.region = option.value;
    showRegionPicker.value = false;
};

const selectMineType = (option: OptionItem) => {
    queryParams.value.mineType = option.value;
};

// ---------- 列表操作 ----------

/** 处理列表卡片操作按钮点击；跳转前状态由路由离开守卫统一保存 */
const onAction = (action: any, item: any) => {
    // 删除确认
    if (action.action === 'delete') {
        showConfirmDialog({
            title: '确定要删除这条数据吗？',
            message: '删除后数据将不可恢复，请谨慎删除。',
            confirmButtonColor: '#E34242',
        }).then(async () => {
            const res = await deleteCompetitorApi(item.id);
            if (res?.code === 200) {
                showToast('删除成功');
                await getPageList(true);
            }
        });
    }
    // 编辑跳转
    if (action.action === 'edit') {
        router.push({ name: 'crm:competitor:edit', query: { id: item.id } });
    }
    // 复制跳转到新增页面，由新增页面通过 copyId 加载原记录并创建新数据。
    if (action.action === 'copy') {
        router.push({ name: 'crm:competitor:create', query: { copyId: item.id } });
    }
    // 详情跳转（会保存快照）
    if (action.action === 'detail') {
        router.push({ name: 'crm:competitor:detail', query: { id: item.id } });
    }
};

/** 新增入口；新增返回列表时不保留快照，列表会重新请求 */
const handleAdd = () => {
    router.push({ name: 'crm:competitor:create' });
};

// ---------- 字典数据加载 ----------

const loadDictData = async () => {
    const res = await getDictMapApi({ parentCodes: [enumCfg['区域类型'], enumCfg['矿山类型']] });
    if (res?.code === 200) {
        regionOptions.value = (res.data?.[enumCfg['区域类型']] || []).map((item: any) => ({
            label: item.name,
            value: item.code,
        }));
        mineTypeOptions.value = (res.data?.[enumCfg['矿山类型']] || []).map((item: any) => ({
            label: item.name,
            value: item.code,
        }));
    }
};

// ---------- 初始化 ----------

/** 初始化列表：优先恢复缓存，没有缓存时首次请求第一页 */
const initPage = async () => {
    await loadDictData();
    if (initialListPageState) {
        await restoreScrollTop(initialListPageState.scrollTop || 0);
        return;
    }
    await getPageList(true);
    disableLoadMore.value = false;
};

/** 离开到详情时保存快照；新增、编辑或其他页面清掉快照，返回后重新请求 */
onBeforeRouteLeave((to: any) => {
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
.competitor-list {
    padding-bottom: 54px;

    .no-data {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-top: 80px;
        color: #999;
    }
}

// ---------- 列表卡片头部 ----------
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

// ---------- 筛选表单 ----------
.competitor-filter-form {
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

    .status-tags,
    .mine-tags {
        margin-top: 8px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .filter-tag {
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

    .select-field {
        margin-top: 8px;
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
}

// ---------- 选项列表 ----------
.option-list {
    max-height: 60vh;
    overflow-y: auto;
    background: #fff;

    .select-row {
        padding: 14px 16px;
        font-size: 15px;
        color: #333;
        border-bottom: 1px solid #f0f1f4;
    }
}

// ---------- 新增按钮 ----------
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

// ---------- 列表卡片全局样式 ----------
::deep(.mx-list-item) {
    border-radius: 8px;
    padding: 16px 12px;
    margin-bottom: 12px;
}

::deep(.mx-descriptions-item) {
    margin-bottom: 10px;
}

::deep(.mx-descriptions-item__container) {
    font-size: 14px;
    line-height: 20px;
}

::deep(.mx-list-item .card-footer .van-button) {
    min-width: 62px;
    border-radius: 16px;
}
</style>
