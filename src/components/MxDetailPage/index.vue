/**
* @description: 详情抽屉页组件
*/
<template>
  <MxDrawer
    v-model:show="show"
    :title="title"
    :width="width"
    :closable-pop="closablePop"
    class="mx-detail-drawer"
  >
    <div class="mx-detail-container">
      <!-- 头部标题区域 -->
      <div 
        v-if="$slots['header-subtitle'] || headerMainTitle || $slots['header-sub-title']" 
        class="mx-detail-subtitle" 
        :class="{ 'no-border': $slots['tabs-content']}"
      >
        <slot name="header-subtitle">
          <div class="header-section">
            <!-- 主标题 -->
            <div v-if="headerMainTitle" class="title-row" :style="{ marginBottom: $slots['header-sub-title'] ? '8px' : '0px' }">
              <span class="main-title">{{ headerMainTitle }}</span>
              <slot name="header-tag" />
            </div>
            <!-- 副标题内容 -->
            <div v-if="$slots['header-sub-title']" class="sub-title">
              <slot name="header-sub-title" />
            </div>
          </div>
        </slot>
      </div>

      <!-- Tabs 导航区域 -->
      <div v-if="$slots['tabs-content']" class="mx-detail-tabs">
        <slot name="tabs-content" />
      </div>

      <!-- 主体左右分栏区域 -->
      <div class="mx-detail-body">
        <!-- 左侧内容区 -->
        <div
          v-if="$slots['left-content'] || showApprovalLogs"
          class="mx-detail-left"
          :style="[{ width: leftWidth }, leftContentStyle]"
        >
          <div class="section-content">
            <slot v-if="$slots['left-content']" name="left-content" />
            <div v-if="showApprovalLogs" class="approval-content">
              <DetailsTitle :title="approvalLogsTitle" :styleOption="{padding: '0px 0px 16px 0px'}" :fontSize="16"/>
              <div class="timeline-container">
                <ApprovalDetails :model-value="approvalLogs || []" type="vertical" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="mx-detail-right">
          <div class="section-content" :style="rightContentStyle">
            <slot name="right-content" />
          </div>

          <!-- 底部操作按钮区域只在右侧区域的底部展示 -->
          <div v-if="$slots.footer || footerButtons.length" class="mx-detail-footer">
            <slot v-if="$slots.footer" name="footer" />
            <n-space v-else justify="center" :size="footerSpaceSize">
              <MxButton
                v-for="button in footerButtons"
                :key="button.key"
                :type="button.type || 'success'"
                :border="button.border || false"
                @click="emit('footerClick', button.key)"
                :styleOption="{
                  padding: ['by', 'resolve', 'refused', 'reject'].includes(button.key) ? '0' : '4px 10px',
                  width: ['by', 'resolve', 'refused', 'reject'].includes(button.key) ? '80px' : '56px'
                }"
              >
                <template #leftIcon>
                  <n-icon v-if="button.key === 'by' || button.key === 'resolve'" :component="Checkmark" />
                  <n-icon v-if="button.key === 'refused' || button.key === 'reject'" :component="CloseOutline" />
                </template>
                {{ button.label }}
              </MxButton>
            </n-space>
          </div>
        </div>
      </div>
    </div>
  </MxDrawer>
</template>

<script setup lang="ts">
import { NSpace, NIcon } from 'naive-ui';
import { Checkmark, CloseOutline } from '@vicons/ionicons5'
import type { CSSProperties } from 'vue'

interface FooterButtonItem {
  key: string
  label: string
  type?: 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  ghost?: boolean
  className?: string
  icon?: any
  border?: boolean
}

const props = withDefaults(defineProps<{
  /** 抽屉标题 */
  title?: string
  /** 抽屉宽度 */
  width?: string
  /** 左侧区域宽度 */
  leftWidth?: string
  /** 是否需要关闭提示 */
  closablePop?: boolean
  /** 头部副标题区域 - 主标题 */
  headerMainTitle?: string
  /** 审批/操作日志标题 */
  approvalLogsTitle?: string
  /** 审批/操作日志数据 */
  approvalLogs?: any[]
  /** 底部按钮配置 */
  footerButtons?: FooterButtonItem[]
  /** 底部按钮间距 */
  footerSpaceSize?: number
  /** 是否显示审批日志 */
  showApprovalLogs?: boolean
  /** 左侧内容区样式 */
  leftContentStyle?: CSSProperties
  /** 右侧内容区样式 */
  rightContentStyle?: CSSProperties
}>(), {
  title: '详情',
  width: 'calc(100vw - 260px)',
  leftWidth: '240px',
  closablePop: false,
  approvalLogsTitle: '审批信息',
  approvalLogs: () => [],
  footerButtons: () => [],
  footerSpaceSize: 24,
  showApprovalLogs: true,
  leftContentStyle: () => ({}),
  rightContentStyle: () => ({})
})

const emit = defineEmits<{
  footerClick: [key: string]
}>()

const show = defineModel<boolean>('show', { default: false })

</script>

<style lang="less">
/* 去除 MxDrawer 内部 content 的默认 padding，让边框线能贴边 */
.n-drawer.custom_drawer_container.mx-detail-drawer {
  .drawer_header_title {
    font-size: 16px;
    font-weight: 600;
  }
  .n-drawer-content-wrapper {
    box-sizing: border-box;
  }
  .n-drawer-body-content-wrapper {
    padding: 0 !important;
  }
}
</style>

<style lang="less" scoped>
.mx-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mx-detail-subtitle {
  padding: 12px 24px;
  border-bottom: 1px solid var(--draw-border);
  margin-bottom: 0;

  &.no-border {
    border-bottom: none;
  }

  .header-section {
    .title-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px; 
      .main-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--base-black);
        margin-right: 8px;
      }
    }
    
    .sub-title {
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      
      :deep(.label) {
        color: var(--base-grey);
      }
      
      :deep(.value) {
        color: var(--base-black);
      }
    }
  }
}

.mx-detail-tabs {
  border-top: 8px solid #F0F0F0;
  font-size: 16px;
  :deep(.module_select_box) {
    gap: 32px;
  }
}

.mx-detail-body {
  display: flex;
  flex: 1;
  overflow: hidden;

  .mx-detail-left {
    flex-shrink: 0;
    padding: 24px;
    border-right: 1px solid var(--draw-border);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: auto;
    align-self: stretch;
  }

  .mx-detail-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    box-sizing: border-box;

    .section-content {
      padding: 16px;
      flex: 1;
      overflow-y: auto;
    }
  }
}

.mx-detail-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 24px;
  margin-top: auto;
  border-top: 1px solid var(--draw-border);
  box-sizing: border-box;

  :deep(.mx-btn.mx_mes-primary) {
    width: 82px;
    padding: 0;
  }

  &:empty {
    display: none;
  }
}

.approval-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.timeline-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}
</style>
