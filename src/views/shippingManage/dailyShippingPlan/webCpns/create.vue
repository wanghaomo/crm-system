<template>
    <WebPage contentPadding="0px" :hideAddBtn="true" showBack  show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被提交">
        <template #headerRight>
            <MxButton :disabled="submitLoading || submitConfirming || detailLoading" @click="handleSubmit">提 交</MxButton>
        </template>
        <template #content>
            <div class="main">
                <div class="big-title">{{ pageTitle }}</div>
                <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="120px">
                    <div class="title">基础信息</div>
                    <div style="padding: 16px 0;">
                        <n-grid :cols="2" :x-gap="16" :y-gap="0">
                            <n-grid-item>
                                <n-form-item label="发货类型" path="planType">
                                    <n-radio-group
                                        class="plan-type-radio-group"
                                        :value="formData.planType"
                                        :disabled="isEditMode"
                                        @update:value="handlePlanTypeChange">
                                        <n-radio
                                            v-for="item in dailyShippingPlanTypeOptions"
                                            :key="item.value"
                                            :value="item.value">
                                            {{ item.label }}
                                        </n-radio>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item v-if="isContractPlan" span="2">
                                <n-form-item label="关联合同单号" path="contractCodes">
                                    <n-select
                                        :value="formData.contractCodes"
                                        :options="contractOptions"
                                        :loading="contractLoading"
                                        multiple
                                        placeholder="请选择"
                                        filterable
                                        clearable
                                        max-tag-count="responsive"
                                        @update:value="handleContractCodesChange" />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                    </div>
                    <div class="title">
                        <span class="title-text">发货订单明细</span>
                        <n-button v-if="isPrePlan" type="primary" size="small" @click="handleAddPreDetail">
                            新增
                        </n-button>
                    </div>
                    <div class="web-data-table shipping-detail-table">
                        <div class="web-n-data-table-con">
                            <n-data-table
                                class="web-n-data-table"
                                :row-key="getDetailRowKey"
                                :columns="detailTableColumns"
                                :data="formData.tableList"
                                :checked-row-keys="checkedDetailRowKeys"
                                :pagination="false"
                                :bordered="true"
                                :bottom-bordered="true"
                                :single-line="true"
                                :loading="detailLoading"
                                :scroll-x="detailTableScrollX"
                                striped
                                @update:checked-row-keys="handleCheckedDetailRowKeys" />
                        </div>
                    </div>
                </n-form>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">

import { ref, reactive, h, computed } from 'vue';
import {
    NButton,
    NDataTable,
    NDatePicker,
    NForm,
    NFormItem,
    NGrid,
    NGridItem,
    NInput,
    NInputNumber,
    NRadio,
    NRadioGroup,
    NSelect,
    useDialog,
    useMessage,
} from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import MxCommSelect from '@/components/CommSelect/index.vue';
const router = useRouter();
const route = useRoute();
import {
    createDailyShippingPlanApi,
    getContractSalesListBySalesContractCode,
    getDailyShippingPlanDetailApi,
    getDailyShippingPlanDetailListByContractCodeApi,
    getYardPageApi,
    updateDailyShippingPlanApi,
} from '@/api';
import {
    DAILY_SHIPPING_PLAN_TYPE,
    dailyShippingPlanTypeOptions,
    PLAN_STATUS_CONSTANT,
} from '@/constants/dailyShippingPlan';
const message = useMessage();
const dialog = useDialog();
const { dictMap } = storeToRefs(useDictStore());
const formRef = ref<any>(null);
const submitLoading = ref(false);
const submitConfirming = ref(false);
const formData = reactive<any>({
    id: '',
    planType: DAILY_SHIPPING_PLAN_TYPE.CONTRACT,
    contractCodes: [],
    tableList: [],
});
// 表单验证规则
const rules = {
    planType: { required: true, message: '请选择发货类型', trigger: ['change'] },
    contractCodes: {
        trigger: ['change'],
        validator: (_rule: any, value: string[]) => {
            if (formData.planType === DAILY_SHIPPING_PLAN_TYPE.CONTRACT && !value?.length) {
                return new Error('请选择关联合同单号');
            }
            return true;
        },
    },
};
const contractOptions = ref<any[]>([]);
const contractLoading = ref(false);
const detailLoading = ref(false);
const yardOptions = ref<Array<{ label: string; value: string }>>([]);
const yardLoading = ref(false);
const pageTitle = computed(() => (route.query.id ? '编辑发货订单' : '新增发货订单'));
const isEditMode = computed(() => Boolean(route.query.id));
const isContractPlan = computed(() => formData.planType === DAILY_SHIPPING_PLAN_TYPE.CONTRACT);
const isPrePlan = computed(() => formData.planType === DAILY_SHIPPING_PLAN_TYPE.PRE);
const checkedDetailRowKeys = ref<Array<string | number>>([]);
const TEMP_DETAIL_ROW_PREFIX = 'TEMP_DAILY_SHIPPING_DETAIL';
let detailRequestSerial = 0;
// 发运计划明细使用的业务字典名称。
const DICT = {
    SUPPLIER_UNIT: '供方单位',
    ORE_TYPE: '矿种',
    TRANSPORT_MODE: '运输方式',
    DELIVERY_METHOD: '交割方式',
    PRIORITY: '优先级',
};
/**
 * 获取指定业务字典选项。
 * @param dictName 字典名称
 * @returns 字典选项列表
 */
const getDictOptions = (dictName: string) => dictMap.value?.[dictName] || [];
/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或字典文案
 * @returns 匹配到的字典文案，空值返回占位文案
 */
const formatDict = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    const option = getDictOptions(dictName).find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
        )
    );
    return option?.label || option?.name || option?.text || value;
};
/**
 * 根据字典文案反查提交值。
 * @param dictName 字典名称
 * @param label 字典文案或值
 * @returns 后端需要的字典值
 */
const getDictValueByLabel = (dictName: string, label: string) => {
    const option = getDictOptions(dictName).find((item: any) =>
        [item.label, item.name, item.text, item.value, item.code].some(
            (optionValue) => optionValue !== null && optionValue !== undefined && String(optionValue) === String(label)
        )
    );
    return option?.value ?? option?.code ?? option?.name ?? option?.label ?? option?.text ?? label;
};
/**
 * 获取明细默认优先级。
 * @returns 优先级“低”对应的字典值
 */
const getDefaultPriority = () => getDictValueByLabel(DICT.PRIORITY, '低');
/**
 * 判断表单字段是否为空。
 * @param value 待校验字段值
 * @returns 是否为空
 */
