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
                        <span class="info-label">拜访目的</span>
                        <MxDict class="info-value" v-model="detailData.visitPurpose" dict-type="拜访目的" :text="true" />
                    </div>
                </div>
            </div>
            <!-- 灰色间隔 -->
            <div class="gray-separator"></div>
            <div class="detail-main">
                <!-- 选项卡 -->
                <div class="detail-tabs-container">
                    <n-tabs v-model:value="activeTab" type="line" animated class="detail-tabs" :bar-width="36">
                        <n-tab v-for="tab in tabList" :key="tab.value" :name="tab.value">
                            {{ tab.label }}
                        </n-tab>
                    </n-tabs>
                </div>
                <!-- 基础信息tab -->
                <div v-if="activeTab === 'basic'" class="tab-content" style="padding: 24px;">
                    <div class="info-section">
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">拜访周期</span>
                                <span class="cell-value">
                                    <MxDict :model-value="detailData.visitCycle" dict-type="关怀周期" :text="true" />
                                </span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">客户星级</span>
                                <span class="cell-value">{{ STAR_LEVEL_MAP[detailData.starLevel] || '--' }}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">计划拜访时间</span>
                                <span class="cell-value">{{ detailData.planTime || '--' }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">拜访人</span>
                                <span class="cell-value" v-if="detailData.executorList">{{ detailData.executorList.map((i: any) => i.username).join('、') || '--' }}</span>
                                <span class="cell-value" v-else>--</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">客户对接人</span>
                                <span class="cell-value" v-if="detailData.contactPersonList">{{ detailData.contactPersonList.map((i: any) => i.label).join('、') || '--' }}</span>
                                <span class="cell-value" v-else>--</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">实际拜访时间</span>
                                <span class="cell-value">{{ detailData.actualTime || '--' }}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">创建时间</span>
                                <span class="cell-value">{{ detailData.createdAt || '--' }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">最新修改时间</span>
                                <span class="cell-value">{{ detailData.updatedAt || '--' }}</span>
                            </div>
                        </div>
                    </div>
                    <!-- 拜访目的 -->
                    <div class="info-block">
                        <div class="block-label">拜访目的</div>
                        <div class="block-value">
                            <MxDict :model-value="detailData.visitPurpose" dict-type="拜访目的" :text="true" />
                        </div>
                    </div>
                    <!-- 客户工作规律 -->
                    <div class="info-block">
                        <div class="block-label">客户工作规律</div>
                        <pre class="block-value pre-wrap">{{ detailData.customerWorkPattern || '--' }}</pre>
                    </div>
                    <!-- 拜访要求 -->
                    <div class="info-block">
                        <div class="block-label">拜访要求</div>
                        <pre class="block-value pre-wrap">{{ detailData.visitRequirements || '--' }}</pre>
                    </div>
                    <!-- 沟通内容 -->
                    <div class="info-block">
                        <div class="block-label">沟通内容</div>
                        <div class="block-value block-bg">
                            <MxEditorPreview :modelValue="detailData.content || ''" maxHeight="200px" />
                        </div>
                    </div>
                    <!-- 客户库存/开工率记录 -->
                    <div class="info-block">
                        <div class="block-label">客户库存/开工率记录</div>
                        <pre class="block-value pre-wrap">{{ detailData.customerInventoryRate || '--' }}</pre>
                    </div>
                    <!-- 拜访附件 -->
                    <div class="info-block">
                        <div class="block-label">拜访附件</div>
                        <div class="block-value">
                            <MxWebFileUpload v-if="detailData.attachments && detailData.attachments.length" :only-show="true" :model-value="detailData.attachments" />
                            <span v-if="!detailData.attachments || !detailData.attachments.length">--</span>
                        </div>
                    </div>
                    <!-- 拜访反馈 -->
                    <div class="info-block">
                        <div class="block-label">拜访反馈</div>
                        <pre class="block-value pre-wrap">{{ detailData.feedback || '--' }}</pre>
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
                        <pre class="block-value">{{ detailData.plusServicesDetail || '--' }}</pre>
                    </div>
                    <!-- 执行情况 -->
                    <div class="info-block">
                        <div class="block-label">执行情况</div>
                        <pre class="block-value pre-wrap">{{ detailData.plusServicesExecution || '--' }}</pre>
                    </div>
                    <!-- 取消原因（仅已取消状态展示） -->
                    <div class="info-block" v-if="detailData.status === 'CANCELLED'">
                        <div class="block-label">取消原因</div>
                        <pre class="block-value pre-wrap">{{ detailData.cancelReason || '--' }}</pre>
                    </div>
                </div>
                <!-- 待办事项tab -->
                <div v-else-if="activeTab === 'todo'" class="tab-content">
                    <div class="table-wrapper">
                        <MxWebDataTable v-bind="tableConfig" />
                    </div>
                </div>
            </div>
        </div>
    </n-spin>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, h, resolveComponent } from 'vue';
import { NTabs, NTab, NSpin } from 'naive-ui';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import MxWebDataTable from '@/components/MxWebDataTable/index.vue';
import { getVisitPlanApi, completeTodoApi } from '@/api/customerManage';
import { STAR_LEVEL_MAP, STATUS_MAP } from '@/config/customer';
import { checkPermission } from '@/utils/comm';

const props = defineProps<{
    recordId: number | string | null;
}>();

const detailLoading = ref(false);
const detailData = ref<any>({});
const activeTab = ref('basic');

// 待办状态映射
const todoStatusMap: Record<string, string> = {
    TODO: '未完成',
    DONE: '已完成',
    DELAYED: '延期',
};

const tabList = [
    { label: '基础信息', value: 'basic' },
    { label: '待办事项', value: 'todo' },
];

// 表格配置
const tableConfig = reactive({
    columns: [
        { title: '待办事项', key: 'todoContent', width: 150, render: (row: any) => row.todoContent || '--' },
        {
            title: '状态',
            key: 'status',
            width: 100,
            render: (row: any) => todoStatusMap[row.status] || row.status || '--',
        },
        { title: '负责人', key: 'principalList', width: 150, render: (row: any) => row.principalList.map((i: any) => i.username).join('、') || '--' },
        { title: '截止时间', key: 'dueTime', width: 180, render: (row: any) => row.dueTime || '--' },
        { title: '完成时间', key: 'completeTime', width: 180, render: (row: any) => row.completeTime || '--' },
        {
            title: '附件',
            key: 'attachmentUrls',
            width: 220,
            render: (row: any) => {
                const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                const attachments = row.attachmentUrls || [];
                if (!attachments || attachments.length === 0) return '--';
                return h(MxWebFileUpload, {
                    onlyShow: true,
                    forceAppSize: true,
                    appSizeWidth: 80,
                    modelValue: attachments,
                    'onUpdate:modelValue': (val: any) => {
                        row.attachmentUrls = val;
                    },
                });
            },
        },
        { title: '备注', key: 'remark', width: 180, render: (row: any) => h('pre', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', lineHeight: '1.6' } }, row.remark || '--') },
    ],
    tableBtns: [
        {
            btnName: '完成',
            isBtnHide: (row: any) => row.status !== 'DONE' && checkPermission(["crm:visit_plan:complete"]),
            btnColor: 'var(--web-success-tag-c)',
            clickTableBtns: async (row: any) => {
                await completeTodoApi(row.id);
                loadDetail(Number(props.recordId));
            },
        },
        {
            btnName: '--',
            isBtnHide: (row: any) => row.status === 'DONE',
            clickTableBtns: () => { },
        }
    ],
    tableList: [],
    isShowPagination: false,
    bordered: true,
    bottomBordered: true,
    singleLine: false,
    flexHeight: false,
});

// 加载详情数据
const loadDetail = async (id: number | string) => {
    detailLoading.value = true;
    try {
        const res: any = await getVisitPlanApi(Number(id));
        if (res?.data) {
            const d = res.data;

            // 解析附件
            let attachments: any[] = [];
            if (d.attachmentUrls) {
                if (typeof d.attachmentUrls === 'string') {
                    try {
                        attachments = JSON.parse(d.attachmentUrls);
                    } catch (e) {
                        console.warn('attachmentUrls 解析失败', e);
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

            // 解析待办事项
            const rawTodoList: any[] = Array.isArray(d.todoList) ? d.todoList : [];
            const parsedTodoList = rawTodoList.map((item: any) => ({
                ...item,
                // 逗号分隔字符串 -> 数组（用于显示）
                principalNames: item.principalNames ? String(item.principalNames).split(',').filter(Boolean).join('、') : '--',
                // 解析附件
                attachmentUrls: (() => {
                    if (!item.attachmentUrls) return [];
                    if (typeof item.attachmentUrls === 'string') {
                        try {
                            return JSON.parse(item.attachmentUrls);
                        } catch (e) {
                            return [];
                        }
                    }
                    return Array.isArray(item.attachmentUrls) ? item.attachmentUrls : [];
                })(),
            }));

            detailData.value = {
                ...d,
                attachments,
                plusServices,
            };
            tableConfig.tableList = parsedTodoList;
        }
    } catch (error) {
        console.error('加载拜访计划详情失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

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
            // padding: 24px;

            .table-wrapper {
                min-width: 100%;
            }
        }
    }

    .info-section {
        margin-bottom: 16px;

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
                    min-width: 120px;
                    text-align: right;
                }

                .cell-value {
                    color: #333;
                    font-size: 14px;
                    max-width: 300px;
                }
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
            min-width: 136px;
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
            background: #f5f6fa;
            padding: 12px;
            border-radius: 6px;

            .content-text {
                background-color: #fff;
                padding: 12px;
                border-radius: 4px;
                line-height: 1.6;
            }
        }
    }


}
</style>
