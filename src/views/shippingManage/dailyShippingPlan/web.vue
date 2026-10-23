<template>
    <WebPage contentPadding="0px" @addEvt="create" :hideAddBtn="!checkPermission(['crm:daily_shipping_plan:create'])">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt" />
                </template>
            </MxWebDataTable>
        </template>
    </WebPage>
    <transportSituationDeawer ref="transportSituationDeawerRef" />
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NSpace, useDialog } from 'naive-ui';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { getDailyShippingPlanDetailPageApi, updateDailyShippingPlanDetailStatusApi } from '@/api';
import {
    dailyShippingPlanTypeOptions,
    getDailyShippingPlanTypeLabel,
    PLAN_STATUS_CONSTANT,
    planStatusMap,
} from '@/constants/dailyShippingPlan';
import { useDictStore } from '@/store/commStore';
import { checkPermission } from '@/utils/comm';
import transportSituationDeawer from './webCpns/transportSituationDeawer.vue';

const router = useRouter();
const dialog = useDialog();
const transportSituationDeawerRef = ref<any>(null);
const { dictMap } = storeToRefs(useDictStore());

const queryParams = ref<any>({
    salesContractCode: '',
    planType: '',
    status: '',
    customerName: '',
    deliveryOrderCode: '',
});

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
 * @returns 字典文案，未匹配或空值返回占位文案
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

/**
 * 格式化发货计划明细状态。
 * @param value 状态编码
 * @returns 状态展示文案
 */
const formatDetailStatus = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    return planStatusMap[value]?.label || value;
};

/**
 * 渲染状态圆点和状态文案。
 * @param row 当前发货计划明细
 * @returns 状态展示节点
 */
const renderDetailStatus = (row: any) => {
    const color = planStatusMap[row.status]?.iconColor || 'var(--base-grey)';
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
                h('span', null, formatDetailStatus(row.status)),
            ],
        }
    );
};

// 列表状态筛选不包含待执行，并支持其他执行状态。
const planStatusOptions = [
    PLAN_STATUS_CONSTANT.EXECUTING,
    PLAN_STATUS_CONSTANT.COMPLETED,
    PLAN_STATUS_CONSTANT.TERMINATED,
].map((value) => ({
    label: planStatusMap[value]?.label || value,
    value,
}));

// 查询配置：合同编号、发货类型、状态、客户名称、发货订单号。
const queryConfiguration = ref([
    {
        value: 'salesContractCode',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '合同编号',
    },
    {
        value: 'planType',
        defaultValue: '',
        label: '',
        type: 'select',
        placeholder: '发货类型',
        options: dailyShippingPlanTypeOptions,
    },
    {
        value: 'status',
        defaultValue: '',
        label: '',
        type: 'select',
        placeholder: '状态',
        options: planStatusOptions,
    },
    {
        value: 'customerName',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '客户名称',
    },
    {
        value: 'deliveryOrderCode',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '发货订单号',
    },
]);

// 明细状态操作配置，沿用详情页的状态值和确认文案。
const detailStatusActionMap = {
    suspend: { status: 1, title: '确认挂起订单', content: '确定要挂起该订单吗？', successMessage: '挂起成功' },
    close: { status: 2, title: '确认关闭订单', content: '确定要关闭该订单吗？', successMessage: '关闭成功' },
    recover: { status: 3, title: '确认恢复订单', content: '确定要恢复该订单吗？', successMessage: '恢复成功' },
};

/**
 * 更新发货计划明细状态并刷新当前列表。
 * @param row 当前发货计划明细
 * @param action 状态操作类型
 * @returns 无返回值
 */
const updateDetailOrderStatus = async (row: any, action: keyof typeof detailStatusActionMap) => {
    try {
        const actionConfig = detailStatusActionMap[action];
        const res = await updateDailyShippingPlanDetailStatusApi(
            {
                id: row.id,
                status: actionConfig.status,
            },
            actionConfig.successMessage
        );
        if (res?.code === 200) {
            await getList();
        }
    } catch (error) {
        console.error('Failed to update shipping plan detail status:', error);
    }
};

/**
 * 打开明细状态操作确认弹窗。
 * @param row 当前发货计划明细
 * @param action 状态操作类型
 * @returns 无返回值
 */
const handleDetailOrderAction = (row: any, action: keyof typeof detailStatusActionMap) => {
    const actionConfig = detailStatusActionMap[action];
    dialog.warning({
        title: actionConfig.title,
        content: actionConfig.content,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => updateDetailOrderStatus(row, action),
    });
};

/**
 * 打开发货计划明细的运输情况。
 * @param row 当前发货计划明细
 * @returns 无返回值
 */
const handleOpenTransportSituation = (row: any) => {
    if (row?.id === undefined || row?.id === null || row?.id === '') return;

    transportSituationDeawerRef.value?.showDrawer({ id: String(row.id) });
};

