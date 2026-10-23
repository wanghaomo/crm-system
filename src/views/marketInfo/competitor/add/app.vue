<template>
    <AppPage :showList="false" :showSearch="false" :title="pageTitle" noPadding>
        <template #content>
            <div class="competitor-add-page">
                <Form ref="formRef" class="competitor-form" @submit="handleSubmit">
                    <!-- 竞争对手名称 -->
                    <Field
                        v-model="formData.competitorName"
                        name="competitorName"
                        label="竞争对手名称"
                        placeholder="请填写"
                        required
                        maxlength="30"
                        :rules="[{ required: true, message: '请填写竞争对手名称' }]" />
                    <!-- 区域 -->
                    <Field
                        v-model="regionLabel"
                        name="region"
                        label="区域"
                        placeholder="请选择"
                        required
                        readonly
                        is-link
                        :rules="[{ required: true, message: '请选择区域' }]"
                        @click="showRegionPicker = true" />
                    <!-- 矿山类型 -->
                    <Field
                        v-model="mineTypeLabel"
                        name="mineType"
                        label="矿山类型"
                        placeholder="请选择"
                        required
                        readonly
                        is-link
                        :rules="[{ required: true, message: '请选择矿山类型' }]"
                        @click="showMineTypePicker = true" />
                    <!-- 调研月份 -->
                    <Field
                        v-model="formData.surveyMonth"
                        name="surveyMonth"
                        label="调研月份"
                        placeholder="请选择"
                        required
                        readonly
                        is-link
                        :rules="[{ required: true, message: '请选择调研月份' }]"
                        @click="showMonthPicker = true" />
                    <!-- 详细地址 -->
                    <Field v-model="formData.detailAddress" label="详细地址" placeholder="请输入" maxlength="100" />
                    <!-- 联系人 -->
                    <Field v-model="formData.contactPerson" label="联系人" placeholder="请输入" maxlength="30" />
                    <!-- 联系电话 -->
                    <Field
                        v-model="formData.contactPhone"
                        label="联系电话"
                        placeholder="请输入"
                        maxlength="11"
                        type="tel"
                        @update:model-value="handlePhoneInput" />
                    <!-- 矿山库存(万吨)：最多一位小数，最大输入100亿 -->
                    <Field
                        v-model="formData.inventory"
                        name="inventory"
                        label="矿山库存(万吨)"
                        placeholder="请输入"
                        required
                        type="number"
                        :min="0"
                        :max="10000000000"
                        :rules="[createRequiredDecimalRule('矿山库存')]"
                        @update:model-value="(value) => handleDecimalInput('inventory', value)"
                        @blur="() => handleDecimalBlur('inventory')" />
                    <!-- 开工率(%)：整数，范围0-100 -->
                    <Field
                        v-model="formData.operatingRate"
                        name="operatingRate"
                        label="开工率(%)"
                        placeholder="请输入"
                        required
                        type="number"
                        :min="0"
                        :max="100"
                        :rules="[createRequiredIntegerRule('开工率', 100)]"
                        @update:model-value="(value) => handleIntegerInput('operatingRate', value, 100)" />
                    <!-- 开工率变化原因：最多500字 -->
                    <Field
                        v-model="formData.rateChangeReason"
                        class="textarea-field"
                        label="开工率变化原因"
                        placeholder="请输入"
                        type="textarea"
                        maxlength="500"
                        autosize
                        show-word-limit />
                    <!-- 月产量(万吨)：最多一位小数，最大输入100亿 -->
                    <Field
                        v-model="formData.monthlyOutput"
                        name="monthlyOutput"
                        label="月产量(万吨)"
                        placeholder="请输入"
                        required
                        type="number"
                        :min="0"
                        :max="10000000000"
                        :rules="[createRequiredDecimalRule('月产量')]"
                        @update:model-value="(value) => handleDecimalInput('monthlyOutput', value)"
                        @blur="() => handleDecimalBlur('monthlyOutput')" />
                    <!-- 最大产能(万吨/月)：最多一位小数 -->
                    <Field
                        v-model="formData.maxOutput"
                        label="最大产能(万吨/月)"
                        placeholder="请输入"
                        type="number"
                        :min="0"
                        :max="10000000000"
                        @update:model-value="(value) => handleDecimalInput('maxOutput', value)"
                        @blur="() => handleDecimalBlur('maxOutput')" />
                    <!-- 产品品位(%)：最多一位小数，范围0-100 -->
                    <Field
                        v-model="formData.productGrade"
                        name="productGrade"
                        label="产品品位(%)"
                        placeholder="请输入"
                        required
                        type="number"
                        :min="0"
                        :max="100"
                        :rules="[createRequiredDecimalRule('产品品位', 100)]"
                        @update:model-value="(value) => handleDecimalInput('productGrade', value, 100)"
                        @blur="() => handleDecimalBlur('productGrade')" />
                    <!-- 主要码头名称 -->
                    <Field
                        v-model="formData.wharfName"
                        name="wharfName"
                        label="主要码头名称"
                        placeholder="请输入"
                        required
                        maxlength="30"
                        :rules="[{ required: true, message: '请输入主要码头名称' }]" />
                    <!-- 主要码头库存(万吨)：最多一位小数，最大输入100亿 -->
                    <Field
                        v-model="formData.wharfInventory"
                        name="wharfInventory"
                        label="主要码头库存(万吨)"
                        placeholder="请输入"
                        required
                        type="number"
                        :min="0"
                        :max="10000000000"
                        :rules="[createRequiredDecimalRule('主要码头库存')]"
                        @update:model-value="(value) => handleDecimalInput('wharfInventory', value)"
                        @blur="() => handleDecimalBlur('wharfInventory')" />
                    <!-- 销售价格(元/吨)：整数，最大输入100亿 -->
                    <Field
                        v-model="formData.salesPrice"
                        name="salesPrice"
                        label="销售价格(元/吨)"
                        placeholder="请输入"
                        required
                        type="number"
                        :min="0"
                        :max="10000000000"
                        :rules="[createRequiredIntegerRule('销售价格')]"
                        @update:model-value="(value) => handleIntegerInput('salesPrice', value)" />
                    <!-- 销售渠道 -->
                    <Field v-model="formData.salesChannel" label="销售渠道" placeholder="请输入" maxlength="200" />
                    <!-- 价格变动原因 -->
                    <Field
                        v-model="formData.priceChangeReason"
                        class="textarea-field"
                        label="价格变动原因"
                        placeholder="请输入"
                        type="textarea"
                        maxlength="500"
                        autosize
                        show-word-limit />
                </Form>
            </div>
        </template>

        <!-- 底部操作按钮 -->
        <template #footer>
            <div class="footer-actions">
                <Button class="save-btn" plain type="primary" @click="handleSave" style="font-size: 16px;">保存</Button>
                <Button class="submit-btn" type="primary" @click="handleSubmit" style="font-size: 16px;">提交</Button>
            </div>
        </template>
    </AppPage>

    <!-- 页面加载遮罩 -->
    <Overlay :show="loading" class="page-loading-overlay">
        <div class="page-loading-box">
            <Loading color="#fff" vertical>加载中...</Loading>
        </div>
    </Overlay>

    <!-- 调研月份选择器 -->
    <Popup v-model:show="showMonthPicker" position="bottom">
        <DatePicker
            v-model="monthPickerValue"
            title="调研月份"
            :columns-type="['year', 'month']"
            @confirm="onMonthConfirm"
            @cancel="showMonthPicker = false" />
    </Popup>

    <!-- 区域选择器 -->
    <ActionSheet v-model:show="showRegionPicker" title="区域">
        <div class="simple-options">
            <div v-for="item in regionOptions" :key="item.value" class="select-row" @click="selectRegion(item)">
                {{ item.label }}
            </div>
        </div>
    </ActionSheet>

    <!-- 矿山类型选择器 -->
    <ActionSheet v-model:show="showMineTypePicker" title="矿山类型">
        <div class="simple-options">
            <div v-for="item in mineTypeOptions" :key="item.value" class="select-row" @click="selectMineType(item)">
                {{ item.label }}
            </div>
        </div>
    </ActionSheet>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ActionSheet, Button, DatePicker, Field, Form, Loading, Overlay, Popup, showDialog, showToast } from 'vant';
