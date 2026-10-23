<template>
    <WebPage showBack hideAddBtn contentPadding="0" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border :styleOption="{ 'color': 'var(--base-color)', 'border-color': 'var(--base-color)' }" @click="handleSave"> 保 存 </MxButton>
            <MxButton @click="handleSubmit"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="competitor-add-container">
                <h1 class="add-title">{{ pageTitle }}</h1>
                <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="120px">
                    <n-grid :cols="2" :x-gap="24" :y-gap="0">
                        <n-grid-item>
                            <n-form-item label="竞争对手名称" path="competitorName">
                                <n-input v-model:value="formData.competitorName" placeholder="请填写竞争矿山全称" :maxlength="30" show-count clearable />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="区域" path="region">
                                <MxDict placeholder="请选择" dictType="区域类型" v-model="formData.region"></MxDict>
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="矿山类型" path="mineType">
                                <MxDict placeholder="请选择" dictType="矿山类型" v-model="formData.mineType"></MxDict>
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="调研月份" path="surveyMonth">
                                <n-date-picker v-model:formatted-value="formData.surveyMonth" value-format="yyyy-MM" type="month" placeholder="请选择" style="width: 100%" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="详细地址" path="detailAddress">
                                <n-input v-model:value="formData.detailAddress" placeholder="请输入" :maxlength="100" clearable show-count />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="联系人" path="contactPerson">
                                <n-input v-model:value="formData.contactPerson" placeholder="请输入" :maxlength="50" clearable />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="联系电话" path="contactPhone">
                                <n-input v-model:value="formData.contactPhone" placeholder="请输入" :maxlength="11" clearable @update:value="handlePhoneInput" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="矿石库存(万吨)" path="inventory">
                                <n-input v-model:value="formData.inventory" placeholder="请输入（保留1位小数）" :maxlength="10" clearable @update:value="(value: any) => handleDecimalInput('inventory', value)" @blur="() => handleDecimalBlur('inventory')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="开工率(%)" path="operatingRate">
                                <n-input v-model:value="formData.operatingRate" placeholder="请输入整数（0-100）" :maxlength="3" clearable @update:value="(value: any) => handleIntegerInput('operatingRate', value, 100)" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="2">
                            <n-form-item label="开工率变化原因" path="rateChangeReason">
                                <n-input v-model:value="formData.rateChangeReason" type="textarea" placeholder="请输入" :maxlength="500" show-count />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="月产量(万吨)" path="monthlyOutput">
                                <n-input v-model:value="formData.monthlyOutput" placeholder="请输入（保留1位小数）" :maxlength="10" clearable @update:value="(value: any) => handleDecimalInput('monthlyOutput', value)" @blur="() => handleDecimalBlur('monthlyOutput')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="最大产能(万吨/月)" path="maxOutput">
                                <n-input v-model:value="formData.maxOutput" placeholder="请输入（保留1位小数）" :maxlength="10" clearable @update:value="(value: any) => handleDecimalInput('maxOutput', value)" @blur="() => handleDecimalBlur('maxOutput')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="产品品位(%)" path="productGrade">
                                <n-input v-model:value="formData.productGrade" placeholder="请输入（保留1位小数）" :maxlength="5" clearable @update:value="(value: any) => handleDecimalInput('productGrade', value, 100)" @blur="() => handleDecimalBlur('productGrade')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="主要码头名称" path="wharfName">
                                <n-input v-model:value="formData.wharfName" placeholder="请输入" :maxlength="30" show-count clearable />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="主要码头库存(万吨)" path="wharfInventory">
                                <n-input v-model:value="formData.wharfInventory" placeholder="请输入（保留1位小数）" :maxlength="10" clearable @update:value="(value: any) => handleDecimalInput('wharfInventory', value)" @blur="() => handleDecimalBlur('wharfInventory')" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="销售价格(元/吨)" path="salesPrice">
                                <n-input v-model:value="formData.salesPrice" placeholder="请输入整数" :maxlength="10" clearable @update:value="(value: any) => handleIntegerInput('salesPrice', value)" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="2">
                            <n-form-item label="价格变动原因" path="priceChangeReason">
                                <n-input v-model:value="formData.priceChangeReason" type="textarea" placeholder="请输入" :maxlength="500" show-count />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="2">
                            <n-form-item label="销售渠道" path="salesChannel">
                                <n-input v-model:value="formData.salesChannel" placeholder="请输入" :maxlength="200" clearable />
                            </n-form-item>
                        </n-grid-item>
                    </n-grid>
                </n-form>
            </div>
        </template>
    </WebPage>
    <!-- 历史数据对比模态框 -->
    <n-modal v-model:show="historyDiffVisible" preset="dialog" :show-icon="false" :mask-closable="false" style="width: auto;" @update:show="handleHistoryDiffShowChange" @close="handleHistoryDiffCancel">
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
                <MxButton border :styleOption="{
                    color: '#2C65F2',
                    borderColor: '#2C65F2',
                    backgroundColor: '#fff',
                    padding: '5px 15px',
                }" @click="handleHistoryDiffCancel">
                    取消
                </MxButton>
                <MxButton :styleOption="{
                    color: '#fff',
                    backgroundColor: '#F59E0B',
                    padding: '5px 15px',
                }" @click="handleHistoryDiffConfirm">
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
    NDatePicker,
    NGrid,
    NGridItem,
    NModal,
    useMessage,
} from 'naive-ui';
import {
    createCompetitorApi,
    updateCompetitorApi,
    queryCompetitorDetailApi,
    compareCompetitorWithHistoryApi,
} from '@/api/competitor';

