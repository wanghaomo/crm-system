<template>
    <div class="web-data-table settlement-detail-table">
        <div class="web-n-data-table-con">
            <n-data-table
                class="web-n-data-table"
                :columns="columns"
                :data="tableRows"
                :row-key="getRowKey"
                :checked-row-keys="checkedRowKeys"
                :pagination="false"
                :bordered="true"
                :bottom-bordered="true"
                :single-line="false"
                :scroll-x="tableScrollX"
                :max-height="SETTLEMENT_DETAIL_BODY_MAX_HEIGHT"
                striped
                @update:checked-row-keys="handleCheckedRowKeys" />
        </div>
    </div>
    <n-grid :cols="1" :x-gap="16" :y-gap="0">
        <n-grid-item>
            <n-form-item label="合同结算条款" path="terms">
                <n-input
                    type="textarea"
                    v-model:value="formData.terms"
                    maxlength="500"
                    show-count
                    rows="5"
                    placeholder="请输入" />
            </n-form-item>
        </n-grid-item>
    </n-grid>
</template>

<script setup lang="ts">
import { computed, h, ref, resolveComponent, watch } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { NDataTable, NDatePicker, NInput, NInputNumber, NFormItem, NGrid, NGridItem, NSelect } from 'naive-ui';
import { useDictStore } from '@/store/commStore';
import {
    getSettlementYardCode,
    getSettlementYardName,
    getSettlementNumberRule,
    getSettlementNumberValidationMessage,
    getSettlementAmountNumber,
    getSettlementUnitPrice,
    formatSettlementAmount,
    normalizeSettlementNumber,
    SETTLEMENT_CHEMICAL_NUMBER_FIELDS,
    SETTLEMENT_TRADER_NUMBER_FIELDS,
    type SettlementYardOption,
} from '../../utils';

const emit = defineEmits(['checked-rows-change']);

const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
    tableList: {
        type: Array,
        default: () => [],
    },
    isEdit: {
        type: Boolean,
        default: false,
    },
    yardOptions: {
        type: Array,
        default: () => [],
    },
    yardLoading: {
        type: Boolean,
        default: false,
    },
    validateTrigger: {
        type: Number,
        default: 0,
    },
});

const { dictMap } = storeToRefs(useDictStore());
const checkedRowKeys = ref<Array<string | number>>([]);
const DICT = {
    ORE_TYPE: '矿石种类',
};
const DEFAULT_NUMBER = 0;
const CUSTOMER_TYPE_TRADER = 'TRADER';
const SETTLEMENT_DETAIL_BODY_MAX_HEIGHT = 400;

/** 结算明细行字段，包含接口 ID 和组件内部勾选状态。 */
type SettlementDetailRow = {
    id?: string | number | null;
    __checked?: boolean;
};

const contentFieldMap = {
    content: ['content', 'value', '含量'],
    weightedAverage: ['weightedAverage', 'weightedAvg', 'weighted', 'average', '加权平均'],
    priceIncrease: ['priceIncrease', 'increasePrice', 'priceFloat', '增价', '增减价'],
};

const tableRows = computed<any[]>(() => props.tableList as any[]);
const oreTypeOptions = computed(() => dictMap.value?.[DICT.ORE_TYPE] || dictMap.value?.['矿种'] || []);
const isTraderCustomer = computed(() => String(props.formData.customerType || '').toUpperCase() === CUSTOMER_TYPE_TRADER);
const shouldUseDefaultValue = computed(() => !props.isEdit);
const settlementYardOptions = computed(() => props.yardOptions as SettlementYardOption[]);
const settlementNumberFields = computed(() =>
    isTraderCustomer.value ? SETTLEMENT_TRADER_NUMBER_FIELDS : SETTLEMENT_CHEMICAL_NUMBER_FIELDS
);

/**
 * 判断字段是否为有效值，数字 0 视为有效。
 * @param value 待判断字段值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== null && value !== undefined && value !== '';

/**
 * 判断结算明细行是否需要按新增态补默认值。
 * @param row 当前表格行
 * @returns 新增页或编辑页无 id 行返回 true
 */
const shouldUseRowDefaultValue = (row: any) => !props.isEdit || !hasValue(row?.id);

/**
 * 获取第一个有效字段值，数字 0 视为有效。
 * @param values 候选字段值
 * @returns 第一个非空值
 */
const getFirstValidValue = (...values: any[]) => {
    return values.find((value) => hasValue(value));
};

/**
 * 按两位小数格式化数字，非法值按默认值处理。
 * @param value 原始数字
 * @param defaultValue 默认数字
 * @returns 两位小数数字
 */
const getFixedNumber = (value: any, defaultValue = DEFAULT_NUMBER) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return defaultValue;
    return Number(numberValue.toFixed(2));
};

/**
 * 获取当前行自动计算的结算单价。
 * @param row 当前结算明细行
 * @returns 结算单价
 */
const getCalculatedUnitPrice = (row: any) => {
    return getSettlementUnitPrice(row, props.formData.customerType, shouldUseRowDefaultValue(row) ? DEFAULT_NUMBER : null);
};

/**
 * 按当前页面状态获取数字输入框回显值，编辑态空值不补 0。
 * @param value 原始数字
 * @returns 数字输入框值
 */
const getNumberInputValue = (value: any) => {
    if (!hasValue(value)) return shouldUseDefaultValue.value ? DEFAULT_NUMBER : null;
    return getFixedNumber(value);
};

/**
 * 获取只读数字字段展示值，编辑态空值不展示默认 0。
 * @param value 原始数字
 * @returns 表格展示值
 */
