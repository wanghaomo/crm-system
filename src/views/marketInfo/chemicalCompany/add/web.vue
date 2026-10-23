<template>
    <WebPage showBack hideAddBtn contentPadding="0" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border  @click="handleSave" :styleOption="{'color': 'var(--base-color)', 'border-color': 'var(--base-color)'}" > 保 存 </MxButton>
            <MxButton  @click="handleSubmit"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="chemical-add-container">
                <h1 class="add-title">{{ pageTitle }}</h1>
                <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="120px">
                    <n-grid :cols="2" :x-gap="24" :y-gap="0">
                        <n-grid-item>
                            <n-form-item label="企业名称" path="enterpriseName">
                                <n-select v-model:value="formData.enterpriseName" placeholder="请选择" filterable clearable :options="customerOptions" tag :on-update:value="handleCustomerChange" :loading="customerLoading" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="调研月份" path="surveyMonth">
                                <n-date-picker v-model:formatted-value="formData.surveyMonth" value-format="yyyy-MM" type="month" placeholder="请选择" style="width: 100%" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="库存情况(万吨)" path="inventory">
                                <n-input v-model:value="formData.inventory" placeholder="请输入（保留1位小数）" :maxlength="10" @update:value="(value: any) => handleDecimalInput('inventory', value)" @blur="() => handleDecimalBlur('inventory')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="开工率(%)" path="operatingRate">
                                <n-input v-model:value="formData.operatingRate" placeholder="请输入整数（0-100）" :maxlength="3" @update:value="(value: any) => handleIntegerInput('operatingRate', value, 100)" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="2">
                            <n-form-item label="开工率变化原因" path="rateChangeReason">
                                <n-input v-model:value="formData.rateChangeReason" type="textarea" placeholder="请输入" :maxlength="500" show-count />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="2">
                            <n-form-item label="企业主要产品规模" path="mainProductScale">
                                <n-input v-model:value="formData.mainProductScale" placeholder="请输入" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="主要产品价格(元/吨)" path="mainProductPrice">
                                <n-input v-model:value="formData.mainProductPrice" placeholder="请输入整数" :maxlength="10" @update:value="(value: any) => handleIntegerInput('mainProductPrice', value)" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="下月采购计划(万吨)" path="nextMonthPlan">
                                <n-input v-model:value="formData.nextMonthPlan" placeholder="请输入（保留1位小数）" :maxlength="10" clearable @update:value="(value: any) => handleDecimalInput('nextMonthPlan', value)" @blur="() => handleDecimalBlur('nextMonthPlan')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="采购产品类型" path="purchaseProductType">
                                <MxDict placeholder="请选择" dictType="采购产品类型" v-model="formData.purchaseProductType"></MxDict>
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="采购预算(万元)" path="purchaseBudget">
                                <n-input v-model:value="formData.purchaseBudget" placeholder="请输入整数" :maxlength="10" @update:value="(value) => handleIntegerInput('purchaseBudget', value)" clearable />
                            </n-form-item>
                        </n-grid-item>
                    </n-grid>
                </n-form>
            </div>
        </template>
    </WebPage>
    <!-- 历史数据对比模态框 -->
    <n-modal
        v-model:show="historyDiffVisible"
        preset="dialog"
        :show-icon="false"
        :mask-closable="false"
        style="width: auto;"
        @update:show="handleHistoryDiffShowChange"
        @close="handleHistoryDiffCancel">
        <template #header>
            <div class="history-diff-header">
                <span class="history-diff-header__icon">!</span>
                <span class="history-diff-header__title">历史数据对比提醒</span>
            </div>
        </template>
        <div class="history-diff-content">
            <div class="history-diff-summary">{{ historyDiffSummary }}</div>
            <div class="history-diff-list">
                <div v-if="!historyDiffItems.length" class="history-diff-empty">库存或开工率与历史数据差异超过阈值。</div>
                <div v-for="item in historyDiffItems" :key="item.name" class="history-diff-item">
                    <div class="history-diff-item__header">
                        <span class="history-diff-item__name">{{ item.name }}</span>
                        <span class="history-diff-item__tag">超出阈值</span>
                    </div>
                    <div class="history-diff-values">
                        <div class="history-diff-value">
                            <span class="history-diff-value__label">历史值</span>
                            <strong class="history-diff-value__number">{{ item.history }}</strong>
                        </div>
                        <div class="history-diff-value">
                            <span class="history-diff-value__label">当前值</span>
                            <strong class="history-diff-value__number history-diff-value__number--current">{{ item.current }}</strong>
                        </div>
                        <div class="history-diff-value">
                            <span class="history-diff-value__label">差异</span>
                            <strong class="history-diff-value__number history-diff-value__number--warning">{{ item.diff }}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <p class="history-diff-footer">请确认数据无误后继续保存或提交。</p>
        </div>
        <template #action>
            <div class="history-diff-actions">
                <MxButton
                    border
                    :styleOption="{
                        color: '#2C65F2',
                        borderColor: '#2C65F2',
                        backgroundColor: '#fff',
                        padding: '5px 15px',
                    }"
                    @click="handleHistoryDiffCancel">
                    取消
                </MxButton>
                <MxButton
                    :styleOption="{
                        color: '#fff',
                        backgroundColor: '#F59E0B',
                        padding: '5px 15px',
                    }"
                    @click="handleHistoryDiffConfirm">
                    确定
                </MxButton>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NDatePicker,
    NGrid,
    NGridItem,
    NModal,
    useMessage,
} from 'naive-ui';
import WebPage from '@/components/WebPage/index.vue';
import MxButton from '@/components/MxButton/index.vue';
import { getCustomerBaseDropdownApi } from '@/api/customerManage';
import {
    createChemicalCompanyApi,
    updateChemicalCompanyApi,
    queryChemicalCompanyDetailApi,
    compareWithHistoryApi,
} from '@/api/chemicalCompany';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const isEdit = computed(() => !!route.query.id && !route.query.copyId);
const isCopy = computed(() => !!route.query.copyId);
const pageTitle = computed(() => {
    if (isCopy.value) return '复制化工企业调研数据';
    return isEdit.value ? '编辑化工企业调研数据' : '新增化工企业调研数据';
});

