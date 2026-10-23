<template>
    <AppPage :showList="false" :showSearch="false" :title="pageTitle" noPadding>
        <template #content>
            <div class="chemical-add-page">
                <Form ref="formRef" class="chemical-form" @submit="handleSubmit">
                    <Field v-model="enterpriseLabel" name="enterpriseName" label="企业名称" placeholder="请选择(可填写)" required readonly is-link :rules="[{ required: true, message: '请选择企业名称' }]" @click="showEnterprisePicker = true" />
                    <Field v-model="regionLabel" name="region" label="区域" placeholder="请选择" required readonly is-link :rules="[{ required: true, message: '请选择区域' }]" @click="showRegionPicker = true" />
                    <Field v-model="formData.surveyMonth" name="surveyMonth" label="调研月份" placeholder="请选择" required readonly is-link :rules="[{ required: true, message: '请选择调研月份' }]" @click="showMonthPicker = true" />
                    <Field v-model="formData.detailAddress" label="详细地址" placeholder="请输入" maxlength="100" />
                    <Field v-model="formData.contactPerson" label="联系人" placeholder="请输入" maxlength="100" />
                    <Field v-model="formData.contactPhone" label="联系电话" placeholder="请输入" maxlength="11" type="tel" />
                    <Field required v-model="formData.inventory" name="inventory" label="库存情况(万吨)" placeholder="请输入" type="number" :min="0" :rules="inventoryRules" @update:model-value="(value) => handleDecimalInput('inventory', value)"
                        @blur="() => handleDecimalBlur('inventory', 10000000000, '库存情况')" />
                    <Field required v-model="formData.operatingRate" name="operatingRate" label="开工率(%)" placeholder="请输入" type="number" :min="0" :rules="operatingRateRules" @update:model-value="(value) => handleDecimalInput('operatingRate', value)"
                        @blur="() => handleDecimalBlur('operatingRate', 100, '开工率')" />
                    <Field v-model="formData.rateChangeReason" class="textarea-field" label="开工率变化原因" placeholder="请输入" type="textarea" maxlength="500" autosize show-word-limit />
                    <Field v-model="formData.mainProductScale" class="textarea-field" name="mainProductScale" label="企业主要产品规模" placeholder="请输入" required type="textarea" maxlength="500" autosize show-word-limit :rules="[{ required: true, message: '请输入企业主要产品规模' }]" />
                    <Field v-model="formData.mainProductPrice" label="主要产品价格(元/吨)" placeholder="请输入" type="number" :min="0" @update:model-value="(value) => handleDecimalInput('mainProductPrice', value)" @blur="() => handleDecimalBlur('mainProductPrice', 10000000000, '主要产品价格')" />
                    <Field v-model="formData.nextMonthPlan" name="nextMonthPlan" label="下月采购计划(万吨)" placeholder="请输入" required type="number" :min="0" :rules="nextMonthPlanRules" @update:model-value="(value) => handleDecimalInput('nextMonthPlan', value)"
                        @blur="() => handleDecimalBlur('nextMonthPlan', 10000000000, '下月采购计划')" />
                    <Field v-model="purchaseProductTypeLabel" name="purchaseProductType" label="采购产品类型" placeholder="请选择" readonly is-link :rules="[{ required: false, message: '请选择采购产品类型' }]" @click="showPurchaseTypePicker = true" />
                    <Field v-model="formData.purchaseBudget" label="采购预算(万元)" placeholder="请输入" type="number" :min="0" @update:model-value="(value) => handleDecimalInput('purchaseBudget', value)" @blur="() => handleDecimalBlur('purchaseBudget', 10000000000, '采购预算')" />
                </Form>
            </div>
        </template>
        <template #footer>
            <div class="footer-actions">
                <Button class="save-btn" plain type="primary" @click="handleSave" style="font-size: 16px;">保存</Button>
                <Button class="submit-btn" type="primary" @click="handleSubmit" style="font-size: 16px;">提交</Button>
            </div>
        </template>
    </AppPage>

    <Overlay :show="loading" class="page-loading-overlay">
        <div class="page-loading-box">
            <Loading color="#fff" vertical>加载中...</Loading>
        </div>
    </Overlay>

    <Popup v-model:show="showMonthPicker" position="bottom">
        <DatePicker v-model="monthPickerValue" title="调研月份" :columns-type="['year', 'month']" @confirm="onMonthConfirm" @cancel="showMonthPicker = false" />
    </Popup>

    <ActionSheet v-model:show="showEnterprisePicker" title="企业名称">
        <div class="select-sheet">
            <Search v-model="enterpriseKeyword" placeholder="输入新的企业名称" show-action left-icon="">
                <template #action>
                    <Button size="small" type="primary" @click="selectCustomEnterprise">填写</Button>
                </template>
            </Search>
            <div class="select-list">
                <div v-for="item in customerOptions" :key="item.value" class="select-row" :class="{ selected: isSelectedCustomer(item) }" @click="handleCustomerChange(item)">
                    <span>{{ item.label }}</span>
                    <span v-if="isSelectedCustomer(item)" class="selected-icon">
                        <Icon name="passed" color="#1989fa" />
                    </span>
                </div>
                <Empty v-if="!customerOptions.length" description="暂无数据" />
            </div>
        </div>
    </ActionSheet>

    <ActionSheet v-model:show="showRegionPicker" title="区域">
        <div class="simple-options">
            <div v-for="item in regionOptions" :key="item.value" class="select-row" :class="{ selected: isSelectedRegion(item) }" @click="selectRegion(item)">
                <span>{{ item.label }}</span>
                <span v-if="isSelectedRegion(item)" class="selected-icon">
                    <Icon name="passed" color="#1989fa" />
                </span>
            </div>
        </div>
    </ActionSheet>

    <ActionSheet v-model:show="showPurchaseTypePicker" title="采购产品类型">
        <div class="simple-options">
            <div v-for="item in purchaseProductTypeOptions" :key="item.value" class="select-row" :class="{ selected: isSelectedPurchaseType(item) }" @click="selectPurchaseType(item)">
                <span>{{ item.label }}</span>
                <span v-if="isSelectedPurchaseType(item)" class="selected-icon">
                    <Icon name="passed" color="#1989fa" />
                </span>
            </div>
        </div>
    </ActionSheet>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    ActionSheet,
    Button,
    DatePicker,
    Empty,
    Field,
    Form,
    Popup,
    Search,
    showDialog,
    showToast,
    Icon,
    Loading,
    Overlay,
} from 'vant';
import dayjs from 'dayjs';
import AppPage from '@/appComponents/AppPage/index.vue';
import { getCustomerBaseDropdownApi } from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import {
    compareWithHistoryApi,
    createChemicalCompanyApi,
    queryChemicalCompanyDetailApi,
    updateChemicalCompanyApi,
} from '@/api/chemicalCompany';
import enumCfg from '@/config/enum.cfg';

