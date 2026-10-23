<template>
    <div style="height: 100%;margin-top: 16px;">
        <MxButton class="addBtn" type="success" hasLeftIcon border @click="emit('addEvt')">
            <template #leftIcon>
                <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
            </template>
            新增
        </MxButton>

        <MxWebDataTable style="height: calc(100% - 28px)" v-bind="tableConfig"> </MxWebDataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import { OVERFLOWING_TYPE_PREPAYMENT_OFFSET } from '../utils';
const props = defineProps(['detailData']);
const emit = defineEmits(['addEvt']);
const { dictMap } = storeToRefs(useDictStore());
/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或字典文案
 * @returns 匹配到的字典文案，空值返回占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const option = (dictMap.value?.[dictName] || []).find((item: any) => item.value == value || item.label == value);
    return option?.label || value;
};
// 回款记录表格配置。
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'recordCode',
            title: '回款记录编号',
            width: 140,
        },
        {
            key: 'receiptCode',
            title: '关联回款单',
            width: 140,
        },
        {
            key: 'payDate',
            title: '回款日期',
            width: 140,
        },
        {
            key: 'payAmount',
            title: '回款金额（元）',
            width: 140,
        },
        {
            key: 'surplusRevenue',
            title: '预收冲应收金额(元)',
            width: 160,
            render: (row: any) =>
                String(row.overflowingType) === OVERFLOWING_TYPE_PREPAYMENT_OFFSET ? row.surplusRevenue ?? '--' : '--',
        },
        {
            key: 'plannedDate',
            title: '计划回款日期',
            width: 140,
        },
        {
            key: 'customerName',
            title: '客户名称',
            width: 140,
        },
        {
            key: 'handlerName',
            title: '经办人',
            width: 140,
        },
        {
            key: 'roundOff',
            title: '抹零数据（元）',
            width: 140,
        },
        {
            key: 'payMethod',
            title: '回款方式',
            width: 140,
            render: (row: any) => formatDict('回款方式', row.payMethod),
        },
        {
            key: 'remark',
            title: '备注',
            width: 140,
        },
    ],
    // 表格数据
    tableList: props.detailData.paymentRecord || [],
    isShowPagination: false,
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
    },
    bordered: true,
    bottomBordered: true,
    singleLine: false,
});
watch(
    () => props.detailData,
    (newValue, oldValue) => {
        tableConfig.value.tableList = newValue.paymentRecord || [];
    },
    {
        deep: true,
    }
);
</script>

<style scoped lang="less">
.addBtn {
    width: 88px;
    height: 32px;

    .add-icon {
        width: 16px;
        height: 16px;
    }
}
</style>
