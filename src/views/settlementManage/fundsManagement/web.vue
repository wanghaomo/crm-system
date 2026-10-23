<template>
    <WebPage contentPadding="0px" :hideAddBtn="true">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt" />
                </template>
            </MxWebDataTable>
        </template>
    </WebPage>
    <n-modal
        v-model:show="prepaymentVisible"
        preset="card"
        title="录入预付款"
        :mask-closable="false"
        style="width: 476px">
        <n-form
            ref="prepaymentFormRef"
            :model="prepaymentForm"
            :rules="prepaymentRules"
            label-placement="left"
            label-align="right"
            label-width="90px">
            <n-form-item label="客户名称" path="customerId">
                <n-input v-model:value="prepaymentForm.customerName" disabled />
            </n-form-item>
            <n-form-item label="预付款(元)" path="prepaymentAmount">
                <n-input-number
                    v-model:value="prepaymentForm.prepaymentAmount"
                    :min="0"
                    clearable
                    placeholder="请输入预付款金额"
                    style="width: 100%" />
            </n-form-item>
        </n-form>
        <template #footer>
            <div class="prepayment-footer">
                <MxButton border @click="closePrepaymentModal">取消</MxButton>
                <MxButton type="success" :disabled="prepaymentSubmitting" @click="submitPrepayment">提交</MxButton>
            </div>
        </template>
    </n-modal>
    <MxDrawer v-model:show="detailVisible" title="客户资金管理详情" size="large" :closablePop="false">
        <n-spin :show="detailLoading">
            <div class="fund-detail">
                <div class="fund-detail-header">
                    <div class="fund-customer-name">{{ formatValue(detailData.customerName) }}</div>
                    <div class="fund-summary-row">
                        <span>总合同金额(万元)</span>
                        <strong>{{ formatValue(detailData.subItemAmount) }}</strong>
                        <span>总合同数量(万吨)</span>
                        <strong>{{ formatValue(detailData.contractQuantity) }}</strong>
                    </div>
                </div>
                <div class="fund-detail-bottom">
                    <div class="fund-section-title">基础信息</div>
                <div class="fund-stat-grid">
                    <div v-for="item in detailStats" :key="item.key" class="fund-stat-card">
                        <div class="fund-stat-label">{{ item.label }}</div>
                        <div :class="['fund-stat-value', `is-${item.tone}`]">{{ item.value }}</div>
                    </div>
                </div>
                <div class="fund-section-title">资金记录</div>
                <n-data-table
                    :columns="fundRecordColumns"
                    :data="fundRecordList"
                    :bordered="true"
                    :single-line="false"
                    :pagination="false" />
                </div>
            </div>
        </n-spin>
    </MxDrawer>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import {
    NDataTable,
    NForm,
    NFormItem,
    NInput,
    NInputNumber,
    NModal,
    NSpin,
} from 'naive-ui';
import {
    createFundsManagementRecordApi,
    getFundsManagementPageApi,
    getFundsManagementRecordListByCustomerApi,
} from '@/api';
import { getCustomerBaseDropdownApi } from '@/api/customerManage';
import { checkPermission } from '@/utils/comm';


const FUND_TYPE_PREPAYMENT = 'FUND_TYPE_01';
const FUND_TYPE_LABEL_MAP: Record<string, string> = {
    FUND_TYPE_01: '预付款',
    FUND_TYPE_02: '溢收款',
    FUND_TYPE_03: '预收冲应收',
};

const customerOptions = ref<any[]>([]);
const queryParams = ref<Record<string, any>>({});

const queryConfiguration = computed(() => [
    {
        value: 'customerId',
        defaultValue: null,
        label: '',
        type: 'select',
        placeholder: '客户名称',
        options: customerOptions.value,
    },
]);

/**
 * 将客户接口记录转换为搜索下拉选项。
 * @param item 客户接口原始记录
 * @returns 搜索组件需要的选项
 */
