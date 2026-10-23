<template>
    <AppPage
        title="发货订单"
        :disableLoadMore="disableLoadMore"
        :showList="true"
        :loading="loading"
        :finished="finished"
        :searchConfig="searchConfig"
        @loadEvt="onLoad"
        @refreshEvt="onRefresh"
        @searchEvt="onSearch"
        @searchFilterReset="handleSearchFilterReset"
        @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="list-wrapper">
                <MxAppListItem
                    v-for="(item, index) in listData"
                    :key="item.id || index"
                    :actions="item.actions"
                    :title="item.deliveryOrderCode || '--'"
                    :statusConfig="item.statusStyle"
                    @action="(action) => onAction(action, item)">
                    <MxAppDescriptions :data="item.infos" :column="3" label-width="auto" />
                </MxAppListItem>
            </div>
        </template>
        <template #filter>
            <div class="mx_mes_app-filter-form">
                <Field
                    v-model="queryParams.salesContractCode"
                    label="合同编号"
                    label-align="top"
                    placeholder="请输入合同编号"
                    clearable />
                <Field
                    v-model="queryParams.deliveryOrderCode"
                    label="发货订单号"
                    label-align="top"
                    placeholder="请输入发货订单号"
                    clearable />
                <Field label="发货类型" label-align="top">
                    <template #input>
                        <div class="status-tags">
                            <span
                                v-for="item in planTypeConfig"
                                :key="item.value"
                                :class="['status-tag', { active: queryParams.planType === item.value }]"
                                @click="queryParams.planType = item.value">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>
                <Field label="状态" label-align="top">
                    <template #input>
                        <div class="status-tags">
                            <span
                                v-for="item in statusConfig"
                                :key="item.value"
                                :class="['status-tag', { active: queryParams.status === item.value }]"
                                @click="queryParams.status = item.value">
                                {{ item.label }}
                            </span>
                        </div>
                    </template>
                </Field>
            </div>
        </template>
        <template #footer>
            <div class="add-btn-container flex-center" v-if="checkPermission(['crm:daily_shipping_plan:create'])">
                <van-button class="add-btn" type="primary" block @click="create">新增</van-button>
            </div>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button as VanButton, Field, showConfirmDialog } from 'vant';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import {
    getDailyShippingPlanDetailPageApi,
    updateDailyShippingPlanDetailStatusApi,
} from '@/api';
import {
    dailyShippingPlanTypeOptions,
    getDailyShippingPlanTypeLabel,
    PLAN_STATUS_CONSTANT,
    planStatusMap,
} from '@/constants/dailyShippingPlan';
import { checkPermission } from '@/utils/comm';

interface ISearchForm {
    searchValue?: string;
}

const router = useRouter();
const { dictMap } = storeToRefs(useDictStore());
const searchOptions: IAppSearchConfig = {
    type: 'input',
    placeholder: '客户名称',
    showFilter: true,
};
const { searchForm, searchConfig, onSearch, onSearchChange, onSearchFilterReset, onSearchFilterComfirm } =
    useAppSearch<ISearchForm>(searchOptions);

const queryParams = ref<any>({
    salesContractCode: '',
    planType: '',
    status: '',
    deliveryOrderCode: '',
});
const loading = ref(false);
const finished = ref(false);
const listData = ref<any[]>([]);
const size = ref(20);
const current = ref(1);
const total = ref(0);
const disableLoadMore = ref(true);

// 发货计划明细使用的业务字典名称。
const DICT = {
    MINERAL_TYPE: '矿种',
    PRIORITY: '优先级',
    SUPPLIER_UNIT: '供方单位',
};

/**
 * 获取指定业务字典选项。
 * @param dictName 字典名称
 * @returns 字典选项列表
 */
const getDictOptions = (dictName: string) => dictMap.value?.[dictName] || [];

/**
 * 将字典值转换为展示文案。
 * @param dictName 字典名称
 * @param value 字典值
 * @returns 字典文案或占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const option = getDictOptions(dictName).find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) =>
                optionValue !== null &&
                optionValue !== undefined &&
                String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};

/**
 * 格式化空值。
 * @param value 待展示值
 * @returns 原值或占位文案
 */
const formatValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);

const planTypeConfig = [
    { label: '全部', value: '' },
    ...dailyShippingPlanTypeOptions,
];

