<template>
    <MxDrawer
        class="ai-report-detail-drawer"
        :show="show"
        title="报告详情"
        :closablePop="false"
        @update:show="handleVisibleChange">
        <div class="report-detail">
            <div class="report-header">
                <div class="report-name">{{ detail.reportName || '--' }}</div>
                <n-descriptions label-placement="left" :column="3" :separator="false" class="mx_crm_descriptions_style mx_crm_descriptions_style1">
                    <n-descriptions-item label="报告编号">
                        {{ detail.reportCode || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="报告类型">
                        {{ detail.reportType || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="生成时间">
                        {{ detail.generatedAt || '--' }}
                    </n-descriptions-item>
                </n-descriptions>
            </div>

            <div class="pad-24">
                <DetailsTitle title="基础信息" :styleOption="{ padding: '16px 0' }" :fontSize="16" />
            <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style mx_crm_descriptions_style2">
                <n-descriptions-item label="AI模型">
                    {{ detail.modelName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item :label-style="{width: '90px'}" label="历史数据跨度">
                    {{ detail.historyRange || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="数据来源" :span="2">
                    {{ detail.dataSource || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="报告备注" :span="2">
                    {{ detail.remark || '--' }}
                </n-descriptions-item>
            </n-descriptions>

            <DetailsTitle title="报告预览" :styleOption="{ padding: '16px 0' }" :fontSize="16">
                <template #btn>
                    <MxButton
                        text
                        type="success"
                        :disabled="downloadLoading"
                        :styleOption="downloadButtonStyle"
                        @click="downloadReport">
                        <template #leftIcon>
                            <span v-if="downloadLoading" class="download-icon loading">↻</span>
                            <img v-else class="download-icon-img" :src="iconComDownload" alt="" />
                        </template>
                        {{ downloadLoading ? '导出中' : '下载' }}
                    </MxButton>
                </template>
            </DetailsTitle>
            <div class="report-preview">
                <div
                    class="rich-text-content markdown-content"
                    v-if="renderedContentData"
                    v-html="renderedContentData"></div>
                <div class="rich-text-content empty-preview" v-else>暂无报告内容</div>
            </div>
            </div>
        </div>
    </MxDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NDescriptions, NDescriptionsItem, useMessage } from 'naive-ui';
import { marked } from 'marked';
import { exportMarkdownToPdf } from '../commonTs/pdfExport';
import iconComDownload from '@/assets/images/comm/icon_common_download.png';

const props = withDefaults(
    defineProps<{
        show: boolean;
        detail: Record<string, any>;
    }>(),
    {
        show: false,
        detail: () => ({}),
    }
);

const message = useMessage();
const emit = defineEmits(['update:show']);
const downloadLoading = ref(false);

const handleVisibleChange = (value: boolean) => {
    emit('update:show', value);
};

const renderedContentData = computed(() => {
    if (!props.detail.contentData) return '';
    return marked.parse(props.detail.contentData, {
        gfm: true,
        breaks: true,
    }) as string;
});

const downloadReport = async () => {
    if (downloadLoading.value) return;
    if (!props.detail.contentData) {
        message.warning('暂无可导出的报告内容');
        return;
    }
    try {
        downloadLoading.value = true;
        await exportMarkdownToPdf(
            props.detail.contentData,
            `${props.detail.reportName || props.detail.reportCode || 'AI预测报告'}.pdf`
        );
    } finally {
        downloadLoading.value = false;
    }
};

const downloadButtonStyle = {
    fontSize: '12px',
    color: 'var(--base-color)',
    height: '24px',
};
</script>

<style lang="less" scoped>
:deep(.mx_crm_descriptions_style1 .n-descriptions-table-content__label){
    width: fit-content !important;
    text-align: left !important;
    justify-content: flex-start !important;
}
:deep(.mx_crm_descriptions_style2 .n-descriptions-table-content__label){
    width: 60px !important;
    text-align: right !important;

}
.report-detail {
    min-height: 100%;
    padding-bottom: 24px;
    background: var(--base-white);
    overflow-y: auto;
}

.report-header {
    padding: 12px 24px;
    border-bottom: 1px solid #f0f0f0;
}

.report-name {
    margin-bottom: 12px;
    color: var(--base-grey4);
    font-size: 16px;
    font-weight: 600;
    line-height: 26px;
}

.download-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 16px;
    line-height: 1;

    &.loading {
        animation: download-loading-rotate 0.8s linear infinite;
    }
}

.download-icon-img {
    display: inline-block;
    width: 16px;
    height: 16px;
    object-fit: contain;
    vertical-align: middle;
}

@keyframes download-loading-rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.report-preview {
    padding: 18px;
    border-radius: 4px;
    background: #f7f8fb;
}

.rich-text-content {
    min-height: 560px;
    padding: 26px 32px;
    background: var(--base-white);
    color: var(--base-grey4);
    font-size: 16px;
    line-height: 1.75;
}

.empty-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--base-grey);
}

.markdown-content {
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
        margin: 16px 0 10px;
        color: var(--base-grey4);
        font-weight: 600;
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

.pad-24 {
    padding: 0 24px;
}

</style>