const isEmptyValue = (value: any) => value === undefined || value === null || String(value).trim() === '';
/**
 * 判断编辑详情中的明细是否已经由后端保存。
 * @param item 发货订单明细
 * @returns 明细是否存在后端ID
 */
const hasPersistedDetailId = (item: any) => !isEmptyValue(item?.id);
const PRE_DELIVERY_QUANTITY_PRECISION = 2;
const PRE_DELIVERY_QUANTITY_MIN = 0;
const PRE_DETAIL_NUMBER_PRECISION = 2;
const PRE_DETAIL_NUMBER_MIN = 0;
const SHIPMENT_THRESHOLD_DEFAULT = 5;
const SHIPMENT_THRESHOLD_MIN = 0;
const SHIPMENT_THRESHOLD_MAX = 100;
/**
 * 将预发货数量转换为最多两位小数的数字，空值或非法值默认按 0 处理。
 * @param value 预发货数量
 * @returns 标准化后的预发货数量
 */
const normalizePreDeliveryQuantity = (value: any) => {
    const quantity = Number(value);
    if (!Number.isFinite(quantity)) return PRE_DELIVERY_QUANTITY_MIN;
    return Number(quantity.toFixed(PRE_DELIVERY_QUANTITY_PRECISION));
};
/**
 * 格式化只读预发货数量。
 * @param value 预发货数量
 * @returns 固定两位小数的展示文案
 */
const formatPreDeliveryQuantity = (value: any) =>
    normalizePreDeliveryQuantity(value).toFixed(PRE_DELIVERY_QUANTITY_PRECISION);
/**
 * 标准化预发货明细中的两位小数字段，空值保持为空。
 * @param value 数字输入值
 * @returns 最多保留两位小数的数字或空字符串
 */
const normalizePreDetailNumber = (value: any) => {
    if (isEmptyValue(value)) return '';
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return value;
    return Number(numberValue.toFixed(PRE_DETAIL_NUMBER_PRECISION));
};
type DeliveryDateRange = [string, string] | null;
/**
 * 获取明细交货期限的日期范围，兼容 startDate/endDate 和“开始至结束”文案。
 * @param item 发货订单明细
 * @returns YYYY-MM-DD 格式的日期范围，日期不完整时返回 null
 */
const getDeliveryDateRange = (item: any): DeliveryDateRange => {
    const deadlineParts = String(item?.deliveryDeadline || '').split('至');
    const startDate = String(item?.startDate || deadlineParts[0] || '').trim().slice(0, 10);
    const endDate = String(item?.endDate || deadlineParts[1] || '').trim().slice(0, 10);
    return startDate && endDate ? [startDate, endDate] : null;
};
/**
 * 获取接口值对应的堆场编码，兼容上游数据暂时返回堆场名称的情况。
 * @param value 堆场编码或堆场名称
 * @returns 匹配到的堆场编码，未匹配时保留原值
 */
const getYardCode = (value: any) => {
    if (isEmptyValue(value)) return '';
    const text = String(value);
    const option = yardOptions.value.find((item) => item.value === text || item.label === text);
    return option?.value || text;
};
/**
 * 获取交货地点对应的堆场名称。
 * @param value 堆场编码或堆场名称
 * @returns 匹配到的堆场名称，未匹配时保留原值
 */
const getYardName = (value: any) => {
    if (isEmptyValue(value)) return '';
    const text = String(value);
    const option = yardOptions.value.find((item) => item.value === text || item.label === text);
    return option?.label || text;
};
type DeliveryMethodValue = string | number;
/**
 * 将接口的逗号分隔值转换成多选组件使用的数组，并统一为字典 value。
 * @param value 接口返回的交割方式字符串或多选组件值
 * @returns 交割方式字典值数组
 */
const normalizeDeliveryMethodValues = (value: any): DeliveryMethodValue[] => {
    if (isEmptyValue(value)) return [];
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter((item) => !isEmptyValue(item))
        .map((item) => getDictValueByLabel(DICT.DELIVERY_METHOD, String(item)));
};
/**
 * 将页面多选值转换成接口要求的逗号分隔字符串。
 * @param values 交割方式字典值数组
 * @returns 逗号分隔的交割方式
 */
const serializeDeliveryMethods = (values: DeliveryMethodValue[]) => values.join(',');
// 所有发货类型都必须补充的明细字段。
const COMMON_REQUIRED_DETAIL_FIELDS = [
    { key: 'priority', label: '优先级' },
    { key: 'shipmentThreshold', label: '发货阈值（%）' },
    { key: 'contactInformation', label: '联系方式' },
    { key: 'placeFelivery', label: '交货地点' },
    { key: 'modeTransportation', label: '运输方式' },
    { key: 'deliveryMethods', label: '交割方式' },
];
// 预发货类型额外必填的明细字段。
const PRE_REQUIRED_DETAIL_FIELDS = [
    { key: 'supplierUnit', label: '供方单位' },
    { key: 'customerId', label: '企业名称' },
    { key: 'oreGgrade', label: '矿石品位（%）' },
    { key: 'oreType', label: '矿石种类' },
    { key: 'contractQuantity', label: '合同数量（吨）' },
    { key: 'deliveryDateRange', label: '交货期限' },
];
/**
 * 获取当前发货类型需要校验的明细字段。
 * @returns 当前发货类型的必填字段配置
 */
const getRequiredDetailFields = () => [
    ...COMMON_REQUIRED_DETAIL_FIELDS,
    ...(isPrePlan.value ? PRE_REQUIRED_DETAIL_FIELDS : []),
];
/**
 * 判断明细字段是否为空，日期范围要求开始和结束日期同时存在。
 * @param row 当前明细行
 * @param key 字段名
 * @returns 字段是否为空
 */
const isDetailFieldEmpty = (row: any, key: string) => {
    if (key === 'deliveryDateRange') {
        return !Array.isArray(row[key]) || !row[key][0] || !row[key][1];
    }
    return isEmptyValue(row[key]);
};
/**
 * 渲染与表单一致的必填列表头。
 * @param title 列标题
 * @returns 带红色星号的标题节点
 */
const renderRequiredTitle = (title: string) =>
    h('span', { class: 'shipping-detail-required-title' }, [
        h('span', { class: 'shipping-detail-required-mark' }, '*'),
        title,
    ]);
/**
 * 创建明细表格单元格校验规则。
 * @param row 当前明细行
 * @param key 字段名
 * @param label 字段文案
 * @param index 行索引
 * @returns Naive UI 表单校验规则
 */
