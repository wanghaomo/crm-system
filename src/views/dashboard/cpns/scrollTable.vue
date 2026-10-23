<template>
  <div class="scroll-table-wrap" ref="wrapRef" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @wheel="handleWheel">
    <div class="table-container">
      <table class="head-table" ref="headTableRef">
        <thead>
          <tr>
            <th v-if="showIndex" class="index-th">序号</th>
            <th v-for="h in headers" :key="h.key" :style="{
              width: h.width ? (typeof h.width === 'number' ? `${h.width}px` : h.width) : 'auto',
              minWidth: h.width ? (typeof h.width === 'number' ? `${h.width}px` : h.width) : '100px'
            }">
              {{ h.label }}
            </th>
          </tr>
        </thead>
      </table>

      <div class="body-scroll-box" ref="scrollBoxRef">
        <div class="scroll-body-inner" ref="bodyInnerRef" :style="{ transform: `translateY(-${scrollTop}px)` }">
          <table class="body-table">
            <tbody>
              <tr v-for="(row, idx) in data" :key="row.id ?? idx">
                <td v-if="showIndex" class="index-td">{{ idx + 1 }}</td>
                <td v-for="h in headers" :key="h.key" :style="{
                  width: h.width ? (typeof h.width === 'number' ? `${h.width}px` : h.width) : 'auto',
                  minWidth: h.width ? (typeof h.width === 'number' ? `${h.width}px` : h.width) : '100px'
                }">
                  {{ row[h.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

export type TableHeaderItem = {
  key: string
  label: string
  width?: string | number
}

interface Props {
  data: Record<string, any>[]
  headers: TableHeaderItem[]
  showIndex?: boolean
  step?: number
  interval?: number
  wheelStep?: number
  overflowThreshold?: number
}
const props = withDefaults(defineProps<Props>(), {
  showIndex: true,
  step: 1,
  interval: 80,
  wheelStep: 30,
  overflowThreshold: 80
})

const wrapRef = ref<HTMLDivElement | null>(null)
const headTableRef = ref<HTMLTableElement | null>(null)
const scrollBoxRef = ref<HTMLDivElement | null>(null)
const bodyInnerRef = ref<HTMLDivElement | null>(null)

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

  if (!wrapRef.value || !headTableRef.value || !scrollBoxRef.value || !bodyInnerRef.value) return

  const headHeight = headTableRef.value.clientHeight
  boxVisibleHeight = wrapRef.value.clientHeight - headHeight
  contentTotalHeight = bodyInnerRef.value.clientHeight
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

watch([() => props.data, () => props.headers, () => props.showIndex], () => {
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

<style scoped>
.scroll-table-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.head-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.head-table thead tr th {
  background-color: #f5f7fa;
}

.body-scroll-box {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.scroll-body-inner {
  will-change: transform;
}

.body-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.head-table th {
  background: #fff !important;
  color: #666666;
  border-bottom: 1px solid #ECEEF4 !important;
  font-size: 12px;
  font-weight: normal;
}

.head-table th {

  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.body-table td {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  font-size: 14px;
  word-break: break-all;
  overflow-wrap: break-word;
  vertical-align: middle;
}

.index-th,
.index-td {
  width: 60px !important;
  min-width: 60px !important;
  text-align: left;
}

.head-table th:not(.index-th),
.body-table td:not(.index-td) {
  text-align: left;
}

/* 斑马纹 */
.body-table tbody tr:nth-child(even) {
  background-color: #fafbfc;
}

.body-table tbody tr:hover {
  background-color: #ECF1FC;
}
</style>