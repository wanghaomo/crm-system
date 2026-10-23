<template>
    <AppPage
        title="资金管理"
        :disableLoadMore="disableLoadMore"
        :showList="true"
        :loading="loading"
        :finished="finished"
        :searchConfig="appSearchConfig"
        @loadEvt="onLoad"
        @refreshEvt="onRefresh"
        @searchEvt="onSearch"
        @searchFilterReset="onSearchFilterReset"
        @searchFilterComfirm="onSearchFilterComfirm">
        <template #content>
            <div class="list-wrapper">
                <MxAppListItem
                    v-for="(item, index) in listData"
                    :key="item.customerId || index"
                    :title="formatValue(item.customerName)"
                    :actions="item.actions"
                    @action="(action) => onAction(action, item)">
                    <MxAppDescriptions :data="item.infos" :column="3" label-width="auto" />
                </MxAppListItem>
            </div>
        </template>
        <template #filter>
            <div class="mx_mes_app-filter-form">
                <MxCommSelect
                    v-model="queryParams.customerId"
                    v-model:label="queryParams.customerName"
                    title="客户名称"
                    typeName="企业客户"
                    class="bordered-field"
                    label-align="top"
                    placeholder="请选择客户名称"
                    :clearable="true"
                    :text="false" />
                <Field
                    v-model="queryParams.customerCode"
                    class="bordered-field"
                    label="客户编码"
                    label-align="top"
                    placeholder="请输入客户编码"
                    clearable />
            </div>
        </template>
    </AppPage>
    <Popup v-model:show="detailVisible" position="right" :style="{ width: '100%', height: '100%' }">
        <div class="fund-detail-popup">
            <div class="fund-detail-header">
                <span>客户资金管理详情</span>
                <span class="fund-detail-close" @click="detailVisible = false">×</span>
            </div>
            <div class="fund-detail-content">
                <div class="fund-detail-customer">{{ formatValue(detailData.customerName) }}</div>
                <div class="fund-detail-summary">
                    <span>总合同金额(万元) {{ formatValue(detailData.subItemAmount) }}</span>
                    <span>总合同数量(万吨) {{ formatValue(detailData.contractQuantity) }}</span>
                </div>
                <div class="fund-section-title">基础信息</div>
                <div class="fund-stat-grid">
                    <div v-for="item in detailStats" :key="item.key" class="fund-stat-card">
                        <div class="fund-stat-label">{{ item.label }}</div>
                        <div :class="['fund-stat-value', `is-${item.tone}`]">{{ item.value }}</div>
                    </div>
                </div>
                <div class="fund-section-title">资金记录</div>
                <div v-if="detailLoading" class="fund-record-empty">加载中...</div>
                <div v-else-if="detailRecords.length === 0" class="fund-record-empty">暂无资金记录</div>
                <div v-else class="fund-record-list">
                    <div v-for="(record, index) in detailRecords" :key="record.id || index" class="fund-record-item">
                        <div class="fund-record-main">
                            <span>{{ index + 1 }}. {{ formatFundType(record.fundType) }}</span>
                            <span
                                :class="
                                    Number(record.prepaymentAmount) < 0
                                        ? 'fund-amount-negative'
                                        : 'fund-amount-positive'
                                ">
                                {{ formatFundAmount(record.prepaymentAmount) }}元
                            </span>
                        </div>
                        <div class="fund-record-meta">
                            <span>{{ formatValue(record.createdAt) }}</span>
                            <span>关联回款单：{{ formatValue(record.receiptCode) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Popup>
    <Popup v-model:show="prepaymentVisible" round position="center" :style="{ width: '88%' }">
        <div class="prepayment-popup">
            <div class="prepayment-title">录入预付款</div>
            <Field v-model="prepaymentForm.customerName" label="客户名称" readonly />
            <Field
                v-model="prepaymentForm.prepaymentAmount"
                label="预付款(元)"
                type="number"
                placeholder="请输入预付款金额"
                clearable />
            <div class="prepayment-actions">
                <van-button type="primary" block :loading="prepaymentSubmitting" @click="submitPrepayment"
                    >提交</van-button
                >
            </div>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button as VanButton, Field, Popup, showToast } from 'vant';
import { useAppSearch, IAppSearchConfig } from '@/hooks/useAppSearch';
import {
    createFundsManagementRecordApi,
    getFundsManagementPageApi,
    getFundsManagementRecordListByCustomerApi,
} from '@/api';
import { checkPermission } from '@/utils/comm';

const FUND_TYPE_PREPAYMENT = 'FUND_TYPE_01';
const FUND_TYPE_LABEL_MAP: Record<string, string> = {
    FUND_TYPE_01: '预付款',
    FUND_TYPE_02: '溢收款',
    FUND_TYPE_03: '预收冲应收',
};

interface ISearchForm {
    searchValue?: string;
}

const searchConfigOptions: IAppSearchConfig = {
    type: 'input',
    placeholder: '客户名称',
    showFilter: true,
};
const {
    searchForm,
    searchConfig: appSearchConfig,
    changeForm,
    onSearch,
    onSearchChange,
    onSearchFilterComfirm,
} = useAppSearch<ISearchForm>(searchConfigOptions);

const queryParams = ref({
    customerId: '',
    customerName: '',
    customerCode: '',
});
const loading = ref(false);
const finished = ref(false);
const listData = ref<any[]>([]);
const current = ref(1);
const size = ref(20);
const total = ref(0);
const disableLoadMore = ref(true);
const prepaymentVisible = ref(false);
const prepaymentSubmitting = ref(false);
const prepaymentForm = ref({
    customerId: '',
    customerName: '',
    prepaymentAmount: '',
});
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<Record<string, any>>({});
const detailRecords = ref<any[]>([]);

/**
 * 将空值转换为页面统一的占位文本。
 * @param value 待展示值
 * @returns 展示文本
 */
const formatValue = (value: any) => {
    return value === null || value === undefined || value === '' ? '--' : value;
};

/**
 * 将资金类型编码转换为详情展示文案。
 * @param fundType 资金类型编码
 * @returns 资金类型展示文案
 */
const formatFundType = (fundType: any) => FUND_TYPE_LABEL_MAP[fundType] || formatValue(fundType);

/**
 * 格式化资金记录金额并补充正负号。
 * @param value 资金记录金额
 * @returns 带正负号的金额展示文本
 */
const formatFundAmount = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return amount > 0 ? `+${value}` : String(value);
};