const formRef = ref<any>(null);
const historyDiffVisible = ref(false);
const historyDiffSummary = ref('');
const historyDiffItems = ref<HistoryDifferenceItem[]>([]);
let historyDiffResolve: ((value: boolean) => void) | null = null;

interface ChemicalSurveyForm {
    id?: string;
    enterpriseName: string;  // 企业名称
    customerId?: string | null;  // 企业id
    surveyMonth: string | null; // 调研月份
    inventory: string; // 库存（保留1位小数）
    operatingRate: string; // 开工率（整数）
    rateChangeReason: string;  // 开工率变化原因
    mainProductScale: string | null; // 企业主要产品规模
    mainProductPrice: string; // 主要产品价格(元/吨)（整数）
    nextMonthPlan: string; // 下月采购计划(万吨)（保留1位小数）
    purchaseProductType: string; // 采购产品类型
    purchaseBudget: string; // 采购预算(万元)（整数）
    status: string;
}

const createEmptyForm = (): ChemicalSurveyForm => ({
    enterpriseName: '',
    customerId: null,
    surveyMonth: null,
    inventory: '',
    operatingRate: '',
    rateChangeReason: '',
    mainProductScale: null,
    mainProductPrice: '',
    nextMonthPlan: '',
    purchaseProductType: '',
    purchaseBudget: '',
    status: '',
});

const formData = ref<ChemicalSurveyForm>(createEmptyForm());

type NumericField = 'inventory' | 'operatingRate' | 'mainProductPrice' | 'nextMonthPlan' | 'purchaseBudget';

interface ComparePayload {
    enterpriseName: string;
    surveyMonth: string;
    inventory: number;
    operatingRate: number;
}

interface HistoryDifferenceItem {
    name: string;
    history: string;
    current: string;
    diff: string;
}


const normalizeInteger = (value: string, max?: number) => {
    const normalized = `${value ?? ''}`.replace(/\D/g, '');
    if (!normalized) return '';
    const numberValue = Number(normalized);
    return String(max !== undefined && numberValue > max ? '' : numberValue);
};

const normalizeDecimal = (value: string) => {
    const normalized = `${value ?? ''}`
        .replace(/[^\d.]/g, '')
        .replace(/(\..*)\./g, '$1');
    const [integer = '', decimal = ''] = normalized.split('.');
    if (!integer && normalized.includes('.')) return '0.';
    return normalized.includes('.') ? `${integer}.${decimal.slice(0, 1)}` : integer;
};