import dayjs from 'dayjs';
import AppPage from '@/appComponents/AppPage/index.vue';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import {
    compareCompetitorWithHistoryApi,
    createCompetitorApi,
    queryCompetitorDetailApi,
    updateCompetitorApi,
} from '@/api/competitor';

// ---------- 类型定义 ----------

/** 竞争对手调研表单 */
interface CompetitorSurveyForm {
    id?: string;
    competitorName: string;
    region: string | null;
    mineType: string | null;
    surveyMonth: string | null;
    detailAddress: string;
    contactPerson: string;
    contactPhone: string;
    inventory: string;
    operatingRate: string;
    rateChangeReason: string;
    monthlyOutput: string;
    maxOutput: string;
    productGrade: string;
    wharfName: string;
    wharfInventory: string;
    salesPrice: string;
    salesChannel: string;
    priceChangeReason: string;
    status: string;
}

/** 小数输入字段 */
type DecimalField = 'inventory' | 'monthlyOutput' | 'maxOutput' | 'productGrade' | 'wharfInventory';
/** 整数输入字段 */
type IntegerField = 'operatingRate' | 'salesPrice';
/** 选项类型 */
type OptionItem = { label: string; value: string };

// ---------- 路由与表单 ----------

const route = useRoute();
const router = useRouter();
const formRef = ref<any>(null);

