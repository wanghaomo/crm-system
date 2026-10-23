<template>
    <WebPage contentPadding="0" hideAddBtn>
        <template #content>
            <n-spin :show="showLoading" description="评估中...">
                <div class="evaluation-container">
                    <!-- 搜索栏 -->
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch" @reset="handleSearchBarReset">
                        <template #extra>
                            <div class="score-range-item">
                                <span class="score-label">评估得分</span>
                                <n-input v-model:value="searchForm.scoreMin" placeholder="" clearable class="score-input" @keypress="handleNumberInput" />
                                <span class="score-separator">-</span>
                                <n-input v-model:value="searchForm.scoreMax" placeholder="" clearable class="score-input" @keypress="handleNumberInput" />
                            </div>
                        </template>
                    </MxWebSearchBar>
                    <template v-if="customerEvaluations.length > 0">
                        <!-- 客户评估列表 - 宫格布局 -->
                        <div class="evaluation-grid">
                            <div class="evaluation-card" v-for="item in ([...customerEvaluations])" :key="item.id">
                                <div class="card-header">
                                    <div class="header-left">
                                        <div class="company-name">{{ item.customerName }}</div>
                                        <div class="level-info">
                                            <span class="level">{{ item.evaluationLevelName }}客户</span>
                                            <span class="execution-rate">
                                                服务执行次数 {{ item.serviceRuleTimes }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="header-right">
                                        <span class="score-value">{{ item.evaluationScore }}</span>
                                        <span class="total-score-label">综合评估得分</span>
                                    </div>
                                </div>
                                <div class="score-details">
                                    <div class="evaluation-time">{{ formatTime(item.evaluationTime) }}评估</div>
                                    <div class="score-list">
                                        <div class="score-item" v-for="(score, index) in item.evaluationDetailList" :key="index">
                                            <span class="score-name">{{ score.indicatorName }}得分</span>
                                            <span class="score-value">{{ score.calcScore }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="last-evaluation">上次评估时间 {{ formatTime(item.previousEvaluationTime) }}</div>
                                <div class="card-footer">
                                    <div class="value-added-records">增值服务记录数 <span class="record-count">{{ item.plusServiceTimes }}</span></div>
                                    <div class="actions">
                                        <button v-if='checkPermission(["crm:customer_evaluation:reassess"])' class="btn-reassess" @click="handleReassess(item)">重 估</button>
                                        <button class="btn-details" @click="openDetail(item)">详 情</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
                            <img src="@/assets/images/empty.png" alt="暂无数据">
                            <!-- <div>暂无数据</div> -->
                        </div>
                    </template>

                    <!-- 分页组件 -->
                    <div class="pagination-wrapper" v-if="pagination.itemCount > 0">
                        <n-pagination v-model:page="pagination.page" v-model:page-size="pagination.pageSize" :item-count="pagination.itemCount" :page-sizes="pagination.pageSizes" :show-size-picker="pagination.showSizePicker" :prefix="pagination.prefix" @update:page="handlePageChange"
                            @update:page-size="handlePageSizeChange" />
                    </div>
                </div>
            </n-spin>
            <!-- 评估详情抽屉 -->
            <MxDrawer v-model:show="detailPopShow" title="评估详情" size="large" :closablePop="false">
                <EvaluationDetail :detailData="currentDetail" :loading="detailLoading" @record-detail="openRecordDetail" />
            </MxDrawer>
            <MxDrawer v-model:show="recordDetailShow" title="评估记录详情" size="large" :closablePop="false">
                <RecordDetail :detailData="recordDetailData" :loading="recordDetailLoading" />
            </MxDrawer>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { NInput, NPagination, NSpin } from 'naive-ui';
import EvaluationDetail from './detail/detail.vue';
import RecordDetail from './detail/recordDetail.vue';
import MxWebSearchBar from '@/components/MxWebSearchBar/index.vue';
import { checkPermission } from '@/utils/comm';
import {
    showLoading,
    searchForm,
    customerEvaluations,
    pagination,
    detailPopShow,
    currentDetail,
    detailLoading,
    recordDetailShow,
    recordDetailData,
    recordDetailLoading,
    queryConfiguration,
    handleSearch,
    handleSearchBarReset,
    handlePageChange,
    handlePageSizeChange,
    handleReassess,
    openDetail,
    openRecordDetail,
    init,
} from './index';
import dayjs from 'dayjs';


// 格式化时间
const formatTime = (time: string) => {
    if (!time) return '--';
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

// 限制只能输入数字
const handleNumberInput = (e: KeyboardEvent) => {
    const char = e.key;
    if (!/\d/.test(char)) {
        e.preventDefault();
    }
};

// 初始化
init();
</script>

<style scoped lang="less">
:deep(.n-spin-content) {
    height: 100%;
}

:deep(.n-spin-container) {
    height: 100%;
}


.evaluation-container {
    height: 100%;
    display: flex;
    flex-direction: column;



    // /* 宫格布局 */
    .evaluation-grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        align-items: stretch;
        align-content: start;
        gap: 12px;
        padding: 16px;
        padding-bottom: 0;
        overflow-y: auto;
        &::-webkit-scrollbar {
            width: 0;
            height: 0;
        }

        /* 卡片样式 */
        .evaluation-card {
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            min-width: 280px;
            // height: fit-content;
            background-color: #fff;
            border: 1px solid #e7ebf2;
            border-radius: 6px;
            padding: 10px 12px 9px;
            box-shadow: 0 2px 8px rgba(20, 35, 60, 0.06);
            transition: all 0.3s ease;

            /* 卡片头部 */
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 7px;

                .header-left {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    gap: 5px;

                    .company-name {
                        overflow: hidden;
                        font-size: 14px;
                        line-height: 20px;
                        font-weight: 600;
                        color: #343a45;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .level-info {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        flex-wrap: wrap;

                        .level {
                            height: 18px;
                            padding: 0 5px;
                            border: 1px solid #bcd3ff;
                            border-radius: 3px;
                            background-color: #edf4ff;
                            color: #2c65f2;
                            font-size: 12px;
                            line-height: 16px;
                        }

                        .execution-rate {
                            height: 18px;
                            padding: 0 5px;
                            border: 1px solid #d5efdc;
                            border-radius: 3px;
                            background-color: #eef9f0;
                            font-size: 12px;
                            line-height: 16px;
                            color: #4aa764;

                            &.warning {
                                border-color: #f4eadc;
                                background-color: #fff7e0;
                                color: #fcbd12;
                            }
                        }
                    }
                }

                .header-right {
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    align-items: flex-end;
                    gap: 7px;

                    .score-value {
                        font-size: 16px;
                        font-weight: 700;
                        line-height: 20px;
                        color: #3a3f47;
                    }

                    .total-score-label {
                        font-size: 12px;
                        line-height: 18px;
                        color: #a4a9b2;
                    }
                }
            }

            /* 得分详情 */
            .score-details {
                min-height: 76px;
                margin-bottom: 8px;
                border-radius: 2px;
                background-color: #F7F7F7;

                .evaluation-time {
                    display: inline-block;
                    max-width: 100%;
                    margin: 0 0 4px 0px;
                    padding: 2px 6px;
                    overflow: hidden;
                    border-radius: 2px;
                    background-color: #e8e8e8;
                    color: #9aa0a8;
                    font-size: 12px;
                    // line-height: 18px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .score-list {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    grid-auto-rows: minmax(20px, auto);
                    align-content: start;
                    column-gap: 24px;
                    row-gap: 8px;
                    margin-bottom: 8px;
                    min-height: 43px;
                    padding: 0 16px;

                    .score-item {
                        display: flex;
                        align-items: center;
                        min-width: 0;
                        gap: 10px;
                        font-size: 12px;
                        line-height: 20px;

                        .score-name {
                            flex-shrink: 0;
                            min-width: 78px;
                            color: #9298a1;
                        }

                        .score-value {
                            overflow: hidden;
                            font-weight: 500;
                            color: #4a4f57;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                    }
                }
            }

            /* 上次评估时间 */
            .last-evaluation {
                margin-bottom: 10px;
                font-size: 12px;
                line-height: 18px;
                color: #a5abb4;
                text-align: right;
            }

            /* 卡片底部 */
            .card-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: auto;

                .value-added-records {
                    font-size: 12px;
                    line-height: 26px;
                    color: #8f96a1;

                    .record-count {
                        font-weight: 600;
                        color: #5f6670;
                    }
                }

                .actions {
                    display: flex;
                    gap: 8px;

                    .btn-reassess,
                    .btn-details {
                        width: 48px;
                        height: 26px;
                        padding: 0;
                        border: 1px solid #d9d9d9;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                        line-height: 24px;
                        transition: all 0.3s ease;
                    }

                    .btn-reassess {
                        border-color: #2c65f2;
                        background-color: #fff;
                        color: #2c65f2;
                    }

                    .btn-reassess:hover {
                        background-color: #edf4ff;
                    }

                    .btn-details {
                        border-color: #2c65f2;
                        background-color: #2c65f2;
                        color: #fff;
                    }

                    .btn-details:hover {
                        background-color: #1f55d6;
                    }
                }
            }
        }

        .evaluation-card:hover {
            box-shadow: 0  2px 10px 8px rgba(20, 35, 60, 0.1);
        }
    }

    // 分页
    .pagination-wrapper {
        margin-top: 20px;
        display: flex;
        justify-content: center;
        padding-bottom: 12px;
    }
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
    .evaluation-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media screen and (max-width: 768px) {
    .evaluation-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<!-- 插槽内容样式（通过 MxWebSearchBar extra 插槽传入，需使用非 scoped 样式以确保跨组件渲染生效） -->
<style lang="less">
.score-range-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 280px;
    height: 32px;
    margin-top: 1px;

    .score-label {
        font-size: 14px;
        color: #666;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .score-input {
        flex: 1;
        min-width: 60px;
        height: 32px;
    }

    .score-separator {
        color: #999;
        font-size: 14px;
    }
}
</style>