interface ChemicalSurveyForm {
    id?: string;
    enterpriseName: string;
    customerId?: string | null;
    region: string | null;
    surveyMonth: string | null;
    detailAddress: string;
    contactPerson: string;
    contactPhone: string;
    inventory: string;
    operatingRate: string;
    rateChangeReason: string;
    mainProductScale: string;
    mainProductPrice: string;
    nextMonthPlan: string;
    purchaseProductType: string;
    purchaseBudget: string;
    status: string;
}

type NumericField = 'inventory' | 'operatingRate' | 'mainProductPrice' | 'nextMonthPlan' | 'purchaseBudget';
type OptionItem = { label: string; value: string };

const loading = ref(true);
const route = useRoute();
const router = useRouter();
const formRef = ref<any>(null);

const isEdit = computed(() => !!route.query.id && !route.query.copyId);
const isCopy = computed(() => !!route.query.copyId);
const pageTitle = computed(() => {
    if (isCopy.value) return '复制化工企业调研';
    return isEdit.value ? '编辑化工企业调研' : '新增化工企业调研';
});

const createEmptyForm = (): ChemicalSurveyForm => ({
    enterpriseName: '',
    customerId: null,
    region: null,
    surveyMonth: null,
    detailAddress: '',
    contactPerson: '',
    contactPhone: '',
    inventory: '',
    operatingRate: '',
    rateChangeReason: '',
    mainProductScale: '',
    mainProductPrice: '',
    nextMonthPlan: '',
    purchaseProductType: '',
    purchaseBudget: '',
    status: '',
});