const isCopy = computed(() => !!route.query.copyId);
const isEdit = computed(() => !!route.query.id && !isCopy.value);
const pageTitle = computed(() => {
    if (isCopy.value) return '复制竞争对手调研';
    return isEdit.value ? '编辑竞争对手调研' : '新增竞争对手调研';
});
const loading = ref(true);

// ---------- 表单数据 ----------

/** 创建空表单 */
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

const formData = ref<CompetitorSurveyForm>(createEmptyForm());
const regionLabel = ref('');
const mineTypeLabel = ref('');

// ---------- 选择器状态 ----------

const showMonthPicker = ref(false);
const showRegionPicker = ref(false);
const showMineTypePicker = ref(false);
const monthPickerValue = ref<string[]>(dayjs().format('YYYY-MM').split('-'));

// ---------- 字典选项（带默认兜底） ----------

const defaultRegionOptions: OptionItem[] = [];
const defaultMineTypeOptions: OptionItem[] = [];
const regionOptions = ref<OptionItem[]>(defaultRegionOptions);
const mineTypeOptions = ref<OptionItem[]>(defaultMineTypeOptions);

// ---------- 输入规范化 ----------

/**
 * 规范整数输入：去除非数字字符，限制最大值
 * @param value - 原始输入值
 * @param max - 可选的最大值限制，超出则截断为最大值
 */
const normalizeInteger = (value: string, max?: number) => {
    const normalized = `${value ?? ''}`.replace(/\D/g, '');
    if (!normalized) return '';
    const numberValue = Number(normalized);
    if (max !== undefined && numberValue > max) return String(max);
    return String(numberValue);
};

/**
 * 规范小数输入：只允许数字和小数点，保留最多一位小数，限制最大值
 * 参考化工企业调研新增页的实现（normalizeDecimal）
 * @param value - 原始输入值
 * @param max - 可选的最大值限制，超出则截断为最大值
 */
