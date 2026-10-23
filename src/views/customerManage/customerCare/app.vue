<template>
    <AppPage
        title="客户关怀"
        :showList="true"
        :loading="loading"
        :finished="finished"
        :disableLoadMore="disableLoadMore"
        :searchConfig="searchConfig"
        filterTitle="筛选"
        @loadEvt="loadList"
        @refreshEvt="refreshList"
        @searchEvt="onSearch"
        @searchFilterReset="handleFilterReset"
        @searchFilterComfirm="handleFilterConfirm">
        <template #content>
            <div class="care-list">
                <MxAppListItem
                    v-for="item in listData"
                    :key="item.id"
                    :actions="item.actions"
                    @action="(action) => handleAction(action, item)">
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
                    class="bordered-field bordered-color"
                    title="执行人"
                    label-align="top"
                    placeholder="请选择执行人"
                    :clearable="true"
                    @changeEvt="handleExecutorFilterChange" />
                <Field class="bordered-field bordered-color" label="关怀类型" label-align="top" readonly is-link @click="careTypeVisible = true">
                    <template #input>{{ filters.careTypeLabel || '请选择' }}</template>
                </Field>
                <Field label="实际关怀时间" label-align="top">
                    <template #input>
                        <div class="time-box" @click="showCalendar = true">
                            <div class="time-item" :class="{ 'select-time': filters.actualTimeStart }">{{ filters.actualTimeStart || '开始时间' }}</div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="{ 'select-time': filters.actualTimeEnd }">{{ filters.actualTimeEnd || '结束时间' }}</div>
                        </div>
                    </template>
                </Field>
            </div>
            <ActionSheet v-model:show="starLevelVisible" title="客户星级" :actions="starLevelActions" @select="handleStarLevelSelect" />
            <ActionSheet v-model:show="careTypeVisible" title="关怀类型" :actions="careTypeActions" @select="handleCareTypeSelect" />
            <Calendar v-model:show="showCalendar" type="range" :min-date="filterCalendarMinDate" @confirm="handleCalendarConfirm" />
        </template>

        <template #footer>
            <div v-if="checkPermission(['crm:customer_car:create'])" class="add-btn-container">
                <Button type="primary" block @click="handleAdd">新增</Button>
            </div>
        </template>
    </AppPage>

    <Popup v-model:show="detailVisible" position="right" :style="{ width: '100%', height: '100%' }">
        <AppPage title="客户关怀详情" :showSearch="false" :showList="false" noPadding>
            <template #content>
                <div v-if="!detailLoading" class="detail-page">
                    <div class="detail-header">
                        <div class="title-row">
                            <div class="detail-title">{{ formatValue(detailData.customerName) }}</div>
                            <AppTag :text="getStatus(detailData.status).label" :type="getStatus(detailData.status).type" />
                        </div>
                        <div class="meta-row"><span>关怀类型</span><b>{{ careTypeMap[detailData.careType] || formatValue(detailData.careType) }}</b></div>
                    </div>
                    <Tabs v-model:active="detailTab" sticky class="detail-tabs" line-width="24" animated>
                        <Tab title="基础信息" name="basic">
                            <div class="tab-panel"><div class="info-card">
                                <div class="section-title">基础信息</div>
                                <div v-for="item in detailRows" :key="item.label" class="info-row" :class="{ long: item.long }">
                                    <span class="label">{{ item.label }}</span>
                                    <template v-if="item.attachment"><MxWebFileUpload v-if="detailData.attachmentList?.length" class="attachments" :only-show="true" :model-value="detailData.attachmentList" /><span v-else class="value">--</span></template>
                                    <span v-else class="value">{{ item.value }}</span>
                                </div>
                            </div></div>
                        </Tab>
                        <Tab title="关怀内容" name="content">
                            <div class="tab-panel"><div class="content-card"><MxEditorPreview v-if="detailData.content" :modelValue="detailData.content" maxHeight="none" minHeight="60" /><div v-else class="content-empty">暂无关怀内容</div></div></div>
                        </Tab>
                    </Tabs>
                </div>
                <div v-else class="page-loading"><Loading vertical>加载中...</Loading></div>
            </template>
        </AppPage>
    </Popup>

    <Popup v-model:show="cancelVisible" position="bottom" round>
        <div class="cancel-popup"><div class="popup-title">取消关怀</div><Field v-model="cancelReason" label="取消原因" type="textarea" rows="4" maxlength="255" show-word-limit placeholder="请输入取消原因" /><Button type="primary" block :loading="actionLoading" @click="submitCancel">提交</Button></div>
    </Popup>