// ==================== 路由和UI工具实例 ====================
/** 路由实例 */
const route = useRoute();
/** 路由跳转实例 */
const router = useRouter();
/** 消息提示实例 */
const message = useMessage();

/** 是否为复制模式（复制优先于编辑处理） */
const isCopy = computed(() => !!route.query.copyId);
/** 是否为编辑模式（复制模式不更新原记录） */
const isEdit = computed(() => !!route.query.id && !isCopy.value);
/** 页面标题（根据当前页面模式动态显示） */
const pageTitle = computed(() => {
    if (isCopy.value) return '复制竞争对手调研数据';
    return isEdit.value ? '编辑竞争对手调研数据' : '新增竞争对手调研数据';
});

/** 表单引用，用于手动触发验证 */
const formRef = ref<any>(null);

// ==================== 历史数据对比模态框状态 ====================
/** 历史对比弹窗是否可见 */
const historyDiffVisible = ref(false);
/** 历史对比摘要信息 */
const historyDiffSummary = ref('');
/** 历史对比差异项列表 */
const historyDiffItems = ref<HistoryDifferenceItem[]>([]);
/** 模态框 Promise resolve 回调，用于阻塞提交流程 */
let historyDiffResolve: ((value: boolean) => void) | null = null;

/** 历史数据差异项结构 */
interface HistoryDifferenceItem {
    name: string;       // 指标名称
    history: string;    // 历史值（含单位）
    current: string;    // 当前值（含单位）
    diff: string;       // 差异百分比
}

/** 竞争对手调研表单数据结构 */
interface CompetitorSurveyForm {
    id?: string;                              // 记录ID（编辑时使用）
    competitorName: string;                   // 竞争对手名称
    region: string | null;                    // 区域
    mineType: string | null;                  // 矿山类型
    surveyMonth: string | null;               // 调研月份（格式：yyyy-MM）
    detailAddress: string;                    // 详细地址
    contactPerson: string;                    // 联系人
    contactPhone: string;                     // 联系电话
    inventory: string;                        // 矿石库存（万吨）
    operatingRate: string;                    // 开工率（%）
    rateChangeReason: string;                 // 开工率变化原因
    monthlyOutput: string;                    // 月产量（万吨）
    maxOutput: string;                        // 最大产能（万吨/月）
    productGrade: string;                     // 产品品位（%）
    wharfName: string;                        // 主要码头名称
    wharfInventory: string;                   // 主要码头库存（万吨）
    salesPrice: string;                       // 销售价格（元/吨）
    salesChannel: string;                     // 销售渠道
    priceChangeReason: string;                // 价格变动原因
    status: string;                           // 状态（DRAFT:草稿, ARCHIVED:已归档）
}

/** 需要保留1位小数的字段类型 */
type DecimalField = 'inventory' | 'monthlyOutput' | 'maxOutput' | 'productGrade' | 'wharfInventory';
/** 需要整数的字段类型 */
type IntegerField = 'operatingRate' | 'salesPrice';

