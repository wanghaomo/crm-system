<template>
    <div
        :class="{
            'pagination-container': true,
            'top-border': showHeadBorder,
        }"
        :style="styleOption">
        <n-pagination
            v-model:page="pagConfig.page"
            :page-size="pagConfig.pageSize"
            :item-count="pagConfig.total"
            :page-slot="pageSlot"
            :show-size-picker="pagConfig.showSizePicker"
            :page-sizes="pagConfig.pageSizes"
            @update:page="handleUpdatePage"
            @update:page-size="handleUpdatePageSize" />
        <span class="total-num" v-if="showTotal">共 {{ pagConfig.total }} 条</span>
    </div>
</template>

<script setup lang="ts">
import { NPagination } from 'naive-ui';
// pagination类型定义
import type { PaginationProps } from '@/types/pagination';
const emit = defineEmits(['changePage', 'changePageSize']);
const props = defineProps<PaginationProps>();
// 当前页变化
const handleUpdatePage = (page: number) => {
    if(props.onPageChange){
        props.onPageChange(page);
        return
    }
    emit('changePage', page);
};

// 列表页可通过 onPageSizeChange 接管刷新逻辑；未配置时继续向外抛事件，兼容旧用法。
const handleUpdatePageSize = (pageSize: number) => {
    if (props.onPageSizeChange) {
        props.onPageSizeChange(pageSize);
        return;
    }
    emit('changePageSize', pageSize);
};
</script>

<style scoped lang="less">
.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 43px;
    &::v-deep(.n-pagination){
        .n-pagination-item--active{
            color: var(--base-color) !important;
            border-color: var(--base-color) !important;
        }
        .n-pagination-item--clickable:hover{
            color: var(--base-color) !important;
        }
    }
}

.top-border {
    border-top: 1px solid var(--base-grey8);
    margin: 0 16px;
}
.total-num {
    font-size: 14px;
    margin-left: var(--base-width);
}
</style>
