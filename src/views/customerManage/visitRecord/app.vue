<template>
    <AppPage
        title="来访记录"
        :showList="true"
        :loading="loading"
        :finished="finished"
        :disableLoadMore="disableLoadMore"
        :searchConfig="searchConfig"
        filterTitle="筛选"
        @loadEvt="onLoad"
        @refreshEvt="onRefresh"
        @searchEvt="onSearch"
        @searchFilterReset="handleFilterReset"
        @searchFilterComfirm="handleFilterConfirm">
        <template #content>
            <div class="visit-list">
                <MxAppListItem
                    v-for="item in listData"
                    :key="item.id"
                    :actions="item.actions"
                    @action="(action) => onAction(action, item)">
                    <template #header>
                        <div class="item-header">
                            <div class="card-title">{{ formatValue(item.customerName) }}</div>
                            <AppTag :text="getStatus(item.status).label" :type="getStatus(item.status).type" />
                        </div>
                    </template>
                    <MxAppDescriptions :data="item.infos" :column="2" label-width="auto" />
                </MxAppListItem>
                <div v-if="!loading && !listData.length" class="empty-state">
                    <img src="@/assets/images/empty.png" alt="暂无数据" />
                </div>
            </div>
        </template>

        <template #filter>
            <div class="mx_mes_app-filter-form">
                <Field label="状态" label-align="top">
                    <template #input>
                        <div class="status-tags">
                            <span
                                v-for="option in statusOptions"
                                :key="option.value"
                                :class="['status-tag', { active: filters.status === option.value }]"
                                @click="filters.status = option.value">
                                {{ option.label }}
                            </span>
                        </div>
                    </template>
                </Field>
                <Field class="bordered-field bordered-color" label="客户星级" label-align="top" readonly is-link @click="starLevelVisible = true">
                    <template #input>{{ filters.starLevelLabel || '请选择' }}</template>
                </Field>
                <MxPersonSelect
                    v-model="filters.executorCode"
                    v-model:label="filters.executorName"
                    class="bordered-field"
                    title="接待人"
                    label-align="top"
                    placeholder="请选择接待人"
                    :clearable="true"
                    @changeEvt="handleExecutorFilterChange" />
                <Field label="来访时间" label-align="top">
                    <template #input>
                        <div class="time-box" @click="showCalendar = true">
                            <div class="time-item" :class="{ 'select-time': filters.actualTimeStart }">
                                {{ filters.actualTimeStart || '开始时间' }}
                            </div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="{ 'select-time': filters.actualTimeEnd }">
                                {{ filters.actualTimeEnd || '结束时间' }}
                            </div>
                        </div>
                    </template>
                </Field>
            </div>
            <ActionSheet v-model:show="starLevelVisible" title="客户星级" :actions="starLevelActions" @select="handleStarLevelSelect" />
            <Calendar v-model:show="showCalendar" type="range" :min-date="filterCalendarMinDate" @confirm="handleCalendarConfirm" />
        </template>

        <template #footer>
            <div v-if="checkPermission(['crm:visit_record:create'])" class="add-btn-container">
                <Button type="primary" block @click="handleAdd">新增</Button>
            </div>
        </template>
    </AppPage>

    <Popup v-model:show="cancelVisible" position="bottom" round>
        <div class="cancel-popup">
            <div class="popup-title">取消来访</div>
            <Field
                v-model="cancelReason"
                label="取消原因"
                type="textarea"
                rows="4"
                maxlength="255"
                show-word-limit
                placeholder="请输入取消原因" />
            <Button type="primary" block :loading="actionLoading" @click="handleCancelConfirm">提交</Button>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ActionSheet, Button, Calendar, Field, Popup, showConfirmDialog, showToast } from 'vant';
import AppPage from '@/appComponents/AppPage/index.vue';
import MxAppListItem from '@/appComponents/MxAppListItem/index.vue';
// import MxAppDescriptions from '@/appComponents/MxAppDescriptions/index.vue';
import AppTag from '@/appComponents/AppTag/index.vue';
import { useAppSearch, type IAppSearchConfig } from '@/hooks/useAppSearch';
import {
    archiveVisitRecordApi,
    cancelVisitRecordApi,
    getVisitRecordPageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_MAP, STAR_LEVEL_OPTIONS } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