const detailStats = computed(() => [
    {
        key: 'shippedQuantity',
        label: '已经发货数量(万吨)',
        value: formatValue(detailData.value.shippedQuantity),
        tone: 'positive',
    },
    {
        key: 'deliveryQuantity',
        label: '已经交割数量(万吨)',
        value: formatValue(detailData.value.deliveryQuantity),
        tone: 'positive',
    },
    {
        key: 'settleWeight',
        label: '已经结算数量(万吨)',
        value: formatValue(detailData.value.settleWeight),
        tone: 'positive',
    },
    {
        key: 'receivedAmount',
        label: '已经结算金额(万元)',
        value: formatValue(detailData.value.receivedAmount),
        tone: 'positive',
    },
    {
        key: 'unSettleWeight',
        label: '待结算数量(万吨)',
        value: formatValue(detailData.value.unSettleWeight),
        tone: 'negative',
    },
    {
        key: 'unReceivedAmount',
        label: '待结算金额(万元)',
        value: formatValue(detailData.value.unReceivedAmount),
        tone: 'negative',
    },
    {
        key: 'amountReceived',
        label: '已回款金额(万元)',
        value: formatValue(detailData.value.amountReceived),
        tone: 'positive',
    },
    {
        key: 'amountUnpaid',
        label: '待回款金额(万元)',
        value: formatValue(detailData.value.amountUnpaid),
        tone: 'negative',
    },
    {
        key: 'prepaymentAmount',
        label: '资金余额(万元)',
        value: formatValue(detailData.value.prepaymentAmount),
        tone: 'normal',
    },
]);

/**
 * 将资金管理分页记录转换为 App 卡片描述数据。
 * @param row 资金管理分页原始记录
 * @returns App 列表卡片数据
 */

