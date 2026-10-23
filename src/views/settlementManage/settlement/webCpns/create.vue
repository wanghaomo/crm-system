<template>
    <WebPage contentPadding="0px" :hideAddBtn="true" showBack  show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <div class="header-actions">
                <MxButton
                    border
                    :disabled="submitLoading"
                    :styleOption="{ color: 'var(--base-color)', 'border-color': 'var(--base-color)' }"
                    @click="saveTable()">
                    保 存
                </MxButton>
                <MxButton :disabled="submitLoading" @click="submitTable()">提 交</MxButton>
            </div>
        </template>
        <template #content>
            <div class="main">
                <div class="big-title">{{ title }}</div>
                <n-form
                    style="margin-top: 16px"
                    ref="formRef"
                    :model="formData"
                    :rules="rules"
                    require-mark-placement="left"
                    label-placement="left"
                    label-align="right"
                    label-width="120px">
                    <div v-if="approvalLogs.length" class="edit-approval-flow">
                        <div class="title" style="margin-top: 0px">流程信息</div>
                        <ApprovalDetails :model-value="approvalLogs" type="horizontal" />
                    </div>
                    <div class="title" style="margin-top: 0px">基础信息</div>
                    <baseInfo :formData="formData" :isEdit="isEdit" />
                    <div class="title" style="margin-top: 0px">结算明细表</div>
                    <settlementDetails
                        ref="settlementDetailsRef"
                        :formData="formData"
                        :tableList="formData.tableList"
                        :isEdit="isEdit"
                        :yard-options="yardOptions"
                        :yard-loading="yardLoading"
                        @checked-rows-change="handleSettlementCheckedRowsChange"
                        :validate-trigger="settlementDetailValidateTrigger" />
                    <div class="title" style="margin-top: 0px">开票信息</div>
                    <billingInfo :formData="formData" />
                    <div class="title" style="margin-top: 0px">申请开票明细</div>
                    <invoiceDetails
                        :formData="formData"
                        :isEdit="isEdit"
                        :validate-trigger="invoiceDetailValidateTrigger"
                        class="invoice-detail-form-item" />
                    <div class="title">审批信息</div>
                    <approveInfo :formData="formData" />
                </n-form>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, onMounted } from 'vue';
import { NForm, useMessage } from 'naive-ui';
import baseInfo from './createCpns/baseInfo.vue';
import settlementDetails from './createCpns/settlementDetails.vue';
import billingInfo from './createCpns/billingInfo.vue';
import invoiceDetails from './createCpns/invoiceDetails.vue';
import approveInfo from './createCpns/approveInfo.vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { createSettlementMainApi, getSettlementMainDetailApi, updateSettlementMainApi } from '@/api';
import { SETTLEMENT_STATUS_CONSTANT } from '@/constants/settlement';
import {
    formatDateParam,
    calculateInvoiceAmounts,
    getSettlementAmountNumber,
    getSettlementUnitPrice,
    getSettlementYardCode,
    getSettlementYardName,
    loadSettlementYardOptions,
    type SettlementYardOption,
} from '../utils';
import dayjs from 'dayjs';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';

const route = useRoute();
const router = useRouter();
const { userInfo } = storeToRefs(useUserStore());
const message = useMessage();
const formRef = ref<InstanceType<typeof NForm> | null>(null);
const settlementDetailsRef = ref<any>(null);
const checkedSettlementRows = ref<any[]>([]);
const submitLoading = ref(false);
const yardOptions = ref<SettlementYardOption[]>([]);
const yardLoading = ref(false);
const settlementDetailValidateTrigger = ref(0);
const invoiceDetailValidateTrigger = ref(0);
const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
const isEdit = computed(() => Boolean(editId.value));
const formData = reactive<any>({
    id: undefined,
    settlementCode: '',
    status: SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
    contractCode: null, // 销售合同编号
    customerId: undefined, // 客户 ID
    applyUnit: '', // 申请单位（供方单位）
    enterpriseName: '', // 客户名称（需方单位）
    shoulDate: null, // 回款到期时间
    customerType: null, // 客户类型
    handler: '', // 我方经办人
    ourHandlerName: '',
    handlerSelectedPerson: null, // 我方经办人对象
    handlerName: '', // 客户经办人
    invoiceType: null, // 本次开票类型
    totalTaxAmount: '', // 结算总价（元）
    settlementTotal: 0, // 结算总量（吨）
    contractDirectorId: '', // 合同我方负责人编码
    contractDirectorName: '', // 合同我方负责人名称
    contractDirectorLarkId: '', // 合同我方负责人飞书 ID
    terms: '', // 合同结算条款
    invoiceInformation: '', // 开票信息
    invoiceRemark: '', // 开票备注
    financeInvoiceMainId: undefined,
    invoiceDetailList: [],
    tableList: [],
    reason: '', // 申请事由
    attachmentsInfo: [], // 结算附件
    associatedApproval: [], // 关联审批
    remark: '', // 结算备注
    approvalId: undefined,
    approvalInstanceId: '',
    initiatorId: '', // 申请人 ID
    initiatorLarkId: '', // 申请人飞书 ID
    initiatorName: '', // 申请人名称
    deptCode: '', // 申请部门编码
    deptName: '', // 申请部门名称
});