const getNumberDisplayValue = (value: any) => {
    if (!hasValue(value)) return shouldUseDefaultValue.value ? DEFAULT_NUMBER : null;
    return getFixedNumber(value);
};

/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或字典文案
 * @returns 匹配到的字典文案，空值返回占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (!hasValue(value)) return '--';
    const options = dictMap.value?.[dictName] || [];
    const option = options.find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};

/**
 * 使用矿石种类字典回显矿石种类。
 * @param value 矿石种类编码或名称
 * @returns 字典文案
 */
const formatOreType = (value: any) => {
    if (!hasValue(value)) return '--';
    const option = oreTypeOptions.value.find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || formatDict(DICT.ORE_TYPE, value);
};

/**
 * 获取表格行唯一标识，优先使用后端主键。
 * @param row 结算明细行数据
 * @returns Naive UI 表格行 key
 */
const getRowKey = (row: any) => row.id || `${row.transportOrderCode || ''}-${row.orderNum || ''}`;

/**
 * 判断两个行 key 是否相同。
 * @param left 左侧行 key
 * @param right 右侧行 key
 * @returns 是否相同
 */
const isSameRowKey = (left: string | number, right: string | number) => String(left) === String(right);

/**
 * 获取当前已勾选的结算明细行。
 * @returns 已勾选的表格行数组
 */
const checkedRows = computed(() =>
    tableRows.value.filter((row) => checkedRowKeys.value.some((key) => isSameRowKey(key, getRowKey(row))))
);

/**
 * 获取当前已勾选的结算明细行。
 * @returns 已勾选的表格行数组
 */
const getCheckedRows = () => {
    return checkedRows.value;
};

/**
 * 同步已勾选行变更到父组件。
 * @returns 无返回值
 */
const emitCheckedRowsChange = () => {
    emit('checked-rows-change', checkedRows.value);
};

/**
 * 同步表格勾选行 key。
 * @param keys 当前选中的行 key
 * @returns 无返回值
 */
const handleCheckedRowKeys = (keys: Array<string | number>) => {
    checkedRowKeys.value = keys;
    emitCheckedRowsChange();
};

/**
 * 获取单元格展示值，空值统一展示为占位符。
 * @param value 单元格原始值
 * @param placeholder 空值占位文案
 * @returns 展示文案
 */
const getCellText = (value: any, placeholder = '--') => {
    if (value === null || value === undefined || value === '') return placeholder;
    return value;
};

/**
 * 渲染可编辑输入框，并将变更写回当前行。
 * @param row 当前表格行
 * @param key 行字段 key
 * @param placeholder 输入框占位文案
 * @param maxlength 最大输入长度
 * @returns 输入框虚拟节点
 */
const renderInput = (row: any, key: string, placeholder = '请输入', maxlength?: number) => {
    return h(NInput, {
        value: row[key] === null || row[key] === undefined ? '' : String(row[key]),
        status: getFieldStatus(row, key),
        size: 'small',
        clearable: true,
        maxlength,
        placeholder,
        'onUpdate:value': (value: string) => {
            row[key] = value;
        },
    });
};

/**
 * 渲染年月日日期选择器。
 * @param row 当前表格行
 * @param key 行字段 key
 * @returns 日期选择器虚拟节点
 */
const renderDatePicker = (row: any, key: string) => {
    return h(NDatePicker, {
        formattedValue: row[key],
        status: getFieldStatus(row, key),
        type: 'date',
        valueFormat: 'yyyy-MM-dd',
        size: 'small',
        clearable: false,
        placeholder: '请选择验收时间',
        'onUpdate:formattedValue': (value: string | null) => {
            row[key] = value || (shouldUseRowDefaultValue(row) ? dayjs().format('YYYY-MM-DD') : null);
        },
    });
};

/**
 * 渲染交货地点堆场下拉。
 * @param row 当前表格行
 * @returns 堆场下拉虚拟节点
 */
const renderYardSelect = (row: any) => {
    const options = settlementYardOptions.value;
    return h(NSelect, {
        value: getSettlementYardCode(row.deliveryLocation, options) || null,
        options,
        loading: props.yardLoading,
        status: getFieldStatus(row, 'deliveryLocation'),
        size: 'small',
        filterable: true,
        clearable: true,
        placeholder: '请选择交货地点',
        fallbackOption: (value: string) => ({
            label: row.deliveryLocationName || getSettlementYardName(value, options),
            value,
        }),
        'onUpdate:value': (value: string | null) => {
            row.deliveryLocation = value || '';
            row.deliveryLocationName = getSettlementYardName(value, options);
        },
    });
};

/**
 * 渲染两位小数数字输入框。
 * @param row 当前表格行
 * @param key 行字段 key
 * @param onChange 数值变更后的回调
 * @returns 数字输入框虚拟节点
 */
const renderNumberInput = (row: any, key: string, onChange?: (row: any) => void) => {
    const rule = getSettlementNumberRule(key);
    return h(NInputNumber, {
        value: getNumberInputValue(row[key]),
        status: getFieldStatus(row, key),
        size: 'small',
        precision: rule.precision,
        showButton: false,
        min: rule.min,
        max: rule.max,
        placeholder: '请输入',
        style: { width: '100%' },
        'onUpdate:value': (value: number | null) => {
            row[key] = hasValue(value)
                ? normalizeSettlementNumber(value, key)
                : shouldUseRowDefaultValue(row)
                    ? DEFAULT_NUMBER
                    : null;
            onChange?.(row);
        },
    });
};

/**
 * 渲染业务人员多选组件。
 * @param row 当前表格行
 * @returns 人员选择组件虚拟节点
 */
