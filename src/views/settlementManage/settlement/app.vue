<template>
    <AppPage title="结算管理" :disableLoadMore="disableLoadMore" :showList="true" :loading="loading" :finished="finished" :searchConfig="searchConfig" @loadEvt="onLoad" @refreshEvt="onRefresh" @searchEvt="onSearch" @searchFilterReset="onSearchFilterReset" @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="list-wrapper">
                <MxAppListItem v-for="(item, index) in listData" :key="index" :actions="item.actions" :title="item.customerName" :statusConfig="item.statusStyle" @action="(btn) => onAction(btn, item)">
                    <template #header>
                        <div class="item-header">
                            <div class="header-left">
                                <div class="card-title">{{ item.customerName }}</div>
                                <div class="card-subtitle">
                                    <span>{{ item.settlementCode || '--' }}</span>
                                    <span class="line"></span>
                                    <span>我方经办人:{{ item.ourHandlerName || '--' }}</span>
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
                <Field label="合同编号" label-align="top">
                    <template #input>
                        <input v-model="queryParams.contractCode" class="filter-input" placeholder="请输入合同编号" />
                    </template>
                </Field>
                <MxPersonSelect title="我方经办人" class="bordered-field" :clearable="true" label-align="top" name="handlerCode" placeholder="请选择我方经办人" v-model="queryParams.handlerCode" />
                <MxCommSelect
                    v-model="queryParams.applyUnit"
                    v-model:label="queryParams.applyUnitLabel"
                    title="申请单位"
                    class="bordered-field"
                    label-align="top"
                    name="applyUnit"
                    placeholder="请选择申请单位"
                    :options="supplierUnitOptions"
                    :clearable="true"
                    :text="false" />
                <Field label-align="top" label="结算时间">
                    <template #input>
                        <div class="time-box" @click="showCreateTime = true">
                            <div class="time-item" :class="[queryParams.settlementStartTime ? 'select-time' : '']">
                                {{ queryParams.settlementStartTime ? queryParams.settlementStartTime.slice(0, 10) : '开始时间' }}
                            </div>
                            <div class="time-center">-</div>
                            <div class="time-item" :class="[queryParams.settlementEndTime ? 'select-time' : '']">
                                {{ queryParams.settlementEndTime ? queryParams.settlementEndTime.slice(0, 10) : '结束时间' }}
                            </div>
                        </div>
                    </template>
                </Field>
            </div>
            <Calendar v-model:show="showCreateTime" type="range" switch-mode="year-month" @confirm="createTimeConfirm" />
        </template>
        <!-- 底部新增按钮 -->
        <template #footer>
            <div class="add-btn-container flex-center" v-if="checkPermission(['crm:settlement:create'])">
                <van-button class="add-btn" type="primary" block @click="handleAdd()"> 新增 </van-button>
            </div>
        </template>
    </AppPage>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, Calendar, Button as VanButton, Field } from 'vant';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import { settlementStatusMap, SETTLEMENT_STATUS_CONSTANT } from '@/constants/settlement';
import { deleteSettlementMainApi, getSettlementPageApi } from '@/api';
import { useDictStore } from '@/store/commStore';
import { formatAmount } from './utils';
import { checkPermission } from '@/utils/comm';

interface ISearchFrom {
    workAreaCode?: string;
    dailyProductionDate?: string;
    searchValue?: string;
}
let config: IAppSearchConfig = {
    type: 'input',
    placeholder: '企业名称',
    showFilter: true,
};
const { searchForm, searchConfig, changeForm, onSearch, onSearchChange, onSearchFilterComfirm } =
    useAppSearch<ISearchFrom>(config);
const { dictMap } = storeToRefs(useDictStore());
const SUPPLIER_UNIT_DICT = '供方单位';
const supplierUnitOptions = computed(() =>
    (dictMap.value?.[SUPPLIER_UNIT_DICT] || []).map((item: any) => ({
        ...item,
        label: item.label || item.name || item.text || item.value || item.code || '',
        value: item.value || item.code || item.label || item.name || item.text || '',
    }))
);

/**
 * 将申请单位 applyUnit 字典值转换为供方单位展示文案。
 * @param value 申请单位字典值
 * @returns 供方单位字典文案
 */