const normalizeDecimal = (value: string, max?: number) => {
    // 去除非数字和小数点字符，并确保只有一个小数点
    const normalized = `${value ?? ''}`.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    const [integer = '', decimal = ''] = normalized.split('.');
    // 处理 ".123" 这种以小数点开头的输入，补0前缀
    if (!integer && normalized.includes('.')) return '0.';
    // 限制小数位数为1位
    const nextValue = normalized.includes('.') ? `${integer}.${decimal.slice(0, 1)}` : integer;
    if (!nextValue) return '';
    const numberValue = Number(nextValue);
    if (max !== undefined && Number.isFinite(numberValue) && numberValue > max) return String(max);
    return nextValue;
};

/**
 * 整数字段输入处理：过滤非数字，限制最大值
 * @param field - 表单字段名
 * @param value - 输入值
 * @param max - 可选的最大值
 */
const handleIntegerInput = (field: IntegerField, value: string, max?: number) => {
    formData.value[field] = normalizeInteger(value, max);
};

/**
 * 小数字段输入处理：保留最多一位小数，限制最大值
 * @param field - 表单字段名
 * @param value - 输入值
 * @param max - 可选的最大值
 */
const handleDecimalInput = (field: DecimalField, value: string, max?: number) => {
    formData.value[field] = normalizeDecimal(value, max);
};

/**
 * 小数字段失焦后补齐一位小数并去除末尾多余的0（如 "1.0" → "1"，"1.5" → "1.5"）
 * @param field - 表单字段名
 */
const handleDecimalBlur = (field: DecimalField) => {
    const value = formData.value[field];
    if (value) formData.value[field] = Number(value).toFixed(1).replace(/\.0$/, '');
};

/**
 * 联系电话只允许数字，最多11位
 * @param value - 输入值
 */
const handlePhoneInput = (value: string) => {
    formData.value.contactPhone = `${value ?? ''}`.replace(/\D/g, '').slice(0, 11);
};

// ---------- 校验规则 ----------

/**
 * 必填小数校验：最多一位小数
 * @param label - 字段中文名，用于错误提示
 * @param max - 可选的最大值限制
 */
const createRequiredDecimalRule = (label: string, max?: number) => ({
    validator: (value: string) => {
        if (!value) return `请输入${label}`;
        if (!/^\d+(\.\d{1})?$/.test(value)) return `${label}需为非负数字，最多保留1位小数`;
        const numberValue = Number(value);
        if (numberValue < 0) return `${label}不能为负数`;
        if (max !== undefined && numberValue > max) return `${label}范围为0-${max}`;
        return true;
    },
});

/**
 * 必填整数校验
 * @param label - 字段中文名，用于错误提示
 * @param max - 可选的最大值限制
 */
const createRequiredIntegerRule = (label: string, max?: number) => ({
    validator: (value: string) => {
        if (!value) return `请输入${label}`;
        if (!/^\d+$/.test(value)) return `${label}需为整数`;
        const numberValue = Number(value);
        if (numberValue < 0) return `${label}不能为负数`;
        if (max !== undefined && numberValue > max) return `${label}范围为0-${max}`;
        return true;
    },
});

// ---------- 数据转换 ----------

/**
 * 从接口返回中按候选字段名取值，兼容新增和详情接口字段差异
 * @param data - 接口返回的数据对象
 * @param keys - 候选字段名列表，按优先级排列
 * @param defaultValue - 未找到时的默认值
 */
const getValue = (data: any, keys: string[], defaultValue: any = '') => {
    const key = keys.find((item) => data?.[item] !== undefined && data?.[item] !== null);
    return key ? data[key] : defaultValue;
};

/**
 * 将任意值安全转为字符串，null/undefined 转为空字符串
 */
const toStringValue = (value: any) => (value === null || value === undefined ? '' : `${value}`);

/**
 * 从选项列表中根据值获取对应的 label
 */
const getOptionLabel = (options: OptionItem[], value: string | null) =>
    options.find((item) => item.value === value)?.label || value || '';

/**
 * 将详情接口数据统一整理成表单结构，兼容多种字段名
 * 参考化工企业调研新增页的 normalizeDetailToForm
 */