interface SearchForm {
    searchValue?: string;
}

const router = useRouter();
const appSearchConfig: IAppSearchConfig = {
    type: 'input',
    placeholder: '企业单位名称',
    showFilter: true,
};
const { searchForm, searchConfig, onSearch, onSearchFilterReset, onSearchFilterComfirm, onSearchChange } =
    useAppSearch<SearchForm>(appSearchConfig);

const starLevelOptions = STAR_LEVEL_OPTIONS.map((item) => ({ ...item }));
const starLevelActions = [{ name: '全部', value: '' }, ...starLevelOptions.map((item) => ({ name: item.label, value: item.value }))];
const statusOptions = [
    { label: '全部', value: '' },
    { label: '待接待', value: 'PENDING' },
    { label: '已接待', value: 'COMPLETED' },
    { label: '已归档', value: 'ARCHIVED' },
    { label: '已取消', value: 'CANCELLED' },
];
const statusMap: Record<string, { label: string; type: string }> = {
    PENDING: { label: '待接待', type: 'warning' },
    COMPLETED: { label: '已接待', type: 'primary' },
    ARCHIVED: { label: '已归档', type: 'success' },
    CANCELLED: { label: '已取消', type: 'info' },
};
const visitTypeMap: Record<string, string> = {
    APPOINTMENT: '提前预约',
    TEMPORARY: '临时通知',
};
const receptionLocationMap = ref<Record<string, string>>({});
const filters = reactive({
    status: '',
    starLevel: '',
    starLevelLabel: '',
    executorCode: '',
    executorName: '',
    actualTimeStart: '',
    actualTimeEnd: '',
});
const listData = ref<any[]>([]);
const loading = ref(false);
const finished = ref(false);
const disableLoadMore = ref(false);
const current = ref(1);
const pageSize = 20;
const total = ref(0);
const filterCalendarMinDate = new Date(2000, 0, 1);
const showCalendar = ref(false);
const starLevelVisible = ref(false);
const cancelVisible = ref(false);
const cancelReason = ref('');
const cancelItem = ref<any>(null);
const actionLoading = ref(false);

/** 将接口空值转成移动端统一的占位文本。 */
const formatValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);

/** 获取单据状态标签样式，保留接口原始状态作为未知状态兜底。 */
const getStatus = (status: string) => statusMap[status] || { label: formatValue(status), type: 'info' };

/** 将人员数组、对象或字符串统一转换为人员名称。 */
const getPersonNames = (value: any) => {
    if (!value) return '--';
    if (typeof value === 'string') return value;
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => item?.username || item?.name || item?.label || item?.code).filter(Boolean).join('、') || '--';
};

/** 将后端列表行转换为 App 卡片展示数据。 */
const formatListItem = (row: any) => {
    const status = row.status;
    const actions: any[] = [];
    if (['PENDING', 'COMPLETED'].includes(status) && checkPermission(['crm:visit_record:edit'])) {
        actions.push({ text: '编辑', type: 'primary', action: 'edit' });
    }
    if (status === 'PENDING' && checkPermission(['crm:visit_record:cancel'])) {
        actions.push({ text: '取消', type: 'danger', action: 'cancel' });
    }
    if (status === 'COMPLETED' && checkPermission(['crm:visit_record:archive'])) {
        actions.push({ text: '归档', type: 'primary', action: 'archive' });
    }
    if (['ARCHIVED', 'CANCELLED'].includes(status)) {
        actions.push({ text: '详情', type: 'primary', action: 'detail' });
    }
    return {
        ...row,
        actions,
        infos: [
            { label: '来访类型', value: visitTypeMap[row.visitType] || row.visitType || '--' },
            { label: '客户星级', value: STAR_LEVEL_MAP[row.starLevel] || row.starLevel || '--' },
            { label: '接待人', value: getPersonNames(row.executorList) },
            { label: '接待地点', value: receptionLocationMap.value[row.receptionLocation] || row.receptionLocation || '--' },
            { label: '来访时间', value: formatValue(row.actualTime), colSpan: 2 },
            // { label: '评价反馈', value: formatValue(row.feedback) },
        ],
    };
};

