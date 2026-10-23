<template>
    <AppPage title="拜访记录" :showList="true" :loading="loading" :finished="finished" :disableLoadMore="disableLoadMore" :searchConfig="appSearchConfig" filterTitle="筛选" @loadEvt="loadList" @refreshEvt="refreshList" @searchEvt="onSearch" @searchFilterReset="resetFilter" @searchFilterComfirm="confirmFilter">
        <template #content>
            <div class="visit-plan-list">
                <MxAppListItem v-for="item in listData" :key="item.id" :actions="item.actions" @action="(action) => handleAction(action, item)">
                    <template #header><div class="item-header"><div class="card-title">{{ formatValue(item.customerName) }}</div><AppTag :text="getStatus(item.status).label" :type="getStatus(item.status).type" /></div></template>
                    <MxAppDescriptions :data="item.infos" :column="2" label-width="auto" />
                </MxAppListItem>
                <div v-if="!loading && !listData.length" class="empty-state"><img src="@/assets/images/empty.png" alt="暂无数据" /></div>
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
                    title="拜访人"
                    label-align="top"
                    placeholder="请选择拜访人"
                    :clearable="true"
                    @changeEvt="handleExecutorFilterChange" />
                <Field label="实际拜访时间" label-align="top">
                    <template #input>
                        <div class="time-box" @click="calendarVisible = true">
                            <div class="time-item" :class="{ 'select-time': filters.startDate }">
                                {{ filters.startDate || '开始时间' }}
                            </div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="{ 'select-time': filters.endDate }">
                                {{ filters.endDate || '结束时间' }}
                            </div>
                        </div>
                    </template>
                </Field>
            </div>
            <ActionSheet v-model:show="starLevelVisible" title="客户星级" :actions="starLevelActions" @select="selectStarLevel" />
            <Calendar v-model:show="calendarVisible" type="range" :min-date="filterCalendarMinDate" @confirm="selectDateRange" />
        </template>
        <template #footer><div v-if="checkPermission(['crm:visit_plan:create'])" class="add-btn-container"><Button type="primary" block @click="handleAdd">新增</Button></div></template>
    </AppPage>
    <Popup v-model:show="cancelVisible" position="bottom" round><div class="cancel-popup"><div class="popup-title">取消拜访</div><Field v-model="cancelReason" label="取消原因" type="textarea" rows="4" maxlength="255" show-word-limit placeholder="请输入取消原因" /><Button type="primary" block :loading="actionLoading" @click="submitCancel">提交</Button></div></Popup>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ActionSheet, Button, Calendar, Field, Popup, showConfirmDialog, showToast } from 'vant';
import { useRouter } from 'vue-router';
import AppPage from '@/appComponents/AppPage/index.vue';
import MxAppListItem from '@/appComponents/MxAppListItem/index.vue';
// import MxAppDescriptions from '@/appComponents/MxAppDescriptions/index.vue';
import AppTag from '@/appComponents/AppTag/index.vue';
import { useAppSearch, type IAppSearchConfig } from '@/hooks/useAppSearch';
import { archiveVisitPlanApi, cancelVisitPlanApi, getVisitPlanPageApi } from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_MAP, STAR_LEVEL_OPTIONS } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

