<template>
    <AppPage :title="editId ? '编辑结算单' : '新增结算单'" :showSearch="false" :showList="false">
        <template #sub-title>
            <step v-model="currentStep" />
        </template>
        <template #content>
            <baseInfo
                v-if="currentStep == 0"
                :formData="formData"
                :isEdit="isEdit"
                :yard-options="yardOptions"
                @settlement-rows-change="handleSettlementCheckedRowsChange" />
            <invoiceInfo v-if="currentStep == 1" :formData="formData" :isEdit="isEdit" />
            <approveInfo v-if="currentStep == 2" :formData="formData" />
        </template>
        <template #footer>
            <div class="bottom-btn-wrapper">
                <template v-if="currentStep == 0">
                    <Button type="primary" block class="bottom-btn" @click="changeStep('next')">下一步</Button>
                </template>
                <template v-if="currentStep == 1">
                    <Button plain type="primary" block class="bottom-btn prev-btn" @click="changeStep('prev')">上一步</Button>
                    <Button type="primary" block class="bottom-btn" @click="changeStep('next')">下一步</Button>
                </template>
                <template v-if="currentStep == 2">
                    <Button plain type="primary" block class="bottom-btn prev-btn" @click="changeStep('prev')">上一步</Button>
                    <Button
                        plain
                        type="primary"
                        block
                        class="bottom-btn"
                        style="border-color: #2C65F2;"
                        :disabled="submitLoading"
                        @click="handleSubmit('save')">
                        保存
                    </Button>
                    <Button type="primary" block class="bottom-btn" :disabled="submitLoading" @click="handleSubmit('submit')">
                        提交
                    </Button>
                </template>
            </div>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, showToast } from 'vant';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { createSettlementMainApi, getSettlementMainDetailApi, updateSettlementMainApi } from '@/api';
import { SETTLEMENT_STATUS_CONSTANT } from '@/constants/settlement';
import baseInfo from './createCpns/baseInfo.vue';
import invoiceInfo from './createCpns/invoiceInfo.vue';
import approveInfo from './createCpns/approveInfo.vue';
import step from './createCpns/step.vue';
import {
    formatDateParam,
    calculateInvoiceAmounts,
    getSettlementAmountNumber,
    getSettlementUnitPrice,
    getSettlementYardCode,
    getSettlementYardName,
    getSettlementNumberValidationMessage,
    SETTLEMENT_CHEMICAL_NUMBER_FIELDS,
    SETTLEMENT_TRADER_NUMBER_FIELDS,
    loadSettlementYardOptions,
    type SettlementYardOption,
} from '../utils';
import { numberToChinese } from '@/utils/commUtil';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const { userInfo } = storeToRefs(useUserStore());
const currentStep = ref(0);
const submitLoading = ref(false);
const checkedSettlementRows = ref<any[]>([]);
const yardOptions = ref<SettlementYardOption[]>([]);
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
const isEdit = computed(() => Boolean(editId.value));
const TEMP_INVOICE_DETAIL_PREFIX = 'TEMP_INVOICE_DETAIL';
const CUSTOMER_TYPE_TRADER = 'TRADER';

const formData = reactive<any>({
    id: undefined,
    settlementCode: '',
    status: SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
    contractCode: null,
    customerId: undefined,
    applyUnit: '',
    enterpriseName: '',
    shoulDate: null,
    customerType: null,
    handler: '',
    ourHandlerName: '',
    handlerSelectedPerson: null,
    handlerName: '',
    invoiceType: null,
    totalTaxAmount: '',
    settlementTotal: 0,
    contractDirectorId: '',
    contractDirectorName: '',
    contractDirectorLarkId: '',
    terms: '',
    invoiceInformation: '',
    invoiceRemark: '',
    financeInvoiceMainId: undefined,
    invoiceDetailList: [],
    tableList: [],
    reason: '',
    attachmentsInfo: [],
    associatedApproval: [],
    remark: '',
    approvalId: undefined,
    approvalInstanceId: '',
    initiatorId: '',
    initiatorLarkId: '',
    initiatorName: '',
    deptCode: '',
    deptName: '',
});

const INVOICE_DETAIL_REQUIRED_FIELDS = [
    { key: 'businessType', label: '业务类型', type: 'select' },
    { key: 'goodsName', label: '货物或应税劳务、服务名称', type: 'input' },
    { key: 'specificationModel', label: '规格型号', type: 'input' },
    { key: 'unit', label: '单位', type: 'input' },
    { key: 'quantity', label: '数量', type: 'input' },
    { key: 'unitPrice', label: '单价（元、含税）', type: 'input' },
    { key: 'amount', label: '金额（元、含税）', type: 'input' },
    { key: 'taxRate', label: '税率（%）', type: 'input' },
];
const INVOICE_TEXT_MAX_LENGTH = 50;
const INVOICE_TEXT_LIMIT_FIELDS = [
    { key: 'goodsName', label: '货物或应税劳务、服务名称' },
    { key: 'specificationModel', label: '规格型号' },
    { key: 'unit', label: '单位' },
];

const CONTENT_FIELD_MAP = {
    content: ['content', 'value', '含量'],
    weightedAverage: ['weightedAverage', 'weightedAvg', 'weighted', 'average', '加权平均'],
    priceIncrease: ['priceIncrease', 'increasePrice', 'priceFloat', '增价', '增减价'],
};