const handleIntegerInput = (field: NumericField, value: string, max?: number) => {
    formData.value[field] = normalizeInteger(value, max);
};

const handleDecimalInput = (field: NumericField, value: string) => {
    formData.value[field] = normalizeDecimal(value);
};

const handleDecimalBlur = (field: NumericField) => {
    const value = formData.value[field];
    if (value) {
        formData.value[field] = Number(value).toFixed(1).replace(/\.0$/, '');
    }
};

const hasInputValue = (value: any) => value !== null && value !== undefined && `${value}`.trim() !== '';

const getComparePayload = (): ComparePayload | null => {
    const { enterpriseName, surveyMonth, inventory, operatingRate } = formData.value;
    if (![enterpriseName, surveyMonth, inventory, operatingRate].every(hasInputValue)) {
        return null;
    }
    if (!/^\d+(\.\d{1})?$/.test(inventory) || !/^\d+$/.test(operatingRate)) {
        return null;
    }

    const operatingRateValue = Number(operatingRate);
    if (operatingRateValue < 0 || operatingRateValue > 100) {
        return null;
    }

    return {
        enterpriseName,
        surveyMonth: surveyMonth as string,
        inventory: Number(inventory),
        operatingRate: operatingRateValue,
    };
};

const getValue = (data: any, keys: string[], defaultValue: any = '') => {
    const key = keys.find((item) => data?.[item] !== undefined && data?.[item] !== null);
    return key ? data[key] : defaultValue;
};

const normalizeDetailToForm = (data: any, copy = false): ChemicalSurveyForm => ({
    ...createEmptyForm(),
    id: copy ? undefined : getValue(data, ['id']),
    enterpriseName: getValue(data, ['enterpriseName', 'customerName']),
    customerId: getValue(data, ['customerId'], null),
    surveyMonth: getValue(data, ['surveyMonth', 'researchMonth'], null),
    inventory: getValue(data, ['inventory'], '')?.toString() || '',
    operatingRate: getValue(data, ['operatingRate'], '')?.toString() || '',
    rateChangeReason: getValue(data, ['rateChangeReason', 'operatingRateReason']),
    mainProductScale: getValue(data, ['mainProductScale', 'mainProduct'], null),
    mainProductPrice: getValue(data, ['mainProductPrice'], '')?.toString() || '',
    nextMonthPlan: getValue(data, ['nextMonthPlan'], '')?.toString() || '',
    purchaseProductType: getValue(data, ['purchaseProductType', 'purchaseType']),
    purchaseBudget: getValue(data, ['purchaseBudget'], '')?.toString() || '',
    status: copy ? '' : getValue(data, ['status']),
});

const buildSubmitPayload = (status: 'DRAFT' | 'ARCHIVED') => {
    const submitFormData = { ...formData.value };
    delete submitFormData.id;
    const { inventory, operatingRate, mainProductPrice, nextMonthPlan, purchaseBudget, ...rest } = submitFormData;
    return {
        ...(isEdit.value ? { id: route.query.id } : {}),
        ...rest,
        inventory: inventory ? parseFloat(inventory) : undefined,
        operatingRate: operatingRate ? parseInt(operatingRate, 10) : undefined,
        mainProductPrice: mainProductPrice ? parseInt(mainProductPrice, 10) : undefined,
        nextMonthPlan: nextMonthPlan ? parseFloat(nextMonthPlan) : undefined,
        purchaseBudget: purchaseBudget ? parseInt(purchaseBudget, 10) : undefined,
        status,
    };
};