/** 读取接待地点字典，用于列表卡片直接展示中文名称。 */
const loadLocationDict = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['接待地点']] });
        const list = res?.data?.[enumCfg['接待地点']] || [];
        receptionLocationMap.value = list.reduce((map: Record<string, string>, item: any) => {
            map[item.code || item.value] = item.name || item.label || item.code || item.value;
            return map;
        }, {});
    } catch (error) {
        console.error('加载接待地点字典失败:', error);
    }
};

/**
 * 组装分页接口查询参数，空筛选项不会传给后端。
 * @returns 包含必填分页字段及非空筛选项的查询参数
 */
const buildQuery = (): Parameters<typeof getVisitRecordPageApi>[0] => {
    const params: Parameters<typeof getVisitRecordPageApi>[0] = {
        current: current.value,
        size: pageSize,
    };
    const filterParams = {
        customerName: searchForm.searchValue || undefined,
        status: filters.status || undefined,
        starLevel: filters.starLevel || undefined,
        executorCode: filters.executorCode || undefined,
        actualTimeStart: filters.actualTimeStart ? `${filters.actualTimeStart} 00:00:00` : undefined,
        actualTimeEnd: filters.actualTimeEnd ? `${filters.actualTimeEnd} 23:59:59` : undefined,
    };
    Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params[key] = value;
    });
    return params;
};

/** 获取来访记录分页数据，支持 AppPage 触底加载。 */
const getList = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }
    loading.value = true;
    try {
        const res: any = await getVisitRecordPageApi(buildQuery());
        if (res?.code !== 200 && !res?.success) {
            finished.value = true;
            return;
        }
        const pageData = res?.data || {};
        const records = Array.isArray(pageData.records) ? pageData.records : [];
        total.value = Number(pageData.total || 0);
        const rows = records.map(formatListItem);
        listData.value = reset ? rows : [...listData.value, ...rows];
        finished.value = records.length < pageSize || (total.value > 0 && listData.value.length >= total.value);
        if (!finished.value) current.value += 1;
    } catch (error) {
        finished.value = true;
        console.error('获取来访记录列表失败:', error);
    } finally {
        loading.value = false;
    }
};

/** 处理筛选人员选择，兼容人员组件的对象和数组返回值。 */
const handleExecutorFilterChange = (option: any) => {
    const item = Array.isArray(option) ? option[0] : option;
    filters.executorCode = item?.value || item?.code || '';
    filters.executorName = item?.label || item?.username || '';
};

/** 处理客户星级筛选。 */
const handleStarLevelSelect = (option: any) => {
    filters.starLevel = option.value || '';
    filters.starLevelLabel = option.name || '';
    starLevelVisible.value = false;
};

/** 处理来访时间范围选择。 */
const handleCalendarConfirm = (dates: Date[]) => {
    filters.actualTimeStart = dates?.[0] ? formatDate(dates[0]) : '';
    filters.actualTimeEnd = dates?.[1] ? formatDate(dates[1]) : filters.actualTimeStart;
    showCalendar.value = false;
};

/** 格式化筛选日期为接口可接受的日期字符串。 */
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/** 处理列表卡片操作。 */
const onAction = async (action: any, item: any) => {
    if (action?.action === 'edit') {
        router.push({ name: 'crm:visit_record:edit', query: { id: item.id } });
        return;
    }
    if (action?.action === 'detail') {
        router.push({ name: 'crm:visit_record:detail', query: { id: item.id } });
        return;
    }
    if (action?.action === 'cancel') {
        cancelItem.value = item;
        cancelReason.value = '';
        cancelVisible.value = true;
        return;
    }
    if (action?.action === 'archive') {
        try {
            await showConfirmDialog({ title: '确认归档', message: '该单据归档后不可再次编辑，是否继续？' });
            actionLoading.value = true;
            await archiveVisitRecordApi(item.id);
            await getList(true);
        } catch (error) {
            if (error) console.error('归档来访记录失败:', error);
        } finally {
            actionLoading.value = false;
        }
    }
};