const COMMON_SETTLEMENT_REQUIRED_FIELDS = [
    { key: 'transportOrderCode', label: '运输订单编号' },
    { key: 'acceptanceTime', label: '验收时间', type: 'select' },
    { key: 'deliveryLocation', label: '交货地点', type: 'select' },
    { key: 'businessPersonName', label: '业务人员', type: 'select' },
    { key: 'oreType', label: '矿石种类', type: 'select' },
    { key: 'contractOreGrade', label: '合同约定品位' },
    { key: 'settleOreGrade', label: '结算品位' },
];
const QUANTITY_SETTLEMENT_REQUIRED_FIELDS = [
    { key: 'actualReceiptWeight', label: '实收量（吨）' },
    { key: 'settleWeight', label: '结算量（吨）' },
    { key: 'contractUnitPrice', label: '合同单价（元/吨）' },
];
const SUFFIX_SETTLEMENT_REQUIRED_FIELDS = [
    { key: 'taxIncludedPrice', label: '结算单价（元/吨）' },
    { key: 'taxIncludedAmount', label: '分项金额（元）' },
];
const TRADER_SETTLEMENT_REQUIRED_FIELDS = [
    ...COMMON_SETTLEMENT_REQUIRED_FIELDS,
    { key: 'moisture', label: '水分（%）' },
    { key: 'exceedMoisture', label: '超出水分吨数' },
    ...QUANTITY_SETTLEMENT_REQUIRED_FIELDS,
    { key: 'gradeFloat', label: '品位增减价（元）' },
    ...SUFFIX_SETTLEMENT_REQUIRED_FIELDS,
];
const CHEMICAL_SETTLEMENT_REQUIRED_FIELDS = [
    { key: 'transportOrderCode', label: '运输订单编号' },
    ...COMMON_SETTLEMENT_REQUIRED_FIELDS.slice(1),
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
    ...QUANTITY_SETTLEMENT_REQUIRED_FIELDS,
    ...SUFFIX_SETTLEMENT_REQUIRED_FIELDS,
];

const settlementRequiredFields = computed(() =>
    String(formData.customerType || '').toUpperCase() === CUSTOMER_TYPE_TRADER
        ? TRADER_SETTLEMENT_REQUIRED_FIELDS
        : CHEMICAL_SETTLEMENT_REQUIRED_FIELDS
);
const settlementNumberFields = computed(() =>
    String(formData.customerType || '').toUpperCase() === CUSTOMER_TYPE_TRADER
        ? SETTLEMENT_TRADER_NUMBER_FIELDS
        : SETTLEMENT_CHEMICAL_NUMBER_FIELDS
);

/**
 * 获取人员飞书 ID，兼容人员接口返回的不同字段。
 * @param user 当前用户或人员对象
 * @returns 飞书用户 ID
 */
const getPersonLarkId = (user: any) => {
    return user?.larkUserId || user?.feishuUserId || user?.larkId || '';
};

/**
 * 新增时默认使用当前登录用户作为我方经办人。
 * @returns 无返回值
 */
const setDefaultHandler = () => {
    if (isEdit.value || formData.handler) return;
    formData.handler = userInfo.value?.code || '';
    formData.ourHandlerName = userInfo.value?.username || '';
    formData.handlerSelectedPerson = {
        ...userInfo.value,
        value: userInfo.value?.code || '',
        code: userInfo.value?.code || '',
        label: userInfo.value?.username || '',
        username: userInfo.value?.username || '',
    };
};

/**
 * 新增时默认使用当前登录用户和第一个部门作为审批申请信息。
 * @returns 无返回值
 */
const setDefaultApprovalInfo = () => {
    if (isEdit.value || !userInfo.value) return;
    const defaultDept = userInfo.value?.userDeptList?.[0] || {};
    if (!formData.initiatorId) {
        formData.initiatorId = userInfo.value?.code || '';
        formData.initiatorName = userInfo.value?.username || '';
        formData.initiatorLarkId = getPersonLarkId(userInfo.value);
    }
    if (!formData.deptCode && defaultDept.deptCode) {
        formData.deptCode = defaultDept.deptCode;
        formData.deptName = defaultDept.deptName || '';
    }
};

watch(
    () => userInfo.value,
    () => {
        setDefaultHandler();
        setDefaultApprovalInfo();
    },
    { immediate: true }
);

/**
 * 将可能为字符串的数值字段转换为数字，非法值按 0 处理。
 * @param value 原始值
 * @returns 数字值
 */
const getNumberValue = (value: any) => {
    if (value === null || value === undefined || value === '') return 0;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
};

/**
 * 同步申请开票明细金额字段。
 * @param rows 申请开票明细列表
 * @returns 无返回值
 */
const syncInvoiceTaxIncludedAmounts = (rows: any[] = []) => {
    rows.forEach((row) => {
        Object.assign(row, calculateInvoiceAmounts(row));
    });
};

/**
 * 获取第一个非空值，数字 0 视为有效。
 * @param values 候选值
 * @returns 第一个有效值
 */
const getFirstValidValue = (...values: any[]) => {
    return values.find((value) => value !== null && value !== undefined && value !== '');
};

/**
 * 判断字段是否有有效值。
 * @param value 待判断值
 * @returns 是否有值
 */
const hasValue = (value: any) => getFirstValidValue(value) !== undefined;