const rules = {
    enterpriseName: { required: true, message: '请选择企业', trigger: 'change', saveOnly: true },
    surveyMonth: { required: true, message: '请选择调研月份', trigger: 'change', saveOnly: true },
    inventory: {
        required: true,
        message: '请输入库存',
        trigger: 'blur',
        saveOnly: true,
        validator: (rule: any, value: string) => {
            if (!value) return new Error('请输入库存');
            const regex = /^\d+(\.\d{1})?$/;
            if (!regex.test(value)) {
                return new Error('请输入有效数字（保留1位小数）');
            }
            const numValue = parseFloat(value);
            if (numValue < 0) {
                return new Error('数值不能为负数');
            }
            return true;
        }
    },
    operatingRate: {
        required: true,
        message: '请输入开工率',
        trigger: 'blur',
        saveOnly: true,
        validator: (rule: any, value: string) => {
            if (!value) return new Error('请输入开工率');
            const regex = /^\d+$/;
            if (!regex.test(value)) {
                return new Error('请输入整数');
            }
            const numValue = parseInt(value, 10);
            if (numValue < 0 || numValue > 100) {
                return new Error('开工率范围为0-100');
            }
            return true;
        }
    },
    mainProductPrice: {
        trigger: 'blur',
        validator: (rule: any, value: string) => {
            if (!value) return true;
            const regex = /^\d+$/;
            if (!regex.test(value)) {
                return new Error('请输入整数');
            }
            const numValue = parseInt(value, 10);
            if (numValue < 0) {
                return new Error('数值不能为负数');
            }
            return true;
        }
    },
    nextMonthPlan: {
        required: true,
        message: '请输入下月采购计划',
        trigger: 'blur',
        validator: (rule: any, value: string) => {
            if (!value) return new Error('请输入下月采购计划');
            const regex = /^\d+(\.\d{1})?$/;
            if (!regex.test(value)) {
                return new Error('请输入有效数字（保留1位小数）');
            }
            const numValue = parseFloat(value);
            if (numValue < 0) {
                return new Error('数值不能为负数');
            }
            return true;
        }
    },
    purchaseBudget: {
        trigger: 'blur',
        validator: (rule: any, value: string) => {
            if (!value) return true;
            const regex = /^\d+$/;
            if (!regex.test(value)) {
                return new Error('请输入整数');
            }
            const numValue = parseInt(value, 10);
            if (numValue < 0) {
                return new Error('数值不能为负数');
            }
            return true;
        }
    },
    mainProductScale: { required: true, message: '请选择企业主要产品规模', trigger: 'change' },
    purchaseProductType: { required: false, message: '请选择采购产品类型', trigger: 'change' },
};
// 获取企业下拉数据
const customerLoading = ref(false);
const customerOptions = ref<{ label: string; value: string }[]>([]);
const loadCustomerOptions = async () => {
    try {
        customerLoading.value = true;
        const res = await getCustomerBaseDropdownApi({
            cooperationStatus: 'NORMAL',
            status: 'STORAGE',
            customerType:'CHEMICAL'
        });
        if (res.code === 200) {
            customerOptions.value = (res.data || []).map((item: any) => (
                {
                    label: item.customerName,
                    value: item.id,
                }));
        }
    } catch (e) {
    } finally {
        customerLoading.value = false;
    }
};
// 企业客户切换
const handleCustomerChange = (value: any, option: any) => {
    if (!option) {
        formData.value.enterpriseName = '';
        formData.value.customerId = null;
        return;
    }
    if (option.value === option.label) {
        formData.value.enterpriseName = option.label;
        formData.value.customerId = null;
    } else {
        formData.value.enterpriseName = option.label;
        formData.value.customerId = option.value;
    }

}
const formatDiffNumber = (value: any, suffix = '') => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '--';
    return `${numberValue}${suffix}`;
};

const getDifferenceItems = (data: any) => {
    const items: HistoryDifferenceItem[] = [];
    if (data?.inventoryExceeded) {
        items.push({
            name: '库存情况',
            history: formatDiffNumber(data.historyInventory, '万吨'),
            current: formatDiffNumber(data.currentInventory, '万吨'),
            diff: formatDiffNumber(data.inventoryDiff,'%'),
        });
    }
    if (data?.operatingRateExceeded) {
        items.push({
            name: '开工率',
            history: formatDiffNumber(data.historyOperatingRate, '%'),
            current: formatDiffNumber(data.currentOperatingRate, '%'),
            diff: formatDiffNumber(data.operatingRateDiff,'%'),
        });
    }
    return items;
};

const closeHistoryDiffModal = (canContinue: boolean) => {
    historyDiffVisible.value = false;
    historyDiffResolve?.(canContinue);
    historyDiffResolve = null;
};

const handleHistoryDiffCancel = () => closeHistoryDiffModal(false);

const handleHistoryDiffConfirm = () => closeHistoryDiffModal(true);

const handleHistoryDiffShowChange = (show: boolean) => {
    if (!show && historyDiffResolve) {
        closeHistoryDiffModal(false);
    }
};

