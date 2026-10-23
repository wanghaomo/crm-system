<template>
  <!-- 描述项组件 -->
  <div class="mx-descriptions">
    <van-row :gutter="gutter">
      <van-col v-for="(item, index) in data" :key="index" :span="getSpan(item.colSpan)" class="mx-descriptions-item" style="padding-left: 0;">
        <div class="mx-descriptions-item__container">
          <div class="mx-descriptions-item__label" :style="labelStyle">
            {{ item.label }}
          </div>
          <div class="mx-descriptions-item__value" :style="valueStyle">
            <slot :name="`item-${index}`" :item="item">
              {{ getDisplayValue(item.value) }}
            </slot>
          </div>
        </div>
      </van-col>
    </van-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Row as VanRow, Col as VanCol } from 'vant';
import { IMxAppDescriptionsProps } from './index.types';

const props = withDefaults(defineProps<IMxAppDescriptionsProps>(), {
  data: () => [],
  column: 2,
  labelWidth: 'auto',
  labelAlign: 'left',
  valueAlign: 'left',
  gutter: 0,
  emptyText: '--',
});

const getSpan = (colSpan?: number) => {
  const safeColumn = props.column > 0 ? props.column : 2;
  const baseSpan = 24 / safeColumn;
  if (colSpan && colSpan > 0) {
    return Math.min(baseSpan * colSpan, 24);
  }
  return baseSpan;
};

const getDisplayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return props.emptyText;
  }
  return value;
};

const labelStyle = computed(() => ({
  width: props.labelWidth,
  textAlign: props.labelAlign,
}));

const valueStyle = computed(() => ({
  textAlign: props.valueAlign,
}));
</script>

<style lang="less" scoped>
.mx-descriptions {
  width: 100%;

  &-item {
    margin-bottom: 8px;

    &__container {
      display: flex;
      font-size: 14px;
      line-height: 1.5;
      box-sizing: border-box;
    }

    &__label {
      color: #999;
      margin-right: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    &__value {
      color: #333;
      word-break: break-all;
      flex: 1;
    }
  }
}
</style>