const renderBusinessPersonSelect = (row: any) => {
    const MxPersonSelect = resolveComponent('MxPersonSelect');
    return h(
        'div',
        {
            class: ['settlement-detail-field-wrapper', { 'is-error': isFieldError(row, 'businessPersonName') }],
        },
        [
            h(MxPersonSelect as any, {
                multiple: true,
                collapseTags: true,
                modelValue: row.businessPersonCodes || [],
                label: row.businessPersonNames || [],
                selectedPerson: row.businessPerson || [],
                placeholder: '请选择业务人员',
                size: 'small',
                style: { width: '100%' },
                'onUpdate:modelValue': (value: string[]) => {
                    row.businessPersonCodes = value || [];
                },
                'onUpdate:label': (value: string[]) => {
                    row.businessPersonNames = value || [];
                    row.businessPersonName = row.businessPersonNames.join(',');
                },
                'onUpdate:selectedPerson': (value: any[] | null) => {
                    setBusinessPersons(row, Array.isArray(value) ? value : []);
                },
                onChangeEvt: (value: any[] | null) => {
                    setBusinessPersons(row, Array.isArray(value) ? value : []);
                },
            }),
        ]
    );
};

/**
 * 尝试把接口返回的 JSON 字符串解析为对象。
 * @param value 原始 JSON 字符串或对象
 * @returns 解析后的对象，解析失败返回空对象
 */
const parseObjectValue = (value: any) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error('解析结算明细成分数据失败:', error);
        return {};
    }
};

/**
 * 获取成分对象默认值，编辑态空字段不补 0。
 * @param value 接口返回的成分对象或 JSON 字符串
 * @param useDefault 是否使用新增态默认值
 * @returns 标准成分对象
 */
const getDefaultContentObject = (value: any, useDefault = true) => {
    const objectValue = parseObjectValue(value);
    const getContentNumberValue = (fieldValue: any) => {
        if (hasValue(fieldValue)) return getFixedNumber(fieldValue);
        return useDefault ? DEFAULT_NUMBER : null;
    };
    return {
        content: getContentNumberValue(objectValue.content ?? objectValue.value ?? objectValue['含量']),
        weightedAverage: getContentNumberValue(
            objectValue.weightedAverage ?? objectValue.weightedAvg ?? objectValue.weighted ?? objectValue.average ?? objectValue['加权平均']
        ),
        priceIncrease: getContentNumberValue(
            objectValue.priceIncrease ?? objectValue.increasePrice ?? objectValue.priceFloat ?? objectValue['增价'] ?? objectValue['增减价']
        ),
    };
};

/**
 * 计算结算明细分项金额，公式为结算单价 * 结算量。
 * @param row 当前表格行
 * @returns 分项金额
 */
const getTaxIncludedAmount = (row: any) => {
    const useDefault = shouldUseRowDefaultValue(row);
    const settleWeightSource = useDefault
        ? getFirstValidValue(row.settleWeight, row.actualReceiptWeight, row.dispatchWeight)
        : row.settleWeight;
    const taxIncludedPrice = getCalculatedUnitPrice(row);
    if (!hasValue(settleWeightSource) || !hasValue(taxIncludedPrice)) {
        return useDefault ? DEFAULT_NUMBER : null;
    }
    const settleWeight = getFixedNumber(settleWeightSource);
    return getSettlementAmountNumber(settleWeight * Number(taxIncludedPrice), useDefault ? DEFAULT_NUMBER : null);
};

/**
 * 根据结算量和结算单价刷新分项金额。
 * @param row 当前表格行
 * @returns 无返回值
 */
const updateTaxIncludedAmount = (row: any) => {
    row.taxIncludedPrice = getCalculatedUnitPrice(row);
    row.taxIncludedAmount = getTaxIncludedAmount(row);
};

/**
 * 解析业务人员字段，兼容数组、对象、JSON 字符串和逗号分隔字符串。
 * @param row 当前表格行
 * @returns 业务人员选择组件需要的人员对象数组
 */
const getBusinessPersonList = (row: any) => {
    const source = row.businessPerson || row.businessPersonId;
    if (Array.isArray(source)) {
        return source.map((item: any) => ({
            ...item,
            value: item.value || item.code || item.id || '',
            label: item.label || item.username || item.name || '',
        }));
    }
    if (source && typeof source === 'object') {
        return [
            {
                ...source,
                value: source.value || source.code || source.id || '',
                label: source.label || source.username || source.name || '',
            },
        ];
    }
    if (typeof source === 'string' && source.trim()) {
        try {
            const parsed = JSON.parse(source);
            if (Array.isArray(parsed)) return getBusinessPersonList({ businessPerson: parsed });
            if (parsed && typeof parsed === 'object') return getBusinessPersonList({ businessPerson: parsed });
        } catch (error) {
            const codes = source.split(',').map((item) => item.trim()).filter(Boolean);
            const names = String(row.businessPersonName || '').split(',').map((item) => item.trim());
            return codes.map((code, index) => ({
                value: code,
                code,
                label: names[index] || code,
                username: names[index] || code,
            }));
        }
    }
    return [];
};

/**
 * 将业务人员选择结果同步到行数据，提交时复用这些字段。
 * @param row 当前表格行
 * @param selectedPersons 选中的人员列表
 * @returns 无返回值
 */
const setBusinessPersons = (row: any, selectedPersons: any[] = []) => {
    const persons = (selectedPersons || []).map((item: any) => ({
        ...item,
        value: item.value || item.code || '',
        code: item.code || item.value || '',
        label: item.label || item.username || item.name || '',
        username: item.username || item.label || item.name || '',
    }));
    row.businessPerson = persons;
    row.businessPersonCodes = persons.map((item) => item.value).filter(Boolean);
    row.businessPersonNames = persons.map((item) => item.label).filter(Boolean);
    row.businessPersonName = row.businessPersonNames.join(',');
    row.businessPersonId = persons.length ? JSON.stringify(persons) : '';
};