const normalizeDetailToForm = (data: any, copy = false): CompetitorSurveyForm => ({
    ...createEmptyForm(),
    id: copy ? undefined : getValue(data, ['id']),
    competitorName: getValue(data, ['competitorName', 'enterpriseName']),
    region: getValue(data, ['region'], null),
    mineType: getValue(data, ['mineType'], null),
    surveyMonth: getValue(data, ['surveyMonth'], null),
    detailAddress: getValue(data, ['detailAddress']),
    contactPerson: getValue(data, ['contactPerson']),
    contactPhone: getValue(data, ['contactPhone']),
    inventory: toStringValue(getValue(data, ['inventory', 'oreInventory'])),
    operatingRate: toStringValue(getValue(data, ['operatingRate'])),
    rateChangeReason: getValue(data, ['rateChangeReason']),
    monthlyOutput: toStringValue(getValue(data, ['monthlyOutput'])),
    maxOutput: toStringValue(getValue(data, ['maxOutput'])),
    productGrade: toStringValue(getValue(data, ['productGrade'])),
    wharfName: getValue(data, ['wharfName', 'mainTerminalName']),
    wharfInventory: toStringValue(getValue(data, ['wharfInventory', 'mainTerminalInventory'])),
    salesPrice: toStringValue(getValue(data, ['salesPrice'])),
    salesChannel: getValue(data, ['salesChannel']),
    priceChangeReason: getValue(data, ['priceChangeReason']),
    status: copy ? '' : getValue(data, ['status']),
});

// ---------- Label 同步 ----------

/**
 * 根据表单值同步页面展示用的 label（区域名、矿山类型名）和月份选择器值
 */
const syncLabels = () => {
    regionLabel.value = getOptionLabel(regionOptions.value, formData.value.region);
    mineTypeLabel.value = getOptionLabel(mineTypeOptions.value, formData.value.mineType);
    if (formData.value.surveyMonth) monthPickerValue.value = formData.value.surveyMonth.split('-');
};

// ---------- 选择器事件 ----------

/** 选择区域字典项 */
const selectRegion = (option: OptionItem) => {
    formData.value.region = option.value;
    regionLabel.value = option.label;
    showRegionPicker.value = false;
};

/** 选择矿山类型字典项 */
const selectMineType = (option: OptionItem) => {
    formData.value.mineType = option.value;
    mineTypeLabel.value = option.label;
    showMineTypePicker.value = false;
};

/** 确认调研月份选择 */
const onMonthConfirm = ({ selectedValues }: any) => {
    formData.value.surveyMonth = selectedValues.join('-');
    monthPickerValue.value = selectedValues;
    showMonthPicker.value = false;
};

// ---------- 提交参数构建 ----------

/**
 * 将字符串数值安全转为数字或 undefined
 * @param value - 字符串值
 * @param parser - 解析函数（parseFloat 或 parseInt）
 */
const toNumberOrUndefined = (value: string, parser: (value: string) => number) => (value ? parser(value) : undefined);

/**
 * 组装保存/提交参数，数值字段转为接口需要的 number 类型
 * @param status - DRAFT（草稿）或 ARCHIVED（归档）
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

// ---------- 表单校验 ----------

/**
 * 触发表单校验
 * @param fields 指定校验的字段；不传时执行全量校验
 * @returns true 校验通过，false 校验失败
 */
const validateForm = async (fields?: string[]) => {
    try {
        await formRef.value?.validate(fields);
        return true;
    } catch {
        return false;
    }
};

// ---------- 历史数据对比 ----------

/**
 * 构建历史数据对比参数
 * 要求库存、开工率已填写且格式正确后才触发对比
 */