const router = useRouter();
const searchConfig: IAppSearchConfig = { type: 'input', placeholder: '企业单位名称', showFilter: true };
const { searchForm, searchConfig: appSearchConfig, onSearch, onSearchFilterReset, onSearchFilterComfirm, onSearchChange } = useAppSearch<{ searchValue?: string }>(searchConfig);
const listData = ref<any[]>([]);
const loading = ref(false);
const finished = ref(false);
const disableLoadMore = ref(false);
const current = ref(1);
const pageSize = 20;
const total = ref(0);
const filterCalendarMinDate = new Date(2000, 0, 1);
const filters = reactive({ status: '', starLevel: '', starLevelLabel: '', executorCode: '', executorName: '', startDate: '', endDate: '' });
const starLevelVisible = ref(false);
const calendarVisible = ref(false);
const cancelVisible = ref(false);
const cancelReason = ref('');
const cancelItem = ref<any>(null);
const actionLoading = ref(false);
const visitPurposeMap = ref<Record<string, string>>({});
const starLevelActions = [{ name: '全部', value: '' }, ...STAR_LEVEL_OPTIONS.map((item) => ({ name: item.label, value: item.value }))];
const statusOptions = [{ label: '全部', value: '' }, { label: '待拜访', value: 'PENDING' }, { label: '已拜访', value: 'COMPLETED' }, { label: '已归档', value: 'ARCHIVED' }, { label: '已取消', value: 'CANCELLED' }];
const statusMap: Record<string, { label: string; type: string }> = { PENDING: { label: '待拜访', type: 'warning' }, COMPLETED: { label: '已拜访', type: 'primary' }, ARCHIVED: { label: '已归档', type: 'success' }, CANCELLED: { label: '已取消', type: 'info' } };
const formatValue = (value: any) => value === null || value === undefined || value === '' ? '--' : value;
const getStatus = (status: string) => statusMap[status] || { label: formatValue(status), type: 'info' };
const getPeople = (value: any) => (Array.isArray(value) ? value : value ? [value] : []).map((item) => item?.username || item?.name || item?.label || item?.code).filter(Boolean).join('、') || '--';
/**
 * 同步筛选人员的编码和名称，兼容人员组件的对象与数组返回值。
 * @param option 人员组件返回的选中项，清空时为空
 * @returns 无返回值，更新拜访人筛选字段
 */
