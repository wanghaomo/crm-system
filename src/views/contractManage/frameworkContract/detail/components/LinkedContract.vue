<template>
    <div class="linked">
        <n-data-table
            :row-key="(row: any) => row.id"
            :columns="columns"
            :data="detail.salesContractList || []"
            :single-line="false"
            :row-class-name="getRowClassName"
            flex-height
            :pagination="false" />
    </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { NDataTable } from 'naive-ui';
import { getContractSalePage } from '@/api/contractManage';
import { SALES_CONTRACT_ROUTE } from '@/views/contractManage/salesContract/commonTs/conmon';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

const router = useRouter();

const renderText = (value: any) => {
    if (value === 0) return 0;
    return value || '--';
};

const formatNumber = (value: any) => {
    if (value === undefined || value === null || value === '') return '--';
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString() : value;
};

const getRowClassName = (row: any) => (row.child?.length ? 'linked-row-expandable' : '');

const getSalesContractIdByCode = async (contractCode: any) => {
    if (!contractCode) return null;
    const res = await getContractSalePage({
        current: 1,
        size: 1,
        contractCode,
    });
    return res.data?.records?.[0]?.id || null;
};

const openSalesContractDetail = async (row: any) => {
    const id = row.contractSalesId || (await getSalesContractIdByCode(row.contractCode));
    if (!id) return;
    router.push({
        path: SALES_CONTRACT_ROUTE.DETAIL,
        query: { id },
    });
};

const childColumns = [
    { title: '序号', key: 'index', width: 80, render: (_row: any, index: number) => index + 1 },
    { title: '品位(%)', key: 'grade', width: 140, render: (row: any) => renderText(row.grade) },
    { title: '合同数量(吨)', key: 'contractQty', width: 180, render: (row: any) => formatNumber(row.contractQty) },
    { title: '合同单价(元/吨)', key: 'unitPrice', width: 180, render: (row: any) => formatNumber(row.unitPrice) },
    { title: '已发货数量(吨)', key: 'shippedQty', width: 180, render: (row: any) => formatNumber(row.shippedQty) },
    { title: '已经交付数量(吨)', key: 'paidQty', width: 200, render: (row: any) => formatNumber(row.paidQty) },
];

const columns = computed<any[]>(() => [
    {
        type: 'expand',
        title: '',
        width: 48,
        expandable: (row: any) => row.child?.length,
        renderExpand: (row: any) =>
            h(NDataTable, {
                columns: childColumns,
                data: row.child || [],
                pagination: false,
                bordered: false,
                singleLine: false,
                class: 'linked-child-table',
            }),
    },
    { title: '序号', key: 'index', width: 80, render: (_row: any, index: number) => index + 1 },
    {
        title: '合同编号',
        key: 'contractCode',
        width: 180,
        render: (row: any) =>
            h(
                'button',
                {
                    class: 'contract-code',
                    type: 'button',
                    onClick: () => openSalesContractDetail(row),
                },
                renderText(row.contractCode)
            ),
    },
    {
        title: '企业名称',
        key: 'customerName',
        width: 200,
        render: (row: any) => renderText(row.customerName || props.detail.customerName),
    },
    {
        title: '对应月度',
        key: 'month',
        width: 140,
        render: (row: any) => renderText(row.month),
    },
    {
        title: '合同总金额(万元)',
        key: 'contractAmount',
        width: 190,
        render: (row: any) => formatNumber(row.contractAmount),
    },
    {
        title: '已回款金额(万元)',
        key: 'paidAmount',
        width: 190,
        render: (row: any) => formatNumber(row.paidAmount),
    },
]);
</script>

<style lang="less" scoped>
.linked {
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.linked :deep(.n-data-table) {
    height: 100%;
}

.linked :deep(.contract-code) {
    color: var(--base-color);
}

.linked :deep(.contract-code) {
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
}

.linked :deep(.linked-row-expandable) {
    background: #f3f7ff;
}

.linked :deep(.n-data-table-expand-placeholder) {
    width: 22px;
}

.linked :deep(.linked-child-table) {
    padding-left: 88px;
}

.linked :deep(.linked-child-table .n-data-table-th),
.linked :deep(.linked-child-table .n-data-table-td) {
    background: #fff;
}
</style>
