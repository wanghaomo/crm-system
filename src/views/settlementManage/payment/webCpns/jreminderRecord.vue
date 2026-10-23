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
// 催收记录表格配置。
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'collectionCode',
            title: '催收记录编号',
            width: 140,
        },
        {
            key: 'receiptCode',
            title: '关联回款单',
            width: 140,
        },
        {
            key: 'collectorTime',
            title: '催收日期',
            width: 140,
        },
        {
            key: 'collectionContent',
            title: '催收内容',
            width: 140,
        },
        {
            key: 'replyTime',
            title: '客户回复时间',
            width: 140,
        },
        {
            key: 'replyContent',
            title: '客户回复内容',
            width: 140,
        },
        {
            key: 'customerName',
            title: '客户名称',
            width: 140,
        },
        {
            key: 'collectorName',
            title: '催收人',
            width: 140,
        },
        {
            key: 'expectedPaymentDate',
            title: '预计回款时间',
            width: 140,
        },
        {
            key: 'collectionMethod',
            title: '催收方式',
            width: 140,
            render: (row: any) => formatDict('催收方式', row.collectionMethod),
        },
        {
            key: 'followUpAction',
            title: '后续跟进措施',
            width: 140,
        },
    ],
    // 表格数据
    tableList: props.detailData.jreminderRecord || [],
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
        tableConfig.value.tableList = newValue.jreminderRecord || [];
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
