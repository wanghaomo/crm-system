<template>
    <AppPage title="报告详情" :show-search="false" :show-list="false" :no-padding="true">
        <template #content>
            <!-- 顶部基础信息 -->
            <div class="detail-header">
                <div class="title-row">
                    <AppTag class="status-tag" :text="currentColor.label || '--'" :type="currentColor.type" />
                    <span class="title">{{ detailData.reportName }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-item" style="margin-right: 30px;">报告编号&nbsp; <span style="color: #333">{{ detailData.reportCode || '--' }}</span></span>
                    <span class="meta-item">报告类型&nbsp; <span style="color: #333">{{ detailData.reportType || '--' }}</span></span>
                </div>
            </div>

            <!-- Tab 切换 -->
            <van-tabs v-model:active="activeTab" sticky class="detail-tabs" line-width="24" animated>
                <!-- 基础数据 -->
                <van-tab title="基础数据" name="base" :title-style="{ fontSize: '16px' }">
                    <div class="tab-panel">
                        <div class="section-title" >基础数据</div>
                        <div class="info-card">
                            <div class="info-row warp">
                                <span class="label">数据来源</span>
                                <span class="value">{{ detailData.dataSource || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">历史数据跨度</span>
                                <span class="value">{{ detailData.historyRange || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">AI模型</span>
                                <span class="value">{{ detailData.modelName || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">生成时间</span>
                                <span class="value">{{ detailData.generatedAt || '--' }}</span>
                            </div>
                            <div class="info-row warp">
                                <span class="label">报告备注</span>
                                <span class="value">{{ detailData.remark || '--' }}</span>
                            </div>
                        </div>
                    </div>
                </van-tab>

                <!-- 报告内容 -->
                <van-tab title="报告预览" name="content" :title-style="{ fontSize: '16px' }">
                    <div class="tab-panel-report">
                        <div class="rich-text-content markdown-content" v-if="renderedContentData" v-html="renderedContentData"></div>
                        <div class="rich-text-content empty-preview" v-else>暂无报告内容</div>
                    </div>
                </van-tab>

            </van-tabs>
        </template>
        <!-- 底部新增按钮 -->
        <template #footer v-if="activeTab == 'content'">
            <div class="add-btn-container flex-center">
                <van-button class="add-btn" type="primary" block @click="downloadReport()"> 下载 </van-button>
            </div>
        </template>
    </AppPage>
</template>

<script setup lang="ts">

import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Tabs as VanTabs, Tab as VanTab, Button as VanButton, showSuccessToast, showFailToast } from 'vant';
import { exportMarkdownToPdf } from '../commonTs/pdfExport';
import { marked } from 'marked';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import {
    getSalesPlanAiReportDetail,
} from '@/api/aiReport';

import {
    AI_REPORT_STATUS_CONFIG,
    AI_REPORT_TYPE_LABEL_MAP
} from '../commonTs/common';

const route = useRoute();
const router = useRouter();
const detailData = ref<any>({});
const currentColor = ref<any>({});
const { dictMap } = storeToRefs(useDictStore());
// 当前 Tab
const activeTab = ref<'base' | 'content'>('base');

const renderedContentData = computed(() => {
    if (!detailData.value.contentData) return '';
    return marked.parse(detailData.value.contentData, {
        gfm: true,
        breaks: true,
    }) as string;
});

const aiModelOptions = computed(() => dictMap.value?.['AI模型'] || []);
const formatReportType = (value?: string) => (value ? AI_REPORT_TYPE_LABEL_MAP[value] || value : '--');
const formatAiModel = (value?: string) => {
    if (!value) return '--';
    const option = aiModelOptions.value.find((item: any) => item.value === value);
    return option?.label || value;
};
// 推送记录模拟数据
const typeRef = ref('detail'); // 编辑模式判断
const getDetail = async (type: 'detail' | 'preview', id?: any) => {
    console.log('id', id);
    typeRef.value = type;
    try {
        const res = await getSalesPlanAiReportDetail(id);
        detailData.value = res.data;
        detailData.value = {
            ...detailData.value,
            reportType: formatReportType(detailData.value.reportType),
            generatedAt: detailData.value.generationTime,
            historyRange: detailData.value.historicalSpan,
            dataSource: detailData.value.dataSources,
            modelName: formatAiModel(detailData.value.aiModel),
            conclusion: detailData.value.summaryConclusion,
        }
        currentColor.value = AI_REPORT_STATUS_CONFIG[detailData.value?.status] || AI_REPORT_STATUS_CONFIG.RUNNING;
    } catch (error) {
        console.log(error, '1');
    }
};
getDetail(route.query.type, route.query.id);

let loading = window.$loading ? window.$loading() : null;
const downloadLoading = ref(false);
const downloadReport = async () => {
    if (downloadLoading.value) return;
    if (!detailData.value.contentData) {
        showFailToast('暂无可导出的报告内容');
        return;
    }
    try {
        downloadLoading.value = true;
        loading.show()
        await exportMarkdownToPdf(
            detailData.value.contentData,
            `${detailData.value.reportName || detailData.value.reportCode || 'AI预测报告'}.pdf`
        );
    } finally {
        downloadLoading.value = false;
        loading.hide();
    }
};

</script>


<style scoped lang="less">
:deep(.van-tabs__content){
    margin: 12px;
    margin-top: 4px;
}
.detail-header {
    padding: 12px;
    padding-bottom: 0;
    background: #ffffff;

    .title-row {
        display: block;
        margin-bottom: 10px;

        .status-tag {
            float: left;
            margin-right: 8px;
            margin-top: 2px;
        }

        .title {
            display: inline;
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            line-height: 1.5;
        }
    }

    .meta-row {
        display: flex;
        // justify-content: space-between;
        color: #999;
        font-size: 14px;

        .meta-item {
            line-height: 1.5;
        }
    }
}

.add-btn-container {
    display: flex;
    padding: 4px 12px 8px;
    background-color: var(--base-white);
    z-index: 99;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);

    .add-btn {
        border-radius: 4px;
        height: 40px;
        font-size: 16px;
        font-weight: 500;
        font-weight: 500;
        --van-button-primary-background: #2c65f2;
        --van-button-primary-border-color: #2c65f2;
    }
}

.detail-tabs {
    :deep(.van-tabs__wrap) {
        background: #ffffff;
    }

    :deep(.van-tab--active) {
        font-weight: 500;
    }

    :deep(.van-tabs__line) {
        background: #2272ff;
    }
}

.tab-panel-report,
.tab-panel {
    padding: 12px;
    height: calc(100vh - 210px);
    box-sizing: border-box;
    background: #fff;
    margin-top: 10px;
    overflow: auto;
    overflow-y: scroll;
    border-radius: 8px;
}

.tab-panel-report {
    height: calc(100vh - 260px);
}

.section-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
}

.info-card {
    border-radius: 8px;

    .info-row {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 16px;

        &:last-child {
            border-bottom: none;
        }

        &.column {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        .label {
            color: #909399;
            width: 110px;
            flex-shrink: 0;
        }

        &.warp {
            flex-wrap: wrap;

            .label {
                width: 100%;
            }
        }

        .value {
            color: #303133;
            flex: 1;
            word-break: break-all;
            /* 强制西文在任意位置换行 */
            word-wrap: break-word;
            /* 兼容旧浏览器 */
            overflow-wrap: anywhere;
            /* 现代浏览器最佳方案 */
            white-space: normal;

            &.strong {
                font-weight: 500;
            }

            &.remark {
                line-height: 1.6;
                color: #606266;
                word-break: break-all;
            }
        }
    }
}

.empty-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--base-grey);
}



.rich-text-content {
    background: var(--base-white);
    color: var(--base-grey4);
    font-size: 16px;
    line-height: 1.75;
    height: 100%;
}

.markdown-content {

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
        margin: 16px 0 10px;
        color: var(--base-grey4);
        font-weight: 500;
        line-height: 1.35;
    }

    :deep(h1) {
        font-size: 24px;
    }

    :deep(h2) {
        font-size: 22px;
    }

    :deep(h3) {
        font-size: 20px;
    }

    :deep(h4) {
        font-size: 18px;
    }

    :deep(p),
    :deep(ul),
    :deep(ol),
    :deep(blockquote),
    :deep(pre),
    :deep(table) {
        margin: 0 0 12px;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(p),
    :deep(li),
    :deep(blockquote),
    :deep(pre),
    :deep(table),
    :deep(tr) {
        break-inside: avoid;
        page-break-inside: avoid;
    }

    :deep(ul),
    :deep(ol) {
        padding-left: 22px;
    }

    :deep(code) {
        padding: 2px 4px;
        border-radius: 3px;
        background: #f2f4f7;
        font-size: 14px;
        font-family: monospace;
    }

    :deep(pre) {
        overflow-x: auto;
        padding: 12px;
        border-radius: 4px;
        background: #f2f4f7;
        font-size: 14px;

        code {
            padding: 0;
            background: transparent;
        }
    }

    :deep(table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }

    :deep(th),
    :deep(td) {
        padding: 8px 10px;
        border: 1px solid #e7eaf2;
        text-align: left;
    }

    :deep(img) {
        max-width: 100%;
    }
}
</style>
