<template>
  <card title="本月订单执行状态" iconClass="icon⎽com⎽order" isApp>
    <template v-if="monthsOrders.length">
      <template v-for="item in monthsOrders" :key="item.id">
        <div class="month-item">
          <div class="title">{{ item.enterpriseName || '--' }}</div>
          <div class="small-title">{{ item.constractNumber || '--' }}</div>
          <div class="content">
            <div class="item">
              <div class="value">{{ formatNumber(item.oreGgrade) }}</div>
              <div class="label">矿山品位(%)</div>
            </div>
            <div class="item">
              <div class="value">{{ formatNumber(item.contractQuantity) }}</div>
              <div class="label">合同数量(吨)</div>
            </div>
          </div>
          <div class="row">
            <div class="item">
              <div class="label">已发货数量(吨)</div>
              <div class="value">{{ formatNumber(item.shippedQuantity) }}</div>
            </div>
            <div class="item">
              <div class="label">在途数量(吨)</div>
              <div class="value">{{ formatNumber(item.intransitQuantity) }}</div>
            </div>
            <div class="item">
              <div class="label">已交割数量(吨)</div>
              <div class="value">{{ formatNumber(item.deliveryQuantity) }}</div>
            </div>
          </div>
        </div>
      </template>
    </template>
    <Empty v-else :scale="0.7" />
  </card>
</template>

<script setup lang="ts">
import card from "./card.vue"
import { PropType } from "vue"
defineProps({
  monthsOrders: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

/** 数值使用千分位展示，并保留接口返回的零值。 */
const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '--'
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '--'
  return numberValue.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
</script>

<style scoped lang="less">
.month-item {
  background: #F4F4F4;
  border-radius: 8px 8px 8px 8px;
  padding: 12px;
  margin-top: 12px;

  .title {
    font-size: 14px;
    color: #333333;
    font-weight: 500;
  }

  .small-title {
    font-size: 14px;
    color: #999999;
    margin-top: 4px;
  }

  .content {
    background: #FFFFFF;
    border-radius: 4px 4px 4px 4px;
    display: flex;
    margin-top: 8px;
    box-sizing: border-box;
    .item {
      width: 50%;
      text-align: center;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      row-gap: 8px;

      .value {
        font-size: 16px;
        color: #333333;
        font-weight: 500;
        // margin-bottom: 8px;
      }

      .label {
        font-size: 14px;
        color: #999999;
      }
    }
  }

  .row {
    display: flex;
    flex-wrap: wrap;

    .item {
      width: 50%;
      display: flex;
      margin-top: 8px;
      align-items: baseline;

      .value {
        font-size: 14px;
        color: #333333;
      }

      .label {
        font-size: 14px;
        color: #999999;
        margin-right: 8px;
      }
    }
  }
}
</style>