const getSupplierUnitLabel = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const option = supplierUnitOptions.value.find((item: any) =>
        [item.value, item.code, item.label, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};

/**
 * 判断结算单是否允许编辑。
 * @param status 单据状态
 * @returns 是否允许编辑
 */
const canEdit = (status: string) => {
    return [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01, SETTLEMENT_STATUS_CONSTANT.APPROVAL_GEN_FAILED].includes(status);
};

/**
 * 从分页接口返回的人员字段中提取我方经办人名称。
 * @param handler 经办人对象、数组或字符串
 * @returns 我方经办人名称
 */
const getHandlerName = (handler: any) => {
    if (!handler) return '--';
    if (typeof handler === 'string') {
        try {
            return getHandlerName(JSON.parse(handler));
        } catch (error) {
            return handler || '--';
        }
    }
    const firstHandler = Array.isArray(handler) ? handler[0] : handler;
    return firstHandler?.label || firstHandler?.username || firstHandler?.name || firstHandler?.value || firstHandler?.code || '--';
};

/**
 * 格式化 App 结算单列表卡片数据。
 * @param row 结算单分页接口原始行数据
 * @returns App 列表组件需要的展示字段、状态样式和操作按钮
 */
const formatListItem = (row: any) => {
    const info = settlementStatusMap[row.status];
    return {
        ...row,
        ourHandlerName: getHandlerName(row.handler),
        infos: [
            { label: '关联合同编号', value: row.contractCode || '--', colSpan: 3 },
            { label: '结算总价', value: formatAmount(row.totalTaxAmount, '元'), colSpan: 1.5 },
            { label: '结算时间', value: row.settlementTime || '--', colSpan: 1.5 },
            { label: '申请单位', value: getSupplierUnitLabel(row.applyUnit), colSpan: 3 },
            { label: '客户经办人', value: row.handlerName || '--', colSpan: 3 },
        ],
        statusStyle: {
            label: info?.label || '--',
            type: (() => {
                const typeMap: Record<string, string> = {
                    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01]: 'warning',
                    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_02]: 'primary',
                    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_03]: 'success',
                    [SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING]: 'primary',
                    [SETTLEMENT_STATUS_CONSTANT.APPROVAL_GEN_FAILED]: 'error',
                    [SETTLEMENT_STATUS_CONSTANT.CANCELING]: 'warning',
                };
                return typeMap[row.status] || 'info';
            })(),
        },
        actions: [
            {
                text: '删除',
                type: 'danger',
                action: 'delete',
                show: canEdit(row.status) && checkPermission(['crm:settlement:delete']),
            },
            {
                text: '编辑',
                type: 'primary',
                action: 'edit',
                show: canEdit(row.status) && checkPermission(['crm:settlement:edit']),
            },

            {
                text: '详情',
                type: 'primary',
                action: 'detail',
                show: !canEdit(row.status),
            },
        ].filter((item) => item.show),
    };
};
const getDefaultQueryParams = () => ({
    status: '',
    settlementStartTime: '',
    settlementEndTime: '',
    handlerCode: '',
    contractCode: '',
    applyUnit: '',
    applyUnitLabel: '',
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
 * 处理结算时间区间选择。
 * @param row 日期范围选择结果
 * @returns 无返回值
 */
const createTimeConfirm = (row: any) => {
    queryParams.value.settlementStartTime = dayjs(row[0]).format('YYYY-MM-DD');
    queryParams.value.settlementEndTime = dayjs(row[1]).format('YYYY-MM-DD');
    showCreateTime.value = false;
};

const loading = ref(false);
const finished = ref(false);
const listData = ref<any[]>([]);
const size = ref(20);
const current = ref(1);
const total = ref(0);
const disableLoadMore = ref(true);

watch(
    supplierUnitOptions,
    () => {
        if (!listData.value.length) return;
        listData.value = listData.value.map((item: any) => formatListItem(item));
    },
    { deep: true }
);

/**
 * 获取 App 结算单分页数据。
 * @param reset 是否重置分页并重新加载第一页
 * @returns 无返回值，结果写入列表数据和分页状态
 */
const getSettlementPage = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }

    loading.value = true;
    try {
        const res = await getSettlementPageApi({
            customerName: searchForm.searchValue || undefined,
            handlerCode: queryParams.value.handlerCode || undefined,
            status: queryParams.value.status || undefined,
            contractCode: queryParams.value.contractCode || undefined,
            applyUnit: queryParams.value.applyUnit || undefined,
            settlementStartTime: queryParams.value.settlementStartTime || undefined,
            settlementEndTime: queryParams.value.settlementEndTime || undefined,
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
    } catch (error) {
        finished.value = true;
        console.error('Failed to obtain settlement:', error);
    } finally {
        loading.value = false;
    }
};

// 注册搜索事件 默认会执行一次
onSearchChange(async () => {
    await getSettlementPage(true);
    disableLoadMore.value = false;
});

/**
 * App 列表触底加载更多。
 * @returns 无返回值
 */
const onLoad = async () => {
    if (finished.value) return;
    await getSettlementPage();
};

/**
 * App 列表下拉刷新。
 * @param done 刷新组件完成回调
 * @returns 无返回值
 */
const onRefresh = async (done?: () => void) => {
    await getSettlementPage(true);
    done?.();
};

/**
 * 删除结算单并刷新 App 列表。
 * @param item 当前结算单数据
 * @returns 无返回值
 */
const deleteSettlement = async (item: any) => {
    if (!item?.id) return;
    try {
        const res: any = await deleteSettlementMainApi(item.id);
        if (res?.code === 200) {
            await getSettlementPage(true);
        }
    } catch (error) {
        console.error('删除结算单失败:', error);
    }
};

/**
 * 处理 App 结算单卡片操作。
 * @param action 操作按钮配置
 * @param item 当前结算单数据
 * @returns 无返回值
 */
const onAction = (action: any, item: any) => {
    if (action.action === 'detail') {
        router.push({ path: '/settlementManage/settlement/detail', query: { id: item.id } });
    }
    if (action.action === 'edit') {
        router.push({ path: '/settlementManage/settlement/edit', query: { id: item.id } });
    }
    if (action.action === 'delete') {
        showConfirmDialog({
            title: '确定要删除这条数据吗？',
            message: '删除后数据将不可恢复，请谨慎删除。',
            confirmButtonColor: 'var(--base-color-red)',
        }).then(async () => {
            await deleteSettlement(item);
        });
    }
};
const router = useRouter();

/**
 * 跳转新增结算单页面。
 * @returns 无返回值
 */
const handleAdd = () => {
    router.push({ path: '/settlementManage/settlement/create' });
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

        .line {
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

    :deep(.van-field__control) {
        border: none !important;
        padding: 0 !important;
    }

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

    .filter-input {
        width: 100%;
        height: 36px;
        border-radius: 4px;
        border: 1px solid #eaeaea;
        padding: 0 12px;
        box-sizing: border-box;
        outline: none;
    }
}


:deep(.van-cell::after) {
    display: none;
}

:deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
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
</style>
