<template> 
    <WebPage contentPadding="0px" :hideAddBtn="!checkPermission(['crm:settlement:create'])" @addEvt="createSettlement">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"></MxWebSearchBar>
                </template>
            </MxWebDataTable>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { deleteSettlementMainApi, getSettlementPageApi } from '@/api';
import { NSpace } from 'naive-ui';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { settlementStatusMap, SETTLEMENT_STATUS_CONSTANT } from '@/constants/settlement';
import { useDictStore } from '@/store/commStore';
import { formatDateParam } from './utils';
import { checkPermission } from '@/utils/comm';

const router = useRouter();
const SUPPLIER_UNIT_DICT = '供方单位';
const { dictMap } = storeToRefs(useDictStore());

const queryParams = ref<any>({});

const editData = ref<any>({});

/**
 * 判断结算单是否允许编辑。
 * @param status 单据状态
 * @returns 是否允许编辑
 */
const canEdit = (status: string) => {
    return [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01, SETTLEMENT_STATUS_CONSTANT.APPROVAL_GEN_FAILED].includes(status);
};

// 查询配置
const queryConfiguration = ref([
    {
        value: 'customerName',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '企业名称',
    },
    {
        value: 'handlerCode',
        defaultValue: '',
        label: '',
        placeholder: '我方经办人',
        type: 'personSelect',
    },
    {
        value: 'settlementTime',
        leftPlaceholder: '结算时间起',
        rightPlaceholder: '结算时间止',
        type: 'dateRange',
    },
    {
        value: 'applyUnit',
        defaultValue: '',
        label: '',
        type: 'dict',
        dictType: SUPPLIER_UNIT_DICT,
        placeholder: '申请单位',
    },
    {
        value: 'contractCode',
        defaultValue: '',
        label: '',
        type: 'input',
        placeholder: '合同编号',
    },
]);

// 表格配置
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'settlementCode',
            title: '结算单编号',
            width: 160,
        },
        {
            key: 'customerName',
            title: '企业名称',
            width: 200,
        },
        {
            key: 'contractCode',
            title: '合同编号',
            width: 160,
        },
        
        {
            key: 'applyUnit',
            title: '申请单位',
            width: 160,
            render(row: any) {
                return getSupplierUnitLabel(row.applyUnit);
            },
        },
        {
            key: 'status',
            title: '状态',
            width: 140,
            render(row: any) {
                const color = settlementStatusMap[row.status]?.iconColor || 'var(--base-grey)';
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
                            h('span', null, settlementStatusMap[row.status]?.label || row.status || '--'),
                        ],
                    }
                );
            },
        },
        {
            key: 'totalTaxAmount',
            title: '结算总价（元）',
            width: 140,
        },
        {
            key: 'settlementTime',
            title: '结算时间',
            width: 140,
        },
        {
            key: 'handler',
            title: '我方经办人',
            width: 120,
            render(row: any) {
                return getHandlerName(row.handler);
            },
        },
        {
            key: 'handlerName',
            title: '客户经办人',
            width: 120,
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
                return canEdit(row.status) && checkPermission(['crm:settlement:edit']);
            },
            clickTableBtns: (row: any) => {
                editData.value = { ...row };
                router.push({
                    path: '/settlementManage/settlement/edit',
                    query: {
                        id: row.id,
                    },
                });
            },
        },
        {
            btnName: '详情',
            btnColor: 'var(--base-color)',
            isBtnHide: (row: any) => {
                return !canEdit(row.status);
            },
            clickTableBtns: (row: any) => {
                editData.value = { ...row };
                router.push({ path: '/settlementManage/settlement/detail', query: { id: row.id } });
            },
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => {
                return canEdit(row.status) && checkPermission(['crm:settlement:delete']);
            },
            clickTableBtns: (row: any) => {
                deleteSettlement(row);
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
const createSettlement = () => {
    router.push({ path: '/settlementManage/settlement/create' });
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
 * 将申请单位 applyUnit 字典值转换为供方单位展示文案。
 * @param value 申请单位字典值
 * @returns 供方单位字典文案
 */
const getSupplierUnitLabel = (value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const options = dictMap.value?.[SUPPLIER_UNIT_DICT] || [];
    const option = options.find((item: any) =>
        [item.value, item.code, item.label, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};

const queryEvt = (query: any) => {
    queryParams.value = query;
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getList();
};

/**
 * 删除结算单并刷新列表。
 * @param row 当前结算单行
 * @returns 无返回值
 */
const deleteSettlement = async (row: any) => {
    if (!row?.id) return;
    try {
        const res: any = await deleteSettlementMainApi(row.id);
        if (res?.code === 200) {
            const pageConfig = tableConfig.value.paginationConfig.pagConfig;
            const currentRows = tableConfig.value.tableList || [];
            if (currentRows.length === 1 && pageConfig.page > 1) {
                pageConfig.page -= 1;
            }
            getList();
        }
    } catch (error) {
        console.error('删除结算单失败:', error);
    }
};

/**
 * 构建结算单分页查询参数。
 * @returns 后端分页接口需要的查询参数
 */
const buildPageParams = () => {
    const settlementTime = queryParams.value.settlementTime;
    return {
        customerName: queryParams.value.customerName || undefined,
        handlerCode: queryParams.value.handlerCode || undefined,
        contractCode: queryParams.value.contractCode || undefined,
        applyUnit: queryParams.value.applyUnit || undefined,
        status: queryParams.value.status || undefined,
        settlementStartTime: Array.isArray(settlementTime) ? formatDateParam(settlementTime[0]) : undefined,
        settlementEndTime: Array.isArray(settlementTime) ? formatDateParam(settlementTime[1]) : undefined,
        current: tableConfig.value.paginationConfig.pagConfig.page,
        size: tableConfig.value.paginationConfig.pagConfig.pageSize,
    };
};

/**
 * 获取结算单分页列表。
 * @returns 无返回值，结果写入表格数据和分页总数
 */
const getList = async () => {
    try {
        const res = await getSettlementPageApi(buildPageParams());

        if (res && res.code === 200) {
            tableConfig.value.tableList = res.data?.records || [];
            tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
        }
    } catch (error) {
        console.error('Failed to obtain settlement:', error);
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
