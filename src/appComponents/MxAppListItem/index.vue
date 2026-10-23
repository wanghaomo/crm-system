<template>
  <!-- 列表项组件 -->
  <div class="mx-list-item" @click="emit('click')">
    <!-- 头部：标题与状态标签 -->
    <div class="card-header">
      <slot name="header">
        <div class="card-title">{{ title }}</div>
        <AppTag v-if="statusConfig?.label" :text="statusConfig.label" :color="statusConfig?.color" :bg-color="statusConfig?.backgroundColor" :border-color="statusConfig?.borderColor" :type="statusConfig?.type" />
      </slot>
    </div>

    <!-- 核心内容区 -->
    <div class="card-body">
      <slot></slot>
    </div>

    <!-- 底部：操作按钮 -->
    <div v-if="$slots.footer || (actions && actions.length)" class="card-footer">
      <slot name="footer">
        <Button v-for="(btn, btnIdx) in actions" :key="btnIdx" round size="small" :type="(btn.type as any) || 'default'" :plain="btn.plain !== false" @click.stop="onAction(btn, btnIdx)" style="">
          {{ btn.text }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from 'vant';
import { IActionItem, IMxAppListItemEmits, IMxAppListItemProps } from './index.types';

const props = withDefaults(defineProps<IMxAppListItemProps>(), {
  title: '',
  statusConfig: () => ({}),
  actions: () => [],
});

const emit = defineEmits<IMxAppListItemEmits>();

const onAction = (btn: IActionItem, index: number) => {
  emit('action', btn, index);
};
</script>

<style lang="less" scoped>
.mx-list-item {
  background-color: var(--base-white);
  border-radius: 12px;
  padding: 16px 12px;
  margin-bottom: 12px;
  box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
  border-radius: 12px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--base-black);
      flex: 1;
      margin-right: 8px;
    }

  }

  .card-body {
    width: 100%;
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;

    :deep(.van-button) {
      height: 32px;
      padding: 0 16px;
      font-size: 14px;
    }
  }
}
</style>