/**
 * 判断结算明细行是否需要按新增态补默认值。
 * @param row 当前结算明细行
 * @returns 新增页或编辑页无 id 行返回 true
 */
const shouldUseSettlementRowDefaultValue = (row: any) => !isEdit.value || !hasValue(row?.id);

/**
 * 加载结算明细交货地点使用的启用堆场。
 * @returns 无返回值
 */
const loadYardOptions = async () => {
    try {
        yardOptions.value = await loadSettlementYardOptions();
    } catch (error) {
        yardOptions.value = [];
        console.error('加载结算单堆场选项失败:', error);
    }
};

/**
 * 按两位小数格式化数字。
 * @param value 原始值
 * @returns 两位小数数字
 */
const getFixedNumber = (value: any) => Number(getNumberValue(value).toFixed(2));

/**
 * 编辑态空值保持为空，新增态使用默认 0。
 * @param value 原始数值
 * @param useDefault 是否按新增态补默认值
 * @returns 可提交数值
 */
const getDefaultableFixedNumber = (value: any, useDefault = !isEdit.value) => {
    if (hasValue(value)) return getFixedNumber(value);
    return useDefault ? 0 : null;
};

/**
 * 解析对象或 JSON 字符串。
 * @param value 原始对象或字符串
 * @returns 解析后的对象
 */
const getObjectValue = (value: any) => {
    if (!value) return {};
    if (typeof value === 'object' && !Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error('解析结算明细成分对象失败:', error);
        return {};
    }
};

/**
 * 从成分对象中提取数字字段。
 * @param objectValue 成分对象
 * @param fieldKeys 可匹配字段 key
 * @param useDefault 是否按新增态补默认值
 * @returns 两位小数数字
 */
const getContentNumber = (objectValue: any, fieldKeys: string[], useDefault = !isEdit.value) => {
    const targetKey = fieldKeys.find((key) => objectValue?.[key] !== null && objectValue?.[key] !== undefined && objectValue?.[key] !== '');
    return targetKey ? getFixedNumber(objectValue[targetKey]) : useDefault ? 0 : null;
};

/**
 * 组装成分字段对象和字符串。
 * @param row 当前结算明细行
 * @param objectKey 成分对象字段名
 * @param stringKey 成分字符串字段名
 * @param useDefault 是否按新增态补默认值
 * @returns 成分提交字段
 */
const getContentPayload = (row: any, objectKey: string, stringKey: string, useDefault = shouldUseSettlementRowDefaultValue(row)) => {
    const objectValue = getObjectValue(row[objectKey] || row[stringKey]);
    const payload = {
        content: getContentNumber(objectValue, CONTENT_FIELD_MAP.content, useDefault),
        weightedAverage: getContentNumber(objectValue, CONTENT_FIELD_MAP.weightedAverage, useDefault),
        priceIncrease: getContentNumber(objectValue, CONTENT_FIELD_MAP.priceIncrease, useDefault),
    };
    return {
        objectValue: payload,
        stringValue: JSON.stringify(payload),
    };
};

/**
 * 按结算单价和结算量计算结算金额，单位元。
 * @param row 当前结算明细行
 * @returns 结算金额
 */
const getDetailSettlementAmount = (row: any) => {
    const useDefault = shouldUseSettlementRowDefaultValue(row);
    const settleWeightSource = useDefault
        ? getFirstValidValue(row.settleWeight, row.actualReceiptWeight, row.dispatchWeight)
        : row.settleWeight;
    const settlementUnitPrice = getSettlementUnitPrice(row, formData.customerType, useDefault ? 0 : null);
    if (!hasValue(settleWeightSource) || !hasValue(settlementUnitPrice)) {
        return useDefault ? 0 : null;
    }
    return getSettlementAmountNumber(
        getNumberValue(settleWeightSource) * getNumberValue(settlementUnitPrice),
        useDefault ? 0 : null
    );
};

/**
 * 按结算单价和结算量计算分项金额，单位元。
 * @param row 当前结算明细行
 * @returns 分项金额
 */
const getDetailTaxIncludedAmount = (row: any) => {
    return getDetailSettlementAmount(row);
};

/**
 * 获取成分字段值，兼容对象和 JSON 字符串。
 * @param row 当前结算明细行
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @param fieldKeys 可匹配字段 key
 * @returns 成分字段值
 */
const getContentRequiredValue = (row: any, objectKey: string, jsonKey: string, fieldKeys: string[]) => {
    const objectValue = row[objectKey] || getObjectValue(row[jsonKey]);
    const key = fieldKeys.find((item) => objectValue?.[item] !== undefined && objectValue?.[item] !== null);
    return key ? objectValue[key] : '';
};

/**
 * 获取结算明细字段校验值，兼容人员、成分和计算字段。
 * @param row 当前结算明细行
 * @param key 字段 key
 * @returns 用于必填校验的字段值
 */
