<template>
    <AppPage title="市场报告" :disableLoadMore="disableLoadMore" :showList="true" :loading="loading" :finished="finished" :searchConfig="searchConfig" @loadEvt="onLoad" @refreshEvt="onRefresh" @searchEvt="onSearch" @searchFilterReset="onSearchFilterReset" @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="list-wrapper">
                <MxAppListItem v-for="(item, index) in listData" :key="index" :actions="item.actions" @action="(btn) => onAction(btn, item)">
                    <template #header>
                        <div class="item-header">
                            <AppTag :text="item.statusName" :type="item.statusStyle?.type" style="margin-right: 8px;" />
                            <div class="card-title">{{ item.title }}</div>
                            <div class="push-state" :style="item.pushStyle">{{ item.latestPushStatusName }}</div>
                        </div>
                    </template>
                    <MxAppDescriptions :data="item.infos" :column="3" label-width="auto" />
                </MxAppListItem>
            </div>
        </template>
        <template #filter>
            <div class="mx_mes_app-filter-form">
                <Field label="状态" label-align="top">
                    <template #input>
                        <div class="status-tags">
                            <span v-for="item in statusConfig" :key="item.value" :class="['status-tag', { active: queryParams.status === item.value }]" @click="queryParams.status = item.value">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>
                <Field label-align="top" label="创建时间" placeholder="请选择创建时间">
                    <template #input>
                        <div class="time-box" @click="showCreateTime = true">
                            <div class="time-item" :class="[queryParams.createAtStart ? 'select-time' : '']">
                                {{ queryParams.createAtStart ? queryParams.createAtStart.slice(0, 10) : '开始时间' }}
                            </div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="[queryParams.createAtEnd ? 'select-time' : '']">
                                {{ queryParams.createAtEnd ? queryParams.createAtEnd.slice(0, 10) : '结束时间' }}
                            </div>
                        </div>
                    </template>
                </Field>
                <MxPersonSelect :clearable="true" class="bordered-field" title="作者" label-align="top" name="authorId" placeholder="请选择作者" v-model="queryParams.authorId" />
            </div>
            <Calendar v-model:show="showCreateTime" type="range" switch-mode="year-month" @confirm="createTimeConfirm" />
        </template>
        <!-- 底部新增按钮 -->
        <template #footer v-if="checkPermission(['crm:market_report:create'])">
            <div class="add-btn-container flex-center">
                <van-button class="add-btn" type="primary" block @click="handleAddClick('add')"> 新增 </van-button>
            </div>
        </template>
    </AppPage>
    <MxCommSelect v-model:show="pushSelectShow" v-model="pushCurrentItem.pushChatList" title="消息推送" name="pushChatList" :multiple="true" :appShowVanField="false" :options="larkChartList" @changeEvt="pushItem" :clearable="true" :text="false" />
</template>
<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, Calendar, Button as VanButton, Field } from 'vant';
import { deepClone, checkPermission } from '@/utils/comm';
import dayjs from 'dayjs';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import {
    MARKET_REPORT_STATUS_CONSTANT,
    MARKET_REPORT_PUSH_STATUS_CONSTANT,
    marketReportPushStatusMap,
} from '@/constants/marketReport';
import {
    getMarketReportPageApi,
    deleteMarketReportApi,
    pushMarketReportApi,
    getLarkChatListApi,
    marketReportPushStateRefresh,
} from '@/api';


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
const { searchForm, searchConfig, changeForm, onSearch, onSearchChange, onSearchFilterComfirm } =
    useAppSearch<ISearchFrom>(config);

// 格式化列表项
const formatListItem = (row: any) => {
    const pushInfo = marketReportPushStatusMap[row.latestPushStatus];
    return {
        ...row,
        infos: [
            { label: '作者', value: row.authorName || '--', colSpan: 1 },
            { label: '创建时间', value: row.createdAt || '--', colSpan: 2 },
        ],
        statusStyle: {
            type: row.status === MARKET_REPORT_STATUS_CONSTANT.DRAFT ? 'warning' : 'success',
        },
        pushStyle: {
            color: pushInfo?.textColor || '--base-grey',
            // borderColor: pushInfo?.borderColor || '--base-grey',
            // backgroundColor: pushInfo?.backgroundColor || '--base-grey',
        },
        actions: [
            {
                text: '删除',
                type: 'danger',
                action: 'delete',
                show: row.status === MARKET_REPORT_STATUS_CONSTANT.DRAFT && checkPermission(["crm:market_report:delete"]),
            },
            { text: '预览', type: 'primary', action: 'preview', show: true },
            {
                text: '编辑',
                type: 'primary',
                action: 'edit',
                show: row.status === MARKET_REPORT_STATUS_CONSTANT.DRAFT && checkPermission(["crm:market_report:edit"])
            },
            {
                text: '推送',
                type: 'primary',
                action: 'push',
                show: row.status === MARKET_REPORT_STATUS_CONSTANT.ARCHIVED && checkPermission(["crm:market_report:push"]),
            },
            {
                text: '详情',
                type: 'primary',
                action: 'detail',
                show: row.status === MARKET_REPORT_STATUS_CONSTANT.ARCHIVED,
            },
        ].filter((item) => item.show),
    };
};
const statusConfig = computed(() => {
    return [
        { label: '全部', value: '' },
        { label: '草稿', value: MARKET_REPORT_STATUS_CONSTANT.DRAFT },
        { label: '已归档', value: MARKET_REPORT_STATUS_CONSTANT.ARCHIVED },
    ];
});
const getDefaultQueryParams = () => ({
    status: '',
    createAtStart: '',
    createAtEnd: '',
    authorId: '',
});
const onSearchFilterReset = (e) => {
    queryParams.value = getDefaultQueryParams();
    changeForm(e);
};
const showCreateTime = ref<boolean>(false);
const queryParams = ref<any>(getDefaultQueryParams());