const formData = ref<ChemicalSurveyForm>(createEmptyForm());
const enterpriseLabel = ref('');
const regionLabel = ref('');
const purchaseProductTypeLabel = ref('');

const showMonthPicker = ref(false);
const showEnterprisePicker = ref(false);
const showRegionPicker = ref(false);
const showPurchaseTypePicker = ref(false);
const monthPickerValue = ref<string[]>(dayjs().format('YYYY-MM').split('-'));
const enterpriseKeyword = ref('');

const defaultRegionOptions: OptionItem[] = [];

const defaultPurchaseProductTypeOptions: OptionItem[] = [];

const regionOptions = ref<OptionItem[]>(defaultRegionOptions);
const purchaseProductTypeOptions = ref<OptionItem[]>(defaultPurchaseProductTypeOptions);

// 企业列表只用于下方列表直接选择，不受自定义输入内容影响。
const customerOptions = ref<OptionItem[]>([]);

// 校验最多一位小数输入，库存和下月采购计划共用。
const decimalValidator = (message: string) => (value: string) => {
    if (!value) return message;
    if (!/^\d+(\.\d{1})?$/.test(value)) return '请输入有效数字（最多保留1位小数）';
    return Number(value) >= 0 || '数值不能为负数';
};

// 校验最多一位小数且范围0-100（开工率专用）。
const operatingRateValidator = (value: string) => {
    if (!value) return '请输入开工率';
    if (!/^\d+(\.\d{1})?$/.test(value)) return '请输入有效数字（最多保留1位小数）';
    const num = Number(value);
    return (num >= 0 && num <= 100) || '开工率范围为0-100';
};

const inventoryRules = [{ validator: decimalValidator('请输入库存') }];
const nextMonthPlanRules = [{ validator: decimalValidator('请输入下月采购计划') }];
const operatingRateRules = [{ validator: operatingRateValidator }];

// 规范小数输入，最多保留一位小数。
const normalizeDecimal = (value: string) => {
    const normalized = `${value ?? ''}`.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    const [integer = '', decimal = ''] = normalized.split('.');
    if (!integer && normalized.includes('.')) return '0.';
    return normalized.includes('.') ? `${integer}.${decimal.slice(0, 1)}` : integer;
};


// 处理最多一位小数字段输入。
const handleDecimalInput = (field: NumericField, value: string) => {
    formData.value[field] = normalizeDecimal(value);
};

// 小数字段失焦后补齐最多一位小数，并校验最大值。
const handleDecimalBlur = (field: NumericField, max?: number, label?: string) => {
    const value = formData.value[field];
    if (!value) return;
    const num = Number(value);
    // 超出最大值时清空并提示
    if (max !== undefined && num > max) {
        formData.value[field] = '';
        showToast(`${label || '当前字段'}不能超过${max.toLocaleString()}`);
        return;
    }
    formData.value[field] = num.toFixed(1).replace(/\.0$/, '');
};

// 从接口返回中按候选字段名取值，兼容新增和详情接口字段差异。
const getValue = (data: any, keys: string[], defaultValue: any = '') => {
    const key = keys.find((item) => data?.[item] !== undefined && data?.[item] !== null);
    return key ? data[key] : defaultValue;
};

// 将详情接口数据统一整理成表单结构。
const normalizeDetailToForm = (data: any, copy = false): ChemicalSurveyForm => ({
    ...createEmptyForm(),
    id: copy ? undefined : getValue(data, ['id']),
    enterpriseName: getValue(data, ['enterpriseName', 'customerName']),
    customerId: getValue(data, ['customerId'], null),
    region: getValue(data, ['region'], null),
    surveyMonth: getValue(data, ['surveyMonth', 'researchMonth'], null),
    detailAddress: getValue(data, ['detailAddress', 'address']),
    contactPerson: getValue(data, ['contactPerson']),
    contactPhone: getValue(data, ['contactPhone']),
    inventory: getValue(data, ['inventory'], '')?.toString() || '',
    operatingRate: getValue(data, ['operatingRate'], '')?.toString() || '',
    rateChangeReason: getValue(data, ['rateChangeReason', 'operatingRateReason']),
    mainProductScale: getValue(data, ['mainProductScale', 'mainProduct']),
    mainProductPrice: getValue(data, ['mainProductPrice'], '')?.toString() || '',
    nextMonthPlan: getValue(data, ['nextMonthPlan'], '')?.toString() || '',
    purchaseProductType: getValue(data, ['purchaseProductType', 'purchaseType']),
    purchaseBudget: getValue(data, ['purchaseBudget'], '')?.toString() || '',
    status: copy ? '' : getValue(data, ['status']),
});