const tableConfig = ref<any>({
    columns: [
        {
            key: 'salesContractCode',
            title: '合同编号',
            width: 160,
            render: (row: any) => formatValue(row.salesContractCode),
        },
        {
            key: 'planType',
            title: '发货类型',
            width: 120,
            render: (row: any) => getDailyShippingPlanTypeLabel(row.planType),
        },
        {
            key: 'deliveryOrderCode',
            title: '发货订单号',
            width: 220,
            render: (row: any) => formatValue(row.deliveryOrderCode),
        },
        {
            key: 'priority',
            title: '优先级',
            width: 100,
            render: (row: any) => formatDict(DICT.PRIORITY, row.priority),
        },
        {
            key: 'status',
            title: '状态',
            width: 120,
            render: (row: any) => renderDetailStatus(row),
        },
        {
            key: 'grade',
            title: '矿石品位（%）',
            width: 140,
            render: (row: any) => formatValue(row.grade),
        },
        {
            key: 'mineralType',
            title: '矿石种类',
            width: 120,
            render: (row: any) => formatDict(DICT.MINERAL_TYPE, row.mineralType),
        },
        {
            key: 'contractNum',
            title: '合同数量（吨）',
            width: 140,
            render: (row: any) => formatValue(row.contractNum),
        },
        {
            key: 'actualQuantity',
            title: '已发货数量（吨）',
            width: 150,
            render: (row: any) => formatValue(row.actualQuantity),
        },
        {
            key: 'shipmentThreshold',
            title: '发货阈值（%）',
            width: 140,
            render: (row: any) => formatValue(row.shipmentThreshold),
        },
        {
            key: 'unshippedNum',
            title: '未发货量（吨）',
            width: 150,
            render: (row: any) => formatValue(row.unshippedNum),
        },
        {
            key: 'preDeliveryQuantity',
            title: '预发货量（吨）',
            width: 150,
            render: (row: any) => formatValue(row.preDeliveryQuantity),
        },
        {
            key: 'deliveryQuantity',
            title: '已交割数量（吨）',
            width: 150,
            render: (row: any) => formatValue(row.deliveryQuantity),
        },
        {
            key: 'unSettledQuantity',
            title: '待结算数量（吨）',
            width: 150,
            render: (row: any) => formatValue(row.unSettledQuantity),
        },
        {
            key: 'settledQuantity',
            title: '已结算数量（吨）',
            width: 150,
            render: (row: any) => formatValue(row.settledQuantity),
        },
        {
            key: 'supplierUnit',
            title: '供货单位',
            width: 140,
            render: (row: any) => formatDict(DICT.SUPPLIER_UNIT, row.supplierUnit),
        },
        {
            key: 'customerName',
            title: '客户名称',
            width: 200,
            render: (row: any) => formatValue(row.customerName),
        },
        {
            key: 'subsidiaryName',
            title: '子公司贸易商',
            width: 200,
            render: (row: any) => formatValue(row.subsidiaryName),
        },
        {
            key: 'remark',
            title: '计划备注',
            width: 220,
            render: (row: any) => formatValue(row.remark),
        },
    ],
    tableList: [],
    tableBtns: [
        {
            btnName: '挂起订单',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => row.status === PLAN_STATUS_CONSTANT.EXECUTING && checkPermission(['crm:daily_shipping_plan:hang']),
            clickTableBtns: (row: any) => handleDetailOrderAction(row, 'suspend'),
        },
        {
            btnName: '恢复订单',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => row.status === PLAN_STATUS_CONSTANT.TERMINATED && checkPermission(['crm:daily_shipping_plan:recover']),
            clickTableBtns: (row: any) => handleDetailOrderAction(row, 'recover'),
        },
        {
            btnName: '关闭订单',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) =>
                [PLAN_STATUS_CONSTANT.EXECUTING, PLAN_STATUS_CONSTANT.TERMINATED].includes(row.status) && checkPermission(['crm:daily_shipping_plan:close']),
            clickTableBtns: (row: any) => handleDetailOrderAction(row, 'close'),
        },
        {
            btnName: '运输情况',
            btnColor: 'var(--base-color)',
            isBtnHide: () => true,
            clickTableBtns: (row: any) => handleOpenTransportSituation(row),
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
        onPageChange: (page: any) => {
            tableConfig.value.paginationConfig.pagConfig.page = page;
            getList();
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

/**
 * 进入发货计划新增页。
 * @returns 无返回值
 */
const create = () => {
    router.push({ path: '/shippingManage/dailyShippingPlan/create' });
};

/**
 * 处理查询条件变更并刷新第一页。
 * @param query 查询栏返回的查询条件
 * @returns 无返回值
 */
const queryEvt = (query: any) => {
    queryParams.value = {
        salesContractCode: query.salesContractCode || '',
        planType: query.planType || '',
        status: query.status || '',
        customerName: query.customerName || '',
        deliveryOrderCode: query.deliveryOrderCode || '',
    };
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getList();
};

/**
 * 获取发货计划明细分页列表。
 * @returns 无返回值，结果写入表格数据和分页总数
 */
const getList = async () => {
    try {
        const pagination = tableConfig.value.paginationConfig.pagConfig;
        const res = await getDailyShippingPlanDetailPageApi({
            ...queryParams.value,
            current: pagination.page,
            size: pagination.pageSize,
        });
        if (res?.code === 200) {
            tableConfig.value.tableList = res.data?.records || [];
            pagination.total = Number(res.data?.total || 0);
        }
    } catch (error) {
        console.error('Failed to obtain shipping plan detail page:', error);
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