/** 历史数据对比请求载荷结构 */
interface ComparePayload {
    competitorName: string;   // 竞争对手名称
    surveyMonth: string;      // 调研月份
    inventory: number;        // 矿石库存
    operatingRate: number;    // 开工率
}

/**
 * 创建空的表单数据对象
 * @returns 初始化的表单数据
 */
const createEmptyForm = (): CompetitorSurveyForm => ({
    competitorName: '',
    region: null,
    mineType: null,
    surveyMonth: null,
    detailAddress: '',
    contactPerson: '',
    contactPhone: '',
    inventory: '',
    operatingRate: '',
    rateChangeReason: '',
    monthlyOutput: '',
    maxOutput: '',
    productGrade: '',
    wharfName: '',
    wharfInventory: '',
    salesPrice: '',
    salesChannel: '',
    priceChangeReason: '',
    status: '',
});

/** 响应式表单数据 */
const formData = ref<CompetitorSurveyForm>(createEmptyForm());

// ==================== 数字输入归一化 ====================
// 统一用 n-input 承载数字字段，避免 n-input-number 自动格式化造成的编辑体验差异。
/**
 * 规范化整数输入：只保留数字字符，可选最大值限制
 * @param value - 输入值
 * @param max - 最大值限制（可选）
 * @returns 规范化后的字符串
 */
const normalizeInteger = (value: string, max?: number) => {
    const normalized = `${value ?? ''}`.replace(/\D/g, '');
    if (!normalized) return '';
    const numberValue = Number(normalized);
    if (max !== undefined && numberValue > max) return String(max);
    return String(numberValue);
};

/**
 * 规范化小数输入：只保留数字和小数点，最多保留1位小数，可选最大值限制
 * @param value - 输入值
 * @param max - 最大值限制（可选）
 * @returns 规范化后的字符串
 */
const normalizeDecimal = (value: string, max?: number) => {
    const normalized = `${value ?? ''}`
        .replace(/[^\d.]/g, '')
        .replace(/(\..*)\./g, '$1');
    const [integer = '', decimal = ''] = normalized.split('.');
    const nextValue = normalized.includes('.') ? `${integer || '0'}.${decimal.slice(0, 1)}` : integer;
    if (!nextValue) return '';
    const numberValue = Number(nextValue);
    if (max !== undefined && Number.isFinite(numberValue) && numberValue > max) return String(max);
    return nextValue;
};

/**
 * 处理整数输入字段的更新
 * @param field - 字段名
 * @param value - 输入值
 * @param max - 最大值限制（可选）
 */
const handleIntegerInput = (field: IntegerField, value: string, max?: number) => {
    formData.value[field] = normalizeInteger(value, max);
};

/**
 * 处理小数输入字段的更新
 * @param field - 字段名
 * @param value - 输入值
 * @param max - 最大值限制（可选）
 */
const handleDecimalInput = (field: DecimalField, value: string, max?: number) => {
    formData.value[field] = normalizeDecimal(value, max);
};

/**
 * 处理小数输入字段失去焦点时的格式化（确保保留1位小数）
 * @param field - 字段名
 */
const handleDecimalBlur = (field: DecimalField) => {
    const value = formData.value[field];
    if (value) {
        formData.value[field] = Number(value).toFixed(1).replace(/\.0$/, '');
    }
};

/**
 * 处理电话号码输入：只允许数字，最多11位
 * @param value - 输入值
 */
const handlePhoneInput = (value: string) => {
    formData.value.contactPhone = `${value ?? ''}`.replace(/\D/g, '').slice(0, 11);
};

// ==================== 字段映射 ====================
/**
 * 从数据对象中按优先级获取字段值
 * @param data - 数据对象
 * @param keys - 候选键名数组（按优先级排序）
 * @param defaultValue - 默认值
 * @returns 找到的第一个有效值或默认值
 */
const getValue = (data: any, keys: string[], defaultValue: any = '') => {
    const key = keys.find((item) => data?.[item] !== undefined && data?.[item] !== null);
    return key ? data[key] : defaultValue;
};

/**
 * 将值转换为字符串，null/undefined转为空字符串
 * @param value - 任意值
 * @returns 字符串
 */
const toStringValue = (value: any) => (value === null || value === undefined ? '' : `${value}`);