const getSettlementRequiredValue = (row: any, key: string) => {
    switch (key) {
        case 'businessPersonName':
            return row.businessPersonCodes?.length || row.businessPerson?.length || row.businessPersonName || row.businessPersonId;
        case 'contentMgoContent':
            return getContentRequiredValue(row, 'contentMgoObject', 'contentMgo', CONTENT_FIELD_MAP.content);
        case 'contentMgoWeightedAverage':
            return getContentRequiredValue(row, 'contentMgoObject', 'contentMgo', CONTENT_FIELD_MAP.weightedAverage);
        case 'contentMgoPriceIncrease':
            return getContentRequiredValue(row, 'contentMgoObject', 'contentMgo', CONTENT_FIELD_MAP.priceIncrease);
        case 'contentFeoContent':
            return getContentRequiredValue(row, 'contentFeoObject', 'contentFeo', CONTENT_FIELD_MAP.content);
        case 'contentFeoWeightedAverage':
            return getContentRequiredValue(row, 'contentFeoObject', 'contentFeo', CONTENT_FIELD_MAP.weightedAverage);
        case 'contentFeoPriceIncrease':
            return getContentRequiredValue(row, 'contentFeoObject', 'contentFeo', CONTENT_FIELD_MAP.priceIncrease);
        case 'contentAloContent':
            return getContentRequiredValue(row, 'contentAloObject', 'contentAlo', CONTENT_FIELD_MAP.content);
        case 'contentAloWeightedAverage':
            return getContentRequiredValue(row, 'contentAloObject', 'contentAlo', CONTENT_FIELD_MAP.weightedAverage);
        case 'contentAloPriceIncrease':
            return getContentRequiredValue(row, 'contentAloObject', 'contentAlo', CONTENT_FIELD_MAP.priceIncrease);
        case 'taxIncludedAmount':
            return getDetailTaxIncludedAmount(row);
        default:
            return row?.[key];
    }
};

/**
 * 判断结算明细必填字段是否为空，数字 0 视为已填写。
 * @param value 字段值
 * @returns 是否为空
 */
const isEmptySettlementValue = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || value === '';
};

/**
 * 获取已勾选结算明细的首个校验错误文案。
 * @param rows 已勾选结算明细列表
 * @returns 校验错误文案，无错误时返回空字符串
 */
const getSettlementDetailErrorMessage = (rows: any[]) => {
    if (!rows.length) return formData.tableList?.length ? '请至少勾选一条结算明细表数据' : '结算明细表至少需要一项';
    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowIndex =
            formData.tableList.findIndex((item: any) => {
                if (item === row) return true;
                if (hasValue(item.id) && hasValue(row.id) && String(item.id) === String(row.id)) return true;
                return Boolean(item.transportOrderCode && row.transportOrderCode && item.transportOrderCode === row.transportOrderCode);
            }) + 1;
        for (const field of settlementRequiredFields.value) {
            if (isEmptySettlementValue(getSettlementRequiredValue(row, field.key))) {
                const prefix = field.type === 'select' ? '请选择' : '请输入';
                return `${prefix}结算明细${numberToChinese(rowIndex || index + 1)}的${field.label}`;
            }
        }
        for (const field of settlementNumberFields.value) {
            const numberError = getSettlementNumberValidationMessage(
                getSettlementRequiredValue(row, field.key),
                field.key,
                field.label
            );
            if (numberError) return `结算明细${numberToChinese(rowIndex || index + 1)}的${numberError}`;
        }
    }
    return '';
};

/**
 * 计算结算明细汇总。
 * @param rows 结算明细行
 * @returns 汇总字段
 */
const getSettlementSummary = (rows: any[]) => {
    return rows.reduce(
        (summary, row) => {
            const useDefault = shouldUseSettlementRowDefaultValue(row);
            summary.totalQuantity += getNumberValue(row.dispatchWeight);
            summary.totalExcessMoistureTons += getNumberValue(row.exceedMoisture);
            summary.totalSettlementTons += getNumberValue(useDefault ? getFirstValidValue(row.settleWeight, row.dispatchWeight) : row.settleWeight);
            summary.totalTaxAmount += getNumberValue(getDetailTaxIncludedAmount(row));
            summary.totalSettlementAmount += getNumberValue(getDetailSettlementAmount(row));
            return summary;
        },
        {
            totalQuantity: 0,
            totalExcessMoistureTons: 0,
            totalSettlementTons: 0,
            totalTaxAmount: 0,
            totalSettlementAmount: 0,
        }
    );
};

/**
 * 计算开票明细汇总。
 * @param rows 开票明细行
 * @returns 汇总字段
 */
const getInvoiceSummary = (rows: any[]) => {
    syncInvoiceTaxIncludedAmounts(rows);
    return rows.reduce(
        (summary, row) => {
            summary.totalQuantity += getNumberValue(row.quantity);
            summary.totalUnitPrice += getNumberValue(row.unitPrice);
            summary.totalAmount += getNumberValue(row.amount);
            summary.totalTaxAmount += getNumberValue(row.taxAmount);
            summary.totalAmountExcludingTax += getNumberValue(row.amountExcludingTax);
            return summary;
        },
        {
            totalQuantity: 0,
            totalUnitPrice: 0,
            totalAmount: 0,
            totalTaxAmount: 0,
            totalAmountExcludingTax: 0,
        }
    );
};

/**
 * 同步结算明细勾选行，并刷新结算总价。
 * @param rows 已勾选行
 * @returns 无返回值
 */
const handleSettlementCheckedRowsChange = (rows: any[] = []) => {
    checkedSettlementRows.value = Array.isArray(rows) ? rows : [];
    if (!formData.tableList?.length) {
        formData.settlementTotal = 0;
        if (!editId.value) {
            formData.totalTaxAmount = '';
        }
        return;
    }
    const settlementSummary = getSettlementSummary(checkedSettlementRows.value);
    formData.totalTaxAmount = getSettlementAmountNumber(settlementSummary.totalTaxAmount);
    formData.settlementTotal = getFixedNumber(settlementSummary.totalSettlementTons);
};

