<template>
    <AppPage title="AI预测" :disableLoadMore="disableLoadMore" :showList="true" :loading="loading" :finished="finished" :searchConfig="searchConfig" @loadEvt="onLoad" @refreshEvt="onRefresh" @searchEvt="onSearch" @searchFilterReset="onSearchFilterReset" @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="list-wrapper">
                <MxAppListItem v-for="(item, index) in listData" :key="index" :title="item.reportName" :actions="item.actions" :statusConfig="item.statusStyle" @action="(btn) => onAction(btn, item)">
                    <MxAppDescriptions :data="item.infos" :column="9" label-width="auto" :gutter="40" />
                </MxAppListItem>
            </div>
        </template>
        <template #filter>
            <div class="mx_mes_app-filter-form">
                <Field label-align="top" label="生成时间" placeholder="请选择生成时间">
                    <template #input>
                        <div class="time-box" @click="showCreateTime = true">
                            <div class="time-item" :class="[queryParams.publishTimeStart ? 'select-time' : '']">
                                {{ queryParams.publishTimeStart ? queryParams.publishTimeStart.slice(0, 10) : '开始时间' }}
                            </div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="[queryParams.publishTimeEnd ? 'select-time' : '']">
                                {{ queryParams.publishTimeEnd ? queryParams.publishTimeEnd.slice(0, 10) : '结束时间' }}
                            </div>
                        </div>
                    </template>
                </Field>
                <MxCommSelect class="bordered-field" label-align="top" v-model="queryParams.source" v-model:label="queryParams.sourceLabel" :options="sourceOptionsRef" title="报告类型" :clearable="true" :text="false" />
            </div>
            <Calendar v-model:show="showCreateTime" type="range" switch-mode="year-month" @confirm="createTimeConfirm" />
        </template>
    </AppPage>
</template>
<script setup lang="ts">
import { ref, } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { storeToRefs } from 'pinia';
import { showDialog, Calendar, Field, showFailToast } from 'vant';
import { checkPermission } from '@/utils/comm';
import dayjs from 'dayjs';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';

import { exportMarkdownToPdf } from './commonTs/pdfExport';
import {
    generateSalesPlanAiReport,
    getSalesPlanAiReportDetail,
    getSalesPlanAiReportPage,
} from '@/api/aiReport';


import {
    AI_REPORT_STATUS_CONFIG,
    AI_REPORT_TYPE_LABEL_MAP,
    AI_REPORT_TYPE_OPTIONS,
    ReportStatus,
    TABLE_ACTION_COLOR,
} from './commonTs/common';
const { userInfo } = storeToRefs(useUserStore());
const router = useRouter();
interface ISearchFrom {
    workAreaCode?: string;
    dailyProductionDate?: string;
    searchValue?: string;
}
let config: IAppSearchConfig = {
    type: 'input',
    placeholder: '报告标题',
    showFilter: true,
    defaultValue: ""
};
const sourceOptionsRef = ref(
    [
        {
            value: '',
            label: '全部',
        },
    ].concat(AI_REPORT_TYPE_OPTIONS)
);
const { searchForm, searchConfig, changeForm, onSearch, onSearchChange, onSearchFilterComfirm } =
    useAppSearch<ISearchFrom>(config);


const formatReportType = (value?: string) => (value ? AI_REPORT_TYPE_LABEL_MAP[value] || value : '--');
// 格式化列表项
const formatListItem = (row: any) => {
    const info = AI_REPORT_STATUS_CONFIG[row.status] || AI_REPORT_STATUS_CONFIG.RUNNING;
    return {
        ...row,
        infos: [
            { label: '报告编号', value: row.reportCode || '--', colSpan: 5 },
            { label: '报告类型', value: formatReportType(row.reportType) || '--', colSpan: 4 },
            { label: '生成时间', value: row.generationTime || '--', colSpan: 6 },
        ],
        statusStyle: {
            label: info?.label || '--',
            type: info?.type,
        },
        actions: [
            {
                text: '下载',
                type: 'primary',
                action: 'download',
                show: row.status === 'COMPLETED' && checkPermission(['crm:ai_prediction:download'])
            },
            {
                text: '详情',
                type: 'primary',
                action: 'detail',
                show: row.status === 'COMPLETED',
            },
            {
                text: '重新生成',
                type: 'primary',
                action: 'reload',
                show: row.status === 'FAILED' && checkPermission(['crm:ai_prediction:rebuild']),
            },
        ].filter((item) => item.show),
    };
};
const getDefaultQueryParams = () => ({
    publishTimeStart: '',
    publishTimeEnd: '',
    source: '',
    sourceLabel: '',
});
const onSearchFilterReset = (e) => {
    queryParams.value = getDefaultQueryParams();
    changeForm(e);
};
const showCreateTime = ref<boolean>(false);
const queryParams = ref<any>(getDefaultQueryParams());