/**
 * 将后端返回的详情数据标准化为表单数据结构
 * 兼容旧页面中的 enterpriseName/oreInventory/mainTerminal* 等字段
 * @param data - 后端返回的原始数据
 * @returns 标准化的表单数据
 */
const normalizeDetailToForm = (data: any, copy = false): CompetitorSurveyForm => ({
    id: copy ? undefined : getValue(data, ['id']),
    competitorName: getValue(data, ['competitorName']),
    region: getValue(data, ['region'], null),
    mineType: getValue(data, ['mineType'], null),
    surveyMonth: getValue(data, ['surveyMonth'], null),
    detailAddress: getValue(data, ['detailAddress']),
    contactPerson: getValue(data, ['contactPerson']),
    contactPhone: getValue(data, ['contactPhone']),
    inventory: toStringValue(getValue(data, ['inventory'])),
    operatingRate: toStringValue(getValue(data, ['operatingRate'])),
    rateChangeReason: getValue(data, ['rateChangeReason']),
    monthlyOutput: toStringValue(getValue(data, ['monthlyOutput'])),
    maxOutput: toStringValue(getValue(data, ['maxOutput'])),
    productGrade: toStringValue(getValue(data, ['productGrade'])),
    wharfName: getValue(data, ['wharfName', 'mainTerminalName']),
    wharfInventory: toStringValue(getValue(data, ['wharfInventory'])),
    salesPrice: toStringValue(getValue(data, ['salesPrice'])),
    salesChannel: getValue(data, ['salesChannel']),
    priceChangeReason: getValue(data, ['priceChangeReason']),
    status: copy ? '' : getValue(data, ['status']),
});

/**
 * 将字符串值转换为数字或undefined
 * @param value - 字符串值
 * @param parser - 解析函数（parseInt或parseFloat）
 * @returns 数字或undefined
 */
const toNumberOrUndefined = (value: string, parser: (value: string) => number) => value ? parser(value) : undefined;

/**
 * 构建提交给后端的载荷数据
 * @param status - 状态（DRAFT:草稿, ARCHIVED:已归档）
 * @returns 提交载荷对象
 */
const buildSubmitPayload = (status: 'DRAFT' | 'ARCHIVED') => ({
    ...(isEdit.value ? { id: route.query.id } : {}),
    competitorName: formData.value.competitorName,
    region: formData.value.region,
    mineType: formData.value.mineType,
    surveyMonth: formData.value.surveyMonth,
    detailAddress: formData.value.detailAddress,
    contactPerson: formData.value.contactPerson,
    contactPhone: formData.value.contactPhone,
    inventory: toNumberOrUndefined(formData.value.inventory, parseFloat),
    operatingRate: toNumberOrUndefined(formData.value.operatingRate, (value) => parseInt(value, 10)),
    rateChangeReason: formData.value.rateChangeReason,
    monthlyOutput: toNumberOrUndefined(formData.value.monthlyOutput, parseFloat),
    maxOutput: toNumberOrUndefined(formData.value.maxOutput, parseFloat),
    productGrade: toNumberOrUndefined(formData.value.productGrade, parseFloat),
    wharfName: formData.value.wharfName,
    wharfInventory: toNumberOrUndefined(formData.value.wharfInventory, parseFloat),
    salesPrice: toNumberOrUndefined(formData.value.salesPrice, (value) => parseInt(value, 10)),
    salesChannel: formData.value.salesChannel,
    priceChangeReason: formData.value.priceChangeReason,
    status,
});

// ==================== 校验规则 ====================
/**
 * 创建必填小数验证规则
 * @param label - 字段中文标签
 * @param max - 最大值限制（可选）
 * @returns 验证规则对象
 */
const createRequiredDecimalRule = (label: string, max?: number) => ({
    required: true,
    trigger: 'blur',
    validator: (_rule: any, value: string) => {
        if (!value) return new Error(`请输入${label}`);
        if (!/^\d+(\.\d{1})?$/.test(value)) return new Error(`${label}需为非负数字，保留1位小数`);
        const numberValue = Number(value);
        if (numberValue < 0) return new Error(`${label}不能为负数`);
        if (max !== undefined && numberValue > max) return new Error(`${label}范围为0-${max}`);
        return true;
    },
});