/**
 * 根据当前选择的我方经办人组装提交字段。
 * @returns 经办人数组
 */
const getHandlerPayload = () => {
    if (!formData.handler) return [];
    const handlerPerson = formData.handlerSelectedPerson || {};
    return [
        {
            code: formData.handler,
            value: formData.handler,
            label: formData.ourHandlerName || '',
            username: formData.ourHandlerName || '',
            larkUserId: getPersonLarkId(handlerPerson),
        },
    ];
};

/**
 * 标准化人员对象。
 * @param person 原始人员对象
 * @returns 标准人员对象
 */
const normalizePerson = (person: any) => {
    return {
        ...person,
        value: person.value || person.code || person.id || '',
        code: person.code || person.value || person.id || '',
        label: person.label || person.username || person.name || '',
        username: person.username || person.label || person.name || '',
    };
};

/**
 * 获取合同我方负责人，作为没有业务人员的结算明细默认值。
 * @returns 标准人员对象，没有负责人时返回 null
 */
const getContractDirectorPerson = () => {
    const person = normalizePerson({
        code: formData.contractDirectorId,
        value: formData.contractDirectorId,
        label: formData.contractDirectorName,
        username: formData.contractDirectorName,
        larkUserId: formData.contractDirectorLarkId,
    });
    return person.value || person.code ? person : null;
};

/**
 * 解析结算明细业务人员。
 * @param row 当前结算明细行
 * @returns 业务人员对象数组
 */
const getBusinessPersonPayload = (row: any) => {
    if (Array.isArray(row.businessPerson)) {
        return row.businessPerson.map((item: any) => normalizePerson(item)).filter((item: any) => item.value || item.code);
    }
    if (row.businessPerson && typeof row.businessPerson === 'object') {
        const person = normalizePerson(row.businessPerson);
        return person.value || person.code ? [person] : [];
    }
    if (typeof row.businessPersonId === 'string' && row.businessPersonId.trim()) {
        try {
            const parsed = JSON.parse(row.businessPersonId);
            if (Array.isArray(parsed)) return parsed.map((item: any) => normalizePerson(item)).filter((item: any) => item.value || item.code);
            if (parsed && typeof parsed === 'object') {
                const person = normalizePerson(parsed);
                return person.value || person.code ? [person] : [];
            }
        } catch (error) {
            const codes = row.businessPersonId.split(',').map((item: string) => item.trim()).filter(Boolean);
            const names = String(row.businessPersonName || '').split(',').map((item) => item.trim());
            return codes.map((code: string, index: number) =>
                normalizePerson({
                    code,
                    value: code,
                    label: names[index] || code,
                    username: names[index] || code,
                })
            );
        }
    }
    if (Array.isArray(row.businessPersonCodes)) {
        const names = Array.isArray(row.businessPersonNames)
            ? row.businessPersonNames
            : String(row.businessPersonName || '').split(',').map((item) => item.trim());
        return row.businessPersonCodes
            .map((code: string, index: number) =>
                normalizePerson({
                    code,
                    value: code,
                    label: names[index] || code,
                    username: names[index] || code,
                })
            )
            .filter((item: any) => item.value || item.code);
    }
    const contractDirector = getContractDirectorPerson();
    if (contractDirector) return [contractDirector];
    return [];
};

/**
 * 组装结算明细 DTO。
 * @param row 当前结算明细行
 * @param index 行下标
 * @returns 结算明细提交字段
 */
