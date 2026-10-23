<template>
    <AppPage :title="pageTitle" :show-search="false" :show-list="false" :no-padding="true">
        <template #content>
            <template v-if="typeRef == 'detail'">
                <!-- 顶部基础信息 -->
                <div class="detail-header">
                    <div class="title-row">
                        <AppTag class="status-tag" :text="detailData.statusName || ' --'" :type="statusTagType" />
                        <span class="title">{{ detailData.title || ' --' }}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-item">作者&nbsp;&nbsp;<span style="color: #333">{{ detailData.authorName || ' --' }}</span></span>
                        <span class="meta-item">创建时间&nbsp;&nbsp;<span style="color: #333">{{ detailData.createdAt || ' --' }}</span></span>
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
                                    <span class="value">{{ detailData.fileType || ' --' }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">文件大小</span>
                                    <span class="value">{{ detailData.fileSize || ' --' }}</span>
                                </div>
                                <div class="info-row column">
                                    <span class="label">备注</span>
                                    <div class="value remark">{{ detailData.remark || ' --' }}</div>
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

                    <!-- 推送记录 -->
                    <van-tab title="推送记录" name="push" :title-style="{ fontSize: '16px' }">
                        <div class="tab-panel">
                            <div class="section-title">推送记录</div>
                            <template v-for="(item, index) in pushRecordList" :key="item.id">
                                <div class="push-item">
                                    <div class="head">
                                        <div class="title">序号{{ numberToChinese(index + 1) }}</div>
                                        <AppTag :text="item.statusName || ' --'" :type="getPushTagType(item.status)" />
                                    </div>
                                    <div class="row">
                                        <div class="label">推送对象</div>
                                        <div class="value">
                                            {{item.pushChatList?.map((item) => item.name).join('、') || '--'}}
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="label">推送时间</div>
                                        <div class="value">{{ item.pushTime || '--' }}</div>
                                    </div>
                                    <div class="row">
                                        <div class="label">失败原因</div>
                                        <div class="value">{{ item.failReason || '--' }}</div>
                                    </div>
                                </div>
                            </template>
                            <empty v-if="pushRecordList.length == 0" />
                        </div>
                    </van-tab>
                </van-tabs>
            </template>
            <template v-else>
                <div class="pdf-wrap preview-mode">
                    <PdfPreview v-if="hasPdfFile" :pdfUrl="pdfFileUrl" />
                    <empty v-else />
                </div>
            </template>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Tabs as VanTabs, Tab as VanTab } from 'vant';
import { numberToChinese } from '@/utils/commUtil';
import {
    MARKET_REPORT_STATUS_CONSTANT,
    MARKET_REPORT_PUSH_STATUS_CONSTANT,
} from '@/constants/marketReport';
import { getMarketReportApi } from '@/api';
import { getFileType } from '@/utils/comm';

const route = useRoute();
const fromBannerRef = ref(route.query.fromBanner === '1');
const detailData = ref<any>({});
const statusTagType = computed(() => {
    if (!detailData.value?.status) return '';
    return detailData.value.status === MARKET_REPORT_STATUS_CONSTANT.DRAFT ? 'warning' : 'success';
});
// PDF 预览相关计算属性
const hasPdfFile = computed(() => {
    const fileInfo = detailData.value?.fileInfo;
    return fileInfo && fileInfo?.url && fileInfo.url !== '#';
});
const pdfFileUrl = computed(() => {
    return detailData.value?.fileInfo?.url || '';
});

// 当前 Tab
const activeTab = ref<'base' | 'content' | 'push'>('base');

const bytesToMB = (size: number) => {
    // 处理非数字、空值、负数
    if (isNaN(size) || size < 0) {
        return '--';
    }

    // 1MB = 1024 * 1024 字节（标准存储换算）
    const mb = size / (1024 * 1024);

    // 保留两位小数并返回字符串
    return mb.toFixed(2) + 'MB';
};
const pushTagTypeMap: Record<string, string> = {
    [MARKET_REPORT_PUSH_STATUS_CONSTANT.PENDING]: 'primary',
    [MARKET_REPORT_PUSH_STATUS_CONSTANT.SUCCESS]: 'success',
    [MARKET_REPORT_PUSH_STATUS_CONSTANT.FAILED]: 'error',
    [MARKET_REPORT_PUSH_STATUS_CONSTANT.NOT]: 'info',
};
const getPushTagType = (status: string) => pushTagTypeMap[status] || 'info';
// 推送记录列表
const pushRecordList = ref<any[]>([]);
const typeRef = ref('detail'); // 编辑模式判断
const pageTitle = computed(() => {
    if (fromBannerRef.value && typeRef.value === 'preview' && detailData.value?.title) {
        return detailData.value.title;
    }
    return typeRef.value === 'detail' ? '市场报告详情' : '预览市场报告';
});
const getDetail = async (type: 'detail' | 'preview', id?: any) => {
    console.log('id', id);
    typeRef.value = type;
    try {
        const res = await getMarketReportApi(id);
        if (!res?.data) return;
        detailData.value = res.data;
        detailData.value.fileType = '--';
        detailData.value.fileSize = '--';
        if (detailData.value.fileInfo) {
            detailData.value.fileType = getFileType(detailData.value.fileInfo.type) || '--';
            detailData.value.fileSize = bytesToMB(detailData.value.fileInfo.size);
        }
        pushRecordList.value = detailData.value.pushLogList;
        console.log('detailData', detailData.value);
    } catch (error) {
        console.log(error, '1');
    }
};
getDetail(route.query.type, route.query.id);
</script>

<style scoped lang="less">
:deep(.van-tabs__content){
    margin: 12px;
    margin-top: 4px;
}
.detail-header {
    padding: 16px;
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
            color: #333;
            line-height: 1.5;
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
        // color: #2272ff;
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
        font-size: 16px;
        font-weight: 500;
        color: #303133;
    }
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
            width: 70px;
            flex-shrink: 0;
        }

        .value {
            color: #303133;
            flex: 1;

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

    &.preview-mode {
        margin-top: 10px;
    }

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
        // vertical-align: top;
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