/**
 * 创建可选小数验证规则
 * @param label - 字段中文标签
 * @param max - 最大值限制（可选）
 * @returns 验证规则对象
 */
const createOptionalDecimalRule = (label: string, max?: number) => ({
    trigger: 'blur',
    validator: (_rule: any, value: string) => {
        if (!value) return true;
        if (!/^\d+(\.\d{1})?$/.test(value)) return new Error(`${label}需为非负数字，保留1位小数`);
        const numberValue = Number(value);
        if (numberValue < 0) return new Error(`${label}不能为负数`);
        if (max !== undefined && numberValue > max) return new Error(`${label}范围为0-${max}`);
        return true;
    },
});

/**
 * 创建必填整数验证规则
 * @param label - 字段中文标签
 * @param max - 最大值限制（可选）
 * @returns 验证规则对象
 */
const createRequiredIntegerRule = (label: string, max?: number) => ({
    required: true,
    trigger: 'blur',
    validator: (_rule: any, value: string) => {
        if (!value) return new Error(`请输入${label}`);
        if (!/^\d+$/.test(value)) return new Error(`${label}需为整数`);
        const numberValue = Number(value);
        if (numberValue < 0) return new Error(`${label}不能为负数`);
        if (max !== undefined && numberValue > max) return new Error(`${label}范围为0-${max}`);
        return true;
    },
});

/** 表单验证规则配置 */
const rules = {
    competitorName: { required: true, message: '请填写竞争对手名称', trigger: 'blur', saveOnly: true },
    region: { required: true, message: '请选择区域', trigger: 'change' },
    mineType: { required: true, message: '请选择矿山类型', trigger: 'change' },
    surveyMonth: { required: true, message: '请选择调研月份', trigger: 'change', saveOnly: true },
    inventory: { ...createRequiredDecimalRule('矿石库存'), saveOnly: true },
    operatingRate: { ...createRequiredIntegerRule('开工率', 100), saveOnly: true },
    monthlyOutput: createRequiredDecimalRule('月产量'),
    maxOutput: createOptionalDecimalRule('最大产能'),
    productGrade: createRequiredDecimalRule('产品品位', 100),
    wharfName: { required: true, message: '请输入主要码头名称', trigger: 'blur' },
    wharfInventory: createRequiredDecimalRule('主要码头库存'),
    salesPrice: createRequiredIntegerRule('销售价格'),
};

// ==================== 历史数据对比逻辑 ====================
/**
 * 检查值是否有有效输入
 * @param value - 待检查的值
 * @returns 是否有有效值
 */
const hasInputValue = (value: any) => value !== null && value !== undefined && `${value}`.trim() !== '';

/**
 * 获取历史数据对比的请求载荷
 * @returns 对比载荷或null（当必填字段不完整时）
 */
const getComparePayload = (): ComparePayload | null => {
    const { competitorName, surveyMonth, inventory, operatingRate } = formData.value;
    if (![competitorName, surveyMonth, inventory, operatingRate].every(hasInputValue)) {
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
        competitorName,
        surveyMonth: surveyMonth as string,
        inventory: Number(inventory),
        operatingRate: operatingRateValue,
    };
};

/**
 * 格式化差异数值，无效值返回 '--'
 * @param value - 原始数值
 * @param suffix - 后缀单位（如 '%'、'万吨'）
 * @returns 格式化后的字符串
 */
const formatDiffNumber = (value: any, suffix = '') => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '--';
    return `${numberValue}${suffix}`;
};

/**
 * 从后端对比结果中提取差异项列表
 * @param data - 后端返回的对比数据
 * @returns 差异项数组
 */
const getDifferenceItems = (data: any): HistoryDifferenceItem[] => {
    const items: HistoryDifferenceItem[] = [];
    if (data?.inventoryExceeded) {
        items.push({
            name: '矿石库存',
            history: formatDiffNumber(data.historyInventory, '万吨'),
            current: formatDiffNumber(data.currentInventory, '万吨'),
            diff: formatDiffNumber(data.inventoryDiff, '%'),
        });
    }
    if (data?.operatingRateExceeded) {
        items.push({
            name: '开工率',
            history: formatDiffNumber(data.historyOperatingRate, '%'),
            current: formatDiffNumber(data.currentOperatingRate, '%'),
            diff: formatDiffNumber(data.operatingRateDiff, '%'),
        });
    }
    return items;
};

