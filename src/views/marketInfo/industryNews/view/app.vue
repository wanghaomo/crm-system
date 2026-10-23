<template>
    <AppPage title="行业动态详情" :show-back="false" :show-search="false" :show-list="false">
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
                        >发布人&nbsp;&nbsp;<span style="color: #333">{{
                            detailData.publishPersonName || '--'
                        }}</span></span
                    >
                    <span class="meta-item"
                        >发布时间&nbsp;&nbsp;<span style="color: #333">{{ detailData.publishTime || '--' }}</span></span
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
                                <span class="label">录入类型</span>
                                <span class="value strong">{{ getInputTypeLabel(detailData.inputType) || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">信息来源</span>
                                <span class="value strong">{{ getSourceOptionsLabel(detailData.source) || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">目标网址</span>
                                <div class="value strong">{{ detailData.remark || '--' }}</div>
                            </div>
                        </div>
                    </div>
                </van-tab>

                <!-- 报告内容 -->
                <van-tab title="报告内容" name="content" :title-style="{ fontSize: '16px' }">
                    <div class="tab-panel">
                        <div class="section-title">正文</div>
                        <div class="sectionContent">
                            <MxEditorPreview :modelValue="detailData.content || '--'" minHeight="150px" />
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
import { inputTypeOptions, sourceOptions, industryNewsStatusMap } from '@/constants/industryNews';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
const props = defineProps({
    detailData: {
        type: Object,
        default: () => ({}),
    },
});
const currentColor = ref<any>({});

const getInputTypeLabel = (type) => {
    let findItem = inputTypeOptions.find((item) => item.value == type);
    return findItem ? findItem.label : type;
};
const getSourceOptionsLabel = (source) => {
    let findItem = sourceOptions.find((item) => item.value == source);
    return findItem ? findItem.label : source;
};
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
            word-break: break-all; /* 强制西文在任意位置换行 */
            word-wrap: break-word; /* 兼容旧浏览器 */
            overflow-wrap: anywhere; /* 现代浏览器最佳方案 */
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

.pdf-wrap {
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    min-height: 300px;
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
