<template>
    <MxDrawer v-model:show="detailPopShow" :title="drawerTitle" size="large" :closablePop="false">
        <div class="detail-content" v-if="typeRef == 'detail'">
            <!-- 顶部信息 -->
            <div class="detail-header">
                <div class="detail-header-top">
                    <span class="detail-title">{{ detailData.title }}</span>
                    <StatusTag :text="detailData.statusName" :color="currentColor.textColor" :bgColor="currentColor.backgroundColor" :borderColor='currentColor.borderColor' />
                </div>
                <div class="detail-header-info">
                    <div class="info-item">
                        <span class="info-label">作者</span>
                        <span class="info-value">{{ detailData.authorName || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">创建时间</span>
                        <span class="info-value">{{ detailData.createdAt || '--' }}</span>
                    </div>
                </div>
            </div>
            <!-- 灰色间隔 -->
            <div class="gray-separator"></div>
            <!-- Tab 区域 -->
            <div class="detail-main">
                <div class="detail-tabs-container">
                    <n-tabs v-model:value="activeTab" :tab-style="{ color: '#666666', fontSize: '16px' }" type="line" animated class="detail-tabs" :bar-width="36">
                        <n-tab v-for="tab in tabList" :key="tab.value" :name="tab.value">
                            {{ tab.label }}
                        </n-tab>
                    </n-tabs>
                </div>
                <!-- 基础信息 -->
                <div v-show="activeTab === 'basic'" class="tab-content">
                    <div class="section-title"><span class="section-bar"></span>基础信息</div>
                    <div class="basic-info-grid">
                        <div class="basic-info-item">
                            <span class="basic-label">文件类型</span>
                            <span class="basic-value">{{ detailData.fileType || '--' }}</span>
                        </div>
                        <div class="basic-info-item">
                            <span class="basic-label">文件大小</span>
                            <span class="basic-value">{{ detailData.fileSize || '--' }}</span>
                        </div>
                        <div class="basic-info-item full-width">
                            <span class="basic-label">备注</span>
                            <span class="basic-value">{{ detailData.remark || '--' }}</span>
                        </div>
                    </div>
                    <div class="section-title"><span class="section-bar"></span>报告内容</div>
                    <div class="report-content">
                        <iframe v-if="hasPdfFile" :src="pdfFileUrl" frameborder="0"></iframe>
                        <Empty v-else />
                    </div>
                </div>
                <!-- 推送记录 -->
                <div v-show="activeTab === 'push'" class="tab-content">
                    <n-data-table :columns="pushRecordColumns" :data="pushRecordList" :pagination="false" size="small" bordered :single-line="false" />
                </div>
            </div>
        </div>
        <div class="preview-wrapper" v-if="typeRef == 'preview'">
            <iframe v-if="hasPdfFile" :src="pdfFileUrl" frameborder="0"></iframe>
            <Empty v-else />
        </div>
    </MxDrawer>
</template>

<script setup lang="ts">
import { Buffer } from "buffer";
import { ref, computed, h } from 'vue';
import {
    marketReportStatusMap,
    marketReportPushStatusMap,
} from '@/constants/marketReport';
import { getMarketReportApi } from '@/api';
import { NTabs, NTab, NDataTable, NSpace } from 'naive-ui';
import { getFileType } from '@/utils/comm';
const detailData = ref<any>({});
const detailPopShow = ref(false);
const activeTab = ref('basic');
const currentColor = ref({
    textColor: '',
    borderColor: '',
    backgroundColor: '',
});
// PDF 预览相关计算属性
const hasPdfFile = computed(() => {
    const fileInfo = detailData.value?.fileInfo;
    return fileInfo && fileInfo?.url && fileInfo.url !== '#';
});
const pdfFileUrl = computed(() => {
    const rawUrl = detailData.value?.fileInfo?.url || '';
    return (
        `http://14.103.131.214:8012/preview/onlinePreview?url=` +
        encodeURIComponent(Buffer.from(rawUrl).toString("base64"))
    );
});

const tabList = [
    { label: '基础信息', value: 'basic' },
    { label: '推送记录', value: 'push' },
];
// 推送记录表格列
const pushRecordColumns = [
    { title: '序号', key: 'index', width: 60, render: (_row: any, index: number) => index + 1 },
    {
        title: '推送飞书群组或个人名称',
        key: 'pushChatList',
        minWidth: 200,
        render: (row: any) => {
            return row.pushChatList.map((item) => item.name).join('、');
        },
    },
    {
        title: '推送状态',
        key: 'latestPushStatusName',
        width: 100,


        render(row: any) {
            const color = marketReportPushStatusMap[row.status]?.iconColor || 'var(--base-grey)';
            return h(
                NSpace,
                { align: 'center', size: 8 },
                {
                    default: () => [
                        h('div', {
                            style: {
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: color,
                            },
                        }),
                        h('span', null, row.statusName),
                    ],
                }
            );
        },
    },
    { title: '推送时间', key: 'pushTime', width: 170 },
    {
        title: '失败原因',
        key: 'failReason',
        minWidth: 150,
        render: (row: any) => {
            return row.failReason || '--';
        },
    },
];

const bytesToMB = (size) => {
    // 处理非数字、空值、负数
    if (isNaN(size) || size === null || size === undefined || size < 0) {
        return '--';
    }

    // 1MB = 1024 * 1024 字节（标准存储换算）
    const mb = size / (1024 * 1024);

    // 保留两位小数并返回字符串
    return mb.toFixed(2) + 'MB';
};
// 推送记录模拟数据
const pushRecordList = ref<any[]>([]);
const typeRef = ref('detail');
const fromBannerRef = ref(false);
const drawerTitle = computed(() => {
    if (fromBannerRef.value && typeRef.value === 'preview' && detailData.value?.title) {
        return detailData.value.title;
    }
    return typeRef.value === 'detail' ? '市场报告详情' : '市场报告预览';
});
const showDrawer = async (type: 'detail' | 'preview', data?: any) => {
    console.log('DAta', data);
    activeTab.value = 'basic';
    typeRef.value = type;
    fromBannerRef.value = data?.fromBanner || false;
    try {
        const res = await getMarketReportApi(data.id);
        detailData.value = res.data;
        detailData.value.fileType = '--';
        detailData.value.fileSize = '--';
        if (detailData.value.fileInfo) {
            detailData.value.fileType = getFileType(detailData.value.fileInfo.type) || '--';
            detailData.value.fileSize = bytesToMB(detailData.value.fileInfo.size);
        }
        currentColor.value = marketReportStatusMap[detailData.value?.status];
        pushRecordList.value = detailData.value.pushLogList;
        detailPopShow.value = true;
        console.log('detailData', detailData.value);
    } catch (error) {
        console.log(error);
    }
};
defineExpose({
    showDrawer,
});
</script>

<style scoped lang="less">
/* 详情样式 */
.detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-header {
        padding: 12px 24px;
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
                    font-weight: normal;
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
    font-size: 16px;
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
            font-size: 14px;
            min-width: 70px;
            text-align: right;
        }

        .basic-value {
            color: #333;
            font-size: 14px;
        }
    }
}

.report-content {
    min-height: 300px;
    height: 100%;
    display: flex;
    overflow: hidden;
    flex: 1;

    iframe {
        flex: 1;
        width: 100%;
        height: 100%;
        border: 1px solid #eee;
        overflow: hidden;
        &::-webkit-scrollbar {
            display: none;
        }
    }
}

.preview-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    iframe {
        flex: 1;
        width: 100%;
        height: 100%;
        border: none;
        overflow: hidden;
    }
}
</style>