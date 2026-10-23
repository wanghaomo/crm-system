<template>
    <n-spin :show="detailLoading" description="加载中...">
        <div class="detail-content">
            <!-- 顶部客户信息 -->
            <div class="detail-header">
                <div class="detail-header-top">
                    <span class="detail-company-name">{{ detailData.customerName || '--' }}</span>
                    <StatusTag :text="STATUS_MAP[detailData.status]?.text" :color="STATUS_MAP[detailData.status]?.color" :bgColor="STATUS_MAP[detailData.status]?.bgColor" :borderColor='STATUS_MAP[detailData.status]?.bdColor' />
                </div>
                <div class="detail-header-info">
                    <div class="info-item">
                        <span class="info-label">关怀类型</span>
                        <MxDict class="info-value" v-model="detailData.careType" dict-type="关怀类型" :text="true" />
                    </div>
                    <div class="info-item">
                        <span class="info-label">客户星级</span>
                        <span class="info-value">{{ STAR_LEVEL_MAP[detailData.starLevel] || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">计划关怀时间</span>
                        <span class="info-value">{{ detailData.planTime || '--' }}</span>
                    </div>
                </div>
            </div>
            <!-- 灰色间隔 -->
            <div class="gray-separator"></div>
            <!-- 基础信息区域 -->
            <div class="detail-body">
                <div class="section-title">
                    <span class="title-line"></span>
                    <span class="title-text">基础信息</span>
                </div>
                <div class="info-section">
                    <div class="info-row">
                        <div class="info-cell">
                            <span class="cell-label">执行方式</span>
                            <span class="cell-value">
                                <MxDict :model-value="detailData.careMethod" dict-type="执行方式" :text="true" />
                            </span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-cell">
                            <span class="cell-label">执行人</span>
                            <span class="cell-value" v-if="detailData.executorList">{{detailData.executorList.map((i: any) => i.username).join('、')}}</span>
                            <span class="cell-value" v-else>--</span>
                        </div>
                        <div class="info-cell">
                            <span class="cell-label" style="width: 112px;">实际关怀时间</span>
                            <span class="cell-value">{{ detailData.actualTime || '--' }}</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-cell">
                            <span class="cell-label">创建时间</span>
                            <span class="cell-value">{{ detailData.createdAt || '--' }}</span>
                        </div>
                        <div class="info-cell">
                            <span class="cell-label" style="width: 112px;">最新修改时间</span>
                            <span class="cell-value">{{ detailData.updatedAt || '--' }}</span>
                        </div>
                    </div>
                </div>
                <div class="info-block">
                    <span class="block-label">关怀内容</span>
                    <div class="block-value block-bg">
                        <MxEditorPreview v-if="detailData.content" :modelValue="detailData.content" maxHeight="220px" />
                        <span v-else>--</span>
                    </div>
                </div>
                <!-- 关怀附件 -->
                <div class="info-block">
                    <div class="block-label">关怀附件</div>
                    <div class="block-value">
                        <MxWebFileUpload
                            v-if="detailData.attachments && detailData.attachments.length"
                            :only-show="true"
                            :model-value="detailData.attachments" />
                        <span v-else>--</span>
                    </div>
                </div>
                <!-- 客户反馈 -->
                <div class="info-block">
                    <div class="block-label">客户反馈</div>
                    <pre class="block-value pre-wrap">{{ detailData.feedback || '--' }}</pre>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">关怀效果评价</span>
                        <span class="cell-value">{{ detailData.careEffectEvaluation || '--' }}</span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label" style="width: 112px;">下次关怀建议时间</span>
                        <span class="cell-value">{{ detailData.nextCareSuggestTime || '--' }}</span>
                    </div>
                </div>
                <!-- 增值服务 -->
                <div class="info-block">
                    <div class="block-label">增值服务</div>
                    <div class="block-value">
                        {{ Array.isArray(detailData.plusServicesList) && detailData.plusServicesList.length ? detailData.plusServicesList.join('、') : '--' }}
                    </div>
                </div>
                <!-- 服务详情 -->
                <div class="info-block">
                    <div class="block-label">服务详情</div>
                    <pre class="block-value pre-wrap">{{ detailData.plusServicesDetail || '--' }}</pre>
                </div>
                <!-- 执行情况 -->
                <div class="info-block">
                    <div class="block-label">执行情况</div>
                    <pre class="block-value pre-wrap">{{ detailData.plusServicesExecution || '--' }}</pre>
                </div>
                <!-- 取消原因（仅已取消状态显示） -->
                <div class="info-block" v-if="detailData.status === 'CANCELLED'">
                    <div class="block-label">取消原因</div>
                    <pre class="block-value pre-wrap">{{ detailData.cancelReason || '--' }}</pre>
                </div>
            </div>
        </div>
    </n-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NSpin } from 'naive-ui';
import { getCustomerCareApi } from '@/api/customerManage';
import { STAR_LEVEL_MAP, STATUS_MAP } from '@/config/customer';

import MxEditorPreview from '@/components/MxEditor/preview.vue';
const props = defineProps<{
    recordId: number | string | null;
}>();

const detailLoading = ref(false);
const detailData = ref<any>({});

// 加载详情数据
const loadDetail = async (id: number | string) => {
    detailLoading.value = true;
    try {
        const res: any = await getCustomerCareApi(Number(id));
        if (res?.data) {
            const d = res.data;

            // 解析附件
            let attachments: any[] = [];
            if (d.attachmentUrls) {
                if (typeof d.attachmentUrls === 'string') {
                    try {
                        attachments = JSON.parse(d.attachmentUrls);
                    } catch (e) {
                        attachments = [];
                    }
                } else if (Array.isArray(d.attachmentUrls)) {
                    attachments = d.attachmentUrls;
                }
            }

            // 解析增值服务
            let plusServices: any[] = [];
            if (d.plusServices) {
                if (typeof d.plusServices === 'string') {
                    plusServices = d.plusServices.split(',').filter(Boolean);
                } else if (Array.isArray(d.plusServices)) {
                    plusServices = d.plusServices;
                }
            }

            detailData.value = {
                ...d,
                attachments,
                plusServices,
            };

            console.log('CustomerCareDetail - 详情数据:', detailData.value);
        }
    } catch (error) {
        console.error('加载关怀记录详情失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

// 组件挂载时加载数据
onMounted(() => {
    if (props.recordId) {
        loadDetail(Number(props.recordId));
    }
});
</script>

<style scoped lang="less">
.detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-header {
        padding: 12px 24px;
        border-bottom: 1px solid #eee;
        flex-shrink: 0;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .detail-company-name {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .status-text {
                font-size: 14px;
                padding: 1px 4px;
                border-radius: 4px;
            }
        }

        .detail-header-info {
            display: flex;
            gap: 40px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .info-label {
                color: #999;

            }

            .info-value {
                color: #333;
            }
        }
    }

    .gray-separator {
        height: 8px;
        background: #f0f0f0;
    }

    .detail-body {
        flex: 1;
        overflow: auto;
        padding: 24px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;

            .title-line {
                width: 4px;
                height: 16px;
                background: var(--base-color);
                border-radius: 2px;
            }

            .title-text {
                font-size: 16px;
                font-weight: 600;
                color: #262626;
            }
        }
    }

    .info-section {
        margin-bottom: 16px;
    }

    .info-row {
        display: flex;
        gap: 40px;
        margin-bottom: 12px;

        &:last-child {
            margin-bottom: 0;
        }

        .info-cell {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            min-width: 500px;

            .cell-label {
                color: #999;
                font-size: 14px;
                width: 84px;
                text-align: right;
            }

            .cell-value {
                color: #333;
                font-size: 14px;
                max-width: 300px;
            }
        }
    }

    .info-block {
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;

        &:last-child {
            margin-bottom: 0;
        }

        .block-label {
            color: #999;
            font-size: 14px;
            width: 84px;
            text-align: right;
            flex-shrink: 0;
        }

        .block-value {
            color: #333;
            font-size: 14px;
            flex: 1;
        }

        .pre-wrap {
            white-space: pre-wrap;
            word-break: break-word;
            margin: 0;
            font-family: inherit;
            line-height: 1.6;
        }

        .block-bg {
            background: #F5F6FA;
            padding: 12px;
            border-radius: 6px;
            width: 100%;
        }
    }


}
</style>