/**
 * 获取合同我方负责人，作为明细业务人员的默认值。
 * @returns 标准人员对象，没有负责人时返回 null
 */
const getContractDirectorPerson = () => {
    const person = {
        value: props.formData.contractDirectorId || '',
        code: props.formData.contractDirectorId || '',
        label: props.formData.contractDirectorName || '',
        username: props.formData.contractDirectorName || '',
        larkUserId: props.formData.contractDirectorLarkId || '',
    };
    return person.value || person.code ? person : null;
};

/**
 * 初始化结算明细默认值，避免空值展示和提交。
 * @param row 当前表格行
 * @returns 无返回值
 */
const normalizeSettlementDetailRow = (row: any) => {
    const useDefault = shouldUseRowDefaultValue(row);
    if ('enterpriseName' in row) {
        delete row.enterpriseName;
    }
    row.deliveryLocation = getSettlementYardCode(row.deliveryLocation, settlementYardOptions.value);
    row.deliveryLocationName =
        row.deliveryLocationName || getSettlementYardName(row.deliveryLocation, settlementYardOptions.value);
    row.acceptanceTime = hasValue(row.acceptanceTime)
        ? dayjs(row.acceptanceTime).format('YYYY-MM-DD')
        : useDefault
            ? dayjs().format('YYYY-MM-DD')
            : row.acceptanceTime;
    row.settleOreGrade = hasValue(row.settleOreGrade)
        ? getFixedNumber(row.settleOreGrade)
        : useDefault
            ? getFixedNumber(row.contractOreGrade)
            : row.settleOreGrade;
    row.priceIncrease = hasValue(row.priceIncrease) ? getFixedNumber(row.priceIncrease) : useDefault ? DEFAULT_NUMBER : row.priceIncrease;
    if (useDefault || hasValue(row.contentMgoObject) || hasValue(row.contentMgo)) {
        row.contentMgoObject = getDefaultContentObject(row.contentMgoObject || row.contentMgo, useDefault);
    }
    if (useDefault || hasValue(row.contentFeoObject) || hasValue(row.contentFeo)) {
        row.contentFeoObject = getDefaultContentObject(row.contentFeoObject || row.contentFeo, useDefault);
    }
    if (useDefault || hasValue(row.contentAloObject) || hasValue(row.contentAlo)) {
        row.contentAloObject = getDefaultContentObject(row.contentAloObject || row.contentAlo, useDefault);
    }
    row.moisture = hasValue(row.moisture) ? getFixedNumber(row.moisture) : useDefault ? DEFAULT_NUMBER : row.moisture;
    row.exceedMoisture = hasValue(row.exceedMoisture) ? getFixedNumber(row.exceedMoisture) : useDefault ? DEFAULT_NUMBER : row.exceedMoisture;
    row.granularity = hasValue(row.granularity) ? getFixedNumber(row.granularity) : useDefault ? DEFAULT_NUMBER : row.granularity;
    row.gradeFloat = hasValue(row.gradeFloat) ? getFixedNumber(row.gradeFloat) : useDefault ? DEFAULT_NUMBER : row.gradeFloat;
    row.actualReceiptWeight = hasValue(row.actualReceiptWeight)
        ? getFixedNumber(row.actualReceiptWeight)
        : useDefault
            ? getFixedNumber(row.dispatchWeight)
            : row.actualReceiptWeight;
    row.settleWeight = hasValue(row.settleWeight)
        ? getFixedNumber(row.settleWeight)
        : useDefault
            ? getFixedNumber(row.dispatchWeight)
            : row.settleWeight;
    row.contractUnitPrice = hasValue(row.contractUnitPrice) ? getFixedNumber(row.contractUnitPrice) : useDefault ? DEFAULT_NUMBER : row.contractUnitPrice;
    row.taxIncludedPrice = getCalculatedUnitPrice(row);
    row.taxIncludedAmount = getTaxIncludedAmount(row);
    let persons = getBusinessPersonList(row);
    if (!persons.length && !row.businessPersonName) {
        const contractDirector = getContractDirectorPerson();
        if (contractDirector) {
            setBusinessPersons(row, [contractDirector]);
            persons = [contractDirector];
        }
    }
    row.businessPersonCodes = row.businessPersonCodes || persons.map((item) => item.value).filter(Boolean);
    row.businessPersonNames = row.businessPersonNames || persons.map((item) => item.label).filter(Boolean);
    row.businessPerson = row.businessPerson || persons;
};

watch(
    [() => props.tableList, () => props.isEdit, () => props.yardOptions, () => props.formData.contractDirectorId],
    ([rows]) => {
        const currentRows = (Array.isArray(rows) ? rows : []) as SettlementDetailRow[];
        currentRows.forEach((row) => normalizeSettlementDetailRow(row));
        const rowKeys = currentRows.map((row) => getRowKey(row));
        const validCheckedKeys = checkedRowKeys.value.filter((key) => rowKeys.some((rowKey) => isSameRowKey(rowKey, key)));
        if (currentRows.some((row) => row.__checked !== undefined)) {
            checkedRowKeys.value = currentRows.filter((row) => row.__checked !== false).map((row) => getRowKey(row));
        } else if (currentRows.length && !validCheckedKeys.length) {
            checkedRowKeys.value = props.isEdit ? currentRows.filter((row) => hasValue(row.id)).map((row) => getRowKey(row)) : rowKeys;
        } else {
            checkedRowKeys.value = validCheckedKeys;
        }
        emitCheckedRowsChange();
    },
    { immediate: true }
);