/** 将后端列表行转换为 App 卡片展示数据。 */
const formatListItem = (row: any) => {
    const actions: any[] = [
        {
            text: '详情',
            type: 'primary',
            action: 'detail',
            show: true,
        },
    ];

    if (checkPermission(['crm:fundsManagement:prepay'])) {
        actions.push({
            text: '预付款',
            type: 'primary',
            action: 'prepayment',
            show: true,
        });
    }

    return {
        ...row,
        actions,
        infos: [
            { label: '总合同金额（万元）', value: formatValue(row.subItemAmount), colSpan: 3 },
            { label: '总合同数量（万吨）', value: formatValue(row.contractQuantity), colSpan: 3 },
            { label: '已发货数量（万吨）', value: formatValue(row.shippedQuantity), colSpan: 3 },
            { label: '已交割数量（万吨）', value: formatValue(row.deliveryQuantity), colSpan: 3 },
            { label: '已结算数量（万吨）', value: formatValue(row.settleWeight), colSpan: 3 },
            { label: '已结算金额（万元）', value: formatValue(row.receivedAmount), colSpan: 3 },
            { label: '已回款金额（万元）', value: formatValue(row.amountReceived), colSpan: 3 },
            { label: '待结算数量（万吨）', value: formatValue(row.unSettleWeight), colSpan: 3 },
            { label: '待结算金额（万元）', value: formatValue(row.unReceivedAmount), colSpan: 3 },
            { label: '待回款金额（万元）', value: formatValue(row.amountUnpaid), colSpan: 3 },
            { label: '资金余额（万元）', value: formatValue(row.prepaymentAmount), colSpan: 3 },
        ],
    };
};
/**
 * 打开 App 录入预付款弹窗。
 * @param item 当前客户资金总览行
 * @returns 无返回值
 */
const openPrepayment = (item: any) => {
    prepaymentForm.value = {
        customerId: item?.customerId || '',
        customerName: item?.customerName || '',
        prepaymentAmount: '',
    };
    prepaymentVisible.value = true;
};

/**
 * 提交 App 预付款。
 * @returns 无返回值
 */
const submitPrepayment = async () => {
    const amount = Number(prepaymentForm.value.prepaymentAmount);
    if (!prepaymentForm.value.customerId) {
        showToast('客户名称不能为空');
        return;
    }
    const rawAmount = prepaymentForm.value.prepaymentAmount;
    if (rawAmount === '' || rawAmount === null || rawAmount === undefined || !Number.isFinite(amount) || amount < 0) {
        showToast('请输入正确的预付款金额');
        return;
    }

    prepaymentSubmitting.value = true;
    try {
        const res: any = await createFundsManagementRecordApi({
            customerId: prepaymentForm.value.customerId,
            fundType: FUND_TYPE_PREPAYMENT,
            prepaymentAmount: amount,
        });
        if (res?.code === 200) {
            prepaymentVisible.value = false;
            await getFundsPage(true);
        }
    } catch (error) {
        console.error('提交预付款失败:', error);
    } finally {
        prepaymentSubmitting.value = false;
    }
};

/**
 * 处理 App 卡片操作。
 * @param action 当前操作
 * @param item 当前客户资金总览行
 * @returns 无返回值
 */
const onAction = (action: any, item: any) => {
    if (action?.action === 'prepayment') openPrepayment(item);
    if (action?.action === 'detail') openDetail(item);
};

/**
 * 打开 App 客户资金详情并加载资金记录。
 * @param item 当前客户资金总览行
 * @returns 无返回值
 */