const TEMP_INVOICE_DETAIL_PREFIX = 'TEMP_INVOICE_DETAIL';
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

/**
 * 新增时默认使用当前登录用户作为经办人。
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
 * 获取人员飞书 ID，兼容不同接口字段名。
 * @param user 当前登录用户或人员对象
 * @returns 飞书用户 ID
 */
const getPersonLarkId = (user: any) => {
    return user?.larkUserId || user?.feishuUserId || user?.larkId || '';
};

/**
 * 新增时默认使用当前登录用户和其第一个部门作为审批申请信息。
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
    if (!formData.initiatorLarkId && String(formData.initiatorId) === String(userInfo.value?.code || '')) {
        formData.initiatorLarkId = getPersonLarkId(userInfo.value);
    }
    if (!formData.deptCode) {
        formData.deptCode = defaultDept.deptCode || '';
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
 * 判断审批信息必填字段是否为空，空数组也视为空。
 * @param value 字段值
 * @returns 是否为空
 */
const isEmptyApprovalValue = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || value === '';
};

/**
 * 创建审批信息必填校验规则。
 * @param message 校验提示文案
 * @returns Naive UI 表单校验规则
 */
const createApprovalRequiredRule = (message: string) => ({
    required: true,
    trigger: ['change', 'blur'],
    validator: (_rule: any, value: any) => {
        if (isEmptyApprovalValue(value)) return new Error(message);
        return true;
    },
});

// 表单验证规则
const rules = {
    contractCode: { required: true, message: '请选择销售合同编号', trigger: ['change'], saveOnly: true },
    applyUnit: { required: true, message: '请输入申请单位', trigger: ['change'] },
    enterpriseName: { required: true, message: '请输入企业名称', trigger: ['change'] },
    shoulDate: { required: true, message: '请选择回款到期时间', trigger: ['change'] },
    customerType: { required: true, message: '请选择客户类型', trigger: ['change'] },
    handler: { required: true, message: '请选择我方经办人', trigger: ['change'] },
    invoiceType: { required: true, message: '请选择本次开票类型', trigger: ['change'] },
    totalTaxAmount: { required: true, message: '请输入结算总价', trigger: ['change'] },
    terms: { required: true, message: '请输入合同结算条款', trigger: ['change'] },
    invoiceRemark: { required: true, message: '请输入开票备注', trigger: ['change'] },
    initiatorId: { required: true, message: '请选择申请人', trigger: ['change'] },
    deptCode: { required: true, message: '请选择申请部门', trigger: ['change'] },
    reason: createApprovalRequiredRule('请输入申请事由'),
    attachmentsInfo: createApprovalRequiredRule('请选择结算附件'),
    associatedApproval: createApprovalRequiredRule('请选择关联审批'),
    remark: createApprovalRequiredRule('请输入结算备注'),
};
const title = computed(() => (route.query.id ? '编辑结算单' : '新增结算单'));

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
 * 判断开票明细必填字段是否为空，数值 0 视为已填写。
 * @param value 字段值
 * @returns 是否为空
 */
function isEmptyInvoiceDetailValue(value: any) {
    return value === null || value === undefined || value === '';
}

/**
 * 获取申请开票明细的首个校验错误文案。
 * @param rows 申请开票明细列表
 * @returns 校验错误文案，无错误时返回空字符串
 */
function getInvoiceDetailErrorMessage(rows: any[]) {
    if (!rows.length) return '申请开票明细至少需要一项';
    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowIndexText = `申请开票明细第${index + 1}行`;
        for (const field of INVOICE_DETAIL_REQUIRED_FIELDS) {
            if (isEmptyInvoiceDetailValue(row?.[field.key])) {
                return field.type === 'select'
                    ? `请选择${rowIndexText}${field.label}`
                    : `请输入${rowIndexText}${field.label}`;
            }
        }
        const overLengthField = INVOICE_TEXT_LIMIT_FIELDS.find((field) => String(row?.[field.key] || '').length > INVOICE_TEXT_MAX_LENGTH);
        if (overLengthField) {
            return `${rowIndexText}${overLengthField.label}最多${INVOICE_TEXT_MAX_LENGTH}字`;
        }
    }
    return '';
}