/**
 * 获取成分二级表头字段值，兼容接口对象里的英文 key 和中文 key。
 * @param row 当前表格行
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @param fieldKeys 可匹配的字段 key 列表
 * @returns 成分字段值
 */
const getContentValue = (row: any, objectKey: string, jsonKey: string, fieldKeys: string[]) => {
    const objectValue = row[objectKey] || parseObjectValue(row[jsonKey]);
    const key = fieldKeys.find((item) => objectValue?.[item] !== undefined && objectValue?.[item] !== null);
    return key ? objectValue[key] : '';
};

/**
 * 渲染成分二级表头下的输入框。
 * @param row 当前表格行
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @param writeKey 写回对象时使用的标准字段 key
 * @param fieldKeys 可读取的字段 key 列表
 * @returns 输入框虚拟节点
 */
const renderContentInput = (
    row: any,
    objectKey: string,
    jsonKey: string,
    writeKey: string,
    fieldKeys: string[],
    requiredKey: string
) => {
    const value = getNumberInputValue(getContentValue(row, objectKey, jsonKey, fieldKeys));
    const rule = getSettlementNumberRule(requiredKey);
    return h(NInputNumber, {
        value,
        status: getFieldStatus(row, requiredKey),
        size: 'small',
        precision: rule.precision,
        showButton: false,
        min: rule.min,
        max: rule.max,
        placeholder: '请输入',
        style: { width: '100%' },
        'onUpdate:value': (inputValue: number | null) => {
            if (!row[objectKey]) {
                row[objectKey] = getDefaultContentObject(row[jsonKey], shouldUseRowDefaultValue(row));
            }
            row[objectKey][writeKey] = hasValue(inputValue)
                ? normalizeSettlementNumber(inputValue, requiredKey)
                : shouldUseRowDefaultValue(row)
                    ? DEFAULT_NUMBER
                    : null;
            updateTaxIncludedAmount(row);
        },
    });
};

const COMMON_REQUIRED_FIELDS = [
    { key: 'transportOrderCode', label: '运输订单编号' },
    { key: 'acceptanceTime', label: '验收时间', type: 'select' },
    { key: 'deliveryLocation', label: '交货地点', type: 'select' },
    { key: 'businessPersonName', label: '业务人员', type: 'select' },
    { key: 'oreType', label: '矿石种类', type: 'select' },
    { key: 'contractOreGrade', label: '合同约定品位' },
    { key: 'settleOreGrade', label: '结算品位' },
];
const QUANTITY_REQUIRED_FIELDS = [
    { key: 'dispatchWeight', label: '发货量（吨）' },
    { key: 'actualReceiptWeight', label: '实收量（吨）' },
    { key: 'settleWeight', label: '结算量（吨）' },
    { key: 'contractUnitPrice', label: '合同单价（元/吨）' },
];
const SUFFIX_REQUIRED_FIELDS = [
    { key: 'taxIncludedPrice', label: '结算单价（元/吨）' },
    { key: 'taxIncludedAmount', label: '分项金额（元）' },
];
const TRADER_REQUIRED_FIELDS = [
    ...COMMON_REQUIRED_FIELDS,
    { key: 'moisture', label: '水分（%）' },
    { key: 'exceedMoisture', label: '超出水分吨数' },
    ...QUANTITY_REQUIRED_FIELDS,
    { key: 'gradeFloat', label: '品位增减价（元）' },
    ...SUFFIX_REQUIRED_FIELDS,
];
const CHEMICAL_REQUIRED_FIELDS = [
    { key: 'transportOrderCode', label: '运输订单编号' },
    ...COMMON_REQUIRED_FIELDS.slice(1),
    { key: 'priceIncrease', label: '增减价' },
    { key: 'contentMgoContent', label: '氧化镁含量≥4.5%含量' },
    { key: 'contentMgoWeightedAverage', label: '氧化镁含量≥4.5%加权平均' },
    { key: 'contentMgoPriceIncrease', label: '氧化镁含量≥4.5%增减价' },
    { key: 'contentFeoContent', label: '氧化铁含量（≤0.8%）含量' },
    { key: 'contentFeoWeightedAverage', label: '氧化铁含量（≤0.8%）加权平均' },
    { key: 'contentFeoPriceIncrease', label: '氧化铁含量（≤0.8%）增减价' },
    { key: 'contentAloContent', label: '氧化铝含量（≤1%）含量' },
    { key: 'contentAloWeightedAverage', label: '氧化铝含量（≤1%）加权平均' },
    { key: 'contentAloPriceIncrease', label: '氧化铝含量（≤1%）增减价' },
    { key: 'moisture', label: '水分（%）' },
    { key: 'exceedMoisture', label: '超出水分吨位（吨）' },
    { key: 'granularity', label: '粒度≤30mm过筛率%' },
    ...QUANTITY_REQUIRED_FIELDS,
    ...SUFFIX_REQUIRED_FIELDS,
];
const requiredFields = computed(() => (isTraderCustomer.value ? TRADER_REQUIRED_FIELDS : CHEMICAL_REQUIRED_FIELDS));
const requiredFieldMap = computed(() => new Map(requiredFields.value.map((field) => [field.key, field])));

/**
 * 渲染带必填星号的表头。
 * @param title 表头标题
 * @returns 表头虚拟节点
 */
const renderRequiredTitle = (title: string) => {
    return () => h('span', { class: 'required-column-title' }, [h('span', { class: 'required-star' }, '*'), title]);
};

