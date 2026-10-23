<template>
  <card title="订单执行状态" class="month-card" iconClass="icon⎽com⎽order">
    <!-- <n-data-table class="month-table" :columns="colums" :data="monthsOrders" :pagination="false" :bordered="false" :bottom-bordered="false" size="small" flex-height striped :single-line="false" :single-column="false" /> -->
    <scrollTable v-if="monthsOrders.length" class="month-table" :headers="colums" :data="monthsOrders"/>
    <Empty v-else class="month-empty" />
  </card>
</template>

<script setup lang="ts">
import card from "./card.vue"
import scrollTable from "./scrollTable.vue"
import { PropType } from "vue"
const props = defineProps({
  monthsOrders: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})
const colums = [
  // { label: '序号', key: 'index', width: 60, render: (_row: any, index: number) => index + 1 },
  { label: '合同编号', key: 'constractNumber', width: '12%' },
  { label: '发货订单号', key: 'deliveryOrderCode', width: '15%' },
  { label: '客户名称', key: 'enterpriseName', width: '15%' },
  { label: '矿山品位（%）', key: 'oreGgrade', width: '12%' },
  { label: '合同数量（吨）', key: 'contractQuantity', width: '12%' },
  { label: '已发货数量（吨）', key: 'shippedQuantity', width: '12%' },
  { label: '在途数量（吨）', key: 'intransitQuantity', width: '12%' },
  { label: '已交割数量（吨）', key: 'deliveryQuantity', width: '12%' },
]
</script>

<style scoped lang="less">
.month-card {
  height: 312px;
  margin-bottom: 20px;
}

.month-table {
  margin-top: 16px;
  height: calc(100% - 12px);
  flex: 1;

  :deep(th),
  :deep(td) {
    border: none !important;
  }

  :deep(th) {
    background: #fff !important;
    color: #666666;
    border-bottom: 1px solid #ECEEF4 !important;
    font-size: 12px;
    font-weight: 'normal';
  }
}

.month-empty {
  height: calc(100% - 12px);
  flex: 1;
  margin-top: 16px;
}
</style>