/**
 * 同步结算明细表已勾选行，并刷新结算总价。
 * @param rows 已勾选的结算明细行
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
    formData.totalTaxAmount = String(getSettlementAmountNumber(settlementSummary.totalTaxAmount));
    formData.settlementTotal = getFixedNumber(settlementSummary.totalSettlementTons);
};

/**
 * 将可能为字符串的数值字段转换为数字，非法值按 0 处理。
 * @param value 原始数值
 * @returns 可提交给接口的数字
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
 * 获取第一个有效字段值，数字 0 视为有效。
 * @param values 候选字段值
 * @returns 第一个非空值
 */
const getFirstValidValue = (...values: any[]) => {
    return values.find((value) => value !== null && value !== undefined && value !== '');
};

/**
 * 判断字段是否存在有效值，数字 0 视为有效。
 * @param value 待判断字段值
 * @returns 是否存在有效值
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
    yardLoading.value = true;
    try {
        yardOptions.value = await loadSettlementYardOptions();
    } catch (error) {
        yardOptions.value = [];
        console.error('加载结算单堆场选项失败:', error);
    } finally {
        yardLoading.value = false;
    }
};

/**
 * 按金额展示精度格式化数字，避免浮点计算出现过长小数。
 * @param value 原始数值
 * @returns 格式化后的数字
 */
const getFixedNumber = (value: any) => {
    return Number(getNumberValue(value).toFixed(2));
};

/**
 * 编辑态空值保持为空，新增态仍按默认 0 处理。
 * @param value 原始数值
 * @param useDefault 是否按新增态补默认值
 * @returns 格式化后的数字或空值
 */
const getDefaultableFixedNumber = (value: any, useDefault = !isEdit.value) => {
    if (hasValue(value)) return getFixedNumber(value);
    return useDefault ? 0 : null;
};

/**
 * 解析接口返回的 JSON 字符串对象。
 * @param value JSON 字符串或对象
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

const CONTENT_FIELD_MAP = {
    content: ['content', 'value', '含量'],
    weightedAverage: ['weightedAverage', 'weightedAvg', 'weighted', 'average', '加权平均'],
    priceIncrease: ['priceIncrease', 'increasePrice', 'priceFloat', '增价', '增减价'],
};

/**
 * 从成分对象中提取数字字段，编辑态未填写时保持为空。
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
 * 将成分对象同时整理成对象字段和字符串字段，满足接口 DTO 两种字段。
 * @param row 当前结算明细行
 * @param objectKey 成分对象字段名
 * @param stringKey 成分字符串字段名
 * @param useDefault 是否按新增态补默认值
 * @returns 标准化后的成分对象和字符串
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
 * 按结算单价和结算量计算单行结算金额，单位元。
 * @param row 当前结算明细行
 * @returns 单行结算金额
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
    const settleWeight = getNumberValue(settleWeightSource);
    return getSettlementAmountNumber(settleWeight * getNumberValue(settlementUnitPrice), useDefault ? 0 : null);
};

/**
 * 按结算单价和结算量计算单行分项金额，单位元。
 * @param row 当前结算明细行
 * @returns 单行分项金额
 */
const getDetailTaxIncludedAmount = (row: any) => {
    return getDetailSettlementAmount(row);
};

/**
 * 计算结算明细汇总值。
 * @param rows 结算明细列表
 * @returns 结算主表汇总字段
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
 * 计算申请开票明细汇总值。
 * @param rows 开票明细列表
 * @returns 开票主表汇总字段
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
 * 根据当前选择的我方经办人组装接口需要的人员数组。
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
 * 解析关联审批字段，兼容接口字符串和组件对象数组。
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
 * 将关联审批整理成接口需要的字符串。
 * @param value 关联审批对象数组或字符串
 * @returns JSON 字符串
 */
const getAssociatedApprovalPayload = (value: any) => {
    if (typeof value === 'string') return value;
    return JSON.stringify(Array.isArray(value) ? value : []);
};

/**
 * 兼容上传组件和接口文档，整理附件对象。
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
 * 将接口附件转换为上传组件可回显的格式。
 * @param attachments 接口附件列表
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
 * 标准化人员选择组件返回的人员对象。
 * @param person 原始人员对象
 * @returns 接口需要的人员对象
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
 * 将结算明细行的业务人员字段整理为人员对象数组。
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
        return row.businessPersonCodes.map((code: string, index: number) =>
            normalizePerson({
                code,
                value: code,
                label: row.businessPersonNames?.[index] || code,
                username: row.businessPersonNames?.[index] || code,
            })
        );
    }
    const contractDirector = getContractDirectorPerson();
    if (contractDirector) return [contractDirector];
    return [];
};

/**
 * 将可结算明细行映射为接口 DTO 字段。
 * @param row 当前结算明细行
 * @param index 当前行下标
 * @returns 结算明细提交参数
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
 * 将开票明细行映射为接口 DTO 字段。
 * @param row 当前开票明细行
 * @returns 开票明细提交参数
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
 * 按创建/修改接口文档组装结算单主表提交参数。
 * @param statusOverride 提交时指定的单据状态
 * @returns 结算单保存参数
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
        expirationTime: formatDateParam(formData.shoulDate) || '',
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
 * 从详情接口回填新增编辑页表单。
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
};

/**
 * 编辑结算单时加载详情。
 * @returns 无返回值
 */
