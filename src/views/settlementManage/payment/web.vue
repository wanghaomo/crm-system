<template>
    <WebPage contentPadding="0px" :hideAddBtn="true">
        <template #headerRight>
            <MxButton v-if="checkPermission(['crm:payment:batchPayment'])" @click="batchPayment()"
                ><template #leftIcon>
                    <img class="add-icon" src="@/assets/images/icon⎽com⎽paymentcollection.png" />
                </template>
                批量回款
            </MxButton>
        </template>
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"> </MxWebSearchBar>
                </template>
            </MxWebDataTable>
        </template>
    </WebPage>
    <addPaymentDrawer ref="addPaymentDrawerRef" @refresh="getList"></addPaymentDrawer>
    <addJrenubderDrawer ref="addJrenubderDrawerRef" @refresh="getList"></addJrenubderDrawer>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { getPaymentPageApi } from '@/api';
import { NSpace } from 'naive-ui';
import { useRouter } from 'vue-router';
import { paymentStatusMap, PAYMENT_STATUS_CONSTANT } from '@/constants/payment';
import addPaymentDrawer from './webCpns/addPaymentDrawer.vue';
import addJrenubderDrawer from './webCpns/addJrenubderDrawer.vue';
import { formatDateParam, normalizePaymentRecord } from './utils';
import { checkPermission } from '@/utils/comm.js';
const addPaymentDrawerRef = ref(null);
const addJrenubderDrawerRef = ref(null);

const router = useRouter();

const queryParams = ref<any>({});

const editData = ref<any>({});
// 回款列表筛选项中的状态选项。
const paymentStatusOptions = [
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_03,
    PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04,
].map((value) => ({
    label: paymentStatusMap[value]?.label || value,
    value,
}));

// 查询配置：企业名称、状态、跟单人、计划回款日和合同编号。
const queryConfiguration = ref([
    {
        value: 'customerName',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '企业名称',
    },
    {
        value: 'status',
        defaultValue: '',
        label: '',
        type: 'select',
        placeholder: '状态',
        options: paymentStatusOptions,
    },
    {
        value: 'handlerCode',
        defaultValue: '',
        label: '',
        placeholder: '跟单人',
        type: 'personSelect',
    },
    {
        value: 'plannedDate',
        leftPlaceholder: '计划回款日',
        rightPlaceholder: '结束日期',
        type: 'dateRange',
    },
    {
        value: 'contractCode',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '合同编号',
    },
]);

// 表格配置：包含回款单字段、状态渲染、行操作和分页回调。
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'receiptCode',
            title: '回款单编号',
            width: 160,
        },
        {
            key: 'customerName',
            title: '企业名称',
            width: 200,
        },
        {
            key: 'handlerName',
            title: '跟单人',
            width: 80,
        },
        {
            key: 'status',
            title: '状态',
            width: 140,
            render(row: any) {
                const color = paymentStatusMap[row.status]?.iconColor || 'var(--base-grey)';
                return h(
                    NSpace,
                    { align: 'center', size: 8 },
                    {
                        default: () => [
                            h('div', {
                                style: {
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                },
                            }),
                            h('span', null, paymentStatusMap[row.status]?.label),
                        ],
                    }
                );
            },
        },
        {
            key: 'contractCode',
            title: '合同编号',
            width: 160,
        },
        {
            key: 'amountDue',
            title: '应收金额(元)',
            width: 120,
        },
        {
            key: 'amountPaid',
            title: '已收金额(元)',
            width: 120,
        },
        {
            key: 'amountUnpaid',
            title: '未收金额(元)',
            width: 120,
        },
        {
            key: 'plannedDate',
            title: '计划回款日',
            width: 120,
        },
        {
            key: 'actualDate',
            title: '实际回款日',
            width: 120,
            render: (row: any) => row.actualDate || '--',
        },
        {
            key: 'collectionCount',
            title: '催收次数',
            width: 80,
        },
        {
            key: 'lastCollectionTime',
            title: '最新催收时间',
            width: 120,
            render: (row: any) => row.lastCollectionTime || '--',
        },
    ],
    // 表格数据
    tableList: [],
    // 操作按钮
    tableBtns: [
        {
            btnName: '编辑',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => {
                return row.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01 && checkPermission(['crm:payment:edit']);
            },
            clickTableBtns: (row: any) => {
                editData.value = { ...row };
                router.push({ path: '/settlementManage/payment/edit', query: { id: row.id } });
            },
        },
        {
            btnName: '回款',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => {
                return (
                    (row.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02 ||
                    row.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04) && checkPermission(['crm:payment:returned'])
                );
            },
            clickTableBtns: (row: any) => {
                addPaymentDrawerRef.value.showDrawer(row);
            },
        },
        {
            btnName: '催款',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => {
                return (
                    (row.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04 ||
                    row.status == PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02) && checkPermission(['crm:payment:demand'])
                );
            },
            clickTableBtns: (row: any) => {
                addJrenubderDrawerRef.value.showDrawer(row);
            },
        },
        {
            btnName: '详情',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => row.status !== PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
            clickTableBtns: (row: any) => {
                editData.value = { ...row };
                router.push({ path: '/settlementManage/payment/detail', query: { id: row.id } });
            },
        },
    ],
    isShowPagination: true,
    // 分页
    paginationConfig: {
        pagConfig: {
            total: 0,
            pageSize: 20,
            page: 1,
        },
        showHeadBorder: true,
        showTotal: true,
        onPageChange: (page: any) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                getList();
            }
        },
        onPageSizeChange: (pageSize: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                getList();
            }
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});
/**
 * 跳转批量回款页面。
 * @returns 无返回值
 */
const batchPayment = () => {
    router.push({ path: '/settlementManage/payment/batchPayment' });
};

/**
 * 构建回款单分页查询参数。
 * @returns 后端分页接口需要的查询参数
 */
const buildPageParams = () => {
    const plannedDate = queryParams.value.plannedDate;
    return {
        customerName: queryParams.value.customerName || undefined,
        status: queryParams.value.status || undefined,
        handlerCode: queryParams.value.handlerCode || undefined,
        contractCode: queryParams.value.contractCode || undefined,
        plannedDateStart: Array.isArray(plannedDate) ? formatDateParam(plannedDate[0]) : undefined,
        plannedDateEnd: Array.isArray(plannedDate) ? formatDateParam(plannedDate[1]) : undefined,
        current: tableConfig.value.paginationConfig.pagConfig.page,
        size: tableConfig.value.paginationConfig.pagConfig.pageSize,
    };
};

/**
 * 处理搜索栏查询条件变更。
 * @param query 搜索栏返回的查询条件
 * @returns 无返回值，重置分页后刷新列表
 */
const queryEvt = (query: any) => {
    queryParams.value = query;
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getList();
};

/**
 * 获取回款单分页列表。
 * @returns 无返回值，结果写入表格数据和分页总数
 */
const getList = async () => {
    try {
        const res = await getPaymentPageApi({
            ...buildPageParams(),
        });

        if (res && res.code === 200) {
            tableConfig.value.tableList = (res.data?.records || []).map((item: any) => normalizePaymentRecord(item));
            tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
        }
    } catch (error) {
        console.error('Failed to obtain payment:', error);
    }
};

onMounted(() => {
    getList();
});
</script>

<style lang="less" scoped>
.add-icon {
    width: 16px;
    height: 16px;
}
</style>
