<template>
    <div class="pdf-preview-wrapper">
        <!-- 工具栏 -->
        <div class="pdf-toolbar">
            <div class="toolbar-left">
                <button class="toolbar-btn" :disabled="currentPage <= 1 || isLoading" @click="prevPage" title="上一页">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"/></svg>
                </button>
                <span class="page-info">{{ pageInfoText }}</span>
                <button class="toolbar-btn" :disabled="currentPage >= totalPages || isLoading" @click="nextPage" title="下一页">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z"/></svg>
                </button>
            </div>
            <div class="toolbar-right">
                <button class="toolbar-btn" :disabled="scale <= minScale || isLoading" @click="zoomOut" title="缩小">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>
                </button>
                <span class="scale-info">{{ Math.round(scale * 100) }}%</span>
                <button class="toolbar-btn" :disabled="scale >= maxScale || isLoading" @click="zoomIn" title="放大">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
                <button class="toolbar-btn" :disabled="isLoading" @click="resetScale" title="重置">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6s-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8s-3.58-8-8-8z"/></svg>
                </button>
            </div>
        </div>
        <!-- PDF 渲染区域 -->
        <div class="pdf-viewer" ref="viewerRef">
            <!-- loading 覆盖层 -->
            <div v-if="isLoading" class="pdf-loading">
                <div class="loading-spinner"></div>
                <span class="loading-text">加载中…</span>
            </div>
            <!-- 错误提示 -->
            <div v-if="errorMsg" class="pdf-error">
                <span>{{ errorMsg }}</span>
            </div>
            <!-- PDF 始终渲染，@loaded 依赖组件挂载 -->
            <div class="pdf-pages" :style="{ transform: `scale(${scale})`, transformOrigin: 'top center' }">
                <vue-pdf-embed
                    :source="doc"
                    :page="currentPage"
                    text-layer
                    annotation-layer
                    @loaded="onLoaded"
                    @loading-failed="onLoadingFailed"
                    @rendered="onRendered"
                    @rendering-failed="onRenderingFailed"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import VuePdfEmbed, { useVuePdfEmbed } from 'vue-pdf-embed'
import 'vue-pdf-embed/dist/styles/textLayer.css'
import 'vue-pdf-embed/dist/styles/annotationLayer.css'

const props = defineProps({
    pdfUrl: {
        type: String,
        required: true,
    },
})

const { doc } = useVuePdfEmbed({ source: props.pdfUrl })

const viewerRef = ref<HTMLElement | null>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)
const minScale = 0.5
const maxScale = 3
const scaleStep = 0.25
const errorMsg = ref('')
const isLoading = ref(true)

const pageInfoText = computed(() => {
    if (isLoading.value) return '-- / --'
    return `${currentPage.value} / ${totalPages.value || 0}`
})

// 翻页
const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--
}
const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++
}

// 缩放
const zoomIn = () => {
    if (scale.value < maxScale) {
        scale.value = Math.min(scale.value + scaleStep, maxScale)
    }
}
const zoomOut = () => {
    if (scale.value > minScale) {
        scale.value = Math.max(scale.value - scaleStep, minScale)
    }
}
const resetScale = () => {
    scale.value = 1
}

// PDF 加载回调
function onLoaded(pdf: any) {
    totalPages.value = pdf?.numPages || 0
    currentPage.value = 1
    isLoading.value = false
    errorMsg.value = ''
    console.log('[PdfPreview] loaded, numPages=', pdf?.numPages)
}

function onLoadingFailed(err: any) {
    isLoading.value = false
    errorMsg.value = 'PDF 加载失败'
    console.error('[PdfPreview] loading-failed', err)
}

function onRendered() {
    console.log('[PdfPreview] rendered page', currentPage.value)
}

function onRenderingFailed(err: any) {
    console.error('[PdfPreview] rendering-failed', err)
}

// 监听 doc 变化（切换 PDF 时重置状态）
watch(() => props.pdfUrl, () => {
    isLoading.value = true
    errorMsg.value = ''
    currentPage.value = 1
    totalPages.value = 0
    scale.value = 1
})
</script>

<style scoped lang="less">
.pdf-preview-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 300px;
    overflow: hidden;
}

.pdf-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid #e8e8e8;
    flex-shrink: 0;
    background: #fafafa;

    .toolbar-left,
    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .toolbar-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        color: #666;
        transition: all 0.2s;
        padding: 0;

        &:hover:not(:disabled) {
            color: #2C65F2;
            border-color: #2C65F2;
        }

        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    }

    .page-info,
    .scale-info {
        font-size: 12px;
        color: #666;
        min-width: 50px;
        text-align: center;
        user-select: none;
    }
}

.pdf-viewer {
    flex: 1;
    min-height: 260px;
    overflow: auto;
    padding: 12px;
    background: #f5f5f5;
    position: relative;

    .pdf-pages {
        transition: transform 0.2s ease;
        margin: 0 auto;
    }
}

.pdf-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #666;
    font-size: 14px;
    background: rgba(245, 245, 245, 0.96);
    z-index: 10;

    .loading-text {
        line-height: 1.5;
        white-space: nowrap;
    }
}

.pdf-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 12px;
    color: #e34242;
    font-size: 14px;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e8e8e8;
    border-top-color: #2C65F2;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