const getDetail = async () => {
    if (!editId.value) return;
    try {
        const res: any = await getSettlementMainDetailApi(editId.value, true);
        if (res?.code === 200) {
            setFormDetail(res.data || {});
            await loadEditApprovalLogs(formData.approvalId);
        }
    } catch (error) {
        console.error('获取结算单详情失败:', error);
    }
};

watch(
    () => formData.tableList,
    () => {
        if (!formData.tableList?.length) {
            formData.settlementTotal = 0;
            if (!editId.value) {
                formData.totalTaxAmount = '';
            }
            return;
        }
        const settlementSummary = getSettlementSummary(checkedSettlementRows.value || []);
        formData.totalTaxAmount = String(getSettlementAmountNumber(settlementSummary.totalTaxAmount));
        formData.settlementTotal = getFixedNumber(settlementSummary.totalSettlementTons);
    },
    { deep: true }
);

/**
 * 保存或提交结算单，新增调用 create，编辑调用 update。
 * @param statusOverride 提交时指定的单据状态
 * @returns 无返回值
 */
const saveTable = async (statusOverride?: string) => {
    if (submitLoading.value) return;
    const isSubmit = statusOverride === SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING;
    if (isSubmit) {
        settlementDetailValidateTrigger.value += 1;
        invoiceDetailValidateTrigger.value += 1;
    }
    try {
        await formRef.value?.validate(
            undefined,
            isSubmit ? undefined : (rule: any) => rule.saveOnly === true,
        );
        if (isSubmit) {
            if (!isReceiptDueDateTodayOrAfter(formData.shoulDate)) {
                message.error('回款到期时间不能选择当前日期之前');
                return;
            }
            const settlementDetailErrorMessage = settlementDetailsRef.value?.getValidationErrorMessage?.() || '';
            if (settlementDetailErrorMessage) {
                message.error(settlementDetailErrorMessage);
                return;
            }
            syncInvoiceTaxIncludedAmounts(formData.invoiceDetailList || []);
            const invoiceDetailErrorMessage = getInvoiceDetailErrorMessage(formData.invoiceDetailList || []);
            if (invoiceDetailErrorMessage) {
                message.error(invoiceDetailErrorMessage);
                return;
            }
        }
        submitLoading.value = true;
        const targetStatus = isSubmit
            ? SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING
            : SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01;
        const payload = getSubmitPayload(targetStatus);
        const res = editId.value ? await updateSettlementMainApi(payload) : await createSettlementMainApi(payload);
        if (res?.code === 200) {
            router.back();
        }
    } catch (error) {
        const errorMessage = Array.isArray(error) ? error?.[0]?.[0]?.message || '' : '';
        if (errorMessage) {
            message.error(errorMessage);
        }
        console.error('保存结算单失败:', error);
    } finally {
        submitLoading.value = false;
    }
};

/**
 * 提交结算单进入审批生成中状态。
 * @returns 无返回值
 */
const submitTable = () => {
    saveTable(SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING);
};

onMounted(async () => {
    try {
        await loadYardOptions();
        await getDetail();
    } catch (error) {
        console.error('初始化结算单新增编辑页失败:', error);
    }
});
</script>

<style scoped lang="less">
.main {
    padding: 0 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.big-title {
    font-size: 16px;
    color: #333333;
    font-weight: 600;
    margin-top: 16px;
}
.title {
    font-size: 14px;
    color: #333333;
    font-weight: 600;
    position: relative;
    padding-left: 12px;
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    margin-bottom: 16px;
    &::before {
        content: '';
        position: absolute;
        width: 4px;
        height: 16px;
        background: #2c65f2;
        border-radius: 2px 2px 2px 2px;
        left: 0px;
        top: 50%;
        transform: translateY(-50%);
    }
}

.header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.edit-approval-flow {
    margin-bottom: 16px;
}

.invoice-detail-form-item {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;

    :deep(.n-form-item-blank) {
        width: 100%;
        min-width: 0;
        max-width: 100%;
    }

    :deep(.n-form-item-blank > *) {
        width: 100%;
        min-width: 0;
        max-width: 100%;
    }
}
</style>
