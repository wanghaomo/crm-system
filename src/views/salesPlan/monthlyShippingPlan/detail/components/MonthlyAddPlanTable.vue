<template>
    <n-data-table
        :row-key="(row) => row.frontId || row.id"
        :columns="columns"
        :data="data"
        :pagination="false"
        :bordered="true"
        :single-line="false"
        default-expand-all
        striped
        class="monthly-add-table"
        :scroll-x="scrollX" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NDataTable } from 'naive-ui';

const props = withDefaults(
    defineProps<{
        columns: any[];
        data: any[];
    }>(),
    {
        columns: () => [],
        data: () => [],
    }
);

const scrollX = computed(() =>
    props.columns.reduce((total: number, column: any) => total + Number(column.width || 0), 0)
);
</script>

<style lang="less" scoped>
.monthly-add-table {
    :deep(.n-data-table-th) {
        height: 44px;
        color: #999999;
        background: var(--base-grey9);
        font-weight: 600;
    }

    :deep(.n-data-table-td) {
        min-height: 50px;
        color: #333333;
    }

    :deep(.monthly-add-cell-clamp) {
        display: -webkit-box;
        max-height: 44px;
        overflow: hidden;
        line-height: 22px;
        white-space: normal;
        word-break: break-all;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    :deep(.n-data-table-tr--expanded .n-data-table-td) {
        background: #f5f7fb;
    }

    :deep(.n-data-table-expand-placeholder) {
        width: 20px;
    }

    :deep(.monthly-add-plan-child) {
        margin: -12px -12px;
        background: #fbfbfc;
    }

    :deep(.monthly-add-plan-child-title) {
        display: flex;
        align-items: center;
        height: 40px;
        color: #333333;
        font-weight: 600;
        border-bottom: 1px solid #eeeeee;
    }

    :deep(.child-data-table) {
        margin: 0;
    }

    :deep(.child-data-table .n-data-table-th) {
        background: #fbfbfc;
    }

    :deep(.child-data-table .n-data-table-td) {
        background: #fbfbfc;
    }
}
</style>