const getSettlementDetailPayload = (row: any, index: number) => {
    const useDefault = shouldUseSettlementRowDefaultValue(row);
    const contentMgo = getContentPayload(row, 'contentMgoObject', 'contentMgo', useDefault);
    const contentFeo = getContentPayload(row, 'contentFeoObject', 'contentFeo', useDefault);
    const contentAlo = getContentPayload(row, 'contentAloObject', 'contentAlo', useDefault);
    const businessPersons = getBusinessPersonPayload(row);
    const businessPersonName = businessPersons.map((item: any) => item.label || item.username).filter(Boolean).join(',');
    return {
        id: row.id,
        settlementMainId: editId.value || undefined,
        settlementCode: formData.settlementCode || undefined,
        transportOrderCode: row.transportOrderCode || '',
        acceptanceTime: formatDateParam(row.acceptanceTime) || row.acceptanceTime || '',
        deliveryLocation: getSettlementYardCode(row.deliveryLocation, yardOptions.value),
        deliveryLocationName:
            row.deliveryLocationName || getSettlementYardName(row.deliveryLocation, yardOptions.value),
        businessPersonId: businessPersons.length ? JSON.stringify(businessPersons) : row.businessPersonId || '',
        businessPerson: businessPersons.length ? businessPersons : undefined,
        businessPersonName: businessPersonName || row.businessPersonName || '',
        inspectorName: row.inspectorName || '',
        oreType: row.oreType || '',
        contractOreGrade: getDefaultableFixedNumber(row.contractOreGrade, useDefault),
        settleOreGrade: getDefaultableFixedNumber(useDefault ? getFirstValidValue(row.settleOreGrade, row.contractOreGrade) : row.settleOreGrade, useDefault),
        contentMgo: contentMgo.stringValue,
        contentMgoObject: contentMgo.objectValue,
        contentFeo: contentFeo.stringValue,
        contentFeoObject: contentFeo.objectValue,
        contentAlo: contentAlo.stringValue,
        contentAloObject: contentAlo.objectValue,
        moisture: getDefaultableFixedNumber(row.moisture, useDefault),
        exceedMoisture: getDefaultableFixedNumber(row.exceedMoisture, useDefault),
        granularity: getDefaultableFixedNumber(row.granularity, useDefault),
        gradeFloat: getDefaultableFixedNumber(row.gradeFloat, useDefault),
        priceIncrease: getDefaultableFixedNumber(row.priceIncrease, useDefault),
        contractUnitPrice: getDefaultableFixedNumber(row.contractUnitPrice, useDefault),
        taxIncludedPrice: getSettlementUnitPrice(row, formData.customerType, useDefault ? 0 : null),
        dispatchWeight: getDefaultableFixedNumber(row.dispatchWeight, useDefault),
        actualReceiptWeight: getDefaultableFixedNumber(
            useDefault ? getFirstValidValue(row.actualReceiptWeight, row.dispatchWeight) : row.actualReceiptWeight,
            useDefault
        ),
        settleWeight: getDefaultableFixedNumber(useDefault ? getFirstValidValue(row.settleWeight, row.dispatchWeight) : row.settleWeight, useDefault),
        taxIncludedAmount: getDetailTaxIncludedAmount(row),
        remark: row.remark || '',
        orderNum: row.orderNum || index + 1,
    };
};

/**
 * 组装开票明细 DTO。
 * @param row 当前开票明细行
 * @returns 开票明细提交字段
 */
const getInvoiceDetailPayload = (row: any) => {
    const amounts = calculateInvoiceAmounts(row);
    return {
        id: typeof row.id === 'string' && row.id.startsWith(TEMP_INVOICE_DETAIL_PREFIX) ? undefined : row.id,
        invoiceMainId: formData.financeInvoiceMainId || undefined,
        businessType: row.businessType || '',
        goodsName: row.goodsName || '',
        specificationModel: row.specificationModel || '',
        unit: row.unit || '',
        quantity: getNumberValue(row.quantity),
        unitPrice: getNumberValue(row.unitPrice),
        amount: getNumberValue(amounts.amount),
        taxRate: getNumberValue(row.taxRate),
        taxAmount: getNumberValue(amounts.taxAmount),
        amountExcludingTax: getNumberValue(amounts.amountExcludingTax),
        remark: row.remark || '',
        applyUnit: row.applyUnit || formData.applyUnit || '',
    };
};

/**
 * 解析关联审批字段。
 * @param value 关联审批字段
 * @returns 关联审批对象数组
 */
const parseAssociatedApproval = (value: any) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
};

/**
 * 将关联审批整理成接口需要的 JSON 字符串。
 * @param value 关联审批对象数组或字符串
 * @returns JSON 字符串
 */
const getAssociatedApprovalPayload = (value: any) => {
    if (typeof value === 'string') return value;
    return JSON.stringify(Array.isArray(value) ? value : []);
};

/**
 * 规范化附件提交字段。
 * @param attachments 附件列表
 * @returns 接口附件列表
 */
const getAttachmentsPayload = (attachments: any[]) => {
    return (Array.isArray(attachments) ? attachments : [])
        .map((item: any) => ({
            ...item,
            name: item.name || item.fileName || item.originalName || item.filename || '',
            url: item.url || item.fileUrl || item.path || '',
        }))
        .filter((item: any) => item.name || item.url);
};

/**
 * 将接口附件转换为上传组件回显格式。
 * @param attachments 附件列表
 * @returns 上传组件附件列表
 */
const getAttachmentViewList = (attachments: any[]) => {
    return (Array.isArray(attachments) ? attachments : []).map((item: any) => ({
        ...item,
        fileName: item.fileName || item.name || item.originalName || '',
        name: item.name || item.fileName || item.originalName || '',
        url: item.url || item.fileUrl || item.path || '',
        status: item.status || 'success',
    }));
};

/**
 * 组装保存或提交参数。
 * @param statusOverride 提交时指定状态
 * @returns 接口 payload
 */