const openDetail = async (item: any) => {
    detailData.value = { ...item };
    detailRecords.value = [];
    detailVisible.value = true;
    if (!item?.customerId) return;

    detailLoading.value = true;
    try {
        const res: any = await getFundsManagementRecordListByCustomerApi(item.customerId);
        if (res?.code === 200) detailRecords.value = Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error('获取客户资金记录失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

/**
 * 重置 App 筛选条件。
 * @param event 搜索组件重置事件
 * @returns 无返回值
 */
const onSearchFilterReset = (event?: any) => {
    queryParams.value = {
        customerId: '',
        customerName: '',
        customerCode: '',
    };
    changeForm(event || { searchValue: '' });
};

/**
 * 获取资金管理分页数据。
 * @param reset 是否重置为第一页
 * @returns 无返回值
 */
const getFundsPage = async (reset = false) => {
    if (loading.value) return;
    if (reset) {
        current.value = 1;
        finished.value = false;
        listData.value = [];
        total.value = 0;
    }

    loading.value = true;
    try {
        const res: any = await getFundsManagementPageApi({
            customerId: queryParams.value.customerId || undefined,
            customerName: searchForm.searchValue || undefined,
            customerCode: queryParams.value.customerCode || undefined,
            current: current.value,
            size: size.value,
        });
        if (res?.code !== 200) {
            finished.value = true;
            return;
        }

        const records = res.data?.records || [];
        total.value = Number(res.data?.total || 0);
        const newList = records.map((item: any) => formatListItem(item));
        listData.value = reset ? newList : [...listData.value, ...newList];
        finished.value = records.length < size.value || (total.value > 0 && listData.value.length >= total.value);
        if (!finished.value) current.value += 1;
    } catch (error) {
        finished.value = true;
        console.error('获取客户资金分页失败:', error);
    } finally {
        loading.value = false;
    }
};

onSearchChange(async () => {
    await getFundsPage(true);
    disableLoadMore.value = false;
});

/**
 * App 列表触底加载下一页。
 * @returns 无返回值
 */
const onLoad = async () => {
    if (!finished.value) await getFundsPage();
};

/**
 * App 列表下拉刷新。
 * @param done 刷新完成回调
 * @returns 无返回值
 */
const onRefresh = async (done?: () => void) => {
    await getFundsPage(true);
    done?.();
};
</script>

<style lang="postcss" scoped>
.mx_mes_app-filter-form {
    padding-bottom: 8px;
}

.prepayment-popup {
    padding: 20px 16px 16px;
}

.prepayment-title {
    margin-bottom: 12px;
    color: var(--base-black);
    font-size: 18px;
    font-weight: 500;
    text-align: center;
}

.prepayment-actions {
    padding-top: 16px;
}

.fund-detail-popup {
    height: 100%;
    overflow-y: auto;
    background: #ffffff;
}

.fund-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #eeeeee;
    color: var(--base-black);
    font-size: 17px;
    font-weight: 600;
}

.fund-detail-close {
    color: #999999;
    font-size: 24px;
    font-weight: 400;
}

.fund-detail-content {
    padding: 16px 12px 24px;
}

.fund-detail-customer {
    margin-bottom: 10px;
    color: var(--base-black);
    font-size: 16px;
    font-weight: 600;
}

.fund-detail-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #999999;
    font-size: 13px;
}

.fund-section-title {
    position: relative;
    margin: 24px 0 12px;
    padding-left: 10px;
    color: var(--base-black);
    font-size: 16px;
    font-weight: 600;

    &::before {
        position: absolute;
        top: 2px;
        left: 0;
        width: 4px;
        height: 18px;
        border-radius: 2px;
        background: var(--base-color);
        content: '';
    }
}

.fund-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}

.fund-stat-card {
    min-height: 64px;
    padding: 12px 10px;
    border-radius: 6px;
    background: #f7f7f7;
}

.fund-stat-label {
    margin-bottom: 8px;
    color: #999999;
    font-size: 12px;
}

.fund-stat-value {
    color: #333333;
    font-size: 17px;

    &.is-positive {
        color: #00c853;
    }

    &.is-negative {
        color: #ff3d3d;
    }
}

.fund-record-item {
    padding: 12px 0;
    border-bottom: 1px solid #eeeeee;
}

.fund-record-main,
.fund-record-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.fund-record-main {
    color: var(--base-black);
    font-size: 14px;
}

.fund-record-meta {
    margin-top: 8px;
    color: #999999;
    font-size: 12px;
}

.fund-record-empty {
    padding: 32px 0;
    color: #999999;
    text-align: center;
}

.fund-amount-positive {
    color: #00c853;
}

.fund-amount-negative {
    color: #ff3d3d;
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
</style>
