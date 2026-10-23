<template>
  <card title="客户发货量TOP10(吨)" :isApp="isApp" iconClass="icon⎽com⎽shipment">
    <div v-if="shipmentData.length" :class="{ shipment: true, 'app-shipment': isApp }" ref="wrapRef"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @wheel="handleWheel"
    >
      <div class="scroll-inner" ref="innerRef" :style="{ transform: `translateY(-${scrollTop}px)` }">
        <div :class="{ inset: !isApp }">
          <div class="item" v-for="(item,index) in shipmentData" :key="item.value">
            <div class="head">
              <div class="icon">{{ index+1 }}</div>
              <div class="name">{{ item.title || '--' }}</div>
              <div class="value">{{ formatNumber(item.value) }}吨</div>
            </div>
            <div class="bar">
              <div class="progress" :style="{ width: (item.value / maxValue * 100) + '%'}"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Empty v-else :scale="isApp ? 0.7 : 0.85" class="shipment-empty" />
  </card>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted, type PropType } from 'vue'
import card from './card.vue'

const props = defineProps({
  isApp: {
    type: Boolean,
    default: false
  },
  shipmentData: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  step: {
    type: Number,
    default: 1
  },
  interval: {
    type: Number,
    default: 80
  },
  wheelStep: {
    type: Number,
    default: 30
  },
  overflowThreshold: {
    type: Number,
    default: 20
  }
})

const formatNumber = (num: number | string): string => {
  if (num === '' || num === null || num === undefined) return ''
  return Number(num).toLocaleString('en-US')
}

const maxValue = computed(() => {
  if (!props.shipmentData.length) return 1
  return Math.max(...props.shipmentData.map((item: any) => item.value), 1)
})

const wrapRef = ref<HTMLDivElement | null>(null)
const innerRef = ref<HTMLDivElement | null>(null)

const scrollTop = ref(0)
let timer: number | null = null
let boxVisibleHeight = 0
let contentTotalHeight = 0
let maxScrollDistance = 0

const canAutoScroll = ref(false)
const canManualScroll = ref(false)

let resizeObserver: ResizeObserver | null = null

const clearTimer = () => {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

const calcScrollBoundary = async () => {
  clearTimer()
  scrollTop.value = 0
  await nextTick()
  if (!wrapRef.value || !innerRef.value) return

  if (props.isApp) {
    canAutoScroll.value = false
    canManualScroll.value = false
    return
  }

  boxVisibleHeight = wrapRef.value.clientHeight
  contentTotalHeight = innerRef.value.clientHeight
  maxScrollDistance = contentTotalHeight - boxVisibleHeight

  canManualScroll.value = maxScrollDistance > 0
  canAutoScroll.value = maxScrollDistance >= props.overflowThreshold

  if (canAutoScroll.value) startScrollLoop()
}

const startScrollLoop = () => {
  if (timer) return
  timer = window.setInterval(() => {
    scrollTop.value += props.step
    if (scrollTop.value >= maxScrollDistance) {
      scrollTop.value = 0
    }
  }, props.interval)
}

const handleMouseEnter = () => {
  clearTimer()
}

const handleMouseLeave = () => {
  if (canAutoScroll.value) startScrollLoop()
}

const handleWheel = (e: WheelEvent) => {
  if (!canManualScroll.value) return

  const delta = e.deltaY > 0 ? props.wheelStep : -props.wheelStep
  const nextScroll = scrollTop.value + delta

  if (delta < 0 && scrollTop.value <= 0) return
  if (delta > 0 && scrollTop.value >= maxScrollDistance) return

  e.preventDefault()
  scrollTop.value = Math.max(0, Math.min(maxScrollDistance, nextScroll))
  clearTimer()
}

watch([() => props.shipmentData, () => props.isApp], () => {
  calcScrollBoundary()
}, { deep: true })

onMounted(() => {
  calcScrollBoundary()
  if (wrapRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => calcScrollBoundary())
    resizeObserver.observe(wrapRef.value)
  }
})

onUnmounted(() => {
  clearTimer()
  if (resizeObserver && wrapRef.value) {
    resizeObserver.unobserve(wrapRef.value)
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>
<style scoped lang="less">
.shipment {
  width: 100%;
  height: 236px;
  overflow: hidden;
  position: relative;
  .scroll-inner {
    will-change: transform;
  }
  .inset {
    width: calc(100% - 12px);
  }
  .item {
    margin-top: 12px;
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        margin: 0px 8px 0px 4px;
        background: #C6C6C6;
        color: #FFFFFF;
        text-align: center;
        line-height: 24px;
      }
      .name {
        font-size: 14px;
        color: #666666;
        flex: 1;
      }
      .value {
        font-size: 14px;
        color: #333333;
        font-weight: 600;
      }
    }
    .bar {
      width: 100%;
      height: 8px;
      background: #E2EDFE;
      border-radius: 0px 0px 0px 0px;
      margin-top: 4px;
      .progress {
        height: 8px;
        background: linear-gradient(90deg, #9FDFFB 0%, #2C65F2 100%);
      }
    }
  }
  // 前三名图标样式
  .item:nth-child(1),
  .item:nth-child(2),
  .item:nth-child(3) {
    .head {
      .icon {
        width: 32px;
        height: 32px;
        color: transparent;
        border-radius: 0px;
        margin: 0px 4px 0px 0px;
      }
    }
  }
  .item:nth-child(1) .head .icon {
    background: url('@/assets/images/dashboard/icon⎽com⎽no.1.png') no-repeat center;
    background-size: 100% 100%;
  }
  .item:nth-child(2) .head .icon {
    background: url('@/assets/images/dashboard/icon⎽com⎽no.2.png') no-repeat center;
    background-size: 100% 100%;
  }
  .item:nth-child(3) .head .icon {
    background: url('@/assets/images/dashboard/icon⎽com⎽no.3.png') no-repeat center;
    background-size: 100% 100%;
  }
}
.shipment-empty {
  width: 100%;
  height: v-bind('isApp ? "360px" : "236px"');
}

.app-shipment {
  height: 360px;
  overflow: auto; // app模式原生滚动条
}
</style>