const formatCustomerOption = (item: any) => ({
    ...item,
    label: item.customerName || item.label || item.enterpriseName || item.name || item.customerCode || '',
    value: item.customerId ?? item.value ?? item.id ?? item.customerCode ?? item.customerName ?? '',
});

/**
 * 将空值转换为页面统一的占位文本。
 * @param value 待展示值
 * @returns 展示文本
 */
const formatValue = (value: any) => {
    return value === null || value === undefined || value === '' ? '--' : value;
};

const prepaymentVisible = ref(false);
const prepaymentSubmitting = ref(false);
const prepaymentFormRef = ref<any>(null);
const prepaymentForm = reactive({
    customerId: '',
    customerName: '',
    prepaymentAmount: null as number | null,
});
const prepaymentRules = {
    customerId: {
        required: true,
        message: '客户名称不能为空',
        trigger: ['blur', 'change'],
    },
    prepaymentAmount: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: number | null) => {
            if (value === null) {
                return new Error('请输入预付款金额');
            }
            if (!Number.isFinite(Number(value)) || Number(value) < 0) {
                return new Error('预付款金额不能小于0');
            }
            return true;
        },
    },
};

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<Record<string, any>>({});
const fundRecordList = ref<any[]>([]);

const detailStats = computed(() => [
    { key: 'shippedQuantity', label: '已经发货数量(万吨)', value: formatValue(detailData.value.shippedQuantity), tone: 'positive' },
    { key: 'deliveryQuantity', label: '已经交割数量(万吨)', value: formatValue(detailData.value.deliveryQuantity), tone: 'positive' },
    { key: 'settleWeight', label: '已经结算数量(万吨)', value: formatValue(detailData.value.settleWeight), tone: 'positive' },
    { key: 'receivedAmount', label: '已经结算金额(万元)', value: formatValue(detailData.value.receivedAmount), tone: 'positive' },
    { key: 'amountReceived', label: '已回款金额(万元)', value: formatValue(detailData.value.amountReceived), tone: 'positive' },
    { key: 'unSettleWeight', label: '待结算数量(万吨)', value: formatValue(detailData.value.unSettleWeight), tone: 'negative' },
    { key: 'unReceivedAmount', label: '待结算金额(万元)', value: formatValue(detailData.value.unReceivedAmount), tone: 'negative' },
    { key: 'amountUnpaid', label: '待回款金额(万元)', value: formatValue(detailData.value.amountUnpaid), tone: 'negative' },
    { key: 'prepaymentAmount', label: '资金余额(万元)', value: formatValue(detailData.value.prepaymentAmount), tone: 'normal' },
]);

/**
 * 将资金类型编码转换为详情展示文案。
 * @param fundType 资金类型编码
 * @returns 资金类型展示文案
 */
const formatFundType = (fundType: any) => {
    return FUND_TYPE_LABEL_MAP[fundType] || formatValue(fundType);
};

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

const fundRecordColumns = [
    {
        title: '序号',
        key: 'index',
        width: 60,
        render: (_row: any, index: number) => index + 1,
    },
    {
        title: '类型',
        key: 'fundType',
        width: 180,
        render: (row: any) => formatFundType(row.fundType),
    },
    {
        title: '金额(元)',
        key: 'prepaymentAmount',
        width: 220,
        render: (row: any) => {
            const amount = Number(row.prepaymentAmount);
            return h(
                'span',
                { class: amount < 0 ? 'fund-amount-negative' : 'fund-amount-positive' },
                formatFundAmount(row.prepaymentAmount)
            );
        },
    },
    {
        title: '时间',
        key: 'createdAt',
        width: 220,
        render: (row: any) => formatValue(row.createdAt),
    },
    {
        title: '关联回款单',
        key: 'receiptCode',
        minWidth: 200,
        render: (row: any) => formatValue(row.receiptCode),
    },
];