// 列表状态筛选不包含待执行。
const statusConfig = computed(() => [
    { label: '全部', value: '' },
    { label: planStatusMap[PLAN_STATUS_CONSTANT.EXECUTING]?.label || '执行中', value: PLAN_STATUS_CONSTANT.EXECUTING },
    { label: planStatusMap[PLAN_STATUS_CONSTANT.COMPLETED]?.label || '已完成', value: PLAN_STATUS_CONSTANT.COMPLETED },
    { label: planStatusMap[PLAN_STATUS_CONSTANT.TERMINATED]?.label || '暂停发货', value: PLAN_STATUS_CONSTANT.TERMINATED },
]);

// 明细状态操作配置，沿用详情页的状态值和确认文案。
const detailStatusActionMap = {
    suspend: { status: 1, title: '确认暂缓发货', message: '确定要暂缓该订单发货吗？', successMessage: '暂缓发货成功' },
    close: { status: 2, title: '确认关闭订单', message: '确定要关闭该订单吗？', successMessage: '关闭成功' },
    recover: { status: 3, title: '确认恢复订单', message: '确定要恢复该订单吗？', successMessage: '恢复成功' },
};

/**
 * 获取当前明细状态下的操作按钮。
 * @param item 当前发货计划明细
 * @returns 操作按钮配置
 */
const getDetailActions = (item: any) =>
    [
        {
            text: '暂缓发货',
            action: 'suspend',
            type: 'primary',
            show: item.status === PLAN_STATUS_CONSTANT.EXECUTING && checkPermission(['crm:daily_shipping_plan:hang']),
        },
        {
            text: '恢复订单',
            action: 'recover',
            type: 'primary',
            show: item.status === PLAN_STATUS_CONSTANT.TERMINATED && checkPermission(['crm:daily_shipping_plan:recover']),
        },
        {
            text: '关闭订单',
            action: 'close',
            type: 'primary',
            show: [PLAN_STATUS_CONSTANT.EXECUTING, PLAN_STATUS_CONSTANT.TERMINATED].includes(item.status) && checkPermission(['crm:daily_shipping_plan:close']),
        },
        {
            text: '运输情况',
            action: 'transport',
            type: 'primary',
            show: true,
        },
    ].filter((action) => action.show);

/**
 * 格式化 App 发货计划明细卡片。
 * @param row 发货计划明细原始数据
 * @returns App 列表卡片数据
 */
const formatListItem = (row: any) => ({
    ...row,
    infos: [
        { label: '合同编号', value: formatValue(row.salesContractCode), colSpan: 3 },
        { label: '发货类型', value: getDailyShippingPlanTypeLabel(row.planType), colSpan: 3 },
        { label: '发货订单号', value: formatValue(row.deliveryOrderCode), colSpan: 3 },
        { label: '优先级', value: formatDict(DICT.PRIORITY, row.priority), colSpan: 3 },
        { label: '矿石品位（%）', value: formatValue(row.grade), colSpan: 3 },
        { label: '矿石种类', value: formatDict(DICT.MINERAL_TYPE, row.mineralType), colSpan: 3 },
        { label: '合同数量（吨）', value: formatValue(row.contractNum), colSpan: 3 },
        { label: '已发货数量（吨）', value: formatValue(row.actualQuantity), colSpan: 3 },
        { label: '发货阈值（%）', value: formatValue(row.shipmentThreshold), colSpan: 3 },
        { label: '未发货量（吨）', value: formatValue(row.unshippedNum), colSpan: 3 },
        { label: '预发货量（吨）', value: formatValue(row.preDeliveryQuantity), colSpan: 3 },
        { label: '已交割数量（吨）', value: formatValue(row.deliveryQuantity), colSpan: 3 },
        { label: '待结算数量（吨）', value: formatValue(row.unSettledQuantity), colSpan: 3 },
        { label: '已结算数量（吨）', value: formatValue(row.settledQuantity), colSpan: 3 },
        { label: '供货单位', value: formatDict(DICT.SUPPLIER_UNIT, row.supplierUnit), colSpan: 3 },
        { label: '客户名称', value: formatValue(row.customerName), colSpan: 3 },
        { label: '子公司贸易商', value: formatValue(row.subsidiaryName), colSpan: 3 },
        { label: '计划备注', value: formatValue(row.remark), colSpan: 3 },
    ],
    statusStyle: {
        label: planStatusMap[row.status]?.label || '--',
        color: planStatusMap[row.status]?.textColor || '--base-grey',
        borderColor: planStatusMap[row.status]?.borderColor || '--base-grey',
        backgroundColor: planStatusMap[row.status]?.backgroundColor || '--base-grey',
    },
    actions: getDetailActions(row),
});