/**
 * 获取结算明细字段校验值，兼容展示值、计算值和二级表头字段。
 * @param row 当前表格行
 * @param key 字段 key
 * @returns 用于必填校验的字段值
 */
const getRequiredFieldValue = (row: any, key: string) => {
    switch (key) {
        case 'businessPersonName':
            return row.businessPersonCodes?.length || row.businessPerson?.length || row.businessPersonName || row.businessPersonId;
        case 'contentMgoContent':
            return getContentValue(row, 'contentMgoObject', 'contentMgo', contentFieldMap.content);
        case 'contentMgoWeightedAverage':
            return getContentValue(row, 'contentMgoObject', 'contentMgo', contentFieldMap.weightedAverage);
        case 'contentMgoPriceIncrease':
            return getContentValue(row, 'contentMgoObject', 'contentMgo', contentFieldMap.priceIncrease);
        case 'contentFeoContent':
            return getContentValue(row, 'contentFeoObject', 'contentFeo', contentFieldMap.content);
        case 'contentFeoWeightedAverage':
            return getContentValue(row, 'contentFeoObject', 'contentFeo', contentFieldMap.weightedAverage);
        case 'contentFeoPriceIncrease':
            return getContentValue(row, 'contentFeoObject', 'contentFeo', contentFieldMap.priceIncrease);
        case 'contentAloContent':
            return getContentValue(row, 'contentAloObject', 'contentAlo', contentFieldMap.content);
        case 'contentAloWeightedAverage':
            return getContentValue(row, 'contentAloObject', 'contentAlo', contentFieldMap.weightedAverage);
        case 'contentAloPriceIncrease':
            return getContentValue(row, 'contentAloObject', 'contentAlo', contentFieldMap.priceIncrease);
        case 'taxIncludedAmount':
            return getTaxIncludedAmount(row);
        default:
            return row?.[key];
    }
};

/**
 * 判断必填字段是否为空，数值 0 视为已填写。
 * @param value 字段值
 * @returns 是否为空
 */
const isEmptyRequiredValue = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || value === '';
};

/**
 * 判断结算明细字段是否处于错误态。
 * @param row 当前表格行
 * @param key 字段 key
 * @returns 是否展示红色错误状态
 */
const isFieldError = (row: any, key: string) => {
    if (!props.validateTrigger) return false;
    if (!checkedRows.value.some((item) => isSameRowKey(getRowKey(item), getRowKey(row)))) return false;
    if (!requiredFieldMap.value.has(key)) return false;
    return isEmptyRequiredValue(getRequiredFieldValue(row, key));
};

/**
 * 获取 Naive UI 表单控件状态。
 * @param row 当前表格行
 * @param key 字段 key
 * @returns 控件错误状态
 */
const getFieldStatus = (row: any, key: string) => {
    return isFieldError(row, key) ? 'error' : undefined;
};

/**
 * 渲染只读单元格，提交校验后空值展示红色边框。
 * @param row 当前表格行
 * @param key 字段 key
 * @param value 展示值
 * @param placeholder 空值占位文案
 * @returns 只读单元格虚拟节点
 */
const renderReadonlyCell = (row: any, key: string, value: any, placeholder = '--') => {
    return h(
        'div',
        {
            class: ['settlement-detail-readonly-cell', { 'is-error': isFieldError(row, key) }],
        },
        getCellText(value, placeholder)
    );
};

/**
 * 获取当前结算明细表首个必填校验错误文案。
 * @returns 校验错误文案，无错误时返回空字符串
 */
const getValidationErrorMessage = () => {
    const selectedRows = checkedRows.value;
    if (!selectedRows.length) return tableRows.value.length ? '请至少勾选一条结算明细表数据' : '结算明细表至少需要一项';
    for (let index = 0; index < selectedRows.length; index += 1) {
        const row = selectedRows[index];
        const rowIndex = tableRows.value.findIndex((item) => isSameRowKey(getRowKey(item), getRowKey(row))) + 1;
        for (const field of requiredFields.value) {
            if (isEmptyRequiredValue(getRequiredFieldValue(row, field.key))) {
                const prefix = 'type' in field && field.type === 'select' ? '请选择' : '请输入';
                return `${prefix}结算明细表第${rowIndex || index + 1}行的${field.label}`;
            }
        }
        for (const field of settlementNumberFields.value) {
            const numberError = getSettlementNumberValidationMessage(
                getRequiredFieldValue(row, field.key),
                field.key,
                field.label
            );
            if (numberError) return `结算明细表第${rowIndex || index + 1}行的${numberError}`;
        }
    }
    return '';
};

defineExpose({
    getValidationErrorMessage,
    getCheckedRows,
});

const selectionColumn = {
    type: 'selection',
    width: 54,
    fixed: 'left',
};

const indexColumn = {
    title: '序号',
    key: 'index',
    width: 60,
    fixed: 'left',
    render: (_row: any, index: number) => index + 1,
};

const transportOrderColumn = {
    title: renderRequiredTitle('运输订单编号'),
    key: 'transportOrderCode',
    width: 140,
    fixed: 'left',
    render: (row: any) => renderReadonlyCell(row, 'transportOrderCode', row.transportOrderCode),
};

const acceptanceTimeColumn = {
    title: renderRequiredTitle('验收时间'),
    key: 'acceptanceTime',
    width: 150,
    render: (row: any) => renderDatePicker(row, 'acceptanceTime'),
};

const deliveryLocationColumn = {
    title: renderRequiredTitle('交货地点'),
    key: 'deliveryLocation',
    width: 180,
    render: (row: any) => renderYardSelect(row),
};

const businessPersonColumn = {
    title: renderRequiredTitle('业务人员'),
    key: 'businessPersonName',
    width: 180,
    render: (row: any) => renderBusinessPersonSelect(row),
};

