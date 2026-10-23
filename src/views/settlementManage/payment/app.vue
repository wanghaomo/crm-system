<template>
    <AppPage
        title="回款管理"
        :disableLoadMore="disableLoadMore"
        :showList="true"
        :loading="loading"
        :finished="finished"
        :searchConfig="searchConfig"
        @loadEvt="onLoad"
        @refreshEvt="onRefresh"
        @searchEvt="onSearch"
        @searchFilterReset="onSearchFilterReset"
        @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="list-wrapper">
                <MxAppListItem
                    v-for="(item, index) in listData"
                    :key="index"
                    :actions="item.actions"
                    :title="item.customerName"
                    :statusConfig="item.statusStyle"
                    @action="(btn) => onAction(btn, item)">
                    <template #header>
                        <div class="item-header">
                            <div class="header-left">
                                <div class="card-title">{{ item.customerName }}</div>
                                <div class="card-subtitle">
                                    <span>{{ item.receiptCode || '--' }}</span>
                                    <span class="line"></span>
                                    <span>跟单人:{{ item.handlerName || '--' }}</span>
                                </div>
                            </div>
                            <AppTag v-if="item.statusStyle?.label" :text="item.statusStyle.label" :type="item.statusStyle.type" />
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
                        <div class="status-tags" >
                            <span
                                v-for="item in statusConfig"
                                :key="item.value"
                                :class="['status-tag', { active: queryParams.status === item.value }, item.value === 'PROGRESS_OVERDUE' ? 'big-status-tag' : '']"
                                @click="queryParams.status = item.value">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>
                <Field
                    v-model="queryParams.contractCode"
                    class="bordered-field"
                    label="合同编号"
                    label-align="top"
                    placeholder="请输入合同编号"
                    clearable />
                <MxPersonSelect
                    :clearable="true"
                    class="bordered-field"
                    title="跟单人"
                    label-align="top"
                    name="handlerCode"
                    placeholder="请选择跟单人"
                    v-model="queryParams.handlerCode" />

                <Field label-align="top" label="计划回款日">
                    <template #input>
                        <div class="time-box" @click="showCreateTime = true">
                            <div class="time-item" :class="[queryParams.plannedDateStart ? 'select-time' : '']">
                                {{ queryParams.plannedDateStart ? queryParams.plannedDateStart.slice(0, 10) : '开始时间' }}
                            </div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="[queryParams.plannedDateEnd ? 'select-time' : '']">
                                {{ queryParams.plannedDateEnd ? queryParams.plannedDateEnd.slice(0, 10) : '结束时间' }}
                            </div>
                        </div>
                    </template>
                </Field>
            </div>
            <Calendar
                v-model:show="showCreateTime"
                type="range"
                switch-mode="year-month"
                @confirm="createTimeConfirm" />
        </template>
        <!-- 底部新增按钮 -->
        <template #footer>
            <div class="add-btn-container flex-center" v-if="checkPermission(['crm:payment:batchPayment'])">
                <van-button class="add-btn" type="primary" block @click="batchPayment()"> 批量回款 </van-button>
            </div>
        </template>

    </AppPage>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button as VanButton, Field, Calendar } from 'vant';
import AppTag from '@/appComponents/AppTag/index.vue';
import dayjs from 'dayjs';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import { paymentStatusMap, PAYMENT_STATUS_CONSTANT } from '@/constants/payment';
import { getPaymentPageApi } from '@/api';
import { formatAmount, formatDateParam, normalizePaymentRecord } from './utils';
import { checkPermission } from '@/utils/comm';

interface ISearchFrom {
    workAreaCode?: string;
    dailyProductionDate?: string;
    searchValue?: string;
}
const config: IAppSearchConfig = {
    type: 'input',
    placeholder: '企业名称',
    showFilter: true,
};
const { searchForm, searchConfig, changeForm, onSearch, onSearchChange, onSearchFilterComfirm } =
    useAppSearch<ISearchFrom>(config);

/**
 * 格式化 App 回款单列表卡片数据。
 * @param row 回款单原始行数据
 * @returns App 列表组件需要的展示字段、状态样式和操作按钮
 */
const formatListItem = (row: any) => {
    const info = paymentStatusMap[row.status];
    const formattedRow = normalizePaymentRecord(row);
    return {
        ...formattedRow,
        infos: [
            { label: '合同编号', value: formattedRow.contractCode || '--', colSpan: 3 },
            { label: '应收金额', value: formatAmount(formattedRow.amountDue), colSpan: 1.5 },
            { label: '计划回款日', value: formattedRow.plannedDate || '--', colSpan: 1.5 },
            { label: '未收金额', value: formatAmount(formattedRow.amountUnpaid), colSpan: 3 },
        ],
        statusStyle: {
            label: info?.label || '--',
            type: (() => {
                const typeMap: Record<string, string> = {
                    [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01]: 'warning',
                    [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02]: 'primary',
                    [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_03]: 'success',
                    [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04]: 'error',
                };
                return typeMap[formattedRow.status] || 'info';
            })(),
        },
        actions: [
            {
                text: '编辑',
                type: 'primary',
                action: 'edit',
                show: formattedRow.status === PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01 && checkPermission(['crm:payment:edit']),
            },
            {
                text: '回款',
                type: 'primary',
                action: 'payment',
                show:
                    (formattedRow.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02 ||
                    formattedRow.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04) && checkPermission(['crm:payment:returned']),
            },
            {
                text: '催款',
                type: 'primary',
                action: 'jreminder',
                show:
                    (formattedRow.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04 ||
                    formattedRow.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02) && checkPermission(['crm:payment:demand']),
            },
            {
                text: '详情',
                type: 'primary',
                action: 'detail',
                show: formattedRow.status !== PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
            },
        ].filter((item) => item.show),
    };
};
// App 筛选面板中的回款状态选项，与 PC 端保持一致。
const paymentStatusOptions = [
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_03,
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04,
].map((value) => ({
    label: paymentStatusMap[value]?.label || value,
    value,
}));