</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ActionSheet, Button, Calendar, Field, Loading, Popup, Tab, Tabs, showConfirmDialog, showToast } from 'vant';
import { useRouter } from 'vue-router';
import AppPage from '@/appComponents/AppPage/index.vue';
import AppTag from '@/appComponents/AppTag/index.vue';
import MxAppListItem from '@/appComponents/MxAppListItem/index.vue';
// import MxAppDescriptions from '@/appComponents/MxAppDescriptions/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import { useAppSearch, type IAppSearchConfig } from '@/hooks/useAppSearch';
import { archiveCustomerCareApi, cancelCustomerCareApi, getCustomerCareApi, getCustomerCarePageApi } from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_MAP, STAR_LEVEL_OPTIONS, STATUS_MAP } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

const router = useRouter();
const searchConfig: IAppSearchConfig = { type: 'input', placeholder: '企业单位名称', showFilter: true };
const { searchForm, onSearch, onSearchChange, onSearchFilterReset, onSearchFilterComfirm } = useAppSearch<{ searchValue?: string }>(searchConfig);
const filters = reactive({ status: '', starLevel: '', starLevelLabel: '', executorCode: '', executorName: '', careType: '', careTypeLabel: '', actualTimeStart: '', actualTimeEnd: '' });
const statusOptions = [{ label: '全部', value: '' }, { label: '待执行', value: 'PENDING' }, { label: '已完成', value: 'COMPLETED' }, { label: '已归档', value: 'ARCHIVED' }, { label: '已取消', value: 'CANCELLED' }];
const starLevelActions = [{ name: '全部', value: '' }, ...STAR_LEVEL_OPTIONS.map((item) => ({ name: item.label, value: item.value }))];
const careTypeMap = ref<Record<string, string>>({});
const careMethodMap = ref<Record<string, string>>({});
const careTypeActions = ref<any[]>([{ name: '全部', value: '' }]);
const listData = ref<any[]>([]);
const loading = ref(false);
const finished = ref(false);
const disableLoadMore = ref(false);
const current = ref(1);
const pageSize = 20;
const total = ref(0);
const filterCalendarMinDate = new Date(2000, 0, 1);
const starLevelVisible = ref(false);
const careTypeVisible = ref(false);
const showCalendar = ref(false);
const cancelVisible = ref(false);
const cancelReason = ref('');
const cancelItem = ref<any>(null);
const actionLoading = ref(false);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<any>({});
const detailTab = ref<'basic' | 'content'>('basic');

