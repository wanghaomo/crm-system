<template>
    <div class="tab-basic">
        <div class="detail-section" style="padding-top: 0">
            <div class="section-title">
                <span class="title-line"></span>
                <span class="title-text">基础信息</span>
            </div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">客户经理</span>
                        <span class="cell-value">{{ managerNames || "--" }}</span>
                    </div>
                    <div v-if="detailData.customerType === 'TRADER'" class="info-cell">
                        <span class="cell-label">是否子公司贸易商</span>
                        <span class="cell-value">{{ subsidiaryText }}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">地址</span>
                        <span class="cell-value">{{ detailData.addressRegion || "--" }}</span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label">详细地址</span>
                        <span class="cell-value">{{ detailData.detailAddress || "--" }}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">经度</span>
                        <span class="cell-value">{{ detailData.longitude ?? "--" }}</span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label">纬度</span>
                        <span class="cell-value">{{ detailData.latitude ?? "--" }}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">是否合作客户</span>
                        <span class="cell-value">{{
                            detailData.isCooperationCustomer === "NO" ? "否" : "是"
                        }}</span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label"></span>
                        <span class="cell-value"></span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">合作状态</span>
                        <span class="cell-value">
                            <template v-if="detailData.status === 'STORAGE' && detailData.cooperationStatus">
                                <span>{{ cooperationStatusText }}</span>
                            </template>
                            <span v-else>--</span>
                        </span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label">合作开始时间</span>
                        <span class="cell-value">{{ detailData.cooperationStartDate || "--" }}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">合作年限</span>
                        <span class="cell-value">{{ detailData.cooperationDuration || "--" }}</span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label">最近合作日期</span>
                        <span class="cell-value">{{ detailData.latestCooperationDate || "--" }}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-cell">
                        <span class="cell-label">历史合作总量</span>
                        <span class="cell-value" v-if="detailData.cooperationTotal">{{
                            detailData.cooperationTotal + "万吨"
                        }}</span>
                        <span class="cell-value" v-else>--</span>
                    </div>
                    <div class="info-cell">
                        <span class="cell-label"></span>
                        <span class="cell-value"></span>
                    </div>
                </div>
            </div>
            <div class="info-block" v-if="detailData.customerType === 'CHEMICAL'">
                <div class="block-label">仓储能力(万吨)</div>
                <div class="block-value">{{ detailData.storageCapacity || "--" }}</div>
            </div>
            <div class="info-block">
                <div class="block-label">客户风险信息</div>
                <div class="block-value block-bg">
                    <MxEditorPreview v-if="detailData.riskInfo" :modelValue="detailData.riskInfo" maxHeight="220px" />
                    <span v-else>--</span>
                </div>
            </div>
            <div class="info-block">
                <div class="block-label">合作流程说明</div>
                <div class="block-value block-bg">
                    <MxEditorPreview v-if="detailData.cooperationProcessExplanation" :modelValue="detailData.cooperationProcessExplanation" maxHeight="220px" />
                    <span v-else>--</span>
                </div>
            </div>
            <div class="info-block">
                <div class="block-label">重要合同条件</div>
                <div class="block-value block-bg">
                    <MxEditorPreview v-if="detailData.importantContractCondition" :modelValue="detailData.importantContractCondition" maxHeight="220px" />
                    <span v-else>--</span>
                </div>
            </div>

            <div class="info-block">
                <div class="block-label">备注</div>
                <div class="block-value">{{ detailData.remark || "--" }}</div>
            </div>
        </div>

        <!-- 化工厂/贸易商信息 -->
        <div class="detail-section">
            <div class="section-title">
                <span class="title-line"></span>
                <span class="title-text">{{
                    detailData.customerType === "CHEMICAL" ? "化工厂企业信息" : "贸易商信息"
                }}</span>
            </div>
            <MxWebDataTable :columns="detailFactoryTableConfig.columns" :tableList="detailData.customerType === 'CHEMICAL'
                ? detailData.chemicalList
                : detailData.traderList
                " :isShowPagination="false" :flexHeight="false" :styleOption="{ padding: '0' }" :singleLine="false" bordered />
        </div>

        <!-- 联系人 -->
        <div class="detail-section">
            <div class="section-title">
                <span class="title-line"></span>
                <span class="title-text">联系人</span>
            </div>
            <MxWebDataTable :columns="detailContactColumns" :tableList="detailData.contactList" :isShowPagination="false" :flexHeight="false" :styleOption="{ padding: '0' }" :singleLine="false" bordered />
        </div>

        <!-- 客户评估 -->
        <div
            v-if="detailData.customerType === 'CHEMICAL' && detailData.isCooperationCustomer !== 'NO'"
            class="detail-section customer-evaluation-section">
            <div class="section-title">
                <span class="title-line"></span>
                <span class="title-text">客户评估</span>
                <span class="evaluation-score">{{ evaluationScoreText }}</span>
            </div>
            <div class="evaluation-grid">
                <div
                    v-for="item in customerEvaluationList"
                    :key="item.indicatorCode"
                    class="evaluation-item"
                >
                    <div class="evaluation-label">
                        <span>{{ item.indicatorName }}</span>
                        <n-tooltip trigger="hover">
                            <template #trigger>
                                <n-icon class="evaluation-info-icon" :component="InformationCircleOutline" />
                            </template>
                            {{ item.description }}
                        </n-tooltip>
                    </div>
                    <div class="evaluation-value">{{ item.displayValue }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NIcon, NTooltip } from "naive-ui";