const getSubmitPayload = (statusOverride?: string) => {
    const settlementRows = checkedSettlementRows.value || [];
    const detailList = settlementRows.map((row: any, index: number) => getSettlementDetailPayload(row, index));
    const invoiceDetailList = (formData.invoiceDetailList || []).map((row: any) => getInvoiceDetailPayload(row));
    const settlementSummary = getSettlementSummary(settlementRows);
    const invoiceSummary = getInvoiceSummary(formData.invoiceDetailList || []);
    return {
        id: editId.value || undefined,
        settlementCode: formData.settlementCode || undefined,
        contractCode: formData.contractCode || '',
        expirationTime: formatDateParam(formData.shoulDate) || formData.shoulDate || '',
        status: statusOverride || formData.status || SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
        customerId: formData.customerId || undefined,
        customerName: formData.enterpriseName || '',
        customerType: formData.customerType || '',
        handler: getHandlerPayload(),
        handlerName: formData.handlerName || '',
        totalTaxAmount: getSettlementAmountNumber(getFirstValidValue(settlementSummary.totalTaxAmount, formData.totalTaxAmount)),
        settlementTotal: getFixedNumber(settlementSummary.totalSettlementTons),
        remark: formData.remark || '',
        terms: formData.terms || '',
        reason: formData.reason || '',
        associatedApproval: getAssociatedApprovalPayload(formData.associatedApproval),
        attachmentsInfo: getAttachmentsPayload(formData.attachmentsInfo),
        approvalId: formData.approvalId || undefined,
        approvalInstanceId: formData.approvalInstanceId || '',
        initiatorId: formData.initiatorId || '',
        initiatorLarkId: formData.initiatorLarkId || '',
        initiatorName: formData.initiatorName || '',
        deptCode: formData.deptCode || '',
        deptName: formData.deptName || '',
        financeSettlementDetailDTOList: detailList,
        financeInvoiceMainDTO: {
            id: formData.financeInvoiceMainId || undefined,
            applyUnit: formData.applyUnit || '',
            customerName: formData.enterpriseName || '',
            invoiceType: formData.invoiceType || '',
            invoiceInformation: formData.invoiceInformation || '',
            invoiceRemark: formData.invoiceRemark || '',
            totalQuantity: getFixedNumber(invoiceSummary.totalQuantity),
            totalUnitPrice: getSettlementAmountNumber(invoiceSummary.totalUnitPrice),
            totalAmount: getSettlementAmountNumber(invoiceSummary.totalAmount),
            totalTaxAmount: getSettlementAmountNumber(invoiceSummary.totalTaxAmount),
            totalAmountExcludingTax: getSettlementAmountNumber(invoiceSummary.totalAmountExcludingTax),
        },
        financeInvoiceDetailDTOList: invoiceDetailList,
        totalQuantity: getFixedNumber(settlementSummary.totalQuantity),
        totalExcessMoistureTons: getFixedNumber(settlementSummary.totalExcessMoistureTons),
        totalSettlementTons: getFixedNumber(settlementSummary.totalSettlementTons),
        totalSettlementAmount: getSettlementAmountNumber(settlementSummary.totalSettlementAmount),
    };
};

/**
 * 从详情接口回填 App 新增编辑页。
 * @param detail 结算单详情
 * @returns 无返回值
 */
const setFormDetail = (detail: any) => {
    const handler = Array.isArray(detail.handler) ? detail.handler[0] || {} : {};
    const invoiceMain = detail.financeInvoiceMainDTO || {};
    formData.id = detail.id;
    formData.settlementCode = detail.settlementCode || '';
    formData.status = detail.status || SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01;
    formData.contractCode = detail.contractCode || null;
    formData.customerId = detail.customerId;
    formData.applyUnit = invoiceMain.applyUnit || '';
    formData.enterpriseName = detail.customerName || '';
    formData.shoulDate = detail.expirationTime || null;
    formData.customerType = detail.customerType || null;
    formData.handler = handler.value || handler.code || handler.id || '';
    formData.ourHandlerName = handler.label || handler.username || handler.name || '';
    formData.handlerSelectedPerson = {
        ...handler,
        value: handler.value || handler.code || handler.id || '',
        code: handler.code || handler.value || handler.id || '',
        label: handler.label || handler.username || handler.name || '',
        username: handler.username || handler.label || handler.name || '',
    };
    formData.handlerName = detail.handlerName || '';
    formData.invoiceType = invoiceMain.invoiceType || null;
    formData.totalTaxAmount = detail.totalTaxAmount ?? '';
    formData.settlementTotal = detail.settlementTotal ?? detail.totalSettlementTons ?? 0;
    formData.terms = detail.terms || '';
    formData.invoiceInformation = invoiceMain.invoiceInformation || '';
    formData.invoiceRemark = invoiceMain.invoiceRemark || '';
    formData.financeInvoiceMainId = invoiceMain.id;
    formData.tableList = (detail.financeSettlementDetailDTOList || []).map((row: any) => ({
        ...row,
        deliveryLocation: getSettlementYardCode(row.deliveryLocation, yardOptions.value),
        deliveryLocationName:
            row.deliveryLocationName || getSettlementYardName(row.deliveryLocation, yardOptions.value),
        __checked: hasValue(row.id),
    }));
    formData.invoiceDetailList = detail.financeInvoiceDetailDTOList || [];
    syncInvoiceTaxIncludedAmounts(formData.invoiceDetailList);
    formData.reason = detail.reason || '';
    formData.attachmentsInfo = getAttachmentViewList(detail.attachmentsInfo || []);
    formData.associatedApproval = parseAssociatedApproval(detail.associatedApproval);
    formData.remark = detail.remark || '';
    formData.approvalId = detail.approvalId;
    formData.approvalInstanceId = detail.approvalInstanceId || '';
    formData.initiatorId = detail.initiatorId || '';
    formData.initiatorLarkId = detail.initiatorLarkId || '';
    formData.initiatorName = detail.initiatorName || '';
    formData.deptCode = detail.deptCode || '';
    formData.deptName = detail.deptName || '';
    handleSettlementCheckedRowsChange(formData.tableList.filter((row: any) => row.__checked !== false));
};

/**
 * 加载编辑详情。
 * @returns 无返回值
 */