const formatValue = (value: any) => value === null || value === undefined || value === '' ? '--' : value;
const getStatus = (status: string) => { const item = STATUS_MAP[status]; return item ? { label: item.text, type: status === 'PENDING' ? 'warning' : status === 'COMPLETED' ? 'primary' : status === 'ARCHIVED' ? 'success' : 'info' } : { label: formatValue(status), type: 'info' }; };
const getPeople = (value: any) => (Array.isArray(value) ? value : value ? [value] : []).map((item) => item?.username || item?.name || item?.label || item?.code).filter(Boolean).join('、') || '--';
const detailRows = computed(() => [
    { label: '客户星级', value: formatValue(STAR_LEVEL_MAP[detailData.value.starLevel]) },
    { label: '执行方式', value: careMethodText(detailData.value.careMethod) },
    { label: '执行人', value: getPeople(detailData.value.executorList) },
    { label: '计划关怀时间', value: formatValue(detailData.value.planTime) },
    { label: '实际关怀时间', value: formatValue(detailData.value.actualTime) },
    { label: '关怀附件', attachment: true, long: true },
    { label: '客户反馈', value: formatValue(detailData.value.feedback), long: true },
    { label: '关怀效果评价', value: formatValue(detailData.value.careEffectEvaluation) },
    { label: '下次关怀建议时间', value: formatValue(detailData.value.nextCareSuggestTime) },
    { label: '增值服务', value: Array.isArray(detailData.value.plusServicesList) ? detailData.value.plusServicesList.join('、') || '--' : formatValue(detailData.value.plusServicesList), long: true },
    { label: '服务详情', value: formatValue(detailData.value.plusServicesDetail), long: true },
    { label: '执行情况', value: formatValue(detailData.value.plusServicesExecution), long: true },
    ...(detailData.value.status === 'CANCELLED' ? [{ label: '取消原因', value: formatValue(detailData.value.cancelReason), long: true }] : []),
]);
const careMethodText = (value: string) => careMethodMap.value[value] || formatValue(value);
const formatListItem = (row: any) => {
    const actions: any[] = [];
    if (['PENDING', 'COMPLETED'].includes(row.status) && checkPermission(['crm:customer_car:edit'])) actions.push({ text: '编辑', type: 'primary', action: 'edit' });
    if (row.status === 'PENDING' && checkPermission(['crm:customer_car:cancel'])) actions.push({ text: '取消', type: 'danger', action: 'cancel' });
    if (row.status === 'COMPLETED' && checkPermission(['crm:customer_car:archive'])) actions.push({ text: '归档', type: 'primary', action: 'archive' });
    if (['ARCHIVED', 'CANCELLED'].includes(row.status)) actions.push({ text: '详情', type: 'primary', action: 'detail' });
    return { ...row, actions, infos: [
        { label: '关怀类型', value: careTypeMap.value[row.careType] || row.careType || '--' },
        { label: '客户星级', value: STAR_LEVEL_MAP[row.starLevel] || row.starLevel || '--' },
        { label: '执行方式', value: careMethodText(row.careMethod) },
        { label: '执行人', value: getPeople(row.executorList) },
        { label: '计划关怀时间', value: formatValue(row.planTime), colSpan: 2 },
        { label: '实际关怀时间', value: formatValue(row.actualTime), colSpan: 2 },
    ] };
};
const buildQuery = () => {
    const params: any = { current: current.value, size: pageSize, customerName: searchForm.searchValue || undefined, status: filters.status || undefined, starLevel: filters.starLevel || undefined, executorCode: filters.executorCode || undefined, careType: filters.careType || undefined, actualTimeStart: filters.actualTimeStart ? `${filters.actualTimeStart} 00:00:00` : undefined, actualTimeEnd: filters.actualTimeEnd ? `${filters.actualTimeEnd} 23:59:59` : undefined };
    Object.keys(params).forEach((key) => { if (params[key] === undefined || params[key] === '') delete params[key]; });
    return params;
};
const loadDicts = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['关怀类型'], enumCfg['执行方式']] });
        const typeList = res?.data?.[enumCfg['关怀类型']] || [];
        const methodList = res?.data?.[enumCfg['执行方式']] || [];
        typeList.forEach((item: any) => { careTypeMap.value[item.code] = item.name; });
        methodList.forEach((item: any) => { careMethodMap.value[item.code] = item.name; });
        careTypeActions.value = [{ name: '全部', value: '' }, ...typeList.map((item: any) => ({ name: item.name, value: item.code }))];
    } catch (error) { console.error('加载客户关怀字典失败:', error); }
};
const loadList = async (reset = false) => {
    if (loading.value) return;
    if (reset) { current.value = 1; finished.value = false; listData.value = []; total.value = 0; }
    loading.value = true;
    try {
        const res: any = await getCustomerCarePageApi(buildQuery());
        const records = Array.isArray(res?.data?.records) ? res.data.records : [];
        total.value = Number(res?.data?.total || 0);
        listData.value = reset ? records.map(formatListItem) : [...listData.value, ...records.map(formatListItem)];
        finished.value = records.length < pageSize || (total.value > 0 && listData.value.length >= total.value);
        if (!finished.value) current.value += 1;
    } catch (error) { finished.value = true; console.error('获取客户关怀列表失败:', error); } finally { loading.value = false; }
};
const refreshList = async (done?: () => void) => { await loadList(true); done?.(); };
const resetFilters = () => Object.assign(filters, { status: '', starLevel: '', starLevelLabel: '', executorCode: '', executorName: '', careType: '', careTypeLabel: '', actualTimeStart: '', actualTimeEnd: '' });
const handleFilterReset = (event?: any) => { resetFilters(); onSearchFilterReset(event); };
const handleFilterConfirm = (event?: any) => onSearchFilterComfirm(event);
const handleStarLevelSelect = (item: any) => { filters.starLevel = item.value || ''; filters.starLevelLabel = item.name || ''; starLevelVisible.value = false; };
const handleCareTypeSelect = (item: any) => { filters.careType = item.value || ''; filters.careTypeLabel = item.name || ''; careTypeVisible.value = false; };
const handleExecutorFilterChange = (value: any) => { const item = Array.isArray(value) ? value[0] : value; filters.executorCode = item?.value || item?.code || ''; filters.executorName = item?.label || item?.username || ''; };
const handleCalendarConfirm = (dates: Date[]) => { filters.actualTimeStart = dates?.[0] ? formatDate(dates[0]) : ''; filters.actualTimeEnd = dates?.[1] ? formatDate(dates[1]) : filters.actualTimeStart; showCalendar.value = false; };
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const handleAdd = () => router.push({ name: 'crm:customer_car:create' });
const handleAction = async (action: any, item: any) => {
    if (action?.action === 'edit') return router.push({ name: 'crm:customer_car:edit', query: { id: item.id } });
    if (action?.action === 'detail') return openDetail(item.id);
    if (action?.action === 'cancel') { cancelItem.value = item; cancelReason.value = ''; cancelVisible.value = true; return; }
    if (action?.action === 'archive') {
        try { await showConfirmDialog({ title: '确认归档', message: '该单据归档后不可再次编辑，是否继续？' }); actionLoading.value = true; await archiveCustomerCareApi(item.id); await loadList(true); } catch (error) { if (error) console.error('归档客户关怀失败:', error); } finally { actionLoading.value = false; }
    }
};
const submitCancel = async () => {
    if (!cancelReason.value.trim()) { showToast('请输入取消原因'); return; }
    actionLoading.value = true;
    try { await cancelCustomerCareApi({ id: cancelItem.value?.id, cancelReason: cancelReason.value.trim() }); cancelVisible.value = false; await loadList(true); } catch (error) { console.error('取消客户关怀失败:', error); } finally { actionLoading.value = false; }
};
const openDetail = async (id: number | string) => {
    detailVisible.value = true; detailLoading.value = true; detailTab.value = 'basic';
    try { const res: any = await getCustomerCareApi(id); detailData.value = res?.data || {}; } catch (error) { console.error('获取客户关怀详情失败:', error); showToast('获取详情失败'); } finally { detailLoading.value = false; }
};
onSearchChange(() => loadList(true), false);
onMounted(async () => { await loadDicts(); await loadList(true); });
</script>