/**
 * 关闭历史对比弹窗并 resolve Promise
 * @param canContinue - 用户是否确认继续
 */
const closeHistoryDiffModal = (canContinue: boolean) => {
    historyDiffVisible.value = false;
    historyDiffResolve?.(canContinue);
    historyDiffResolve = null;
};

/** 用户取消历史对比弹窗 */
const handleHistoryDiffCancel = () => closeHistoryDiffModal(false);

/** 用户确认历史对比弹窗 */
const handleHistoryDiffConfirm = () => closeHistoryDiffModal(true);

/** 弹窗显示状态变化回调（处理外部关闭场景） */
const handleHistoryDiffShowChange = (show: boolean) => {
    if (!show && historyDiffResolve) {
        closeHistoryDiffModal(false);
    }
};

/**
 * 打开历史对比弹窗，返回 Promise 等待用户操作
 * @param data - 后端返回的对比结果
 * @returns 用户是否确认继续
 */
const openHistoryDiffModal = (data: any): Promise<boolean> => {
    historyDiffSummary.value = `检测到当前数据与历史调研数据存在明显差异${data?.historySurveyMonth ? `，历史月份：${data.historySurveyMonth}` : ''}。`;
    historyDiffItems.value = getDifferenceItems(data);
    historyDiffVisible.value = true;

    return new Promise<boolean>((resolve) => {
        historyDiffResolve = resolve;
    });
};

/**
 * 提交前调用后端接口进行历史数据对比
 * 无差异或载荷不完整时直接放行；有差异时弹窗等待用户确认
 * @returns 是否可以继续提交
 */
const confirmHistoryDifference = async (): Promise<boolean> => {
    const payload = getComparePayload();
    if (!payload) return true;
    const res = await compareCompetitorWithHistoryApi(payload);
    if (res?.code !== 200 || res.data?.hasDifference !== true) return true;

    return openHistoryDiffModal(res.data);
};

/**
 * 验证表单数据
 * @param saveOnly - 是否只执行保存所需字段校验
 * @returns 验证是否通过
 */
const validateForm = async (saveOnly = false) => {
    try {
        await formRef.value?.validate(
            undefined,
            saveOnly ? (rule: any) => rule.saveOnly === true : undefined,
        );
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * 处理保存或提交操作
 * 流程：表单校验 → 历史数据对比确认 → 调用保存/更新接口
 * @param status - 状态（DRAFT:草稿, ARCHIVED:已归档）
 */
const handleSaveOrSubmit = async (status: 'DRAFT' | 'ARCHIVED') => {
    const canProceed = await validateForm(status === 'DRAFT');
    if (!canProceed) return;
    // 提交前进行历史数据对比，用户取消则中止
    const canContinue = await confirmHistoryDifference();
    if (!canContinue) return;
    const payload = buildSubmitPayload(status);
    const res = isEdit.value ? await updateCompetitorApi(payload) : await createCompetitorApi(payload);
    if (res?.code === 200) {
        message.success(status === 'DRAFT' ? '保存成功（草稿）' : '提交成功（已归档）');
        router.back();
    }
};

/** 保存为草稿 */
const handleSave = () => handleSaveOrSubmit('DRAFT');
/** 提交并归档 */
const handleSubmit = () => handleSaveOrSubmit('ARCHIVED');

/**
 * 加载编辑数据（仅在编辑模式下调用）
 */
const loadEditData = async () => {
    const sourceId = route.query.id || route.query.copyId;
    if (!sourceId) {
        const now = new Date();
        formData.value.surveyMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return;
    }
    try {
        const res = await queryCompetitorDetailApi(sourceId);
        if (res?.code === 200) {
            formData.value = normalizeDetailToForm(res.data || {}, isCopy.value);
        }
    } catch (error) {
        console.error('加载竞争对手调研数据失败:', error);
    }
};

/**
 * 组件挂载时的初始化逻辑
 */
onMounted(async () => {
    await loadEditData();
});
</script>

<style scoped lang="less">
:deep(.component_page_content_box) {
    height: auto !important;
}


.competitor-add-container {
    padding: 16px;

    .add-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px 0;
    }
}

/* 历史数据对比弹窗样式 */
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