const inspectorNameColumn = {
    title: '验货人员',
    key: 'inspectorName',
    width: 120,
    render: (row: any) => renderInput(row, 'inspectorName', '请输入', 50),
};

const oreTypeColumn = {
    title: renderRequiredTitle('矿石种类'),
    key: 'oreType',
    width: 120,
    render: (row: any) => renderReadonlyCell(row, 'oreType', formatOreType(row.oreType)),
};

const contractOreGradeColumn = {
    title: renderRequiredTitle('合同约定品位'),
    key: 'contractOreGrade',
    width: 120,
    render: (row: any) => renderReadonlyCell(row, 'contractOreGrade', row.contractOreGrade),
};

const settleOreGradeColumn = {
    title: renderRequiredTitle('结算品位'),
    key: 'settleOreGrade',
    width: 120,
    render: (row: any) => renderNumberInput(row, 'settleOreGrade'),
};

const priceIncreaseColumn = {
    title: renderRequiredTitle('增减价'),
    key: 'priceIncrease',
    width: 100,
    render: (row: any) => renderNumberInput(row, 'priceIncrease', updateTaxIncludedAmount),
};

const contentMgoColumn = {
    title: '氧化镁含量≥4.5%',
    key: 'contentMgoGroup',
    children: [
        {
            title: renderRequiredTitle('含量'),
            key: 'contentMgoContent',
            width: 100,
            render: (row: any) =>
                renderContentInput(row, 'contentMgoObject', 'contentMgo', 'content', contentFieldMap.content, 'contentMgoContent'),
        },
        {
            title: renderRequiredTitle('加权平均'),
            key: 'contentMgoWeightedAverage',
            width: 110,
            render: (row: any) =>
                renderContentInput(
                    row,
                    'contentMgoObject',
                    'contentMgo',
                    'weightedAverage',
                    contentFieldMap.weightedAverage,
                    'contentMgoWeightedAverage'
                ),
        },
        {
            title: renderRequiredTitle('增减价'),
            key: 'contentMgoPriceIncrease',
            width: 100,
            render: (row: any) =>
                renderContentInput(
                    row,
                    'contentMgoObject',
                    'contentMgo',
                    'priceIncrease',
                    contentFieldMap.priceIncrease,
                    'contentMgoPriceIncrease'
                ),
        },
    ],
};

const contentFeoColumn = {
    title: '氧化铁含量（≤0.8%）',
    key: 'contentFeoGroup',
    children: [
        {
            title: renderRequiredTitle('含量'),
            key: 'contentFeoContent',
            width: 100,
            render: (row: any) =>
                renderContentInput(row, 'contentFeoObject', 'contentFeo', 'content', contentFieldMap.content, 'contentFeoContent'),
        },
        {
            title: renderRequiredTitle('加权平均'),
            key: 'contentFeoWeightedAverage',
            width: 110,
            render: (row: any) =>
                renderContentInput(
                    row,
                    'contentFeoObject',
                    'contentFeo',
                    'weightedAverage',
                    contentFieldMap.weightedAverage,
                    'contentFeoWeightedAverage'
                ),
        },
        {
            title: renderRequiredTitle('增减价'),
            key: 'contentFeoPriceIncrease',
            width: 100,
            render: (row: any) =>
                renderContentInput(
                    row,
                    'contentFeoObject',
                    'contentFeo',
                    'priceIncrease',
                    contentFieldMap.priceIncrease,
                    'contentFeoPriceIncrease'
                ),
        },
    ],
};

const contentAloColumn = {
    title: '氧化铝含量（≤1%）',
    key: 'contentAloGroup',
    children: [
        {
            title: renderRequiredTitle('含量'),
            key: 'contentAloContent',
            width: 100,
            render: (row: any) =>
                renderContentInput(row, 'contentAloObject', 'contentAlo', 'content', contentFieldMap.content, 'contentAloContent'),
        },
        {
            title: renderRequiredTitle('加权平均'),
            key: 'contentAloWeightedAverage',
            width: 110,
            render: (row: any) =>
                renderContentInput(
                    row,
                    'contentAloObject',
                    'contentAlo',
                    'weightedAverage',
                    contentFieldMap.weightedAverage,
                    'contentAloWeightedAverage'
                ),
        },
        {
            title: renderRequiredTitle('增减价'),
            key: 'contentAloPriceIncrease',
            width: 100,
            render: (row: any) =>
                renderContentInput(
                    row,
                    'contentAloObject',
                    'contentAlo',
                    'priceIncrease',
                    contentFieldMap.priceIncrease,
                    'contentAloPriceIncrease'
                ),
        },
    ],
};

const moistureColumn = {
    title: renderRequiredTitle('水分（%）'),
    key: 'moisture',
    width: 100,
    render: (row: any) => renderNumberInput(row, 'moisture'),
};

const exceedMoistureColumn = {
    title: renderRequiredTitle('超出水分吨位（吨）'),
    key: 'exceedMoisture',
    width: 140,
    render: (row: any) => renderNumberInput(row, 'exceedMoisture'),
};

const traderExceedMoistureColumn = {
    title: renderRequiredTitle('超出水分吨数'),
    key: 'exceedMoisture',
    width: 140,
    render: (row: any) => renderNumberInput(row, 'exceedMoisture'),
};

const granularityColumn = {
    title: renderRequiredTitle('粒度≤30mm过筛率%'),
    key: 'granularity',
    width: 150,
    render: (row: any) => renderNumberInput(row, 'granularity'),
};