const getComparePayload = () => {
    const { competitorName, surveyMonth, inventory, operatingRate } = formData.value;
    if (![competitorName, surveyMonth, inventory, operatingRate].every((item) => `${item ?? ''}`.trim())) return null;
    // 库存支持最多1位小数，开工率为整数
    if (!/^\d+(\.\d{1})?$/.test(inventory) || !/^\d+$/.test(operatingRate)) return null;
    const operatingRateValue = Number(operatingRate);
    if (operatingRateValue < 0 || operatingRateValue > 100) return null;
    return {
        competitorName,
        surveyMonth,
        inventory: Number(inventory),
        operatingRate: operatingRateValue,
    };
};

/**
 * 格式化差异数值展示
 * @param value - 数值
 * @param suffix - 单位后缀，如"万吨"、"%"
 */
const formatDiffNumber = (value: any, suffix = '') => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '--';
    return `${numberValue}${suffix}`;
};

/**
 * 整理历史数据对比差异提示文案
 * @param data - 对比接口返回的差异数据
 */
const getDifferenceTips = (data: any) => {
    const tips: string[] = [];
    if (data?.inventoryExceeded) {
        tips.push(
            `库存：历史${formatDiffNumber(data.historyInventory, '万吨')}，当前${formatDiffNumber(
                data.currentInventory,
                '万吨'
            )}，差异${formatDiffNumber(data.inventoryDiff)}`
        );
    }
    if (data?.operatingRateExceeded) {
        tips.push(
            `开工率：历史${formatDiffNumber(data.historyOperatingRate, '%')}，当前${formatDiffNumber(
                data.currentOperatingRate,
                '%'
            )}，差异${formatDiffNumber(data.operatingRateDiff)}`
        );
    }
    return tips;
};

/**
 * 保存/提交前对比历史数据，存在明显差异时弹窗让用户二次确认
 * 参考化工企业调研新增页的 confirmHistoryDifference
 * @returns true 用户确认继续提交，false 用户取消
 */
const confirmHistoryDifference = async () => {
    const payload = getComparePayload();
    if (!payload) return true;
    try {
        const res = await compareCompetitorWithHistoryApi(payload);
        if (res?.code !== 200 || res.data?.hasDifference !== true) return true;
        const tips = getDifferenceTips(res.data);
        const messageLines = [
            '检测到当前数据与历史调研数据存在明显差异。',
            res.data?.historySurveyMonth ? `历史月份：${res.data.historySurveyMonth}` : '',
            ...(tips.length ? tips.map((item) => `- ${item}`) : ['- 库存或开工率与历史数据差异超过阈值。']),
            '请确认数据无误后继续保存或提交。',
        ].filter(Boolean);

        try {
            await showDialog({
                title: '历史数据对比提醒',
                message: messageLines.join('\n'),
                messageAlign: 'left',
                showCancelButton: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirmButtonColor: '#2c65f2',
            });
            return true; // 用户点击确认，继续提交
        } catch {
            return false; // 用户点击取消，中断提交
        }
    } catch {
        // 对比接口异常不阻塞提交流程
    }
    return true;
};

// ---------- 保存/提交 ----------

/**
 * 保存或提交：校验 → 历史数据对比 → 构建参数 → 调接口
 * @param status - DRAFT（草稿）或 ARCHIVED（归档）
 */
const handleSaveOrSubmit = async (status: 'DRAFT' | 'ARCHIVED') => {
    const saveRequiredFields = ['competitorName', 'surveyMonth', 'inventory', 'operatingRate'];
    const valid = await validateForm(status === 'DRAFT' ? saveRequiredFields : undefined);
    if (!valid) return;
    // 提交保存时进行历史数据对比，用户确认后继续，取消则中断
    const confirmed = await confirmHistoryDifference();
    if (!confirmed) return;
    const payload = buildSubmitPayload(status);
    const res = isEdit.value ? await updateCompetitorApi(payload) : await createCompetitorApi(payload);
    if (res?.code === 200) {
        showToast(status === 'DRAFT' ? '保存成功' : '提交成功');
        router.back();
    }
};

/** 保存为草稿 */
const handleSave = () => handleSaveOrSubmit('DRAFT');