/** 提交取消来访原因并刷新列表。 */
const handleCancelConfirm = async () => {
    if (!cancelReason.value.trim()) {
        showToast('请输入取消原因');
        return;
    }
    actionLoading.value = true;
    try {
        await cancelVisitRecordApi({ id: cancelItem.value?.id, cancelReason: cancelReason.value.trim() });
        cancelVisible.value = false;
        await getList(true);
    } catch (error) {
        console.error('取消来访记录失败:', error);
    } finally {
        actionLoading.value = false;
    }
};

/** 进入新增页面。 */
const handleAdd = () => router.push({ name: 'crm:visit_record:create' });

/** 重置筛选条件并重新请求第一页。 */
const resetFilters = () => {
    Object.assign(filters, {
        status: '',
        starLevel: '',
        starLevelLabel: '',
        executorCode: '',
        executorName: '',
        actualTimeStart: '',
        actualTimeEnd: '',
    });
};

onSearchChange(async () => {
    await getList(true);
    disableLoadMore.value = false;
}, false);
onMounted(async () => {
    await loadLocationDict();
    await getList(true);
});

const handleFilterReset = (event?: any) => {
    resetFilters();
    onSearchFilterReset(event);
};
const handleFilterConfirm = (event?: any) => onSearchFilterComfirm(event);
const onLoad = async () => getList();
const onRefresh = async (done?: () => void) => {
    await getList(true);
    done?.();
};
</script>

<style lang="less" scoped>
.item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.card-title {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #333;
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.empty-state {
    display: flex;
    justify-content: center;
    padding-top: 80px;
}

.empty-state img {
    width: 180px;
    height: 146px;
}

.mx_mes_app-filter-form {
    padding-bottom: 8px;

    :deep(.van-cell) {
        padding: 8px 0;
    }

    :deep(.van-field__control) {
        border: none !important;
        padding: 0 !important;
    }

    .status-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 4px;
    }

    .status-tag {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 32px;
        padding: 6px;
        border: 1px solid rgba(132, 132, 132, 0.16);
        border-radius: 4px;
        color: var(--base-grey2);
        font-size: 14px;
        cursor: pointer;
    }

    .status-tag.active {
        border-color: #ecf1fc;
        color: #2c65f2;
        background: #ecf1fc;
    }

    .time-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 14px;
    }

    .time-item {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        height: 36px;
        overflow: hidden;
        border: 1px solid #eaeaea;
        border-radius: 4px;
        color: #999;
        font-size: 14px;
        white-space: nowrap;
    }

    .time-center {
        flex-shrink: 0;
        color: #c4c4c4;
        font-size: 14px;
        font-weight: 400;
    }

    .select-time {
        color: #333;
    }
}

:deep(.van-cell::after) {
    display: none;
}

:deep(.van-field__label) {
    color: var(--base-black);
    font-size: 16px;
    font-weight: 500;
}

:deep(.bordered-field .van-field__value) {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 34px;
    margin-top: 4px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid #eaeaea;
    border-radius: 4px;
}

:deep(.bordered-field .van-field__control) {
    min-height: 34px;
    border: none !important;
}

:deep(.bordered-color .van-field__control) {
    color: #c8c9cc
}

:deep(.bordered-field .van-cell__right-icon),
:deep(.bordered-field .van-field__right-icon) {
    display: none;
}

.add-btn-container {
    padding: 4px 12px 8px;
    background: #fff;
}

.cancel-popup {
    padding: 20px 16px 16px;
}

.popup-title {
    margin-bottom: 12px;
    color: #333;
    font-size: 18px;
    font-weight: 500;
    text-align: center;
}

.cancel-popup :deep(.van-button) {
    margin-top: 16px;
}
</style>