const createDetailRule = (row: any, key: string, label: string, index: number) => ({
    required: true,
    trigger: ['blur', 'change', 'input'],
    validator() {
        if (!row.checked) return true;
        if (isDetailFieldEmpty(row, key)) return new Error(`发货订单明细第${index + 1}行的${label}必填`);
        return true;
    },
});
/**
 * 渲染带行内校验的明细表格表单项。
 * @param row 当前明细行
 * @param index 行索引
 * @param key 字段名
 * @param label 字段文案
 * @param children 表单控件渲染函数
 * @returns 表单项 VNode
 */
const renderDetailFormItem = (row: any, index: number, key: string, label: string, children: any) =>
    h(
        NFormItem,
        {
            path: `tableList[${index}].${key}`,
            rule: createDetailRule(row, key, label, index),
            showLabel: false,
            style: { width: '100%', marginBottom: 0 },
        },
        children
    );
/**
 * 获取发货订单明细行唯一 key。
 * @param row 当前明细行
 * @returns 行唯一 key
 */
const getDetailRowKey = (row: any) => row.id || row.frontId;
/**
 * 判断两个行 key 是否相同。
 * @param left 左侧行 key
 * @param right 右侧行 key
 * @returns 是否相同
 */
const isSameDetailRowKey = (left: string | number, right: string | number) => String(left) === String(right);
/**
 * 同步表格选中行 key 到明细 checked 字段。
 * @param keys 当前选中的行 key
 * @returns 无返回值
 */
const handleCheckedDetailRowKeys = (keys: Array<string | number>) => {
    checkedDetailRowKeys.value = keys;
    formData.tableList.forEach((item: any) => {
        item.checked = keys.some((key) => isSameDetailRowKey(key, getDetailRowKey(item)));
    });
};
/**
 * 批量替换明细表格数据，保持 reactive 数组引用不变。
 * @param list 新的明细列表
 * @returns 无返回值
 */
const setDetailTableList = (list: any[]) => {
    formData.tableList.splice(0, formData.tableList.length, ...list);
    checkedDetailRowKeys.value = formData.tableList.filter((item: any) => item.checked).map((item: any) => getDetailRowKey(item));
};
/**
 * 创建前端临时明细标识。
 * @returns 唯一的前端明细标识
 */