const statusConfig = computed(() => [{ label: '全部', value: '' }, ...paymentStatusOptions]);
/**
 * 获取列表默认查询条件。
 * @returns 默认筛选参数
 */
const getDefaultQueryParams = () => ({
    status: '',
    plannedDateStart: '',
    plannedDateEnd: '',
    handlerCode: '',
    contractCode: '',
});
/**
 * 重置 App 筛选条件。
 * @returns 无返回值，重置筛选表单
 */
const onSearchFilterReset = (event?: any) => {
    queryParams.value = getDefaultQueryParams();
    changeForm(event || { searchValue: '' });
};
const showCreateTime = ref<boolean>(false);
const queryParams = ref<any>(getDefaultQueryParams());

/**
 * 处理计划回款日区间选择。
 * @param row 日期范围选择结果
 * @returns 无返回值
 */
const createTimeConfirm = (row: any) => {
    queryParams.value.plannedDateStart = dayjs(row[0]).format('YYYY-MM-DD');
    queryParams.value.plannedDateEnd = dayjs(row[1]).format('YYYY-MM-DD');
    showCreateTime.value = false;
};

const loading = ref(false);
const finished = ref(false);
const listData = ref<any[]>([]);
const size = ref(20);
const current = ref(1);
const total = ref(0);
const disableLoadMore = ref(true);
/**
 * 获取 App 回款单分页数据。
 * @param reset 是否重置分页并重新加载第一页
 * @returns 无返回值，结果写入列表数据和分页状态
 */
const getPaymentPage = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }

    loading.value = true;
    try {
        const res = await getPaymentPageApi({
            customerName: searchForm.searchValue || undefined,
            status: queryParams.value.status || undefined,
            handlerCode: queryParams.value.handlerCode || undefined,
            contractCode: queryParams.value.contractCode || undefined,
            plannedDateStart: formatDateParam(queryParams.value.plannedDateStart),
            plannedDateEnd: formatDateParam(queryParams.value.plannedDateEnd),
            current: current.value,
            size: size.value,
        });
        if (res.code === 200) {
            const records = res.data?.records || [];
            total.value = Number(res.data?.total || 0);
            const newList = records.map((item: any) => formatListItem(item));
            listData.value = reset ? newList : [...listData.value, ...newList];

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
onSearchChange(async () => {
    await getPaymentPage(true);
    disableLoadMore.value = false;
});

/**
 * App 列表触底加载更多。
 * @returns 无返回值
 */
const onLoad = async () => {
    if (finished.value) return;
    await getPaymentPage();
};

/**
 * App 列表下拉刷新。
 * @param done 刷新组件完成回调
 * @returns 无返回值
 */
const onRefresh = async (done?: () => void) => {
    await getPaymentPage(true);
    done?.();
};

/**
 * 处理 App 回款单卡片操作。
 * @param action 操作按钮配置
 * @param item 当前回款单数据
 * @returns 无返回值
 */
const onAction = (action: any, item: any) => {
    if (action.action === 'detail') {
        router.push({ path: '/settlementManage/payment/detail', query: { id: item.id } });
    }
    if (action.action === 'edit') {
        router.push({ path: '/settlementManage/payment/edit', query: { id: item.id } });
    }
    if (action.action === 'jreminder') {
        router.push({ path: '/settlementManage/payment/jreminderRecord', query: { id: item.id } });
    }
    if (action.action === 'payment') {
        router.push({ path: '/settlementManage/payment/paymentRecord', query: { id: item.id } });
    }
};
const router = useRouter();
/**
 * 跳转批量回款页面。
 * @returns 无返回值
 */
const batchPayment = () => {
    router.push({ path: '/settlementManage/payment/batchPayment' });
};
</script>
<style lang="postcss" scoped>
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
    align-items: flex-start;
    width: 100%;

    .header-left {
        flex: 1;
        min-width: 0;
        margin-right: 8px;
    }

    .card-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--base-black);
        margin-bottom: 4px;
    }

    .card-subtitle {
        font-size: 14px;
        color: var(--base-grey);
        display: flex;
        align-items: center;
        .line{
            height: 8px;
            width: 1px;
            margin: 0 6px;
            background-color: #CECECE;
        }
    }

    .push-state {
        font-size: 12px;
        margin-left: 4px;
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

:deep(.van-field__control) {
        border: none !important;
        padding: 0 !important;
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
    :deep(input.van-field__control) {
        height: 36px;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid #eaeaea;
        box-sizing: border-box;
    }
}

:deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
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
    border: none !important;
}
:deep(.bordered-field .van-cell__right-icon),
:deep(.bordered-field .van-field__right-icon) {
    display: none;
}

.big-status-tag {
    width: 120px !important;
}
</style>