import { InformationCircleOutline } from "@vicons/ionicons5";
import MxEditorPreview from "@/components/MxEditor/preview.vue";
import {
    CUSTOMER_EVALUATION_CONFIG,
    CUSTOMER_EVALUATION_FIELD_MAP,
    formatEvaluationOptionLabel,
} from "../customerEvaluation";

const props = defineProps<{
    detailData: any;
    detailFactoryTableConfig: any;
    detailContactColumns: any;
}>();

const cooperationStatusMap: Record<string, { color: string; text: string }> = {
    NORMAL: { color: "#18D851", text: "正常" },
    SUSPENDED: { color: "#FCBD12", text: "暂停" },
    TERMINATED: { color: "#C4C4C4", text: "终止" },
};

const cooperationStatusColor = computed(() => {
    return cooperationStatusMap[props.detailData.cooperationStatus]?.color || "#C4C4C4";
});

const cooperationStatusText = computed(() => {
    return cooperationStatusMap[props.detailData.cooperationStatus]?.text || "--";
});

const managerNames = computed(() => {
    const list = props.detailData.manager;
    if (!list || !Array.isArray(list) || list.length === 0) return "";
    return list
        .map((item: any) => item.username || item.label || "")
        .filter(Boolean)
        .join("、");
});

const subsidiaryText = computed(() => {
    if (props.detailData.isSubsidiary === 1) return "是";
    if (props.detailData.isSubsidiary === 2) return "否";
    return "--";
});

const evaluationScoreText = computed(() => {
    const score = props.detailData.baseScore;
    return score === null || score === undefined || score === "" ? "--" : `${score}分`;
});

const customerEvaluationList = computed(() => {
    return CUSTOMER_EVALUATION_CONFIG.map((config) => {
        const field = CUSTOMER_EVALUATION_FIELD_MAP[config.indicatorCode];
        const selectedOptionValue = props.detailData[field];
        const selectedOption = config.options.find(
            (option) => option.value === selectedOptionValue
        );
        return {
            ...config,
            displayValue: formatEvaluationOptionLabel(selectedOption?.label),
        };
    });
});
</script>

<style scoped lang="less">
.tab-basic {
    height: 100%;
    padding-bottom: 20px;
}

.detail-section {
    // margin-top: 16px;
    background: #fff;
    border-radius: 8px;
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &:last-child {
        margin-bottom: 0;
    }
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0px;

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

.info-grid {
    // margin-bottom: 16px;

    .info-row {
        display: flex;
        gap: 220px;
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }

        .info-cell {
            display: flex;
            align-items: center;
            gap: 18px;
            min-width: 200px;

            .cell-label {
                color: #999;
                font-size: 14px;
                min-width: 90px;
                text-align: right;
            }

            .cell-value {
                color: #333;
                font-size: 14px;
                font-weight: normal;
                display: flex;
                align-items: center;
                gap: 6px;

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
            }
        }
    }
}

.info-block {
    // margin-bottom: 16px;
    display: flex;
    align-items: flex-start;
    gap: 16px;

    &:last-child {
        margin-bottom: 0;
    }

    .block-label {
        color: #999;
        font-size: 14px;
        min-width: 90px;
        text-align: right;
    }

    .block-value {
        color: #333;
        font-size: 14px;
    }

    .block-bg {
        background: #f5f6fa;
        padding: 12px;
        border-radius: 6px;
        width: 100%;

        .cooperation-process {
            background-color: #fff;
            padding: 12px;
        }
    }
}

.customer-evaluation-section {
    padding-bottom: 4px;
}

.evaluation-score {
    color: var(--base-color);
    font-size: 16px;
    font-weight: 500;
}

.evaluation-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 64px;
    row-gap: 20px;
}

.evaluation-item {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    align-items: center;
    min-width: 0;
}

.evaluation-label {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    padding-right: 18px;
    color: #999;
    font-size: 14px;
    text-align: right;
}

.evaluation-info-icon {
    flex-shrink: 0;
    color: #999;
    cursor: help;
    font-size: 16px;
}

.evaluation-value {
    min-width: 0;
    color: #333;
    font-size: 14px;
    overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
    .evaluation-grid {
        grid-template-columns: 1fr;
    }
}
</style>
