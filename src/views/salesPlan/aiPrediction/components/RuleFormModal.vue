<template>
    <n-modal  v-model:show="modalVisible" preset="card" class="rule-form-modal my-modal" :title="ruleFormTitle" :bordered="false" :mask-closable="false" :style="{ width: '580px' }" :z-index="3000">
        <n-form ref="ruleFormRef" class="rule-form" :model="ruleForm" :rules="ruleRules" label-placement="left" label-align="right" label-width="110px" require-mark-placement="left">
            <n-form-item label="报告名称" path="ruleName">
                <n-input v-model:value="ruleForm.ruleName" placeholder="请输入" />
            </n-form-item>
            <n-form-item label="报告类型" path="reportType">
                <n-radio-group v-model:value="ruleForm.reportType" class="rule-radio-group">
                    <n-radio v-for="item in AI_REPORT_TYPE_OPTIONS" :key="item.value" :value="item.value">
                        {{ item.label }}
                    </n-radio>
                </n-radio-group>
            </n-form-item>
            <n-form-item label="AI模型" path="aiModel">
                <n-select v-model:value="ruleForm.aiModel" :options="getDictEnum('AI模型')" placeholder="请选择" clearable />
            </n-form-item>
            <n-form-item label="数据来源" path="dataSources">
                <n-input v-model:value="ruleForm.dataSources" placeholder="请输入" />
            </n-form-item>
            <n-form-item label="生成周期" path="generationCycle">
                <n-select v-model:value="ruleForm.generationCycle" :options="generationCycleOptions" placeholder="请选择" clearable />
            </n-form-item>
            <n-form-item label="历史数据跨度" path="historicalSpan">
                <n-select v-model:value="ruleForm.historicalSpan" :options="historicalSpanOptions" placeholder="请选择" clearable />
            </n-form-item>
            <n-form-item label="报告备注" path="remark">
                <n-input v-model:value="ruleForm.remark" type="textarea" placeholder="请输入" maxlength="250" show-count :autosize="{ minRows: 4, maxRows: 8 }" />
            </n-form-item>
        </n-form>
        <template #footer>
            <div class="rule-form-footer">
                <MxButton type="success" :styleOption="saveButtonStyle" @click="handleSaveRule">保 存</MxButton>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NForm, NFormItem, NInput, NModal, NRadio, NRadioGroup, NSelect } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import { AI_REPORT_TYPE_OPTIONS } from '../commonTs/common';

const props = defineProps<{
    show: boolean;
    ruleData?: any;
}>();

// 字典
const { dictMap } = storeToRefs(useDictStore());
// 字典枚举获取
const getDictEnum = computed(() => {
    return (name: string) => {
        if (dictMap.value) {
            return dictMap.value[name] || [];
        }
        return [];
    };
});

const emit = defineEmits(['update:show', 'save']);

const ruleFormRef = ref<any>(null);
const modalVisible = ref(false);

const getDefaultRuleForm = () => ({
    id: null as number | null,
    ruleName: '价格预测-[时间范围]报告',
    reportType: 'MONTHLY',
    aiModel: null as string | null,
    dataSources: '',
    generationCycle: null as string | null,
    historicalSpan: null as string | null,
    remark: '',
});

const ruleForm = reactive(getDefaultRuleForm());

const ruleFormTitle = computed(() => (props.ruleData ? '编辑配置规则' : '新增配置规则'));

const allGenerationCycleOptions = [
    { label: '手动触发', value: 'MANUAL' },
    { label: '每月1日自动生成', value: 'MONTHLY_1ST' },
    { label: '每季度首月1日自动生成', value: 'QUARTERLY_1ST' },
];

const generationCycleOptions = computed(() => {
    if (ruleForm.reportType === 'QUARTERLY') {
        return allGenerationCycleOptions.filter((item) => ['MANUAL', 'QUARTERLY_1ST'].includes(item.value));
    }
    return allGenerationCycleOptions.filter((item) => ['MANUAL', 'MONTHLY_1ST'].includes(item.value));
});

const historicalSpanOptions = [
    { label: '近3个月', value: '近3个月' },
    { label: '近6个月', value: '近6个月' },
    { label: '近12个月', value: '近12个月' },
];

const ruleRules = {
    ruleName: { required: true, message: '请输入报告名称', trigger: ['blur', 'input'] },
    reportType: { required: true, message: '请选择报告类型', trigger: ['change'] },
    aiModel: { required: true, message: '请选择AI模型', trigger: ['change'] },
    generationCycle: { required: true, message: '请选择生成周期', trigger: ['change'] },
    historicalSpan: { required: true, message: '请选择历史数据跨度', trigger: ['change'] },
};

const resetRuleForm = () => {
    Object.assign(ruleForm, getDefaultRuleForm());
};

const initRuleForm = () => {
    resetRuleForm();
    if (!props.ruleData) return;
    Object.assign(ruleForm, {
        id: props.ruleData.id,
        ruleName: props.ruleData.ruleName,
        reportType: props.ruleData.reportType || 'MONTHLY',
        aiModel: props.ruleData.aiModel,
        dataSources: props.ruleData.dataSources || '',
        generationCycle: props.ruleData.generationCycle,
        historicalSpan: props.ruleData.historicalSpan,
        remark: props.ruleData.remark || '',
    });
};

const handleSaveRule = () => {
    ruleFormRef.value?.validate?.((errors: any) => {
        if (!errors) {
            emit('save', { ...ruleForm });
        }
    });
};

const saveButtonStyle = {
    width: '64px',
    height: '32px',
    fontSize: '14px',
};

watch(
    () => props.show,
    (value) => {
        modalVisible.value = value;
        if (value) initRuleForm();
    },
    { immediate: true }
);

watch(
    () => modalVisible.value,
    (value) => {
        emit('update:show', value);
    }
);

watch(
    () => ruleForm.reportType,
    () => {
        if (!ruleForm.generationCycle) return;
        const hasCurrentCycle = generationCycleOptions.value.some((item) => item.value === ruleForm.generationCycle);
        if (!hasCurrentCycle) {
            ruleForm.generationCycle = null;
        }
    }
);
</script>

<style lang="less">
.my-modal.n-card>.n-card-header {
    border-bottom: 1px solid #f1f1f1;
    padding: 12px 24px;
    margin-bottom: 24px;
}
</style>
<style lang="less" scoped>
.rule-radio-group {
    display: flex;
    align-items: center;
    gap: 34px;
    height: 34px;
}

.rule-form-footer {
    display: flex;
    justify-content: center;
}
</style>
