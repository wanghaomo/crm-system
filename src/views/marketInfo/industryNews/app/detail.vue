<template>
    <AppPage :title="pageTitle" :show-search="false" :show-list="false" :no-padding="typeRef == 'detail'">
        <template #content>
            <template v-if="typeRef == 'detail'">
                <!-- 顶部基础信息 -->
                <div class="detail-header">
                    <div class="title-row">
                        <span class="title">{{ detailData.title }}</span>
                        <AppTag class="status-tag" :text="detailData.statusName || '--'" :type="statusType" />
                    </div>
                    <div class="meta-row">
                        <span class="meta-item">发布人&nbsp;&nbsp;<span style="color: #333">{{
                            detailData.publishPersonName || '--'
                                }}</span></span>
                        <span class="meta-item">发布时间&nbsp;&nbsp;<span style="color: #333">{{
                            detailData.publishTime || '--'
                                }}</span></span>
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
                                    <span class="value">{{
                                        getInputTypeLabel(detailData.inputType) || '--'
                                    }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">信息来源</span>
                                    <span class="value">{{
                                        getSourceOptionsLabel(detailData.source) || '--'
                                    }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">目标网址</span>
                                    <span class="value">{{ detailData.targetUrl || '--' }}</span>
                                </div>
                            </div>
                        </div>
                    </van-tab>

                    <!-- 报告内容 -->
                    <van-tab title="正文" name="content" :title-style="{ fontSize: '16px' }">
                        <div class="tab-panel">
                            <div class="section-title" style="margin-bottom: 12px;">正文</div>
                            <div class="sectionContent">
                                <MxEditorPreview :modelValue="detailData.content || '--'" minHeight="150px" />
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
                                        <AppTag :text="industryNewsPushStatusMap[item.status]?.label" :type="getPushType(item.status)" />
                                    </div>
                                    <div class="row">
                                        <div class="label">推送对象</div>
                                        <div class="value">
                                            {{item.pushChatList.map((item) => item.name).join('、') || '--'}}
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
                <div class="preview">
                    <!-- <div class="section-title" v-if="!fromBannerRef"><span class="section-bar"></span>正文</div> -->
                    <div class="sectionContent">
                        <MxEditorPreview :modelValue="detailData.content || '--'" minHeight="150px" />
                    </div>
                </div>
            </template>
        </template>
    </AppPage>
</template>

<script setup lang="ts">

import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Tabs as VanTabs, Tab as VanTab } from 'vant';
import { numberToChinese } from '@/utils/commUtil';
import {
    INDUSTRY_NEWS_STATUS_CONSTANT,
    INDUSTRY_NEWS_PUSH_STATUS_CONSTANT,
    industryNewsPushStatusMap,
    inputTypeOptions,
    sourceOptions,
} from '@/constants/industryNews';
import { getIndustryNewsApi } from '@/api';
import type { MxAppTableColumn } from '@/appComponents/MxAppTable/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import AppTag from '@/appComponents/AppTag/index.vue';

const route = useRoute();
const router = useRouter();
const fromBannerRef = ref(route.query.fromBanner === '1');
const detailData = ref<any>({});

// 当前 Tab
const activeTab = ref<'base' | 'content' | 'push'>('base');

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
const getInputTypeLabel = (type) => {
    let findItem = inputTypeOptions.find((item) => item.value == type);
    return findItem ? findItem.label : type;
};
const getSourceOptionsLabel = (source) => {
    let findItem = sourceOptions.find((item) => item.value == source);
    return findItem ? findItem.label : source;
};
const statusType = computed(() => {
    const statusMap: Record<string, string> = {
        [INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT]: 'warning',
        [INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED]: 'success',
    };
    return statusMap[detailData.value?.status] || 'info';
});
const getPushType = (status) => {
    const pushTypeMap: Record<string, string> = {
        [INDUSTRY_NEWS_PUSH_STATUS_CONSTANT.NOT]: 'info',
        [INDUSTRY_NEWS_PUSH_STATUS_CONSTANT.PENDING]: 'primary',
        [INDUSTRY_NEWS_PUSH_STATUS_CONSTANT.SUCCESS]: 'success',
        [INDUSTRY_NEWS_PUSH_STATUS_CONSTANT.FAILED]: 'error',
    };
    return pushTypeMap[status] || 'info';
};
// 推送记录模拟数据
const pushRecordList = ref<any[]>([]);
const typeRef = ref('detail'); // 编辑模式判断
const pageTitle = computed(() => {
    if (fromBannerRef.value && typeRef.value === 'preview' && detailData.value?.title) {
        return detailData.value.title;
    }
    return typeRef.value === 'detail' ? '行业动态详情' : '预览行业动态';
});
const getDetail = async (type: 'detail' | 'preview', id?: any) => {
    console.log('id', id);
    typeRef.value = type;
    try {
        const res = await getIndustryNewsApi(id);
        detailData.value = res.data;
        pushRecordList.value = detailData.value.pushLogList;
        pushRecordList.value.forEach((item) => {
            item.pushChatList = item.pushChat ? JSON.parse(item.pushChat) : [];
        });
    } catch (error) {
        console.log(error, '1');
    }
};
getDetail(route.query.type, route.query.id);
</script>

<style scoped lang="less">
:deep(.van-tabs__content) {
    margin: 12px;
    margin-top: 4px;
}

:deep(.mx-list-item .card-footer) {
    margin-top: 4px !important;
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
        font-weight: 500;
    }

    :deep(.van-tabs__line) {
        background: #2272ff;
    }
}

.section-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #303133;
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
        margin-bottom: 0;
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

.preview {
    padding: 12px;
    min-height: 100%;
    box-sizing: border-box;
    background: #fff;
    border-radius: 8px;
}
</style>