const handleExecutorFilterChange = (option: any) => {
    const item = Array.isArray(option) ? option[0] : option;
    filters.executorCode = item?.value || item?.code || '';
    filters.executorName = item?.label || item?.username || '';
};
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatItem = (row: any) => {
    const actions: any[] = [];
    if (['PENDING', 'COMPLETED'].includes(row.status) && checkPermission(['crm:visit_plan:edit'])) actions.push({ text: '编辑', type: 'primary', action: 'edit' });
    if (row.status === 'PENDING' && checkPermission(['crm:visit_plan:cancel'])) actions.unshift({ text: '取消', type: 'danger', action: 'cancel' });
    if (row.status === 'COMPLETED' && checkPermission(['crm:visit_plan:archive'])) actions.unshift({ text: '归档', type: 'primary', action: 'archive' });
    if (['ARCHIVED', 'CANCELLED'].includes(row.status)) actions.push({ text: '详情', type: 'primary', action: 'detail' });
    return { ...row, actions, infos: [
        { label: '拜访目的', value: visitPurposeMap.value[row.visitPurpose] || row.visitPurposeName || formatValue(row.visitPurpose) },
        { label: '客户星级', value: STAR_LEVEL_MAP[row.starLevel] || formatValue(row.starLevel) },
        { label: '拜访人', value: getPeople(row.executorList) },
        { label: '客户对接人', value: getPeople(row.contactPersonList), colSpan: 2 },
        { label: '计划拜访时间', value: formatValue(row.planTime), colSpan: 2 },
        { label: '实际拜访时间', value: formatValue(row.actualTime), colSpan: 2 },
    ] };
};
/** 加载拜访目的字典，用于将分页列表中的编码转换为中文名称。 */
const loadVisitPurposeDict = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['拜访目的']] });
        const purposeList: any[] = res?.data?.[enumCfg['拜访目的']] || [];
        visitPurposeMap.value = purposeList.reduce((map: Record<string, string>, item: any) => {
            const code = item.code || item.value;
            const name = item.name || item.label || code;
            if (code) map[code] = name;
            return map;
        }, {});
    } catch (error) {
        console.error('加载拜访目的字典失败:', error);
    }
};
const buildQuery = () => ({ current: current.value, size: pageSize, customerName: searchForm.searchValue || undefined, status: filters.status || undefined, starLevel: filters.starLevel || undefined, executorCode: filters.executorCode || undefined, actualTimeStart: filters.startDate ? `${filters.startDate} 00:00:00` : undefined, actualTimeEnd: filters.endDate ? `${filters.endDate} 23:59:59` : undefined });
/** 加载移动端拜访记录列表。 */
const getList = async (reset = false) => {
    if (loading.value) return;
    if (reset) { current.value = 1; finished.value = false; listData.value = []; total.value = 0; }
    loading.value = true;
    try { const res: any = await getVisitPlanPageApi(buildQuery()); const data = res?.data || {}; const records = Array.isArray(data.records) ? data.records : []; total.value = Number(data.total || 0); listData.value = reset ? records.map(formatItem) : [...listData.value, ...records.map(formatItem)]; finished.value = records.length < pageSize || (total.value > 0 && listData.value.length >= total.value); if (!finished.value) current.value += 1; } catch (error) { finished.value = true; console.error('获取拜访记录失败:', error); } finally { loading.value = false; }
};
const handleSearch = async () => { await getList(true); disableLoadMore.value = false; };
const loadList = async () => getList();
const refreshList = async (done?: () => void) => { await getList(true); done?.(); };
const resetFilter = (event?: any) => { Object.assign(filters, { status: '', starLevel: '', starLevelLabel: '', executorCode: '', executorName: '', startDate: '', endDate: '' }); onSearchFilterReset(event); };
const confirmFilter = (event?: any) => onSearchFilterComfirm(event);
const selectStarLevel = (item: any) => { filters.starLevel = item.value || ''; filters.starLevelLabel = item.name || ''; starLevelVisible.value = false; };
const selectDateRange = (dates: Date[]) => { filters.startDate = dates?.[0] ? formatDate(dates[0]) : ''; filters.endDate = dates?.[1] ? formatDate(dates[1]) : filters.startDate; calendarVisible.value = false; };
const handleAdd = () => router.push({ name: 'crm:visit_plan:create' });
const handleAction = async (action: any, item: any) => {
    if (action.action === 'edit') return router.push({ name: 'crm:visit_plan:edit', query: { id: item.id } });
    if (action.action === 'detail') return router.push({ name: 'crm:visit_plan:detail', query: { id: item.id } });
    if (action.action === 'cancel') { cancelItem.value = item; cancelReason.value = ''; cancelVisible.value = true; return; }
    if (action.action === 'archive') { try { await showConfirmDialog({ title: '确认归档', message: '该单据归档后不可再次编辑，是否继续？' }); actionLoading.value = true; await archiveVisitPlanApi(item.id); await getList(true); } catch (error) { if (error) console.error('归档拜访记录失败:', error); } finally { actionLoading.value = false; } }
};
const submitCancel = async () => { if (!cancelReason.value.trim()) return showToast('请输入取消原因'); actionLoading.value = true; try { await cancelVisitPlanApi({ id: cancelItem.value?.id, cancelReason: cancelReason.value.trim() }); cancelVisible.value = false; await getList(true); } catch (error) { console.error('取消拜访记录失败:', error); } finally { actionLoading.value = false; } };
onSearchChange(handleSearch, false);
onMounted(async () => {
    await loadVisitPurposeDict();
    await getList(true);
});
</script>

<style scoped lang="less">
.item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.card-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: #333;
    font-size: 16px;
    font-weight: 500;
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

.mx_mes_app-filter-form :deep(.van-cell::after) {
    display: none;
}

.mx_mes_app-filter-form :deep(.van-field__label) {
    color: var(--base-black);
    font-size: 16px;
    font-weight: 500;
}

.mx_mes_app-filter-form :deep(.bordered-field .van-field__value) {
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

.mx_mes_app-filter-form :deep(.bordered-field .van-field__control) {
    min-height: 34px;
    border: none !important;
}

.mx_mes_app-filter-form :deep(.bordered-color .van-field__control) {
    color: #c8c9cc;
}

.mx_mes_app-filter-form :deep(.bordered-field .van-cell__right-icon),
.mx_mes_app-filter-form :deep(.bordered-field .van-field__right-icon) {
    display: none;
}

.add-btn-container {
    padding: 8px 12px;
    background: #fff;
}

.cancel-popup {
    padding: 16px;
}

.popup-title {
    margin-bottom: 12px;
    color: #333;
    font-size: 17px;
    font-weight: 600;
}
</style>