<style scoped lang="less">
.item-header { display: flex; align-items: center; gap: 8px; width: 100%; }
.card-title { min-width: 0; flex: 1; overflow: hidden; color: #333; font-size: 16px; font-weight: 500; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
.title-row { display: flex; align-items: center; gap: 8px; width: 100%; }
.detail-title { min-width: 0;overflow: hidden; color: #333; font-size: 16px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.empty-state { display: flex; justify-content: center; padding-top: 80px; }.empty-state img { width: 180px; height: 146px; }
.mx_mes_app-filter-form { padding-bottom: 8px; }
.mx_mes_app-filter-form :deep(.van-cell) { padding: 8px 0; }
.mx_mes_app-filter-form :deep(.van-field__control) { border: none !important; padding: 0 !important; }
.status-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.status-tag { display: flex; align-items: center; justify-content: center; width: 80px; height: 32px; padding: 6px; border: 1px solid rgba(132,132,132,.16); border-radius: 4px; color: var(--base-grey2); font-size: 14px; cursor: pointer; }
.status-tag.active { border-color: #ecf1fc; color: #2c65f2; background: #ecf1fc; }
.time-box { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 14px; }
.time-item { display: flex; align-items: center; justify-content: center; flex: 1; height: 36px; overflow: hidden; border: 1px solid #eaeaea; border-radius: 4px; color: #999; font-size: 14px; white-space: nowrap; }
.time-center { flex-shrink: 0; color: #c4c4c4; font-size: 14px; font-weight: 400; }.select-time { color: #333; }
:deep(.van-cell::after) { display: none; }
:deep(.van-field__label),:deep(.detail-tabs .van-tab) { color: var(--base-black); font-size: 16px; font-weight: 500; }
:deep(.bordered-field .van-field__value) { display: flex; align-items: center; width: 100%; min-height: 34px; margin-top: 4px; padding: 0 12px; box-sizing: border-box; border: 1px solid #eaeaea; border-radius: 4px; }
:deep(.bordered-field .van-field__control) { min-height: 34px; border: none !important; }
:deep(.bordered-color .van-field__control) { color: #c8c9cc; }
:deep(.bordered-field .van-cell__right-icon),:deep(.bordered-field .van-field__right-icon) { display: none; }
.add-btn-container { padding: 4px 12px 8px; background: #fff; }.cancel-popup { padding: 20px 16px 16px; }.popup-title { margin-bottom: 12px; color: #333; font-size: 18px; font-weight: 500; text-align: center; }
.detail-page { min-height: 100%; background: #f5f6f8; }.detail-header { padding: 12px 18px; background: #fff; }.meta-row { display: flex; gap: 8px; margin-top: 10px; color: #999; font-size: 14px; }.meta-row b { color: #333; font-weight: 400; }.detail-tabs :deep(.van-tabs__wrap) { background: #fff; }.detail-tabs :deep(.van-tabs__line) { background: #2c65f2; }.tab-panel { min-height: calc(100vh - 160px); padding: 12px; }.info-card,.content-card { padding: 0 12px 12px; border-radius: 12px; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.04); }.section-title { padding: 16px 0; color: #333; font-size: 16px; font-weight: 600; }.info-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; line-height: 26px; }.info-row:last-child { border-bottom: 0; }.info-row .label { width: 98px; flex-shrink: 0; color: #aaa; }.info-row .value { flex: 1; min-width: 0; color: #333; word-break: break-word; }.info-row.long { display: block; }.info-row.long .label { display: block; width: auto; margin-bottom: 6px; }.attachments { display: block; margin-top: 8px; }.content-card { padding: 16px; color: #333; font-size: 16px; line-height: 1.7; }.content-card :deep(img) { max-width: 100%; height: auto; }.content-empty,.page-loading { display: flex; align-items: center; justify-content: center; min-height: 120px; color: #999; }
</style>
