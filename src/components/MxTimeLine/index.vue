/**
* @description: 时间线组件，支持横向和纵向展示
*/
<template>
  <div :class="['timeline-wrapper', { 'timeline-wrapper--horizontal': horizontal }]">
    <n-timeline
      :horizontal="horizontal"
      :icon-size="iconSize"
    >
      <n-timeline-item
        v-for="(item, index) in data"
        :key="index"
        :color="getItemConfig(item).color"
        :title="horizontal ? undefined : item[titleField]"
        :time="undefined"
      >
        <template #icon>
          <div :class="['timeline-icon-wrapper', { 'timeline-icon-wrapper--horizontal': horizontal }]">
            <n-icon>
              <component :is="getIcon(item)" :size="30"/>
            </n-icon>
            <span v-if="horizontal" class="timeline-title-horizontal">{{ item[titleField] }}</span>
          </div>
        </template>
        <template v-if="$slots.default" #default>
          <slot :item="item" :index="index" />
        </template>
        <template v-else-if="showDefaultContent" #default>
          <template v-for="(field, idx) in contentFields" :key="field">
            <div
              v-if="field === 'remarks' && String(item[field] ?? '').trim()"
              class="timeline-expand-btn"
              :style="{ color: getItemConfig(item).type === 'error' ? 'var(--base-color-red)' : 'var(--base-grey)' }"
              @click="toggleExpand(index, field)"
            >
              <span class="mx_mes-mr-8">审批意见</span>
              <n-icon>
                <ChevronDown v-if="expandedMap[`${index}-${field}`]" :size="20" />
                <ChevronUp v-else :size="20"/>
              </n-icon>
            </div>
            <div
              v-show="field !== 'remarks' || !expandedMap[`${index}-${field}`]"
              :ref="el => setContentRef(el, index, field)"
              class="timeline-content"
              :style="field === 'remarks' && getItemConfig(item).type === 'error' ? { color: 'var(--base-color-red)', fontSize: '12px' } : {}"
            >
              {{ item[field] }}
              <span v-if="horizontal && idx === 0 && item[timeField]" class="timeline-time" style="margin-top: 0; margin-left: 4px; display: inline-block;">{{ item[timeField] }}</span>
            </div>
            <div v-if="!horizontal && idx === 0 && item[timeField]" class="timeline-time">{{ item[timeField] }}</div>
          </template>
        </template>
      </n-timeline-item>
    </n-timeline>
  </div>
</template>

<script setup lang="ts">
import { NTimeline, NTimelineItem, NIcon } from 'naive-ui';
import { CheckmarkCircle, CloseCircle, RemoveCircleSharp, ChevronDown, ChevronUp } from '@vicons/ionicons5';
import { computed, ref, reactive, type Component } from 'vue';

interface TimelineItem {
  [key: string]: any;
}

interface IconConfig {
  type: 'success' | 'error' | 'default' | 'info';
  icon?: Component;
  color: string;
}

type LayoutMode = 'horizontal' | 'vertical';

const props = withDefaults(defineProps<{
  /** 时间线数据 */
  data: TimelineItem[];
  /** 布局模式：horizontal(横向) / vertical(纵向) */
  layout?: LayoutMode;
  /** 图标大小 */
  iconSize?: number;
  /** 标题字段名 */
  titleField?: string;
  /** 时间字段名 */
  timeField?: string;
  /** 内容字段名列表 */
  contentFields?: string[];
  /** 是否显示默认内容 */
  showDefaultContent?: boolean;
  /** 状态字段名，用于判断图标和颜色 */
  statusField?: string;
  /** 自定义状态配置，key为状态值，value为图标配置 */
  statusConfig?: Record<string, IconConfig>;
  /** 默认图标配置 */
  defaultConfig?: IconConfig;
}>(), {
  data: () => [],
  layout: 'vertical',
  iconSize: 20,
  titleField: 'title',
  timeField: 'time',
  contentFields: () => [],
  showDefaultContent: true,
  statusField: 'status',
  statusConfig: () => ({
    '提交': { type: 'info', color: 'var(--base-color)' },
    '通过': { type: 'info', color: 'var(--base-color)' },
    '完成': { type: 'info', color: 'var(--base-color)' },
    '关闭': { type: 'default', color: 'var(--base-grey8)' },
    '不通过': { type: 'error', color: 'var(--base-color-red)' }
  }),
  defaultConfig: () => ({ type: 'info', color: 'var(--base-color)' })
});

const horizontal = computed(() => props.layout === 'horizontal');

// 存储每个item-field的DOM引用
const contentRefs = ref<Record<string, HTMLElement>>({});

// 存储展开状态
const expandedMap = reactive<Record<string, boolean>>({});

// 设置DOM引用
const setContentRef = (el: any, index: number, field: string) => {
  if (el) {
    const key = `${index}-${field}`;
    contentRefs.value[key] = el;
    if (field === 'remarks' && expandedMap[key] === undefined) {
      expandedMap[key] = false;
    }
  }
};

// 切换展开/收起
const toggleExpand = (index: number, field: string) => {
  const key = `${index}-${field}`;
  expandedMap[key] = !expandedMap[key];
};

const getItemConfig = (item: TimelineItem): IconConfig => {
  const status = item[props.statusField];
  if (status && props.statusConfig[status]) {
    return props.statusConfig[status];
  }
  return props.defaultConfig;
};

const getIcon = (item: TimelineItem): Component => {
  const config = getItemConfig(item);
  switch (config.type) {
    case 'error':
      return CloseCircle;
    case 'default':
      return RemoveCircleSharp;
    case 'success':
    case 'info':
    default:
      return CheckmarkCircle;
  }
};
</script>

<style lang="less" scoped>
.timeline-content {
  color: var(--base-grey);
  margin-top: 4px;
  line-height: 20px;

  &--clamped {
    max-height: 40px;
    overflow: hidden;
  }
}

.timeline-expand-btn {
  color: var(--base-grey);
  font-size: 14px;
  cursor: pointer;
  margin-top: 4px;
  display: flex;
  align-items: center;
}

.timeline-time {
  color: var(--base-grey);
  font-size: 12px;
  margin-top: 4px;
}

:deep(.n-timeline .n-timeline-item .n-timeline-item-content .n-timeline-item-content__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--base-black);
  white-space: nowrap;
}
:deep(.n-timeline .timeline-content) {
  color: var(--base-grey2);
}

.timeline-icon-wrapper {
  display: flex;
  align-items: center;
  // justify-content: center;
  position: relative;
  z-index: 1;

  &--horizontal {
    gap: 8px;
    background-color: #F2F3F5;
    padding-right: 8px;
  }
}

.timeline-title-horizontal {
  font-size: 16px;
  font-weight: 600;
  color: var(--base-black);
  white-space: nowrap;
}

.timeline-wrapper {
  &--horizontal {
    background: #F2F3F5;
    padding: 16px 0;
    border-radius: 4px;
    overflow-x: auto;

    :deep(.n-timeline) {
      display: flex;
      flex-wrap: nowrap;
      justify-content: flex-start;
      min-width: 100%;
      width: max-content;
      margin: 0;
    }

    :deep(.n-timeline .n-timeline-item) {
      flex: 1 0 280px;
      width: 280px;
    }

    :deep(.n-timeline .n-timeline-item:first-child) {
      padding-left: 40px;
    }

    :deep(.n-timeline .n-timeline-item:last-child) {
      padding-right: 24px;
    }
  }
}
</style>