const getDetail = async () => {
    if (!editId.value) return;
    try {
        const res: any = await getSettlementMainDetailApi(editId.value, true);
        if (res?.code === 200) {
            setFormDetail(res.data || {});
        }
    } catch (error) {
        console.error('获取结算单详情失败:', error);
    }
};

/**
 * 判断回款到期时间是否为当前日期或之后。
 * @param value 回款到期时间
 * @returns 是否为当前日期或之后
 */
const isReceiptDueDateTodayOrAfter = (value: any) => {
    const date = dayjs(value);
    return date.isValid() && !date.isBefore(dayjs().startOf('day'), 'day');
};

/**
 * 校验当前步骤的必填数据。
 * @param stepIndex 当前步骤
 * @returns 校验是否通过
 */
const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
        if (!formData.contractCode) return '请选择销售合同编号';
        if (!formData.shoulDate) return '请选择回款到期时间';
        if (!isReceiptDueDateTodayOrAfter(formData.shoulDate)) return '回款到期时间不能选择当前日期之前';
        if (!formData.enterpriseName) return '请选择销售合同带出企业名称';
        if (!formData.customerType) return '请选择销售合同带出客户类型';
        if (!formData.handler) return '请选择我方经办人';
        if (isEmptySettlementValue(formData.totalTaxAmount)) return '请输入结算总价';
        if (!checkedSettlementRows.value.length) return '结算明细表至少需要一项';
        const settlementDetailErrorMessage = getSettlementDetailErrorMessage(checkedSettlementRows.value);
        if (settlementDetailErrorMessage) return settlementDetailErrorMessage;
        if (!formData.terms) return '请输入合同结算条款';
    }
    if (stepIndex === 1) {
        if (!formData.applyUnit) return '请选择销售合同带出申请单位';
        if (!formData.enterpriseName) return '请选择销售合同带出客户名称';
        if (!formData.invoiceType) return '请选择本次开票类型';
        if (!formData.invoiceRemark) return '请输入开票备注';
        if (!formData.invoiceDetailList?.length) return '申请开票明细至少需要一项';
        syncInvoiceTaxIncludedAmounts(formData.invoiceDetailList || []);
        for (let index = 0; index < formData.invoiceDetailList.length; index += 1) {
            const row = formData.invoiceDetailList[index];
            for (const field of INVOICE_DETAIL_REQUIRED_FIELDS) {
                if (row?.[field.key] === null || row?.[field.key] === undefined || row?.[field.key] === '') {
                    return `${field.type === 'select' ? '请选择' : '请输入'}申请开票明细第${index + 1}行的${field.label}`;
                }
            }
            const overLengthField = INVOICE_TEXT_LIMIT_FIELDS.find((field) => String(row?.[field.key] || '').length > INVOICE_TEXT_MAX_LENGTH);
            if (overLengthField) {
                return `申请开票明细第${index + 1}行的${overLengthField.label}最多${INVOICE_TEXT_MAX_LENGTH}字`;
            }
        }
    }
    if (stepIndex === 2) {
        if (!formData.initiatorId) return '请选择申请人';
        if (!formData.deptCode) return '请选择申请部门';
        if (!formData.reason) return '请输入申请事由';
        if (!formData.attachmentsInfo?.length) return '请选择结算附件';
        if (!formData.associatedApproval?.length) return '请选择关联审批';
        if (!formData.remark) return '请输入结算备注';
    }
    return '';
};

/**
 * 切换步骤。下一步只切换页面，最终保存或提交时统一执行校验。
 * @param type 前进或后退
 * @returns 无返回值
 */
const changeStep = (type: 'next' | 'prev') => {
    if (type === 'next') {
        currentStep.value += 1;
    }
    if (type === 'prev') {
        currentStep.value -= 1;
    }
};

/**
 * 保存或提交结算单。
 * @param action 保存或提交
 * @returns 无返回值
 */
const handleSubmit = async (action: 'save' | 'submit') => {
    const errorMessage = action === 'save'
        ? (!formData.contractCode ? '请选择销售合同编号' : '')
        : [0, 1, 2].map((stepIndex) => validateStep(stepIndex)).find(Boolean);
    if (errorMessage) {
        showToast(errorMessage as string);
        return;
    }
    submitLoading.value = true;
    try {
        const statusOverride = action === 'submit'
            ? SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING
            : SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01;
        const payload = getSubmitPayload(statusOverride);
        const request = isEdit.value ? updateSettlementMainApi : createSettlementMainApi;
        const res: any = await request(payload);
        if (res?.code === 200) {
            router.back();
        }
    } catch (error) {
        console.error('保存结算单失败:', error);
    } finally {
        submitLoading.value = false;
    }
};

onMounted(async () => {
    try {
        await loadYardOptions();
        if (isEdit.value) {
            await getDetail();
            return;
        }
        setDefaultHandler();
        setDefaultApprovalInfo();
    } catch (error) {
        console.error('初始化 App 结算单新增编辑页失败:', error);
    }
});
</script>

<style scoped lang="less">
.bottom-btn-wrapper {
    display: flex;
    gap: 20px;
    padding: 4px 12px 8px;
    background-color: var(--base-white);
    z-index: 99;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);

    .bottom-btn {
        border-radius: 4px;
        height: 40px;
        font-size: 16px;
        font-weight: 500;
    }

    .prev-btn {
        color: #666;
        border-color: #C4C4C4;
    }
}
</style>