const getRegionLabel = (value: string | null) =>
    regionOptions.value.find((item) => item.value === value)?.label || value || '';
const getPurchaseTypeLabel = (value: string) =>
    purchaseProductTypeOptions.value.find((item) => item.value === value)?.label || value || '';

// 根据表单值同步页面展示用 label。
const syncLabels = () => {
    enterpriseLabel.value = formData.value.enterpriseName || ''; // 企业名称
    regionLabel.value = getRegionLabel(formData.value.region); // 区域
    purchaseProductTypeLabel.value = getPurchaseTypeLabel(formData.value.purchaseProductType); // 采购产品类型
    if (formData.value.surveyMonth) monthPickerValue.value = formData.value.surveyMonth.split('-'); // 调研月份
};

// 判断当前企业是否命中客户列表项，用于在列表中展示选中状态。
const isSelectedCustomer = (option: OptionItem) => {
    if (formData.value.customerId) return option.value === formData.value.customerId;
    return !!formData.value.enterpriseName && option.label === formData.value.enterpriseName;
};

// 判断当前区域是否命中字典列表项，用于在列表中展示选中状态。
const isSelectedRegion = (option: OptionItem) => option.value === formData.value.region;

// 判断当前采购产品类型是否命中字典列表项，用于在列表中展示选中状态。
const isSelectedPurchaseType = (option: OptionItem) => option.value === formData.value.purchaseProductType;

// 选择客户列表中的企业，同时保留 customerId。
const handleCustomerChange = (option: OptionItem) => {
    formData.value.enterpriseName = option.label;
    formData.value.customerId = option.value;
    enterpriseLabel.value = option.label;
    showEnterprisePicker.value = false;
};

// 使用输入框中的自定义企业名称，不关联客户列表，不写入 customerId。
const selectCustomEnterprise = () => {
    const value = enterpriseKeyword.value.trim();
    if (!value) return;
    formData.value.enterpriseName = value;
    formData.value.customerId = null;
    enterpriseLabel.value = value;
    showEnterprisePicker.value = false;
};

// 选择区域字典项。
const selectRegion = (option: OptionItem) => {
    formData.value.region = option.value;
    regionLabel.value = option.label;
    showRegionPicker.value = false;
};

// 选择采购产品类型字典项。
const selectPurchaseType = (option: OptionItem) => {
    formData.value.purchaseProductType = option.value;
    purchaseProductTypeLabel.value = option.label;
    showPurchaseTypePicker.value = false;
};

// 确认调研月份。
const onMonthConfirm = ({ selectedValues }: any) => {
    formData.value.surveyMonth = selectedValues.join('-');
    monthPickerValue.value = selectedValues;
    showMonthPicker.value = false;
};

// 组装保存/提交参数，数值字段转成接口需要的 number 类型。
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

/**
 * 触发表单校验，统一返回布尔值方便后续流程判断。
 * @param fields 指定校验的字段；不传时执行全量校验
 * @returns 表单是否通过校验
 */
const validateForm = async (fields?: string[]) => {
    try {
        await formRef.value?.validate(fields);
        return true;
    } catch {
        return false;
    }
};
// 历史数据对比参数构建
const getComparePayload = () => {
    const { enterpriseName, surveyMonth, inventory, operatingRate } = formData.value;
    if (![enterpriseName, surveyMonth, inventory, operatingRate].every((item) => `${item ?? ''}`.trim())) return null;
    if (!/^\d+(\.\d{1})?$/.test(inventory) || !/^\d+$/.test(operatingRate)) return null;
    const operatingRateValue = Number(operatingRate);
    if (operatingRateValue < 0 || operatingRateValue > 100) return null;
    return {
        enterpriseName,
        surveyMonth,
        inventory: Number(inventory),
        operatingRate: operatingRateValue,
    };
};

const formatDiffNumber = (value: any, suffix = '') => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '--';
    return `${numberValue}${suffix}`;
};

// 整理历史数据对比差异提示文案。
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