/** 提交并归档 */
const handleSubmit = () => handleSaveOrSubmit('ARCHIVED');

// ---------- 数据加载 ----------

/**
 * 加载字典数据（区域、矿山类型）
 * 接口返回为空时使用前端默认选项兜底
 */
const loadDictData = async () => {
    const res = await getDictMapApi({ parentCodes: [enumCfg['区域类型'], enumCfg['矿山类型']] });
    if (res?.code === 200) {
        const regionList = res.data?.[enumCfg['区域类型']] || [];
        const mineTypeList = res.data?.[enumCfg['矿山类型']] || [];
        regionOptions.value = regionList.length
            ? regionList.map((item: any) => ({ label: item.name, value: item.code }))
            : defaultRegionOptions;
        mineTypeOptions.value = mineTypeList.length
            ? mineTypeList.map((item: any) => ({ label: item.name, value: item.code }))
            : defaultMineTypeOptions;
    }
};

/**
 * 加载编辑数据或初始化新增表单
 * - 编辑模式：根据 id 查询详情并回填
 * - 新增模式：默认调研月份为当前月份
 */
const loadEditData = async () => {
    const sourceId = route.query.id || route.query.copyId;
    if (!sourceId) {
        // 新增时默认调研月份为当前月份
        formData.value.surveyMonth = dayjs().format('YYYY-MM');
        syncLabels();
        loading.value = false;
        return;
    }
    try {
        const res = await queryCompetitorDetailApi(sourceId);
        if (res?.code === 200) {
            formData.value = normalizeDetailToForm(res.data || {}, isCopy.value);
            syncLabels();
        }
    } catch (error) {
        console.error('加载竞争对手调研数据失败:', error);
    } finally {
        loading.value = false;
    }
};

// ---------- 初始化 ----------

onMounted(async () => {
    await loadDictData();
    await loadEditData();
});
</script>

<style lang="less" scoped>
// ---------- 页面容器 ----------
.competitor-add-page {
    padding: 8px 8px 64px;
}

// ---------- 页面加载遮罩 ----------
.page-loading-overlay {
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.38);
}

.page-loading-box {
    min-width: 96px;
    padding: 18px 20px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.68);
    display: flex;
    align-items: center;
    justify-content: center;
}

// ---------- 表单样式 ----------
.competitor-form {
    overflow: hidden;
    border-radius: 6px;
    background: #fff;

    :deep(.van-cell) {
        padding: 11px 12px;
        align-items: flex-start;
        font-size: 16px;
    }

    :deep(.van-field__label) {
        width: 96px;
        color: #666;
    }

    :deep(.van-field__control) {
        color: #333;
        text-align: left;
    }

    :deep(.van-field__word-limit) {
        color: #b6bac2;
    }

    .textarea-field {
        :deep(.van-cell) {
            flex-direction: column;
            align-items: flex-start;
        }

        :deep(.van-cell__title) {
            width: 100%;
            flex: none;
            max-width: 100%;
        }

        :deep(.van-cell__value) {
            width: 100%;
            flex: none;
        }

        :deep(.van-field__label) {
            line-height: 22px;
        }

        :deep(.van-field__control) {
            min-height: 96px;
        }
    }
}

// ---------- 底部按钮 ----------
.footer-actions {
    display: flex;
    gap: 14px;
    padding: 8px 18px 10px;
    background: #fff;

    .save-btn,
    .submit-btn {
        flex: 1;
        height: 38px;
        border-radius: 3px;
        font-size: 16px;
        font-weight: 500;
        --van-button-primary-background: #2c65f2;
        --van-button-primary-border-color: #2c65f2;
    }
}

// ---------- 选择器选项列表 ----------
.simple-options {
    max-height: 60vh;
    overflow-y: auto;
    background: #fff;
}

.select-row {
    padding: 14px 16px;
    font-size: 15px;
    color: #333;
    border-bottom: 1px solid #f0f1f4;
}
</style>
