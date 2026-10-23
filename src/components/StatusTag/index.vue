<template>
  <div v-if="text" class="crm_status_tag" :style="tagStyle">{{ text }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface StatusTagProps {
  /** 标签文字 */
  text?: string
  /** 文字颜色 */
  color?: string
  /** 背景色 */
  bgColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 边框圆角 */
  borderRadius?: string
  /** 内边距 */
  padding?: string
  /** 字体大小 */
  fontSize?: string
  /** 标签整体宽度（auto 或固定值） */
  width?: string
  /** 标签整体高度（auto 或固定值） */
  height?: string
  weight?: string
}

const props = withDefaults(defineProps<StatusTagProps>(), {
  text: '',
  color: '',
  bgColor: '',
  borderColor: '',
  borderRadius: '4px',
  padding: '1px 4px',
  fontSize: '14px',
  width: 'auto',
  height: '22px',
  weight: 'normal'
})

const tagStyle = computed(() => ({
  color: props.color,
  backgroundColor: props.bgColor,
  borderColor: props.borderColor,
  borderRadius: props.borderRadius,
  padding: props.padding,
  fontSize: props.fontSize,
  width: props.width,
  height: props.height,
  fontWeight: props.weight
}))


</script>

<style lang="less" scoped>
.crm_status_tag {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  white-space: nowrap;
  font-weight: normal;
}
</style>