const createTimeConfirm = (row: any) => {
    queryParams.value.publishTimeStart = dayjs(row[0]).format('YYYY-MM-DD HH:mm:ss');
    queryParams.value.publishTimeEnd = dayjs(row[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');
    showCreateTime.value = false;
};


const loading = ref(false);
const finished = ref(false);
const listData = ref<any[]>([]);
const size = ref(20);
const current = ref(1);
const total = ref(0);
const disableLoadMore = ref(true);
const getPageList = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }

    loading.value = true;
    try {
        const res = await getSalesPlanAiReportPage({
            reportName: searchForm.searchValue,
            reportType: queryParams.value.source,
            reportStartTime: queryParams.value.publishTimeStart,
            reportEndTime: queryParams.value.publishTimeEnd,
            current: current.value,
            size: size.value,
        });
        if (res.code === 200) {
            const records = res.data?.records || [];
            total.value = Number(res.data?.total || 0);
            const newList = records.map((item: any) => formatListItem(item));
            listData.value = reset ? newList : [...listData.value, ...newList];
            console.log('listData', listData.value);

            const isNoMoreBySize = records.length < size.value;
            const isNoMoreByTotal = total.value > 0 && listData.value.length >= total.value;
            finished.value = isNoMoreBySize || isNoMoreByTotal;

            if (!finished.value) {
                current.value += 1;
            }
            return;
        }
        finished.value = true;
    } finally {
        loading.value = false;
    }
};

// 注册搜索事件 默认会执行一次
onSearchChange(async (searchForm) => {
    console.log(queryParams.value);
    console.log(searchForm);
    await getPageList(true);
    disableLoadMore.value = false;
});

const onLoad = async () => {
    if (finished.value) return;
    await getPageList();
};

const onRefresh = async (done?: () => void) => {
    await getPageList(true);
    done?.();
};

const onAction = (action: any, item: any) => {
    if (action.action === 'download') {
        downloadReport(item)
    }
    if (action.action === 'reload') {
        regenerateReport(item)
    }
    if (action.action === 'detail') {
        const query: any = { type: action.action };
        if (item.id) {
            query.id = item.id;
        }
        router.push({ name: 'crm:ai_prediction:detail', query });
    }
};

let showloading = window.$loading ? window.$loading() : null;
const exportingReportId = ref<any>(null);
const downloadReport = async (row: any) => {
    if (!row?.id) return;
    if (exportingReportId.value) return;
    try {
        exportingReportId.value = row.id;
        showloading.show()
        const res = await getSalesPlanAiReportDetail(row.id);
        if (res.code === 200) {
            await exportMarkdownReport(res.data || {});
        } else {
            showFailToast(res.msg || '获取报告内容失败');
        }
    } catch {
        showFailToast('获取报告内容失败');
    } finally {
        exportingReportId.value = null;
        showloading.hide()
    }
};
const exportMarkdownReport = async (detail: any) => {
    if (!detail.contentData) {
        showFailToast('暂无可导出的报告内容');
        return;
    }
    await exportMarkdownToPdf(
        detail.contentData,
        `${detail.reportName || detail.reportCode || 'AI预测报告'}.pdf`
    );
};
const regenerateReport = async (row: any) => {
    try {
        const res = await generateSalesPlanAiReport({ ruleId: row.ruleId, reportCode: row.reportCode });
        if (res.code === 200) {
            showDialog({
                message: 'AI智能体正在运算生成报告，\n请耐心等待',
                className: 'dd',
                confirmButtonText: "我知道了"
            }).then(async () => {
                await getPageList(true);
            })
            // await getPageList(true);
        }
    } catch {
        showFailToast('重新生成失败');
    }
};
</script>
<style lang="less" scoped>
:deep(.mx-list-item .card-footer) {
    margin-top: 4px !important;
}

:deep(.list-wrapper .mx-descriptions-item) {
    margin-right: 18px !important;
}

.app_page_content {
    height: 200vh;
}

.calendar_footer {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 50px;

    .reset {
        width: 96px;
    }
}

.time-box {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
}

.time-item {
    height: 36px;
    border-radius: 4px 4px 4px 4px;
    border: 1px solid #eaeaea;
    flex: 1;
    color: #999999;
    white-space: nowrap;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.time-center {
    font-weight: 400;
    font-size: 14px;
    color: #c4c4c4;
    flex-shrink: 0;
}

.select-time {
    color: #333333;
}

:deep(.van-cell) {
    padding-left: 0px;
    padding-right: 0px;
}

/* 查询条件的样式 */
.mx_mes_app-filter-form {
    padding-bottom: 8px;

    :deep(.van-cell) {
        padding: 8px 0;
    }

    :deep(.van-cell::after) {
        display: none;
    }

    :deep(.van-field__label) {
        font-size: 16px;
        font-weight: 500;
        color: var(--base-black);
    }

    // :deep(input.van-field__control[name='publishPersonId']) {
    //     height: 36px;
    //     border-radius: 4px 4px 4px 4px;
    //     border: 1px solid #eaeaea;
    //     padding: 0 12px;
    //     box-sizing: border-box;
    // }
}

:deep(.bordered-field .van-field__value) {
    margin-top: 4px;
    border: 1px solid #eaeaea;
    box-sizing: border-box;
    width: 100%;
    min-height: 34px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    border-radius: 4px;
}

:deep(.bordered-field .van-field__control) {
    min-height: 34px;
}

:deep(.bordered-field .van-cell__right-icon),
:deep(.bordered-field .van-field__right-icon) {
    display: none;
}
</style>
<style>
.dd .van-dialog__message{
    font-size: 16px;
}
</style>