const openHistoryDiffModal = (data: any) => {
    historyDiffSummary.value = `检测到当前数据与历史调研数据存在明显差异${data?.historySurveyMonth ? `，历史月份：${data.historySurveyMonth}` : ''}。`;
    historyDiffItems.value = getDifferenceItems(data);
    historyDiffVisible.value = true;

    return new Promise<boolean>((resolve) => {
        historyDiffResolve = resolve;
    });
};

const confirmHistoryDifference = async () => {
    const payload = getComparePayload();
    if (!payload) return true;
    const res = await compareWithHistoryApi(payload);
    if (res?.code !== 200 || res.data?.hasDifference !== true) return true;

    return openHistoryDiffModal(res.data);
};

// 提交前校验
const validateAndSubmit = async (saveOnly = false) => {
    try {
        await formRef.value?.validate(
            undefined,
            saveOnly ? (rule: any) => rule.saveOnly === true : undefined,
        );
    } catch (e) {
        return false;
    }

    return true;
};

const handleSaveOrSubmit = async (status: 'DRAFT' | 'ARCHIVED') => {
    const canProceed = await validateAndSubmit(status === 'DRAFT');
    if (!canProceed) return;
    const canContinue = await confirmHistoryDifference();
    if (!canContinue) return;

    const payload = buildSubmitPayload(status);
    const res = isEdit.value ? await updateChemicalCompanyApi(payload) : await createChemicalCompanyApi(payload);
    if (res?.code === 200) {
        message.success(status === 'DRAFT' ? '保存成功（草稿）' : '提交成功（已归档）');
        router.back();
    }
};

const handleSave = () => handleSaveOrSubmit('DRAFT');
const handleSubmit = () => handleSaveOrSubmit('ARCHIVED');

// 编辑模式加载数据
const loadEditData = async () => {
    const sourceId = route.query.id || route.query.copyId;
    if (!sourceId) {
        const now = new Date();
        formData.value.surveyMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return;
    }
    try {
        const res = await queryChemicalCompanyDetailApi(sourceId);
        if (res?.code === 200) {
            formData.value = normalizeDetailToForm(res.data || {}, isCopy.value);
        }
    } catch (error) {
        console.error('加载化工企业调研数据失败:', error);
    }
};

onMounted(async () => {
    await loadCustomerOptions();
    await loadEditData();
});
</script>

<style scoped lang="less">
:deep(.component_page_content_box) {
    height: auto !important;
}

.chemical-add-container {
    padding: 16px;

    .add-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px 0;
    }
}

.history-diff-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .history-diff-header__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
        color: #fff;
        background: #f59e0b;
        border-radius: 50%;
    }

    .history-diff-header__title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
    }
}

.history-diff-content {
    color: #333;
    font-size: 14px;

    .history-diff-summary {
        margin-bottom: 12px;
        padding: 10px 12px;
        line-height: 22px;
        color: #334155;
        background: #f6f9ff;
        border: 1px solid #dce8ff;
        border-radius: 6px;
    }

    .history-diff-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 12px;
    }

    .history-diff-item {
        padding: 10px 12px 12px;
        background: #fffaf2;
        border: 1px solid #ffe0b3;
        border-radius: 6px;
    }

    .history-diff-item__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .history-diff-item__name {
        font-weight: 600;
        color: #1f2937;
    }

    .history-diff-item__tag {
        padding: 2px 8px;
        font-size: 12px;
        line-height: 18px;
        color: #d97706;
        background: #fff4df;
        border: 1px solid #ffd28a;
        border-radius: 3px;
    }

    .history-diff-values {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    }

    .history-diff-value {
        min-width: 0;
        padding: 8px 10px;
        background: #fff;
        border: 1px solid #f1f3f6;
        border-radius: 4px;
    }

    .history-diff-value__label {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        line-height: 18px;
        color: #8a92a3;
    }

    .history-diff-value__number {
        display: block;
        overflow: hidden;
        font-size: 15px;
        line-height: 22px;
        color: #1f2937;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .history-diff-value__number--current {
        color: #2c65f2;
    }

    .history-diff-value__number--warning {
        color: #f59e0b;
    }

    .history-diff-empty {
        padding: 10px 12px;
        line-height: 22px;
        color: #d97706;
        background: #fffaf2;
        border: 1px solid #ffe0b3;
        border-radius: 6px;
    }

    .history-diff-footer {
        margin: 0;
        padding-top: 2px;
        line-height: 22px;
        color: #4b5563;
    }
}

.history-diff-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
