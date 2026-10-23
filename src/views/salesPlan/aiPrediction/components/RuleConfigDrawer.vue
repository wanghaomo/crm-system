<template>
    <MxDrawer class="ai-rule-drawer" :show="show" title="预测规则配置" width="640px" :closablePop="false" @update:show="handleVisibleChange">
        <div class="rule-config">

            <MxButton border type="success" @click="openRuleForm()" v-if="checkPermission(['crm:ai_prediction:add_set'])">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽add_blue.png" alt="" width="16" height="16" style="margin-bottom: 2px;">
                </template>
               <span>新增预测规则</span>
            </MxButton>

            <n-spin :show="ruleListLoading">
                <div v-if="ruleList.length" class="rule-list">
                    <div v-for="item in ruleList" :key="item.id" class="rule-card">
                        <div class="rule-card-main">
                            <div class="rule-card-left">
                                <div class="rule-title">{{ item.ruleName || '--' }}</div>
                                <div class="rule-tags">
                                    <MxTag type="success" size="mini" :styleOption="tagStyle">
                                        {{ formatReportType(item.reportType) }}
                                    </MxTag>
                                    <MxTag type="success" size="mini" :styleOption="tagStyle">
                                        {{ formatGenerationCycle(item.generationCycle) }}
                                    </MxTag>
                                </div>
                            </div>
                            <div class="rule-model">
                                <div class="model-name">{{ formatAiModel(item.aiModel) }}</div>
                                <div class="model-label">AI模型</div>
                            </div>
                        </div>

                        <div class="rule-info">
                            <div class="info-row">
                                <span class="info-label">数据来源</span>
                                <span class="info-value">{{ item.dataSources || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">报告备注</span>
                                <span class="info-value">{{ item.remark || '--' }}</span>
                            </div>
                        </div>

                        <div class="rule-footer">
                            <div class="history-range">
                                <span>历史数据跨度</span>
                                <strong>{{ item.historicalSpan || '--' }}</strong>
                            </div>
                            <div class="rule-actions">
                                <MxButton v-if="checkPermission(['crm:ai_prediction:del_set'])" type="error" border :styleOption="dangerButtonStyle" @click="confirmDeleteRule(item)">
                                    删 除
                                </MxButton>
                                <MxButton v-if="checkPermission(['crm:ai_prediction:edit_set'])" border type="success" :styleOption="primaryBorderButtonStyle" @click="openRuleForm(item)">
                                    编 辑
                                </MxButton>
                                <MxButton v-if="checkPermission(['crm:ai_prediction:forecast'])" type="success" :styleOption="primaryButtonStyle" :disabled="generatingRuleId === item.id" @click="handleGenerateReport(item)">
                                    {{ generatingRuleId === item.id ? '生成中' : '预 测' }}
                                </MxButton>
                            </div>
                        </div>
                    </div>
                </div>
                <n-empty v-else class="rule-empty" description="暂无预测规则" />
            </n-spin>
        </div>
    </MxDrawer>
    <RuleFormModal @save="saveRule" v-model:show="ruleFormVisible" :ruleData="currentRule" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NEmpty, NSpin, useDialog, useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import RuleFormModal from './RuleFormModal.vue';
import {
    createSalesPlanAiReport,
    deleteSalesPlanAiReportRule,
    generateSalesPlanAiReport,
    getSalesPlanAiReportRuleList,
    updateSalesPlanAiReport,
} from '@/api/aiReport';
import { useDictStore } from '@/store/commStore';
import { checkPermission } from '@/utils/comm.js';

const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits(['update:show', 'refresh']);

const { dictMap } = storeToRefs(useDictStore());
const dialog = useDialog();
const message = useMessage();
const ruleList = ref<any[]>([]);
const ruleListLoading = ref(false);
const generatingRuleId = ref<any>(null);

const handleVisibleChange = (value: boolean) => {
    emit('update:show', value);
};

const ruleFormVisible = ref(false);
const currentRule = ref<any>(null);

const openRuleForm = (row?: any) => {
    currentRule.value = row || null;
    ruleFormVisible.value = true;
};

const reportTypeMap: Record<string, string> = {
    MONTHLY: '月度预测',
    QUARTERLY: '季度预测',
};

const generationCycleMap: Record<string, string> = {
    MANUAL: '手动触发',
    MONTHLY_1ST: '每月1日自动生成',
    QUARTERLY_1ST: '每季度首月1日自动生成',
};

const aiModelOptions = computed(() => dictMap.value?.['AI模型'] || []);

const formatReportType = (value?: string) => (value ? reportTypeMap[value] || value : '--');
const formatGenerationCycle = (value?: string) => (value ? generationCycleMap[value] || value : '--');
const formatAiModel = (value?: string) => {
    if (!value) return '--';
    const option = aiModelOptions.value.find((item: any) => item.value === value);
    return option?.label || value;
};

const primaryBorderButtonStyle = {
    minWidth: '56px',
    height: '32px',
    padding: '4px 12px',
    fontSize: '14px',
    borderColor: 'var(--base-color)',
};

const dangerButtonStyle = {
    minWidth: '56px',
    height: '32px',
    padding: '4px 12px',
    fontSize: '14px',
    borderColor: 'var(--base-color-red)',
};

const primaryButtonStyle = {
    minWidth: '56px',
    height: '32px',
    padding: '4px 12px',
    fontSize: '14px',
};

const tagStyle = {
    height: '20px',
    padding: '0 6px',
    borderRadius: '4px',
    borderColor: '#d9e6ff',
    backgroundColor: '#eef4ff',
    color: 'var(--base-color)',
    fontSize: '12px',
};

const getRuleList = async () => {
    try {
        ruleListLoading.value = true;
        const res = await getSalesPlanAiReportRuleList();
        if (res.code === 200) {
            ruleList.value = Array.isArray(res.data) ? res.data : [];
        }
    } catch {
        ruleList.value = [];
    } finally {
        ruleListLoading.value = false;
    }
};

const deleteRule = async (row: any) => {
    if (!row?.id) return;
    try {
        const res = await deleteSalesPlanAiReportRule(row.id);
        if (res.code === 200) {
            message.success('删除成功');
            getRuleList();
        }
    } catch {
        message.error('删除失败');
    }
};

const confirmDeleteRule = (row: any) => {
    dialog.warning({
        title: '确认删除',
        content: '该预测规则删除后不可恢复，确认要删除吗？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => deleteRule(row),
    });
};

const handleGenerateReport = async (row: any) => {
    if (!row?.id || generatingRuleId.value) return;
    try {
        generatingRuleId.value = row.id;
        const res = await generateSalesPlanAiReport({
            ruleId: row.id,
        });
        if (res.code === 200) {
            message.success('预测任务已发起');
            emit('update:show', false);
            emit('refresh');
        }
    } catch {
        message.error('预测失败');
    } finally {
        generatingRuleId.value = null;
    }
};

const saveRule = async (formData: any) => {
    const res = formData.id ? await updateSalesPlanAiReport(formData) : await createSalesPlanAiReport(formData);
    if (res.code === 200) {
        ruleFormVisible.value = false;
        getRuleList();
    }
};

watch(
    () => props.show,
    (value) => {
        if (value) getRuleList();
    },
    { immediate: true }
);
</script>

<style lang="less" scoped>
.rule-config {
    height: 100%;
    padding: 24px;
    background: var(--base-white);
    font-size: 14px;
}

.rule-list {
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.rule-empty {
    margin-top: 80px;
}

.rule-card {
    width: 100%;
    padding: 12px;
    border: 1px solid #e7eaf2;
    border-radius: 8px;
    background: var(--base-white);
}

.rule-card-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
}

.rule-card-left {
    min-width: 0;
}

.rule-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 24px;
    color: var(--base-grey4);
}

.rule-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;

}

.rule-model {
    flex-shrink: 0;
    text-align: right;
}

.model-name {
    font-size: 16px;
    font-weight: 600;
    line-height: 28px;
    color: var(--base-grey4);
}

.model-label {
    margin-top: 6px;
    font-size: 12px;
    line-height: 20px;
    color: var(--base-grey);
}

.rule-info {
    margin-top: 14px;
    padding: 10px 12px;
    border-radius: 4px;
    background: #f6f6f7;
}

.info-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 28px;
    font-size: 12px;
    line-height: 28px;
}

.info-label {
    flex-shrink: 0;
    color: var(--base-grey);
}

.info-value {
    min-width: 0;
    color: var(--base-grey4);
    font-weight: 600;
}

.rule-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 14px;
}

.history-range {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--base-grey);
    font-size: 12px;
    line-height: 28px;

    strong {
        color: var(--base-grey4);
        font-weight: 400;
    }
}

.rule-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

::deep(.ai-rule-drawer .drawer_header) {
    font-size: 14px;
}
</style>