const tableConfig = ref<any>({
    columns: [
        {
            key: 'customerName',
            title: '客户名称',
            width: 220,
            render: (row: any) => formatValue(row.customerName),
        },
        {
            key: 'subItemAmount',
            title: '总合同金额（万元）',
            width: 180,
            render: (row: any) => formatValue(row.subItemAmount),
        },
        {
            key: 'contractQuantity',
            title: '总合同数量（万吨）',
            width: 180,
            render: (row: any) => formatValue(row.contractQuantity),
        },
        {
            key: 'shippedQuantity',
            title: '已经发货数量（万吨）',
            width: 190,
            render: (row: any) => formatValue(row.shippedQuantity),
        },
        {
            key: 'deliveryQuantity',
            title: '已经交割数量（万吨）',
            width: 180,
            render: (row: any) => formatValue(row.deliveryQuantity),
        },
        {
            key: 'settleWeight',
            title: '已经结算数量（万吨）',
            width: 190,
            render: (row: any) => formatValue(row.settleWeight),
        },
        {
            key: 'receivedAmount',
            title: '已经结算金额（万元）',
            width: 190,
            render: (row: any) => formatValue(row.receivedAmount),
        },
        {
            key: 'unSettleWeight',
            title: '待结算数量（万吨）',
            width: 180,
            render: (row: any) => formatValue(row.unSettleWeight),
        },
        {
            key: 'unReceivedAmount',
            title: '待结算金额（万元）',
            width: 180,
            render: (row: any) => formatValue(row.unReceivedAmount),
        },
        {
            key: 'amountReceived',
            title: '已回款金额（万元）',
            width: 180,
            render: (row: any) => formatValue(row.amountReceived),
        },
        {
            key: 'amountUnpaid',
            title: '待回款金额（万元）',
            width: 180,
            render: (row: any) => formatValue(row.amountUnpaid),
        },
        {
            key: 'prepaymentAmount',
            title: '资金余额（万元）',
            width: 160,
            render: (row: any) => formatValue(row.prepaymentAmount),
        },
    ],
    tableList: [],
    tableBtns: [
        {
            btnName: '预付款',
            isBtnHide: (row: any) => checkPermission(["crm:fundsManagement:prepay"]),
            btnColor: 'var(--base-color)',
            clickTableBtns: (row: any) => openPrepaymentModal(row),
        },
        {
            btnName: '详情',
            btnColor: 'var(--base-color)',
            clickTableBtns: (row: any) => openDetailDrawer(row),
        },
    ],
    isShowPagination: true,
    paginationConfig: {
        pagConfig: {
            total: 0,
            pageSize: 20,
            page: 1,
        },
        showHeadBorder: true,
        showTotal: true,
        onPageChange: (page: number) => {
            tableConfig.value.paginationConfig.pagConfig.page = page;
            getList();
        },
        onPageSizeChange: (pageSize: number) => {
            tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
            tableConfig.value.paginationConfig.pagConfig.page = 1;
            getList();
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

/**
 * 打开录入预付款弹窗。
 * @param row 当前客户资金总览行
 * @returns 无返回值
 */
const openPrepaymentModal = (row: any) => {
    prepaymentForm.customerId = row?.customerId || '';
    prepaymentForm.customerName = row?.customerName || '';
    prepaymentForm.prepaymentAmount = null;
    prepaymentFormRef.value?.restoreValidation();
    prepaymentVisible.value = true;
};

/**
 * 关闭录入预付款弹窗并清理校验状态。
 * @returns 无返回值
 */
const closePrepaymentModal = () => {
    prepaymentVisible.value = false;
    prepaymentFormRef.value?.restoreValidation();
};

/**
 * 提交客户预付款。
 * @returns 无返回值
 */
const submitPrepayment = async () => {
    try {
        await prepaymentFormRef.value?.validate();
        prepaymentSubmitting.value = true;
        const res: any = await createFundsManagementRecordApi({
            customerId: prepaymentForm.customerId,
            fundType: FUND_TYPE_PREPAYMENT,
            prepaymentAmount: prepaymentForm.prepaymentAmount,
        });
        if (res?.code === 200) {
            closePrepaymentModal();
            await getList();
        }
    } catch (error) {
        console.error('提交预付款失败:', error);
    } finally {
        prepaymentSubmitting.value = false;
    }
};

/**
 * 打开客户资金管理详情，并查询当前客户的资金记录。
 * @param row 当前客户资金总览行
 * @returns 无返回值
 */
const openDetailDrawer = async (row: any) => {
    detailData.value = { ...row };
    fundRecordList.value = [];
    detailVisible.value = true;
    if (!row?.customerId) return;

    detailLoading.value = true;
    try {
        const res: any = await getFundsManagementRecordListByCustomerApi(row.customerId);
        if (res?.code === 200) {
            fundRecordList.value = Array.isArray(res.data) ? res.data : [];
        }
    } catch (error) {
        console.error('获取客户资金记录失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

/**
 * 读取客户资金查询的客户下拉选项。
 * @returns 无返回值，结果写入客户下拉选项
 */
const loadCustomerOptions = async () => {
    try {
        const res: any = await getCustomerBaseDropdownApi({
            cooperationStatus: 'NORMAL',
            status: 'STORAGE',
        });
        if (res?.code !== 200) return;
        const customerList = Array.isArray(res.data) ? res.data : res.data?.records || res.data?.list || [];
        customerOptions.value = customerList.map((item: any) => formatCustomerOption(item));
    } catch (error) {
        console.error('获取客户资金客户下拉失败:', error);
    }
};

/**
 * 处理搜索条件并刷新第一页。
 * @param query 搜索栏返回的查询条件
 * @returns 无返回值
 */
const queryEvt = (query: Record<string, any>) => {
    queryParams.value = query;
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getList();
};

/**
 * 构建客户资金分页查询参数。
 * @returns 后端分页接口需要的查询参数
 */
const buildPageParams = () => ({
    customerId: queryParams.value.customerId || undefined,
    current: tableConfig.value.paginationConfig.pagConfig.page,
    size: tableConfig.value.paginationConfig.pagConfig.pageSize,
});

/**
 * 获取客户资金分页数据。
 * @returns 无返回值，结果写入表格和分页总数
 */
const getList = async () => {
    try {
        const res: any = await getFundsManagementPageApi(buildPageParams());
        if (res?.code !== 200) return;
        tableConfig.value.tableList = res.data?.records || [];
        tableConfig.value.paginationConfig.pagConfig.total = Number(res.data?.total || 0);
    } catch (error) {
        console.error('获取客户资金分页失败:', error);
    }
};

onMounted(async () => {
    await Promise.all([loadCustomerOptions(), getList()]);
});
</script>

<style lang="less" scoped>
.prepayment-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.fund-detail {
    // padding: 0 8px 24px;
}

.fund-detail-header {
    padding: 12px 24px;
    border-bottom: 1px solid #eeeeee;
}

.fund-detail-bottom {
    padding: 0 24px;
}

.fund-customer-name {
    margin-bottom: 8px;
    color: #333333;
    font-size: 16px;
    font-weight: 600;
}

.fund-summary-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #999999;
    font-size: 14px;

    strong {
        margin-right: 76px;
        color: #333333;
        font-weight: 400;
    }
}

.fund-section-title {
    position: relative;
    margin: 24px 0 16px;
    padding-left: 12px;
    color: #333333;
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
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
}

.fund-stat-card {
    min-height: 72px;
    padding: 14px 12px;
    border-radius: 8px;
    background: #f7f7f7;
    box-sizing: border-box;
}

.fund-stat-label {
    margin-bottom: 10px;
    color: #999999;
    font-size: 14px;
    white-space: nowrap;
}

.fund-stat-value {
    color: #333333;
    font-size: 18px;

    &.is-positive {
        color: #00c853;
    }

    &.is-negative {
        color: #ff3d3d;
    }
}

:deep(.fund-amount-positive) {
    color: #00c853;
}

:deep(.fund-amount-negative) {
    color: #ff3d3d;
}

@media (max-width: 1200px) {
    .fund-stat-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>