const createDetailFrontId = () =>
    `${TEMP_DETAIL_ROW_PREFIX}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
/**
 * 将合同编号字符串或数组转换为多选组件数组。
 * @param value 合同编号字符串或数组
 * @returns 去重后的合同编号数组
 */
const normalizeContractCodes = (value: any): string[] => {
    if (isEmptyValue(value)) return [];
    const values = Array.isArray(value) ? value : String(value).split(',');
    return Array.from(new Set(values.map((item) => String(item ?? '').trim()).filter(Boolean)));
};
/**
 * 获取销售合同编号。
 * @param item 销售合同数据
 * @returns 销售合同编号
 */
const getContractCode = (item: any) =>
    String(item?.contractCode || item?.salesContractCode || item?.salesContractNumber || '').trim();
/**
 * 获取合同下拉展示文案。
 * @param item 销售合同数据
 * @returns 客户名称与合同编号组合文案
 */
const getContractLabel = (item: any) => {
    const customerName = String(item?.customerName || '').trim();
    const contractCode = getContractCode(item);
    return [customerName, contractCode].filter(Boolean).join('-');
};
/**
 * 将销售合同列表转换为合同编号下拉选项。
 * @param list 销售合同列表
 * @returns 合同编号下拉选项
 */
const createContractOptions = (list: any[] = []) => {
    const codeSet = new Set<string>();
    return list.reduce((options: any[], item: any) => {
        const contractCode = getContractCode(item);
        if (!contractCode || codeSet.has(contractCode)) return options;
        codeSet.add(contractCode);
        options.push({ ...item, label: getContractLabel(item) || contractCode, value: contractCode });
        return options;
    }, []);
};
/**
 * 补齐编辑详情中已关联但可选接口未返回的合同编号。
 * @param contractCodes 当前订单已关联的合同编号
 * @param contractNameMap 合同编号与客户名称的映射
 * @returns 无返回值
 */
const ensureContractOptions = (contractCodes: string[], contractNameMap = new Map<string, string>()) => {
    const optionMap = new Map(contractOptions.value.map((item: any) => [String(item.value), item]));
    contractCodes.forEach((contractCode) => {
        if (!optionMap.has(contractCode)) {
            optionMap.set(contractCode, {
                label: contractNameMap.get(contractCode) || contractCode,
                value: contractCode,
                contractCode,
            });
        }
    });
    contractOptions.value = Array.from(optionMap.values());
};
/**
 * 加载可以生成合同发货明细的销售合同。
 * @returns 无返回值，结果写入合同下拉和合同数据源
 */
const loadContractOptions = async () => {
    contractLoading.value = true;
    try {
        const res = await getContractSalesListBySalesContractCode();
        if (res?.code !== 200) {
            contractOptions.value = [];
            return;
        }
        contractOptions.value = createContractOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
        contractOptions.value = [];
        message.error('销售合同加载失败，请稍后重试');
    } finally {
        contractLoading.value = false;
    }
};
/**
 * 加载启用的堆场，并转换为名称展示、编码提交的下拉选项。
 * @returns 无返回值，结果写入堆场下拉选项
 */
const loadYardOptions = async () => {
    yardLoading.value = true;
    try {
        const res = await getYardPageApi({
            current: 1,
            size: 1000,
            status: 1,
        });
        if (res.code !== 200) {
            yardOptions.value = [];
            return;
        }
        const records = Array.isArray(res.data?.records) ? res.data.records : [];
        const yardCodes = new Set<string>();
        yardOptions.value = records.reduce(
            (options: Array<{ label: string; value: string }>, item: any) => {
                const yardName = String(item?.yardName || '').trim();
                const yardCode = String(item?.yardCode || '').trim();
                if (!yardName || !yardCode || yardCodes.has(yardCode)) return options;
                yardCodes.add(yardCode);
                options.push({
                    label: yardName,
                    value: yardCode,
                });
                return options;
            },
            []
        );
    } catch {
        yardOptions.value = [];
        message.error('堆场信息加载失败，请稍后重试');
    } finally {
        yardLoading.value = false;
    }
};
/**
 * 标准化发货订单明细字段，用于页面展示和编辑。
 * @param item 后端返回的明细原始数据
 * @param checked 是否默认勾选当前明细
 * @param useDefaultShipmentThreshold 是否在阈值为空时使用新增默认值
 * @returns 兼容新旧字段后的明细数据
 */
const formatDetailItem = (item: any, checked = false, useDefaultShipmentThreshold = false) => {
    const detailPlanType = item.planType || formData.planType;
    const isPreDetail = detailPlanType === DAILY_SHIPPING_PLAN_TYPE.PRE;
    const deliveryDateRange = getDeliveryDateRange(item);
    return {
        ...item,
        frontId: item.frontId || item.id || createDetailFrontId(),
        checked,
        planType: detailPlanType,
        salesContractNumber: item.salesContractNumber || item.salesContractCode || '',
        priority: item.priority || getDefaultPriority(),
        companyname: item.companyname || item.customerName || '',
        contactInformation: item.contactInformation || item.phone || '',
        oreGgrade: isPreDetail
            ? normalizePreDetailNumber(item.oreGgrade ?? item.grade)
            : item.oreGgrade ?? item.grade ?? '',
        oreType: item.oreType || item.mineralType || '',
        contractQuantity: isPreDetail
            ? normalizePreDetailNumber(item.contractQuantity ?? item.contractNum)
            : item.contractQuantity ?? item.contractNum ?? '',
        unshippedQuantity: item.unshippedQuantity ?? item.unshippedNum ?? '',
        plannedSshipmentQuantity: item.plannedSshipmentQuantity ?? item.actualQuantity ?? '',
        placeFelivery: getYardCode(item.placeFelivery || item.deliveryLocation),
        deliveryLocationName:
            item.deliveryLocationName || getYardName(item.placeFelivery || item.deliveryLocation),
        modeTransportation: item.modeTransportation || item.transportation || '',
        deliveryMethods: normalizeDeliveryMethodValues(item.deliveryMethods || item.deliveryMethod),
        startDate: deliveryDateRange?.[0] || item.startDate || '',
        endDate: deliveryDateRange?.[1] || item.endDate || '',
        deliveryDateRange,
        deliveryDeadline: deliveryDateRange?.join('至') || item.deliveryDeadline || '',
        preDeliveryQuantity: normalizePreDeliveryQuantity(item.preDeliveryQuantity),
        shipmentThreshold:
            useDefaultShipmentThreshold && isEmptyValue(item.shipmentThreshold)
                ? SHIPMENT_THRESHOLD_DEFAULT
                : item.shipmentThreshold,
    };
};
/**
 * 获取发货订单明细用于编辑合并的匹配标识。
 * @param item 发货订单明细
 * @returns 可用于匹配候选明细与详情明细的标识集合
 */
const getDetailMatchKeys = (item: any) => {
    const contractCode = getContractCode(item);
    const keys: string[] = [];
    const sourceFields = [
        ['contractPricingDetailGradeId', item.contractPricingDetailGradeId],
        ['salesPlanHistRemainId', item.salesPlanHistRemainId],
        ['weeklyPlanId', item.weeklyPlanId],
        ['weeklyPlanCode', item.weeklyPlanCode],
        ['id', item.id],
    ];
    sourceFields.forEach(([field, value]) => {
        if (!isEmptyValue(value)) keys.push(`${field}:${contractCode}:${String(value)}`);
    });
    const grade = item.oreGgrade ?? item.grade;
    const deliveryLocation = getYardCode(item.placeFelivery || item.deliveryLocation);
    const mineralType = item.oreType || item.mineralType || '';
    if (contractCode && (!isEmptyValue(grade) || deliveryLocation)) {
        keys.push(
            `business:${JSON.stringify([
                contractCode,
                isEmptyValue(grade) ? '' : String(grade),
                deliveryLocation,
                mineralType,
            ])}`
        );
    }
    return keys;
};
/**
 * 合并按合同查询的候选明细与编辑详情明细。
 * @param candidateDetails 按关联合同查询出的完整候选明细
 * @param savedDetails 详情接口返回的已保存明细
 * @returns 候选明细与已保存明细合并后的表格数据
 */
const mergeEditDetailList = (candidateDetails: any[], savedDetails: any[]) => {
    const unmatchedSavedDetails = [...savedDetails];
    const mergedDetails = candidateDetails.map((candidate: any) => {
        const candidateKeys = new Set(getDetailMatchKeys(candidate));
        const matchedIndex = unmatchedSavedDetails.findIndex((saved: any) =>
            getDetailMatchKeys(saved).some((key) => candidateKeys.has(key))
        );
        if (matchedIndex < 0) {
            return formatDetailItem(
                { ...candidate, planType: DAILY_SHIPPING_PLAN_TYPE.CONTRACT },
                false,
                true
            );
        }
        const [savedDetail] = unmatchedSavedDetails.splice(matchedIndex, 1);
        return formatDetailItem(
            {
                ...candidate,
                ...savedDetail,
                planType: savedDetail.planType || DAILY_SHIPPING_PLAN_TYPE.CONTRACT,
            },
            hasPersistedDetailId(savedDetail)
        );
    });
    return [
        ...mergedDetails,
        ...unmatchedSavedDetails.map((item: any) => formatDetailItem(item, hasPersistedDetailId(item))),
    ];
};
/**
 * 根据当前已选合同重新获取发货订单明细。
 * @param contractCodes 当前选中的合同编号
 * @param savedDetails 编辑详情接口返回的已保存明细；新增或主动切换合同时不传
 * @returns 异步加载结果
 */
const loadContractDetailList = async (contractCodes: string[], savedDetails: any[] | null = null) => {
    const requestSerial = ++detailRequestSerial;
    if (!contractCodes.length) {
        detailLoading.value = false;
        setDetailTableList(
            (savedDetails || []).map((item: any) => formatDetailItem(item, hasPersistedDetailId(item)))
        );
        return;
    }
    detailLoading.value = true;
    try {
        const res = await getDailyShippingPlanDetailListByContractCodeApi(contractCodes);
        if (requestSerial !== detailRequestSerial) return;
        if (res?.code !== 200) {
            setDetailTableList(
                (savedDetails || []).map((item: any) => formatDetailItem(item, hasPersistedDetailId(item)))
            );
            message.error('发货订单明细加载失败，请稍后重试');
            return;
        }
        const details = Array.isArray(res.data) ? res.data : [];
        const candidateDetails = details.map((item: any) => ({
            ...item,
            planType: DAILY_SHIPPING_PLAN_TYPE.CONTRACT,
            salesContractCode:
                item.salesContractCode || (contractCodes.length === 1 ? contractCodes[0] : ''),
        }));
        setDetailTableList(
            savedDetails === null
                ? candidateDetails.map((item: any) => formatDetailItem(item, true, true))
                : mergeEditDetailList(candidateDetails, savedDetails)
        );
    } catch {
        if (requestSerial === detailRequestSerial) {
            setDetailTableList(
                (savedDetails || []).map((item: any) => formatDetailItem(item, hasPersistedDetailId(item)))
            );
            message.error('发货订单明细加载失败，请稍后重试');
        }
    } finally {
        if (requestSerial === detailRequestSerial) detailLoading.value = false;
    }
};
/**
 * 处理关联合同单号多选变化并重新获取发货订单明细。
 * @param value 选中的合同编号数组
 * @returns 异步加载结果
 */
const handleContractCodesChange = async (value: string[] | null) => {
    formData.contractCodes = normalizeContractCodes(value || []);
    await loadContractDetailList(formData.contractCodes);
};
/**
 * 创建一条可手工补录的预发货明细。
 * @returns 无返回值
 */
const handleAddPreDetail = () => {
    const detail = formatDetailItem(
        {
            planType: DAILY_SHIPPING_PLAN_TYPE.PRE,
            priority: getDefaultPriority(),
            shipmentThreshold: SHIPMENT_THRESHOLD_DEFAULT,
        },
        true,
        true
    );
    setDetailTableList([...formData.tableList, detail]);
};
/**
 * 删除指定预发货明细。
 * @param row 待删除的预发货明细
 * @returns 无返回值
 */
const handleDeletePreDetail = (row: any) => {
    setDetailTableList(formData.tableList.filter((item: any) => getDetailRowKey(item) !== getDetailRowKey(row)));
};
/**
 * 应用发货类型变化并清理另一类型的数据。
 * @param value 新的发货类型
 * @returns 无返回值
 */
const applyPlanTypeChange = (value: string) => {
    detailRequestSerial += 1;
    detailLoading.value = false;
    formData.planType = value;
    formData.contractCodes = [];
    setDetailTableList([]);
    formRef.value?.restoreValidation?.();
};
/**
 * 处理发货类型切换，有明细时先确认是否清空。
 * @param value 新的发货类型
 * @returns 无返回值
 */
const handlePlanTypeChange = (value: string) => {
    if (isEditMode.value) return;
    if (!value || value === formData.planType) return;
    if (!formData.tableList.length) {
        applyPlanTypeChange(value);
        return;
    }
    dialog.warning({
        title: '切换发货类型',
        content: '切换后将清空当前发货订单明细，是否继续？',
        positiveText: '确认切换',
        negativeText: '取消',
        onPositiveClick: () => applyPlanTypeChange(value),
    });
};
/**
 * 根据主单提交状态计算明细状态。
 * @param status 主单目标状态
 * @returns 明细目标状态
 */
const getDetailStatus = (status: string) => {
    return status === PLAN_STATUS_CONSTANT.PENDING ? PLAN_STATUS_CONSTANT.PENDING : PLAN_STATUS_CONSTANT.EXECUTING;
};
/**
 * 构建单条发货订单明细提交参数。
 * @param item 页面明细数据
 * @param status 主单目标状态
 * @returns 后端接口需要的明细参数
 */
const buildDetailPayload = (item: any, status: string) => {
    return {
        id: item.id,
        planType: formData.planType,
        weeklyPlanId: item.weeklyPlanId,
        weeklyPlanCode: item.weeklyPlanCode,
        contractPricingDetailGradeId: isContractPlan.value ? item.contractPricingDetailGradeId : undefined,
        salesPlanHistRemainId: item.salesPlanHistRemainId,
        deliveryOrderCode: item.deliveryOrderCode,
        customerId: item.customerId,
        subsidiaryId: item.subsidiaryId ?? null,
        subsidiaryName: item.subsidiaryName || '',
        status: getDetailStatus(status),
        priority: item.priority || '',
        salesContractCode: isContractPlan.value ? item.salesContractCode || item.salesContractNumber || '' : '',
        customerName: item.companyname || item.customerName || '',
        contactInformation: item.contactInformation || '',
        grade: isPrePlan.value
            ? normalizePreDetailNumber(item.oreGgrade ?? item.grade)
            : item.oreGgrade ?? item.grade,
        mineralType: item.oreType || item.mineralType || '',
        contractNum: isPrePlan.value
            ? normalizePreDetailNumber(item.contractQuantity ?? item.contractNum)
            : item.contractQuantity ?? item.contractNum,
        unshippedNum: isPrePlan.value ? item.contractQuantity ?? item.contractNum : item.unshippedQuantity ?? item.unshippedNum,
        taxIncludedPrice: item.taxIncludedPrice,
        actualQuantity: isPrePlan.value ? 0 : item.plannedSshipmentQuantity ?? item.actualQuantity,
        preDeliveryQuantity: isContractPlan.value
            ? normalizePreDeliveryQuantity(item.preDeliveryQuantity)
            : undefined,
        shipmentThreshold: item.shipmentThreshold,
        deliveryLocation: getYardCode(item.placeFelivery || item.deliveryLocation),
        deliveryLocationName:
            item.deliveryLocationName || getYardName(item.placeFelivery || item.deliveryLocation),
        transportation: item.modeTransportation || item.transportation || '',
        deliveryMethod: serializeDeliveryMethods(item.deliveryMethods),
        supplierUnit: item.supplierUnit || '',
        startDate: item.deliveryDateRange?.[0] || item.startDate || '',
        endDate: item.deliveryDateRange?.[1] || item.endDate || '',
        finishedState: item.finishedState || '',
        remark: item.remark || '',
        shipmentTransportationOrderDTOList: item.shipmentTransportationOrderDTOList || [],
    };
};
/**
 * 从明细列表中汇总客户名称。
 * @param list 发货订单明细列表
 * @returns 去重后的客户名称字符串
 */
const buildCustomerNames = (list: any[]) =>
    Array.from(
        new Set(
            (list || [])
                .map((item: any) => item.customerName || item.companyname || '')
                .filter((name: string) => String(name).trim())
        )
    ).join(',');
/**
 * 获取当前勾选的发货订单明细。
 * @returns 已勾选的明细列表
 */
const getCheckedDetailList = () => (formData.tableList || []).filter((item: any) => item.checked);
/**
 * 校验每个已选合同是否至少勾选了一条发货订单明细。
 * @param checkedDetails 已勾选的发货订单明细
 * @returns 校验失败提示，校验通过时返回空字符串
 */
const validateContractDetailSelection = (checkedDetails: any[]) => {
    if (!isContractPlan.value) return '';
    const selectedContractCodes = normalizeContractCodes(formData.contractCodes);
    const checkedContractCodes = new Set(
        checkedDetails.map((item: any) => getContractCode(item)).filter(Boolean)
    );
    const missingContractCodes = selectedContractCodes.filter((code) => !checkedContractCodes.has(code));
    if (!missingContractCodes.length) return '';
    const missingContractLabels = missingContractCodes.map(
        (code) => contractOptions.value.find((item: any) => String(item.value) === code)?.label || code
    );
    return `关联合同单号「${missingContractLabels.join('、')}」未选择发货订单明细，请勾选后再保存`;
};

/**
 * 构建发运计划新增或编辑提交参数。
 * @param status 主单目标状态
 * @returns 后端接口需要的主表和明细参数
 */
const buildSubmitPayload = (status: string) => {
    const checkedDetails = getCheckedDetailList();
    const details = checkedDetails.map((item: any) => buildDetailPayload(item, status));
    return {
        ...(route.query.id ? { id: route.query.id } : {}),
        planType: formData.planType,
        contractCodes: isContractPlan.value ? normalizeContractCodes(formData.contractCodes).join(',') : '',
        customerNames: buildCustomerNames(checkedDetails),
        status,
        details,
    };
};
/**
 * 提交前校验基础信息和明细必填字段。
 * @returns 是否允许提交
 */
const validateBeforeSubmit = async () => {
    try {
        await formRef.value?.validate?.();
    } catch (errors: any) {
        message.warning(errors?.[0]?.[0]?.message || '请完善基础信息');
        return false;
    }
    const checkedDetails = getCheckedDetailList();
    if (!checkedDetails.length) {
        message.warning('请至少勾选一条发货订单明细');
        return false;
    }
    const missingContractMessage = validateContractDetailSelection(checkedDetails);
    if (missingContractMessage) {
        message.warning(missingContractMessage);
        return false;
    }
    const currentRequiredFields = getRequiredDetailFields();
    const invalidRow = checkedDetails.find((row: any) =>
        currentRequiredFields.some((field) => isDetailFieldEmpty(row, field.key))
    );
    if (invalidRow) {
        const invalidRowIndex = formData.tableList.findIndex((row: any) => row === invalidRow);
        const invalidField = currentRequiredFields.find((field) =>
            isDetailFieldEmpty(invalidRow, field.key)
        );
        message.warning(`发货订单明细第${invalidRowIndex + 1}行的${invalidField?.label}必填`);
        return false;
    }
    const invalidThresholdRow = checkedDetails.find((row: any) => {
        const threshold = Number(row.shipmentThreshold);
        return !Number.isFinite(threshold) || threshold < SHIPMENT_THRESHOLD_MIN || threshold > SHIPMENT_THRESHOLD_MAX;
    });
    if (invalidThresholdRow) {
        const invalidRowIndex = formData.tableList.findIndex((row: any) => row === invalidThresholdRow);
        message.warning(`发货订单明细第${invalidRowIndex + 1}行的发货阈值必须在0-100之间`);
        return false;
    }
    if (isPrePlan.value) {
        const numberFields = [
            { key: 'oreGgrade', label: '矿石品位（%）' },
            { key: 'contractQuantity', label: '合同数量（吨）' },
        ];
        const invalidNumberRow = checkedDetails.find((row: any) =>
            numberFields.some(
                (field) =>
                    !Number.isFinite(Number(row[field.key])) ||
                    Number(row[field.key]) < PRE_DETAIL_NUMBER_MIN
            )
        );
        if (invalidNumberRow) {
            const invalidRowIndex = formData.tableList.findIndex((row: any) => row === invalidNumberRow);
            const invalidField = numberFields.find(
                (field) =>
                    !Number.isFinite(Number(invalidNumberRow[field.key])) ||
                    Number(invalidNumberRow[field.key]) < PRE_DETAIL_NUMBER_MIN
            );
            message.warning(`发货订单明细第${invalidRowIndex + 1}行的${invalidField?.label}不能小于0`);
            return false;
        }
    }
    return true;
};
/**
 * 将客户选择结果同步到预发货明细。
 * @param row 当前预发货明细
 * @param customer 客户选择组件返回的客户
 * @returns 无返回值
 */
const handlePreDetailCustomerChange = (row: any, customer: any) => {
    const selectedCustomer = Array.isArray(customer) ? customer[0] : customer;
    row.customerId = selectedCustomer?.id || selectedCustomer?.value || '';
    row.companyname = selectedCustomer?.customerName || selectedCustomer?.label || '';
    row.customerName = row.companyname;
    row.subsidiaryId = selectedCustomer?.subsidiaryId ?? null;
    row.subsidiaryName = selectedCustomer?.subsidiaryName || '';
};
// 发货订单明细表格列，编辑态下部分字段渲染为可校验表单控件。
const detailTableColumns = computed<any[]>(() => [
    {
        type: 'selection',
        width: 60,
        fixed: 'left',
    },
    {
        key: 'index',
        title: '序号',
        width: 60,
        fixed: 'left',
        render: (_row: any, index: number) => index + 1,
    },
    ...(isContractPlan.value
        ? [
              {
                  key: 'salesContractNumber',
                  title: '关联销售合同编号',
                  width: 140,
                  render: (row: any) => row.salesContractNumber || '--',
              },
          ]
        : []),
    {
        key: 'priority',
        title: () => renderRequiredTitle('优先级'),
        isRule: true,
        width: 140,
        render(row: any, index: number) {
            return renderDetailFormItem(row, index, 'priority', '优先级', () =>
                h(NSelect, {
                    value: row.priority,
                    options: getDictOptions(DICT.PRIORITY),
                    placeholder: '请选择',
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.priority = val;
                    },
                })
            );
        },
    },
    {
        key: 'supplierUnit',
        title: () => (isPrePlan.value ? renderRequiredTitle('供方单位') : '供方单位'),
        width: 200,
        render(row: any, index: number) {
            if (!isPrePlan.value) return formatDict(DICT.SUPPLIER_UNIT, row.supplierUnit);
            return renderDetailFormItem(row, index, 'supplierUnit', '供方单位', () =>
                h(NSelect, {
                    value: row.supplierUnit,
                    options: getDictOptions(DICT.SUPPLIER_UNIT),
                    placeholder: '请选择',
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.supplierUnit = val;
                    },
                })
            );
        },
    },
    {
        key: 'companyname',
        title: () => (isPrePlan.value ? renderRequiredTitle('企业名称') : '企业名称'),
        width: 220,
        render(row: any, index: number) {
            if (!isPrePlan.value) return row.companyname || '--';
            return renderDetailFormItem(row, index, 'customerId', '企业名称', () =>
                h(MxCommSelect, {
                    key: getDetailRowKey(row),
                    modelValue: row.customerId || '',
                    label: row.companyname || '',
                    typeName: '企业客户',
                    clearable: true,
                    text: false,
                    'onUpdate:modelValue': (value: string | string[] | null) => {
                        row.customerId = Array.isArray(value) ? value[0] || '' : value || '';
                    },
                    'onUpdate:label': (label: string | string[] | null) => {
                        row.companyname = Array.isArray(label) ? label.join('、') : label || '';
                        row.customerName = row.companyname;
                    },
                    onChangeEvt: (customer: any) => handlePreDetailCustomerChange(row, customer),
                })
            );
        },
    },
    ...(!isPrePlan.value
        ? [
              {
                  key: 'subsidiaryName',
                  title: '子公司贸易商',
                  width: 180,
                  render: (row: any) => row.subsidiaryName || '--',
              },
          ]
        : []),
    {
        key: 'contactInformation',
        title: () => renderRequiredTitle('联系方式'),
        isRule: true,
        width: 220,
        render(row: any, index: number) {
            return renderDetailFormItem(row, index, 'contactInformation', '联系方式', () =>
                h(NInput, {
                    value: row.contactInformation,
                    placeholder: '请输入',
                    type: 'textarea',
                    maxlength: 500,
                    showCount: true,
                    autosize: {
                        minRows: 1,
                        maxRows: 3,
                    },
                    'onUpdate:value': (val) => {
                        row.contactInformation = val;
                    },
                })
            );
        },
    },
    {
        key: 'oreGgrade',
        title: () => (isPrePlan.value ? renderRequiredTitle('矿石品位（%）') : '矿石品位（%）'),
        width: 140,
        render(row: any, index: number) {
            if (!isPrePlan.value) return row.oreGgrade ?? '--';
            return renderDetailFormItem(row, index, 'oreGgrade', '矿石品位（%）', () =>
                h(NInputNumber, {
                    value: row.oreGgrade,
                    placeholder: '请输入',
                    min: PRE_DETAIL_NUMBER_MIN,
                    precision: PRE_DETAIL_NUMBER_PRECISION,
                    step: 0.01,
                    showButton: false,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.oreGgrade = val;
                    },
                })
            );
        },
    },
    {
        key: 'oreType',
        title: () => (isPrePlan.value ? renderRequiredTitle('矿石种类') : '矿石种类'),
        width: 140,
        render(row: any, index: number) {
            if (!isPrePlan.value) return formatDict(DICT.ORE_TYPE, row.oreType);
            return renderDetailFormItem(row, index, 'oreType', '矿石种类', () =>
                h(NSelect, {
                    value: row.oreType,
                    options: getDictOptions(DICT.ORE_TYPE),
                    placeholder: '请选择',
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.oreType = val;
                    },
                })
            );
        },
    },
    {
        key: 'contractQuantity',
        title: () => (isPrePlan.value ? renderRequiredTitle('合同数量（吨）') : '合同数量（吨）'),
        width: 140,
        render(row: any, index: number) {
            if (!isPrePlan.value) return row.contractQuantity ?? '--';
            return renderDetailFormItem(row, index, 'contractQuantity', '合同数量（吨）', () =>
                h(NInputNumber, {
                    value: row.contractQuantity,
                    placeholder: '请输入',
                    min: PRE_DETAIL_NUMBER_MIN,
                    precision: PRE_DETAIL_NUMBER_PRECISION,
                    step: 0.01,
                    showButton: false,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.contractQuantity = val;
                    },
                })
            );
        },
    },
    ...(isContractPlan.value
        ? [
              {
                  key: 'preDeliveryQuantity',
                  title: '预发货数量',
                  width: 160,
                  render: (row: any) => formatPreDeliveryQuantity(row.preDeliveryQuantity),
              },
          ]
        : []),
    {
        key: 'shipmentThreshold',
        title: () => renderRequiredTitle('发货阈值（%）'),
        isRule: true,
        width: 170,
        render(row: any, index: number) {
            return renderDetailFormItem(row, index, 'shipmentThreshold', '发货阈值（%）', () =>
                h(NInputNumber, {
                    value: row.shipmentThreshold,
                    placeholder: '请输入',
                    min: SHIPMENT_THRESHOLD_MIN,
                    max: SHIPMENT_THRESHOLD_MAX,
                    step: 1,
                    showButton: false,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.shipmentThreshold = val;
                    },
                })
            );
        },
    },
    {
        key: 'placeFelivery',
        title: () => renderRequiredTitle('交货地点'),
        isRule: true,
        width: 160,
        render(row: any, index: number) {
            return renderDetailFormItem(row, index, 'placeFelivery', '交货地点', () =>
                h(NSelect, {
                    value: row.placeFelivery,
                    options: yardOptions.value,
                    loading: yardLoading.value,
                    placeholder: '请选择',
                    filterable: true,
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:value': (val: string | null) => {
                        row.placeFelivery = val || '';
                        row.deliveryLocationName = getYardName(val);
                    },
                })
            );
        },
    },
    {
        key: 'modeTransportation',
        title: () => renderRequiredTitle('运输方式'),
        isRule: true,
        width: 140,
        render(row: any, index: number) {
            return renderDetailFormItem(row, index, 'modeTransportation', '运输方式', () =>
                h(NSelect, {
                    value: row.modeTransportation,
                    options: getDictOptions(DICT.TRANSPORT_MODE),
                    placeholder: '请选择',
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:value': (val) => {
                        row.modeTransportation = val;
                    },
                })
            );
        },
    },
    {
        key: 'deliveryMethods',
        title: () => renderRequiredTitle('交割方式'),
        isRule: true,
        width: 180,
        render(row: any, index: number) {
            return renderDetailFormItem(row, index, 'deliveryMethods', '交割方式', () =>
                h(NSelect, {
                    value: row.deliveryMethods,
                    options: getDictOptions(DICT.DELIVERY_METHOD),
                    multiple: true,
                    maxTagCount: 'responsive',
                    ellipsisTagPopoverProps: {
                        placement: 'top',
                        trigger: 'hover',
                    },
                    placeholder: '请选择',
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:value': (val: DeliveryMethodValue[]) => {
                        row.deliveryMethods = normalizeDeliveryMethodValues(val);
                    },
                })
            );
        },
    },
    {
        key: 'deliveryDeadline',
        title: () => (isPrePlan.value ? renderRequiredTitle('交货期限') : '交货期限'),
        width: 250,
        render(row: any, index: number) {
            if (!isPrePlan.value) return row.deliveryDeadline || '--';
            return renderDetailFormItem(row, index, 'deliveryDateRange', '交货期限', () =>
                h(NDatePicker, {
                    formattedValue: row.deliveryDateRange,
                    type: 'daterange',
                    valueFormat: 'yyyy-MM-dd',
                    clearable: true,
                    style: { width: '100%' },
                    'onUpdate:formattedValue': (value: DeliveryDateRange) => {
                        row.deliveryDateRange = value;
                        row.startDate = value?.[0] || '';
                        row.endDate = value?.[1] || '';
                        row.deliveryDeadline = value?.join('至') || '';
                    },
                })
            );
        },
    },
    {
        key: 'remark',
        title: '计划备注',
        width: 200,
        render(row: any) {
            return h(NInput, {
                value: row.remark,
                type: 'textarea',
                maxlength: 500,
                showCount: true,
                autosize: {
                    minRows: 1,
                    maxRows: 3,
                },
                placeholder: '请输入',
                'onUpdate:value': (val) => {
                    row.remark = val;
                },
            });
        },
    },
    ...(isPrePlan.value
        ? [
              {
                  key: 'actions',
                  title: '操作',
                  width: 90,
                  fixed: 'right',
                  render(row: any) {
                      return h(
                          NButton,
                          {
                              text: true,
                              type: 'error',
                              onClick: () => handleDeletePreDetail(row),
                          },
                          { default: () => '删除' }
                      );
                  },
              },
          ]
        : []),
]);
const detailTableScrollX = computed(() => {
    const width = detailTableColumns.value.reduce((total, item: any) => total + Number(item.width || 0), 0);
    return width > 856 ? width : 856;
});
/**
 * 编辑发运计划时获取详情并回填表单。
 * @returns 无返回值
 */
const getAllData = async () => {
    try {
        const res = await getDailyShippingPlanDetailApi(route.query.id, true);

        if (res && res.code === 200) {
            const detailList = Array.isArray(res.data?.details) ? res.data.details : [];
            formData.id = res.data?.id || '';
            formData.planType =
                res.data?.planType || detailList[0]?.planType || DAILY_SHIPPING_PLAN_TYPE.CONTRACT;
            const detailContractCodes = detailList.map((item: any) => getContractCode(item));
            formData.contractCodes = normalizeContractCodes(
                res.data?.contractCodes || detailContractCodes
            );
            const contractNameMap = new Map<string, string>(
                detailList
                    .map((item: any) => [getContractCode(item), getContractLabel(item)] as const)
                    .filter(([code, name]) => Boolean(code && name))
            );
            ensureContractOptions(formData.contractCodes, contractNameMap);
            if (isContractPlan.value) {
                await loadContractDetailList(formData.contractCodes, detailList);
            } else {
                setDetailTableList(
                    detailList.map((item: any) => formatDetailItem(item, hasPersistedDetailId(item)))
                );
            }
        }
    } catch (error) {
        console.error('Failed to obtain daily shipping plan detail:', error);
    }
};
/**
 * 初始化堆场、销售合同和新增或编辑页面数据。
 * @returns 无返回值
 */
const initializePage = async () => {
    try {
        await Promise.all([loadYardOptions(), loadContractOptions()]);
        if (route.query.id) {
            await getAllData();
        }
    } catch (error) {
        console.error('Failed to initialize daily shipping plan page:', error);
    }
};
initializePage();
/**
 * 执行已经确认的发运计划提交请求。
 * @returns 无返回值
 */
const executeSubmit = async () => {
    try {
        submitLoading.value = true;
        const payload = buildSubmitPayload(PLAN_STATUS_CONSTANT.EXECUTING);
        const res = route.query.id ? await updateDailyShippingPlanApi(payload) : await createDailyShippingPlanApi(payload);
        if (res?.code === 200) {
            router.back();
        }
    } catch (error) {
        console.error('Failed to submit daily shipping plan:', error);
    } finally {
        submitLoading.value = false;
    }
};
/**
 * 打开提交确认弹窗。
 * @returns 用户确认时返回 true，取消或关闭弹窗时返回 false
 */
const confirmSubmit = () =>
    new Promise<boolean>((resolve) => {
        dialog.warning({
            title: '提交确认',
            content: '提交后，所有发货明细将推送至物流系统，请确认！',
            positiveText: '确认提交',
            negativeText: '取消',
            onPositiveClick: () => resolve(true),
            onNegativeClick: () => resolve(false),
            onMaskClick: () => resolve(false),
            onClose: () => resolve(false),
        });
    });
/**
 * 校验并提交发运计划。
 * @returns 无返回值
 */
const handleSubmit = async () => {
    if (submitLoading.value || submitConfirming.value || detailLoading.value) return;
    try {
        const valid = await validateBeforeSubmit();
        if (!valid) return;
        submitConfirming.value = true;
        const confirmed = await confirmSubmit();
        if (confirmed) {
            await executeSubmit();
        }
    } catch (error) {
        console.error('Failed to confirm daily shipping plan submission:', error);
    } finally {
        submitConfirming.value = false;
    }
};
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

.shipping-detail-table {
    padding-top: 16px;
}

.plan-type-radio-group {
    display: flex;
    align-items: center;
    gap: 24px;
}

.shipping-detail-table .web-n-data-table-con {
    background-color: #ffffff;
    border-radius: 8px;
}

.shipping-detail-table :deep(.n-data-table-td) {
    overflow: hidden;
}

.shipping-detail-table :deep(.n-data-table-td > *),
.shipping-detail-table :deep(.n-form-item),
.shipping-detail-table :deep(.n-form-item-blank),
.shipping-detail-table :deep(.n-input),
.shipping-detail-table :deep(.n-input-number),
.shipping-detail-table :deep(.n-select) {
    min-width: 0;
    max-width: 100%;
}

.shipping-detail-table :deep(.shipping-detail-required-title) {
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.shipping-detail-table :deep(.shipping-detail-required-mark) {
    color: #d03050;
    font-weight: 600;
}

:deep(.n-data-table .n-form-item-feedback-wrapper) {
    display: none;
}
.title-text {
    display: flex;
    align-items: center;
}
</style>
