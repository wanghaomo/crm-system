<template>
  <div v-if="text" class="crm_status_tag" :class="props.type" :style="tagStyle">{{ text }}</div>
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
  type?: string
}

const props = withDefaults(defineProps<StatusTagProps>(), {
  text: '',
  color: '',
  bgColor: '',
  borderColor: '',
  borderRadius: '4px',
  padding: '0px 4px',
  fontSize: '12px',
  width: 'auto',
  height: '18px',
  weight: 'normal',
  type: ''
})

const tagStyle = computed(() => {
  const style: Record<string, string> = {
    borderRadius: props.borderRadius,
    padding: props.padding,
    fontSize: props.fontSize,
    width: props.width,
    height: props.height,
    fontWeight: props.weight,
    lineHeight: props.height,
  }
  // type 存在时使用预设样式，跳过内联颜色
  if (!props.type) {
    style.color = props.color
    style.backgroundColor = props.bgColor
    style.borderColor = props.borderColor
  }
  return style
})


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

.crm_status_tag.primary {
  background-color: #EBFAFF;
  border-color: #D8E7F4;
  color: #0192FF;
}

.crm_status_tag.warning {
  background-color: #FFF1D9;
  border-color: #FFE49A;
  color: #E59222;
}

.crm_status_tag.error {
  background-color: #F8E5E2;
  border-color: #FFD2CC;
  color: #C94837;
}

.crm_status_tag.success {
  background-color: #E0FFD5;
  border-color: #E2F4D8;
  color: #5AA771;
}

.crm_status_tag.info {
  background-color: #F0F0F0;
  border-color: #DDDFE6;
  color: #999999;
}
</style>
