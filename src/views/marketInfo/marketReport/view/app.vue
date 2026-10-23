<template>
    <AppPage title="市场报告详情" :show-back="false" :show-search="false" :show-list="false">
        <template #content>
            <!-- 顶部基础信息 -->
            <div class="detail-header">
                <div class="title-row">
                    <span class="title">{{ detailData.title || '--' }}</span>
                    <span
                        class="status-tag"
                        :style="{
                            color: currentColor.textColor,
                            borderColor: currentColor.borderColor,
                            backgroundColor: currentColor.backgroundColor,
                        }"
                        >{{ detailData.statusName || '--' }}</span
                    >
                </div>
                <div class="meta-row">
                    <span class="meta-item"
                        >作者&nbsp;&nbsp;<span style="color: #333">{{ detailData.authorName || '--' }}</span></span
                    >
                    <span class="meta-item"
                        >创建时间&nbsp;&nbsp;<span style="color: #333">{{ detailData.createdAt || '--' }}</span></span
                    >
                </div>
            </div>

            <!-- Tab 切换 -->
            <van-tabs v-model:active="activeTab" sticky class="detail-tabs" line-width="24" animated>
                <!-- 基础数据 -->
                <van-tab title="基础数据" name="base" :title-style="{ fontSize: '16px' }">
                    <div class="tab-panel">
                        <div class="section-title">基础数据</div>
                        <div class="info-card">
                            <div class="info-row">
                                <span class="label">文件类型</span>
                                <span class="value strong">{{ detailData.fileType || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">文件大小</span>
                                <span class="value strong">{{ detailData.fileSize || '--' }}</span>
                            </div>
                            <div class="info-row column">
                                <span class="label">备注</span>
                                <div class="value remark">{{ detailData.remark || '--' }}</div>
                            </div>
                        </div>
                    </div>
                </van-tab>

                <!-- 报告内容 -->
                <van-tab title="报告内容" name="content" :title-style="{ fontSize: '16px' }">
                    <div class="tab-panel">
                        <div class="pdf-wrap">
                            <PdfPreview v-if="hasPdfFile" :pdfUrl="pdfFileUrl" />
                            <empty v-else />
                        </div>
                    </div>
                </van-tab>
            </van-tabs>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Tabs as VanTabs, Tab as VanTab } from 'vant';
import { numberToChinese } from '@/utils/commUtil';
import { marketReportStatusMap } from '@/constants/marketReport';
const props = defineProps({
    detailData: {
        type: Object,
        default: () => ({}),
    },
});
const route = useRoute();
const router = useRouter();
const currentColor = ref<any>({});

// PDF 预览相关计算属性
const hasPdfFile = computed(() => {
    const fileInfo = props.detailData?.fileInfo;
    return fileInfo && fileInfo?.url && fileInfo.url !== '#';
});
const pdfFileUrl = computed(() => {
    return props.detailData?.fileInfo?.url || '';
});
watch(
    () => props.detailData,
    (newValue) => {
        if (newValue && marketReportStatusMap[newValue?.status]) {
            currentColor.value = marketReportStatusMap[props.detailData?.status];
        }
    },
    {
        immediate: true,
        deep: true,
    }
);
// 当前 Tab
const activeTab = ref<'base' | 'content'>('base');
</script>

<style scoped lang="less">
.detail-header {
    padding: 16px;
    background: #ffffff;

    .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        .title {
            font-size: 17px;
            font-weight: 500;
            color: #303133;
            flex: 1;
        }

        .status-tag {
            padding: 2px 8px;
            font-size: 12px;
            color: #67c23a;
            background: #e8f5e8;
            border-radius: 4px;
            line-height: 1.4;
            margin-right: 8px;
        }
    }

    .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        color: #999;
        font-size: 14px;

        .meta-item {
            line-height: 1.5;
        }
    }
}

.detail-tabs {
    :deep(.van-tabs__wrap) {
        background: #ffffff;
    }

    :deep(.van-tab--active) {
        color: #2272ff;
        font-weight: 500;
    }

    :deep(.van-tabs__line) {
        background: #2272ff;
    }
}

.tab-panel {
    padding: 12px;
    min-height: calc(100vh - 210px);
    box-sizing: border-box;
    background: #fff;
    margin-top: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;

    .section-title {
        font-size: 15px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 10px;
    }
}

.info-card {
    border-radius: 8px;

    .info-row {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 14px;

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
            width: 70px;
            flex-shrink: 0;
        }

        .value {
            color: #303133;
            flex: 1;

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

.pdf-wrap {
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    min-height: 300px;
    flex: 1;
    /* 内容多页时垂直堆叠，空状态时居中 */
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;

    .pdf-empty {
        color: #909399;
        font-size: 14px;
        padding: 80px 0;
        text-align: center;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pdf-img {
        width: 100%;
        display: block;
        /* 紧密堆叠，不留间距，形成连续长图 */
        margin: 0;
        padding: 0;
        border: none;
        vertical-align: top;
    }
}

.push-item {
    background: #f4f4f4;
    border-radius: 8px 8px 8px 8px;
    margin-top: 12px;
    padding: 12px;
    box-sizing: border-box;
    .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .title {
            font-weight: 500;
            font-size: 14px;
            color: #333333;
        }
        .status-tag {
            padding: 0 4px;
            height: 18px;
            border-radius: 2px 2px 2px 2px;
            border: 1px solid #0192ff;
            font-weight: 400;
            font-size: 12px;
        }
    }
    .row {
        margin-top: 8px;
        display: flex;
        font-size: 14px;
        .label {
            color: #999999;
            margin-right: 8px;
        }
        .value {
            color: #333333;
            flex: 1;
        }
    }
}
</style>