const gradeFloatColumn = {
    title: renderRequiredTitle('品位增减价（元）'),
    key: 'gradeFloat',
    width: 170,
    render: (row: any) => renderNumberInput(row, 'gradeFloat', updateTaxIncludedAmount),
};

const dispatchWeightColumn = {
    title: renderRequiredTitle('发货量（吨）'),
    key: 'dispatchWeight',
    width: 130,
    render: (row: any) => renderReadonlyCell(row, 'dispatchWeight', getNumberDisplayValue(row.dispatchWeight)),
};

const actualReceiptWeightColumn = {
    title: renderRequiredTitle('实收量（吨）'),
    key: 'actualReceiptWeight',
    width: 130,
    render: (row: any) => renderNumberInput(row, 'actualReceiptWeight'),
};

const settleWeightColumn = {
    title: renderRequiredTitle('结算量（吨）'),
    key: 'settleWeight',
    width: 130,
    render: (row: any) => renderNumberInput(row, 'settleWeight', updateTaxIncludedAmount),
};

const contractUnitPriceColumn = {
    title: renderRequiredTitle('合同单价（元/吨）'),
    key: 'contractUnitPrice',
    width: 130,
    render: (row: any) => renderReadonlyCell(row, 'contractUnitPrice', getNumberDisplayValue(row.contractUnitPrice)),
};

const taxIncludedPriceColumn = {
    title: renderRequiredTitle('结算单价（元/吨）'),
    key: 'taxIncludedPrice',
    width: 150,
    render: (row: any) => renderReadonlyCell(row, 'taxIncludedPrice', formatSettlementAmount(getCalculatedUnitPrice(row))),
};

const taxIncludedAmountColumn = {
    title: renderRequiredTitle('分项金额（元）'),
    key: 'taxIncludedAmount',
    width: 130,
    render: (row: any) => renderReadonlyCell(row, 'taxIncludedAmount', formatSettlementAmount(getTaxIncludedAmount(row), '自动计算'), '自动计算'),
};

const remarkColumn = {
    title: '备注',
    key: 'remark',
    width: 160,
    render: (row: any) =>
        h(NInput, {
            value: row.remark || '',
            size: 'small',
            type: 'textarea',
            maxlength: 500,
            showCount: true,
            autosize: { minRows: 1, maxRows: 3 },
            placeholder: '请输入',
            'onUpdate:value': (value: string) => {
                row.remark = value;
            },
        }),
};

const leadingColumns = [
    selectionColumn,
    indexColumn,
    transportOrderColumn,
    acceptanceTimeColumn,
    deliveryLocationColumn,
    businessPersonColumn,
    inspectorNameColumn,
    oreTypeColumn,
    contractOreGradeColumn,
    settleOreGradeColumn,
];

const quantityColumns = [
    dispatchWeightColumn,
    actualReceiptWeightColumn,
    settleWeightColumn,
    contractUnitPriceColumn,
];

const suffixColumns = [taxIncludedPriceColumn, taxIncludedAmountColumn, remarkColumn];

/**
 * 根据客户类型生成结算明细表列，贸易商与化工企业使用不同业务配置。
 * @returns 当前客户类型对应的表格列
 */
const columns = computed(() => {
    if (isTraderCustomer.value) {
        return [
            ...leadingColumns,
            moistureColumn,
            traderExceedMoistureColumn,
            ...quantityColumns,
            gradeFloatColumn,
            ...suffixColumns,
        ];
    }

    return [
        selectionColumn,
        indexColumn,
        transportOrderColumn,
        acceptanceTimeColumn,
        deliveryLocationColumn,
        businessPersonColumn,
        inspectorNameColumn,
        oreTypeColumn,
        contractOreGradeColumn,
        settleOreGradeColumn,
        priceIncreaseColumn,
        contentMgoColumn,
        contentFeoColumn,
        contentAloColumn,
        moistureColumn,
        exceedMoistureColumn,
        granularityColumn,
        ...quantityColumns,
        ...suffixColumns,
    ];
});

/**
 * 递归计算 Naive UI 二级表头的横向滚动宽度。
 * @param columnList 表格列配置
 * @returns 所有叶子列宽度总和
 */
const getColumnsWidth = (columnList: any[]) => {
    return columnList.reduce((total, column) => {
        if (column.children?.length) {
            return total + getColumnsWidth(column.children);
        }
        return total + Number(column.width || 0);
    }, 0);
};

const tableScrollX = computed(() => getColumnsWidth(columns.value));

</script>

<style scoped lang="less">
.web-data-table {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
}

.web-n-data-table-con {
    height: 100%;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    flex: 1;
    border-radius: 8px;
}

.web-n-data-table {
    margin-bottom: calc(var(--base-width) / 2);
    flex: 1;
}

.settlement-detail-table {
    width: 100%;
    height: auto;
    flex: none;
    max-height: 500px;
    margin-bottom: 16px;

    .web-n-data-table-con {
        height: auto;
        flex: none;
        overflow: hidden;
    }

    .web-n-data-table {
        flex: none;
        margin-bottom: 0;
    }

    :deep(.required-column-title) {
        display: inline-flex;
        align-items: center;
    }

    :deep(.required-star) {
        color: #e34242;
        margin-right: 2px;
    }

    :deep(.settlement-detail-readonly-cell) {
        min-height: 28px;
        line-height: 26px;
        padding: 0 8px;
        border: 1px solid transparent;
        border-radius: 3px;
    }

    :deep(.settlement-detail-readonly-cell.is-error),
    :deep(.settlement-detail-field-wrapper.is-error) {
        border-color: #d03050;
    }

    :deep(.settlement-detail-field-wrapper) {
        border: 1px solid transparent;
        border-radius: 3px;
    }
}
</style>