const createTimeConfirm = (row: any) => {
    queryParams.value.createAtStart = dayjs(row[0]).format('YYYY-MM-DD HH:mm:ss');
    queryParams.value.createAtEnd = dayjs(row[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');
    showCreateTime.value = false;
};

const pushSelectShow = ref(false);
const pushCurrentItem = ref<any>({});

const loading = ref(false);
const finished = ref(false);
const listData = ref<any[]>([]);
const size = ref(20);
const current = ref(1);
const total = ref(0);
const disableLoadMore = ref(true);
const getMarketReportPage = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }

    loading.value = true;
    try {
        const res = await getMarketReportPageApi({
            title: searchForm.searchValue,
            authorId: queryParams.value.authorId,
            status: queryParams.value.status,
            createTimeStart: queryParams.value.createAtStart,
            createTimeEnd: queryParams.value.createAtEnd,
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
    await getMarketReportPage(true);
    disableLoadMore.value = false;
});

const onLoad = async () => {
    if (finished.value) return;
    await getMarketReportPage();
};

const onRefresh = async (done?: () => void) => {
    await getMarketReportPage(true);
    done?.();
};

const onAction = (action: any, item: any) => {
    if (action.action === 'delete') {
        showConfirmDialog({
            title: '确定要删除这条数据吗？',
            message: '删除后数据将不可恢复，请谨慎删除。',
            confirmButtonColor: 'var(--base-color-red)',
        }).then(async () => {
            try {
                const res = await deleteMarketReportApi(item.id);
                if (res && res.code === 200) {
                    onRefresh();
                }
            } catch (error) {
                console.error('Delete market report failed:', error);
            }
        });
    }
    if (action.action === 'detail' || action.action === 'preview') {
        const query: any = { type: action.action };
        if (item.id) {
            query.id = item.id;
        }
        router.push({ name: 'crm:market_report:detail', query });
    }
    if (action.action === 'edit') {
        handleAddClick(action.action, item.id);
    }
    if (action.action === 'push') {
        // pushItem(item);
        pushCurrentItem.value = deepClone(item);
        pushCurrentItem.value.pushChatList = (pushCurrentItem.value.pushChatList || []).map((item) => item.chatId);
        pushSelectShow.value = true;
    }
};
//获取飞书群组列表
let larkChartList = ref([]);
const changeItem = (item, pushState) => {
    item.latestPushStatus = pushState;
    item.latestPushStatusName = marketReportPushStatusMap[pushState].label;
    let newItem = formatListItem(item);
    item.pushStyle = newItem.pushStyle;
    item.statusStyle = newItem.statusStyle;
};
const pushItem = async (pushChatList) => {
    const params = {
        ...pushCurrentItem.value,
        pushChatList: pushChatList.map((item) => ({ name: item.label, chatId: item.value })),
    };
    try {
        const res = await pushMarketReportApi(params);
        console.log('res', res);
        if (res && res.code == 200) {
            let findItem = listData.value.find((item) => item.id == pushCurrentItem.value.id);
            if (findItem) {
                changeItem(findItem, MARKET_REPORT_PUSH_STATUS_CONSTANT.PENDING);
                marketReportPushStateRefresh(findItem, changeItem);
            }
        }
    } catch (error) {
        console.error('Failed to push market report:', error);
    }
};
const router = useRouter();
const handleAddClick = (type: string, id?: string) => {
    const query: any = { type };
    if (id) {
        query.id = id;
    }
    router.push({ name: 'crm:market_report:create', query });
};
const getLarkChatList = async () => {
    try {
        const res = await getLarkChatListApi();
        larkChartList.value = (res.data || []).map((item) => {
            return {
                label: item.name,
                value: item.chatId,
            };
        });
    } catch (error) {
        console.log(error);
    }
};
getLarkChatList();
onBeforeUnmount(() => {
    listData.value.forEach((item) => {
        clearTimeout(item.pushTimer);
    });
});
</script>
<style lang="less" scoped>
:deep(.mx-list-item .card-footer) {
    margin-top: 4px !important;
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

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .card-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--base-black);
        flex: 1;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-all;
    }

    .push-state {
        font-size: 12px;
    }
}

.add-btn-container {
    display: flex;
    padding: 4px 12px 8px;
    background-color: var(--base-white);
    z-index: 99;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);

    .add-btn {
        border-radius: 4px;
        height: 40px;
        font-size: 16px;
        font-weight: 500;
        font-weight: 500;
        --van-button-primary-background: #2c65f2;
        --van-button-primary-border-color: #2c65f2;
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

    .status-tags {
        margin-top: 4px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .status-tag {
            width: 80px;
            height: 32px;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: var(--base-grey2);
            border: 1px solid rgba(132, 132, 132, 0.16);
            border-radius: 4px;
            cursor: pointer;

            &.active {
                color: #2c65f2;
                background: #ecf1fc;
                border-color: #ecf1fc;
            }
        }
    }

    // :deep(input.van-field__control) {
    //     height: 36px;
    //     border-radius: 4px 4px 4px 4px;
    //     border: 1px solid #eaeaea;
    //     padding: 0 12px;
    //     box-sizing: border-box;
    // }
}



:deep(.van-cell::after) {
    display: none;
}

:deep(.van-field__label) {
    font-size: 16px;
    font-weight: 500;
    color: var(--base-black);
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