// 保存/提交前对比历史数据，存在明显差异时弹窗让用户二次确认。
const confirmHistoryDifference = async () => {
    const payload = getComparePayload();
    if (!payload) return true;
    const res = await compareWithHistoryApi(payload);
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
        return true;
    } catch {
        return false;
    }
};

// 保存校验核心调研数据，提交继续执行完整表单校验。
const handleSaveOrSubmit = async (status: 'DRAFT' | 'ARCHIVED') => {
    const saveRequiredFields = ['enterpriseName', 'surveyMonth', 'inventory', 'operatingRate'];
    const valid = await validateForm(status === 'DRAFT' ? saveRequiredFields : undefined);
    if (!valid) return;
    const canContinue = await confirmHistoryDifference();
    if (!canContinue) return;
    const payload = buildSubmitPayload(status);
    const res = isEdit.value ? await updateChemicalCompanyApi(payload) : await createChemicalCompanyApi(payload);
    if (res?.code === 200) {
        showToast(status === 'DRAFT' ? '保存成功' : '提交成功');
        router.back();
    }
};

// 保存为草稿。
const handleSave = () => handleSaveOrSubmit('DRAFT');

// 提交并归档。
const handleSubmit = () => handleSaveOrSubmit('ARCHIVED');

// 获取客户列表，仅供企业选择弹层下方列表直接选择。
const loadCustomerOptions = async () => {
    const res = await getCustomerBaseDropdownApi({
        cooperationStatus: 'NORMAL',
        status: 'STORAGE',
        customerType: 'CHEMICAL'
    });
    if (res?.code === 200) {
        customerOptions.value = (res.data || []).map((item: any) => ({
            label: item.customerName,
            value: item.id,
        }));
    }
};

// 获取区域和采购产品类型字典。
const loadDictData = async () => {
    const res = await getDictMapApi({ parentCodes: [enumCfg['区域类型'], enumCfg['采购产品类型']] });
    if (res?.code === 200) {
        const regionList = res.data?.[enumCfg['区域类型']] || [];
        const purchaseTypeList = res.data?.[enumCfg['采购产品类型']] || [];

        regionOptions.value = regionList.length
            ? regionList.map((item: any) => ({
                label: item.name,
                value: item.code,
            }))
            : defaultRegionOptions;
        purchaseProductTypeOptions.value = purchaseTypeList.length
            ? purchaseTypeList.map((item: any) => ({
                label: item.name,
                value: item.code,
            }))
            : defaultPurchaseProductTypeOptions;
    }
};

// 加载编辑数据；新增时默认调研月份为当前月份。
const loadEditData = async () => {
    const sourceId = route.query.id || route.query.copyId;
    if (!sourceId) {
        formData.value.surveyMonth = dayjs().format('YYYY-MM');
        syncLabels();
        loading.value = false;
        return;
    }
    try {
        const res = await queryChemicalCompanyDetailApi(sourceId);
        if (res?.code === 200) {
            formData.value = normalizeDetailToForm(res.data || {}, isCopy.value);
            syncLabels();
        }
    } finally {
        loading.value = false;
    }
};

// 初始化页面基础数据，先加载字典和客户列表，再回填编辑数据。
onMounted(async () => {
    await loadDictData();
    await loadCustomerOptions();
    await loadEditData();
});
</script>

<style lang="less" scoped>
.chemical-add-page {
    padding: 8px 8px 64px;
}

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

.chemical-form {
    overflow: hidden;
    border-radius: 6px;
    background: #fff;

    :deep(.van-cell) {
        padding: 11px 12px;
        align-items: flex-start;
        font-size: 16px;
    }

    :deep(.van-field__label) {
        width: 92px;
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
        font-weight: 500;
        --van-button-primary-background: #2c65f2;
        --van-button-primary-border-color: #2c65f2;
    }
}

.select-sheet {
    height: 68vh;
    display: flex;
    flex-direction: column;
    background: #f5f6f8;

    :deep(.van-search__action) {
        line-height: 100%;
    }

    .select-list {
        flex: 1;
        overflow-y: auto;
        background: #fff;
    }
}

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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    &.selected {
        color: #2c65f2;
        font-weight: 500;
    }

    .selected-icon {
        flex-shrink: 0;
        color: #2c65f2;
        font-size: 14px;
    }
}
</style>
