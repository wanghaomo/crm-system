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
                        <span class="info-label">来访类型</span>
                        <span class="info-value">{{ visitTypeMap[detailData.visitType] || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">客户星级</span>
                        <span class="info-value">{{ STAR_LEVEL_MAP[detailData.starLevel] || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">来访时间</span>
                        <span class="info-value">{{ detailData.actualTime || '--' }}</span>
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
                                <span class="cell-label">来访人员</span>
                                <span class="cell-value">{{ detailData.visitors || '--' }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">接待规格</span>
                                <div class="cell-value">
                                    <MxDict v-model="detailData.receptionSpec" dict-type="接待规格" :text="true" />
                                </div>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">接待人</span>
                                <span class="cell-value" v-if="detailData.executorList && Array.isArray(detailData.executorList)">{{detailData.executorList.map((i: any) => i.username).join('、') || '--'}}</span>
                                <span class="cell-value" v-else>--</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">接待地点</span>
                                <MxDict placeholder="请选择" dictType="接待地点" v-model="detailData.receptionLocation" text></MxDict>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-cell">
                                <span class="cell-label">创建时间</span>
                                <span class="cell-value">{{ detailData.createdAt || '--' }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="cell-label">最新修改时间</span>
                                <span class="cell-value">{{ detailData.updateTime || '--' }}</span>
                            </div>
                        </div>
                    </div>
                    <!-- 取消原因（仅已取消状态展示） -->
                    <div class="info-block" v-if="detailData.status === 'CANCELLED'">
                        <div class="block-label">取消原因</div>
                        <pre class="block-value pre-wrap">{{ detailData.cancelReason || '--' }}</pre>
                    </div>
                    <!-- 客户需求记录 -->
                    <div class="info-block">
                        <div class="block-label">客户需求记录</div>
                        <pre class="block-value pre-wrap">{{ detailData.customerDemand || '--' }}</pre>
                    </div>
                    <!-- 沟通内容（富文本） -->
                    <div class="info-block">
                        <div class="block-label">沟通内容</div>
                        <div class="block-value block-bg">
                            <MxEditorPreview :modelValue="detailData.content || ''" maxHeight="220px" />
                        </div>
                    </div>
                    <!-- 接待附件 -->
                    <div class="info-block">
                        <div class="block-label">接待附件</div>
                        <div class="block-value">
                            <MxWebFileUpload v-if="detailData.attachmentList && detailData.attachmentList.length" :only-show="true" :model-value="detailData.attachmentList" />
                            <span v-else>--</span>
                        </div>
                    </div>
                    <!-- 评价反馈 -->
                    <div class="info-block">
                        <div class="block-label">评价反馈</div>
                        <pre class="block-value pre-wrap">{{ detailData.feedback || '--' }}</pre>
                    </div>
                    <!-- 增值服务 -->
                    <div class="info-block">
                        <div class="block-label">增值服务</div>
                        <div class="block-value" v-if="detailData.plusServicesList && Array.isArray(detailData.plusServicesList)">{{ detailData.plusServicesList.join('、') }} </div>
                        <div class="block-value" v-else>--</div>
                    </div>
                    <!-- 服务详情 -->
                    <div class="info-block">
                        <div class="block-label">服务详情</div>
                        <pre class="block-value">{{ detailData.plusServicesDetail || '--' }}</pre>
                    </div>
                    <!-- 执行情况 -->
                    <div class="info-block">
                        <div class="block-label">服务执行情况</div>
                        <pre class="block-value pre-wrap">{{ detailData.plusServicesExecution || '--' }}</pre>
                    </div>
                </div>
                <!-- 会议需求tab：仅当需要协助会议时展示 -->
                <div v-else-if="activeTab === 'meeting'" class="tab-content" style="padding: 24px;">
                    <n-descriptions v-if="detailData.meetingRequirement" bordered :column="2" size="small" label-placement="left">
                        <n-descriptions-item label="会议/接待名称">{{ detailData.meetingRequirement.meetingName || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议/接待时间">{{ detailData.meetingRequirement.meetingTime || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议/接待级别">{{ detailData.meetingRequirement.meetingLevel || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议/接待地区">{{ detailData.meetingRequirement.meetingArea || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议室/接待室地点">{{ detailData.meetingRequirement.meetingRoom1 || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议室/接待室地点 2">{{ detailData.meetingRequirement.meetingRoom2 || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议室/接待室地点 3">{{ detailData.meetingRequirement.meetingRoom3 || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="参会人桌牌">{{ (detailData.meetingRequirement.nameplates || []).join('、') || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="电脑/会议屏">{{ detailData.meetingRequirement.screen || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="投影仪">{{ detailData.meetingRequirement.projector || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="翻页笔">{{ detailData.meetingRequirement.clicker || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="麦克风">{{ detailData.meetingRequirement.microphone || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议茶水">{{ detailData.meetingRequirement.tea || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="茶歇">{{ detailData.meetingRequirement.teaBreak || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="接待午餐">{{ detailData.meetingRequirement.lunch || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="接待晚餐">{{ detailData.meetingRequirement.dinner || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="住房预定">{{ detailData.meetingRequirement.hotel || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="接机服务">{{ detailData.meetingRequirement.pickUp || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="送机服务">{{ detailData.meetingRequirement.dropOff || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="行程订票服务">{{ detailData.meetingRequirement.ticketBooking || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="是否需要会外服务">{{ detailData.meetingRequirement.outService || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="宣传片/欢迎词">{{ (detailData.meetingRequirement.promoVideo || []).join('、') || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议纪要">{{ detailData.meetingRequirement.minutes || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议/接待资料">{{ detailData.meetingRequirement.materials || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议/接待通知">{{ detailData.meetingRequirement.notice || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="会议议程/接待流程">{{ detailData.meetingRequirement.agenda || '--' }}</n-descriptions-item>
                        <n-descriptions-item label="其他备注（需写明）" :span="2">{{ detailData.meetingRequirement.remark || '--' }}</n-descriptions-item>
                    </n-descriptions>
                    <div v-else>--</div>
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
import { ref, computed, onMounted, reactive, h, resolveComponent } from 'vue';
import { NTabs, NTab, NSpin, NDescriptions, NDescriptionsItem } from 'naive-ui';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import { getVisitRecordApi, completeTodoApi } from '@/api/customerManage';
import { STATUS_MAP, STAR_LEVEL_MAP } from '@/config/customer';
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
            key: 'attachmentList',
            width: 220,
            render: (row: any) => {
                if (!row.attachmentList || row.attachmentList.length === 0) return '--';
                const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                return h(MxWebFileUpload, {
                    onlyShow: true,
                    forceAppSize: true,
                    appSizeWidth:80,
                    modelValue: row.attachmentList,
                    'onUpdate:modelValue': (val: any) => {
                        row.attachmentList = val;
                    },
                });
            },
        },
        { title: '备注', key: 'remarks', width: 180, render: (row: any) => h('pre', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', lineHeight: '1.6' } }, row.remarks || '--') },
    ],
    tableBtns: [
        {
            btnName: '完成',
            isBtnHide: (row: any) => row.status !== 'DONE' && checkPermission(["crm:visit_record:complete"]), // 未完成
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
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});


const visitTypeMap: Record<string, string> = {
    APPOINTMENT: '提前预约',
    TEMPORARY: '临时通知',
};


const tabList = computed(() => {
    const list = [
        { label: '基础信息', value: 'basic' },
        { label: '待办事项', value: 'todo' },
    ];
    // 仅当需要协助会议时，展示会议需求页签
    if (detailData.value?.needMeetingAssist === 'YES') {
        list.push({ label: '会议需求', value: 'meeting' });
    }
    return list;
});

// 加载详情数据
const loadDetail = async (id: number | string) => {
    detailLoading.value = true;
    try {
        const res: any = await getVisitRecordApi(Number(id));
        if (res?.data) {
            const d = res.data;
            detailData.value = {
                ...d
            };
            // 解析待办事项
            const rawTodoList: any[] = Array.isArray(d.todoList) ? d.todoList : [];
            tableConfig.tableList = rawTodoList.map((item: any) => ({
                ...item,
            }));
        }
    } catch (error) {
        console.error('加载来访记录详情失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

onMounted(() => {
    if (props.recordId) {
        loadDetail(Number(props.recordId));
    } else {
        window.$message.warning('ID为空');
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
                // 移除padding对表格宽度的影响，让横向滚动正常工作
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
                    min-width: 90px;
                    text-align: right;
                }

                .cell-value {
                    display: inline-block;
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
            min-width: 90px;
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