/**
 * 更新明细状态并刷新列表。
 * @param item 当前发货计划明细
 * @param action 操作按钮
 * @returns 无返回值
 */
const updateDetailOrderStatus = async (item: any, action: keyof typeof detailStatusActionMap) => {
    try {
        const actionConfig = detailStatusActionMap[action];
        const res = await updateDailyShippingPlanDetailStatusApi(
            {
                id: item.id,
                status: actionConfig.status,
            },
            actionConfig.successMessage
        );
        if (res?.code === 200) {
            await getPage(true);
        }
    } catch (error) {
        console.error('Failed to update shipping plan detail status:', error);
    }
};

/**
 * 处理 App 明细操作。
 * @param action 操作按钮
 * @param item 当前发货计划明细
 * @returns 无返回值
 */
const onAction = async (action: any, item: any) => {
    if (action.action === 'transport') {
        if (item?.id === undefined || item?.id === null || item?.id === '') return;

        router.push({
            name: 'crm:daily_shipping_plan:transportSituation',
            query: {
                id: String(item.id),
            },
        });
        return;
    }
    const actionConfig = detailStatusActionMap[action.action as keyof typeof detailStatusActionMap];
    if (!actionConfig) return;
    try {
        await showConfirmDialog({
            title: actionConfig.title,
            message: actionConfig.message,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        });
        await updateDetailOrderStatus(item, action.action);
    } catch (error) {
        // 用户取消确认时保持当前列表，不额外提示。
    }
};

/**
 * 重置 App 筛选条件。
 * @param event 筛选组件事件
 * @returns 无返回值
 */
const handleSearchFilterReset = (event?: any) => {
    queryParams.value = {
        salesContractCode: '',
        planType: '',
        status: '',
        deliveryOrderCode: '',
    };
    onSearchFilterReset(event || { searchValue: '' });
};

/**
 * 获取 App 发货计划明细分页数据。
 * @param reset 是否重置分页并重新加载第一页
 * @returns 无返回值
 */
const getPage = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }

    loading.value = true;
    try {
        const res = await getDailyShippingPlanDetailPageApi({
            salesContractCode: queryParams.value.salesContractCode || '',
            planType: queryParams.value.planType || '',
            status: queryParams.value.status || '',
            customerName: searchForm.searchValue || '',
            deliveryOrderCode: queryParams.value.deliveryOrderCode || '',
            current: current.value,
            size: size.value,
        });
        if (res?.code === 200) {
            const records = res.data?.records || [];
            total.value = Number(res.data?.total || 0);
            const newList = records.map((item: any) => formatListItem(item));
            listData.value = reset ? newList : [...listData.value, ...newList];
            finished.value = records.length < size.value || (total.value > 0 && listData.value.length >= total.value);
            if (!finished.value) current.value += 1;
            return;
        }
        finished.value = true;
    } catch (error) {
        finished.value = true;
        console.error('Failed to obtain shipping plan detail page:', error);
    } finally {
        loading.value = false;
    }
};

// 搜索栏默认回调会触发一次，客户名称作为接口 customerName 参数。
onSearchChange(async () => {
    await getPage(true);
    disableLoadMore.value = false;
});

/**
 * App 列表触底加载下一页。
 * @returns 无返回值
 */
const onLoad = async () => {
    if (!finished.value) await getPage();
};

/**
 * App 列表下拉刷新。
 * @param done 刷新完成回调
 * @returns 无返回值
 */
const onRefresh = async (done?: () => void) => {
    await getPage(true);
    done?.();
};

/**
 * 进入发货计划新增页。
 * @returns 无返回值
 */
const create = () => {
    router.push({ path: '/shippingManage/dailyShippingPlan/create' });
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
    align-items: center;
    margin-bottom: 12px;
    width: 100%;

    .card-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--base-black);
        flex: 1;
    }

    .card-status {
        font-size: 12px;
        line-height: 18px;
        padding: 2px 4px;
        border-radius: 2px;
        white-space: nowrap;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
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
        padding: 0 12px;
        box-sizing: border-box;
    }
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
