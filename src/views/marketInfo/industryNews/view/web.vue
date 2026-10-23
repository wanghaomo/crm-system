<template>
    <div class="detail-content">
        <!-- 顶部信息 -->
        <div class="detail-header">
            <div class="detail-header-top">
                <span class="detail-title">{{ detailData.title || '--' }}</span>
                <n-tag
                    :color="{
                        textColor: currentColor.textColor,
                        borderColor: currentColor.borderColor,
                        color: currentColor.backgroundColor,
                    }"
                    class="mx_mes_header_tag">
                    {{ detailData.statusName || '--' }}
                </n-tag>
            </div>
            <div class="detail-header-info">
                <div class="info-item">
                    <span class="info-label">发布人</span>
                    <span class="info-value">{{ detailData.publishPersonName || '--' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">录入类型</span>
                    <span class="info-value">{{ getInputTypeLabel(detailData.inputType) || '--' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">发布时间</span>
                    <span class="info-value">{{ detailData.publishTime || '--' }}</span>
                </div>
            </div>
        </div>
        <!-- 灰色间隔 -->
        <div class="gray-separator"></div>
        <!-- Tab 区域 -->
        <div class="detail-main">
            <!-- <div class="detail-tabs-container">
                <n-tabs
                    v-model:value="activeTab"
                    :tab-style="{ color: '#666666', fontSize: '16px' }"
                    type="line"
                    animated
                    class="detail-tabs"
                    :bar-width="36">
                    <n-tab v-for="tab in tabList" :key="tab.value" :name="tab.value">
                        {{ tab.label }}
                    </n-tab>
                </n-tabs>
            </div> -->
            <!-- 基础信息 -->
            <div v-show="activeTab === 'basic'" class="tab-content">
                <div class="section-title"><span class="section-bar"></span>基础信息</div>
                <div class="basic-info-grid">
                    <div class="basic-info-item">
                        <span class="basic-label">信息来源</span>
                        <span class="basic-value">{{ getSourceOptionsLabel(detailData.source) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">目标网址</span>
                        <span class="basic-value">{{ detailData.targetUrl || '--' }}</span>
                    </div>
                </div>
                <div class="section-title"><span class="section-bar"></span>正文</div>
                <div class="sectionContent">
                    <MxEditorPreview class="industry-news-editor-preview" :modelValue="detailData.content || '--'" minHeight="100%" maxHeight="none" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import MxTag from '@/components/MxTag/index.vue';
import {
    industryNewsStatusMap,
    industryNewsPushStatusMap,
    inputTypeOptions,
    sourceOptions,
} from '@/constants/industryNews';
import { getMarketReportApi } from '@/api';
import { NTabs, NTab, NDataTable, NTag, NSpace } from 'naive-ui';
import { deepClone, getFileType } from '@/utils/comm';
const props = defineProps({
    detailData: {
        type: Object,
        default: () => ({}),
    },
});
const activeTab = ref('basic');
const currentColor = ref({});

const getInputTypeLabel = (type) => {
    let findItem = inputTypeOptions.find((item) => item.value == type);
    return findItem ? findItem.label : type;
};
const getSourceOptionsLabel = (source) => {
    let findItem = sourceOptions.find((item) => item.value == source);
    return findItem ? findItem.label : source;
};
const tabList = [{ label: '基础信息', value: 'basic' }];

watch(
    () => props.detailData,
    (newValue) => {
        if (newValue && industryNewsStatusMap[newValue?.status]) {
            currentColor.value = industryNewsStatusMap[props.detailData?.status];
        }
    },
    {
        immediate: true,
        deep: true,
    }
);
</script>

<style scoped lang="less">
.drawer-footer {
    display: flex;
    justify-content: center !important;
    gap: 12px;
    width: 100%;
}
/* 详情样式 */
.detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-header {
        padding: 16px;
        flex-shrink: 0;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .detail-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
        }

        .detail-header-info {
            display: flex;
            gap: 40px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;

                .info-label {
                    color: #999;
                    font-size: 14px;
                }

                .info-value {
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                }
            }
        }
    }

    .gray-separator {
        height: 8px;
        background: #f0f0f0;
        flex-shrink: 0;
    }

    .detail-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .detail-tabs-container {
            padding: 0 24px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .tab-content {
            flex: 1;
            overflow: auto;
            padding: 16px 24px;
            display: flex;
            flex-direction: column;
        }
    }
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    margin-top: 16px;

    &:first-child {
        margin-top: 0;
    }

    .section-bar {
        display: inline-block;
        width: 3px;
        height: 14px;
        background-color: #2c65f2;
        border-radius: 2px;
    }
}

.basic-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 40px;
    margin-bottom: 16px;

    .basic-info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        &.full-width {
            grid-column: span 2;
        }

        .basic-label {
            color: #999;
            font-size: 12px;
            min-width: 70px;
            text-align: right;
        }

        .basic-value {
            color: #333;
            font-size: 12px;
            word-break: break-all; /* 强制西文在任意位置换行 */
            word-wrap: break-word; /* 兼容旧浏览器 */
            overflow-wrap: anywhere; /* 现代浏览器最佳方案 */
            white-space: normal;
        }
    }
}

.report-content {
    min-height: 300px;

    .no-pdf-tip {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #999;
        font-size: 14px;
        background: #fafafa;
        border-radius: 4px;
    }
}

.sectionContent {
    flex: 1;
    display: flex;
    min-height: 0;

    .industry-news-editor-preview {
        flex: 1;
        min-height: 0;
    }

    :deep(.mx-editor-preview) {
        display: flex;
    }

    :deep(.w-e-text-container) {
        height: 100% !important;
        max-height: none !important;
    }
}
</style>
