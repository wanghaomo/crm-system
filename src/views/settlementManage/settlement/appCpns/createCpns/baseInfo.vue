<template>
    <div class="edit-content">
        <div class="form-card">
            <div class="form-card-title">基础信息</div>
            <Form ref="formRef" label-width="120px">
                <Field
                    :modelValue="contractLabel"
                    :is-link="true"
                    :required="true"
                    readonly
                    name="contractCode"
                    label="销售合同编号"
                    placeholder="请选择"
                    @click="showContractPicker = true" />
                <Field
                    :modelValue="formData.shoulDate || ''"
                    :is-link="true"
                    :required="true"
                    readonly
                    name="shoulDate"
                    label="回款到期时间"
                    placeholder="请选择"
                    @click="openDatePicker" />
                <Field
                    v-model="formData.enterpriseName"
                    name="enterpriseName"
                    label="企业名称"
                    readonly
                    required
                    placeholder="自动匹配销售合同" />
                <Field
                    :modelValue="customerTypeLabel"
                    :required="true"
                    readonly
                    name="customerType"
                    label="客户类型"
                    placeholder="自动匹配销售合同" />
                <MxPersonSelect
                    :clearable="true"
                    title="我方经办人"
                    :required="true"
                    name="handler"
                    placeholder="请选择我方经办人"
                    v-model="formData.handler"
                    v-model:label="formData.ourHandlerName"
                    v-model:selectedPerson="formData.handlerSelectedPerson" />
                <Field
                    v-model="formData.handlerName"
                    name="handlerName"
                    label="客户经办人"
                    maxlength="50"
                    placeholder="请输入客户经办人"
                    clearable />
                <Field
                    :modelValue="formatSettlementAmount(formData.totalTaxAmount, '0.0000')"
                    name="totalTaxAmount"
                    label="结算总价(元)"
                    required
                    readonly
                    placeholder="根据下方明细表自动计算">
                    <template #input>
                        <div style="color: #999">
                            {{ formatSettlementAmount(formData.totalTaxAmount, '0.0000') }}
                        </div>
                    </template>
                </Field>
                <Field
                    :modelValue="getCellText(formData.settlementTotal, 0)"
                    name="settlementTotal"
                    label="结算总量(吨)"
                    readonly
                    placeholder="根据下方明细表自动计算">
                    <template #input>
                        <div style="color: #999">
                            {{ getCellText(formData.settlementTotal, 0) }}
                        </div>
                    </template>
                </Field>
                <Field
                    style="border-radius: 12px;"
                    name="terms"
                    label-align="top"
                    v-model="formData.terms"
                    label="合同结算条款"
                    rows="5"
                    required
                    autosize
                    maxlength="500"
                    type="textarea"
                    show-word-limit
                    clearable
                    placeholder="请输入" />
            </Form>
        </div>
    </div>
    <card title="结算明细表">
        <template #titleLeft>
            <checkbox
                :model-value="isAllChecked"
                :indeterminate="isIndeterminate"
                shape="square"
                icon-size="16px"
                style="margin-right: 8px"
                @update:model-value="toggleAllRows" />
        </template>
        <template v-for="(item, index) in settlementRecord" :key="getRowKey(item, index)">
            <div class="settlement-item">
                <checkbox
                    v-model="item.__checked"
                    shape="square"
                    icon-size="16px"
                    class="checkbox"
                    @update:model-value="emitCheckedRows" />
                <dataItem
                    title="结算明细"
                    :index="index + 1"
                    :item="item"
                    showEdit
                    class="data-item"
                    :smallTitle="`分项金额 ${formatSettlementAmount(getTaxIncludedAmount(item), '0.0000')}元`"
                    :descriptions="getSettlementRecordDescriptions(item)"
                    @edit="handleEditSettlementDetail(item, index)" />
            </div>
        </template>
        <empty v-if="settlementRecord.length == 0" />
    </card>
    <Popup v-model:show="showDatePicker" position="bottom" round>
        <DatePicker
            v-model="currentDate"
            title="回款到期时间"
            :min-date="receiptDueMinDate"
            @confirm="onDateConfirm"
            @cancel="showDatePicker = false" />
    </Popup>
    <Popup v-model:show="showContractPicker" position="bottom" round>
        <Picker
            :columns="contractOptions"
            title="销售合同编号"
            @confirm="onContractConfirm"
            @cancel="showContractPicker = false" />
    </Popup>
    <Popup v-model:show="showSettlementEditPopup" position="bottom" round>
        <div class="settlement-detail-popup">
            <div class="popup-title">编辑结算明细</div>
            <Form label-width="132px">
                <Field
                    :model-value="getCellText(editingSettlementForm.transportOrderCode)"
                    label="运输订单编号"
                    required
                    readonly />
                <Field
                    :model-value="editingSettlementForm.acceptanceTime || ''"
                    label="验收时间"
                    required
                    readonly
                    is-link
                    placeholder="请选择验收时间"
                    @click="openAcceptanceDatePicker" />
                <MxCommSelect
                    :key="settlementEditSession"
                    v-model="editingSettlementForm.deliveryLocation"
                    v-model:label="editingSettlementForm.deliveryLocationName"
                    name="deliveryLocation"
                    title="交货地点"
                    placeholder="请选择交货地点"
                    required
                    :options="yardOptions"
                    :rules="[{ required: true, message: '请选择交货地点', trigger: 'onChange' }]"
                    :clearable="true"
                    :text="false" />
                <MxPersonSelect
                    title="业务人员"
                    multiple
                    collapse-tags
                    required
                    placeholder="请选择业务人员"
                    v-model:modelValue="editingSettlementForm.businessPersonCodes"
                    v-model:label="editingSettlementForm.businessPersonNames"
                    v-model:selectedPerson="editingSettlementForm.businessPerson"
                    @changeEvt="handleBusinessPersonChange" />
                <Field v-model="editingSettlementForm.inspectorName" label="验货人员" maxlength="50" placeholder="请输入" />
                <Field :model-value="formatOreType(editingSettlementForm.oreType)" label="矿石种类" required readonly />
                <Field :model-value="getCellText(editingSettlementForm.contractOreGrade)" label="合同约定品位" required readonly />
                <Field
                    v-model="editingSettlementForm.settleOreGrade"
                    label="结算品位"
                    type="number"
                    required
                    placeholder="请输入"
                    @blur="formatEditNumberField('settleOreGrade')" />

                <template v-if="!isTraderCustomer">
                    <Field
                        v-model="editingSettlementForm.priceIncrease"
                        label="增减价"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatEditNumberField('priceIncrease')" />
                    <div class="content-group-title">氧化镁含量≥4.5%</div>
                    <Field
                        v-model="editingSettlementForm.contentMgoObject.content"
                        label="含量"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentMgoObject', 'content')" />
                    <Field
                        v-model="editingSettlementForm.contentMgoObject.weightedAverage"
                        label="加权平均"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentMgoObject', 'weightedAverage')" />
                    <Field
                        v-model="editingSettlementForm.contentMgoObject.priceIncrease"
                        label="增减价"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentMgoObject', 'priceIncrease')" />
                    <div class="content-group-title">氧化铁含量（≤0.8%）</div>
                    <Field
                        v-model="editingSettlementForm.contentFeoObject.content"
                        label="含量"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentFeoObject', 'content')" />
                    <Field
                        v-model="editingSettlementForm.contentFeoObject.weightedAverage"
                        label="加权平均"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentFeoObject', 'weightedAverage')" />
                    <Field
                        v-model="editingSettlementForm.contentFeoObject.priceIncrease"
                        label="增减价"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentFeoObject', 'priceIncrease')" />
                    <div class="content-group-title">氧化铝含量（≤1%）</div>
                    <Field
                        v-model="editingSettlementForm.contentAloObject.content"
                        label="含量"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentAloObject', 'content')" />
                    <Field
                        v-model="editingSettlementForm.contentAloObject.weightedAverage"
                        label="加权平均"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentAloObject', 'weightedAverage')" />
                    <Field
                        v-model="editingSettlementForm.contentAloObject.priceIncrease"
                        label="增减价"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatContentNumberField('contentAloObject', 'priceIncrease')" />
                </template>

                <Field
                    v-model="editingSettlementForm.moisture"
                    label="水分（%）"
                    type="number"
                    required
                    placeholder="请输入"
                    @blur="formatEditNumberField('moisture')" />
                <Field
                    v-model="editingSettlementForm.exceedMoisture"
                    :label="isTraderCustomer ? '超出水分吨数' : '超出水分吨位（吨）'"
                    type="number"
                    required
                    placeholder="请输入"
                    @blur="formatEditNumberField('exceedMoisture')" />
                <template v-if="isTraderCustomer">
                    <Field
                        v-model="editingSettlementForm.gradeFloat"
                        label="品位增减价（元）"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatEditNumberField('gradeFloat')" />
                </template>
                <template v-else>
                    <Field
                        v-model="editingSettlementForm.granularity"
                        label="粒度≤30mm过筛率%"
                        type="number"
                        required
                        placeholder="请输入"
                        @blur="formatEditNumberField('granularity')" />
                </template>
                <Field :model-value="getDispatchWeightDisplayValue(editingSettlementForm.dispatchWeight)" label="发货量（吨）" readonly />
                <Field
                    v-model="editingSettlementForm.actualReceiptWeight"
                    label="实收量（吨）"
                    type="number"
                    required
                    placeholder="请输入"
                    @blur="formatEditNumberField('actualReceiptWeight')" />
                <Field
                    v-model="editingSettlementForm.settleWeight"
                    label="结算量（吨）"
                    type="number"
                    required
                    placeholder="请输入"
                    @blur="handleSettlementAmountFieldBlur('settleWeight')" />
                <Field :model-value="getCellText(editingSettlementForm.contractUnitPrice)" label="合同单价（元/吨）" required readonly />
                <Field
                    :model-value="formatSettlementAmount(editingSettlementForm.taxIncludedPrice)"
                    label="结算单价（元/吨）"
                    required
                    readonly />
                <Field :model-value="formatSettlementAmount(editingSettlementForm.taxIncludedAmount)" label="分项金额（元）" required readonly />
                <Field
                    v-model="editingSettlementForm.remark"
                    label="备注"
                    label-align="top"
                    type="textarea"
                    rows="4"
                    autosize
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入" />
            </Form>
            <div class="popup-footer">
                <button class="popup-cancel" @click="showSettlementEditPopup = false">取消</button>
                <button class="popup-confirm" @click="handleSaveSettlementDetail">确定</button>
            </div>
        </div>
    </Popup>
    <Popup v-model:show="showAcceptanceDatePicker" position="bottom" round>
        <DatePicker
            v-model="acceptanceDateValue"
            title="验收时间"
            @confirm="onAcceptanceDateConfirm"
            @cancel="showAcceptanceDatePicker = false" />
    </Popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Checkbox, DatePicker, Field, Form, Picker, Popup, showToast } from 'vant';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { getContractSalesListByStatus, getSettlementDetailListByContractCodeApi } from '@/api';
import { useDictStore } from '@/store/commStore';
import { numberToChinese } from '@/utils/commUtil';
import {
    getSettlementYardCode,
    getSettlementYardName,
    getSettlementNumberValidationMessage,
    getSettlementAmountNumber,
    getSettlementUnitPrice,
    formatSettlementAmount,
    normalizeSettlementNumber,
    SETTLEMENT_CHEMICAL_NUMBER_FIELDS,
    SETTLEMENT_TRADER_NUMBER_FIELDS,
    type SettlementYardOption,
} from '../../utils';
import card from '../card.vue';
import dataItem from '../data-item.vue';

const emit = defineEmits(['settlement-rows-change']);

const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
    isEdit: {
        type: Boolean,
        default: false,
    },
    yardOptions: {
        type: Array,
        default: () => [],
    },
});

const CONTRACT_STATUS_EXECUTING = 'EXECUTING';
const CUSTOMER_TYPE_TRADER = 'TRADER';
const DEFAULT_NUMBER = 0;
const DICT = {
    ORE_TYPE: '矿石种类',
};

const contentFieldMap = {
    content: ['content', 'value', '含量'],
    weightedAverage: ['weightedAverage', 'weightedAvg', 'weighted', 'average', '加权平均'],
    priceIncrease: ['priceIncrease', 'increasePrice', 'priceFloat', '增价', '增减价'],
};

const showDatePicker = ref(false);
const showContractPicker = ref(false);
const showSettlementEditPopup = ref(false);
const showAcceptanceDatePicker = ref(false);
const contractList = ref<any[]>([]);
const editingSettlementIndex = ref(-1);
const settlementEditSession = ref(0);
const editingSettlementForm = ref<any>({
    contentMgoObject: { content: null, weightedAverage: null, priceIncrease: null },
    contentFeoObject: { content: null, weightedAverage: null, priceIncrease: null },
    contentAloObject: { content: null, weightedAverage: null, priceIncrease: null },
});
/**
 * 获取回款到期时间的最小可选日期。
 * @returns 今天零点日期对象
 */
const getReceiptDueMinDate = () => new Date(dayjs().startOf('day').valueOf());

const receiptDueMinDate = ref<Date>(getReceiptDueMinDate());
const currentDate = ref<any[]>([
    dayjs(receiptDueMinDate.value).format('YYYY'),
    dayjs(receiptDueMinDate.value).format('MM'),
    dayjs(receiptDueMinDate.value).format('DD'),
]);
const acceptanceDateValue = ref<any[]>([dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')]);
const { dictMap } = storeToRefs(useDictStore());

const customerTypeOptions = [
    { text: '化工企业', value: 'CHEMICAL' },
    { text: '贸易商', value: CUSTOMER_TYPE_TRADER },
];

const settlementRecord = computed<any[]>(() => props.formData.tableList || []);
const isTraderCustomer = computed(() => String(props.formData.customerType || '').toUpperCase() === CUSTOMER_TYPE_TRADER);
const shouldUseDefaultValue = computed(() => !props.isEdit);
const settlementNumberFields = computed(() =>
    isTraderCustomer.value ? SETTLEMENT_TRADER_NUMBER_FIELDS : SETTLEMENT_CHEMICAL_NUMBER_FIELDS
);
/**
 * 判断结算明细行是否需要按新增态补默认值。
 * @param row 当前结算明细行
 * @returns 新增页或编辑页无 id 行返回 true
 */
const shouldUseRowDefaultValue = (row: any) => !props.isEdit || !hasValue(row?.id);
const shouldUseEditingRowDefaultValue = computed(() => shouldUseRowDefaultValue(editingSettlementForm.value));
const oreTypeOptions = computed(() => dictMap.value?.[DICT.ORE_TYPE] || dictMap.value?.['矿种'] || []);
const settlementYardOptions = computed(() => props.yardOptions as SettlementYardOption[]);

const customerTypeLabel = computed(() => {
    const option = customerTypeOptions.find((item) => item.value === props.formData.customerType);
    return option?.text || props.formData.customerType || '';
});

const contractOptions = computed(() => {
    return contractList.value.map((item) => ({
        text: item.contractCode || '',
        value: item.contractCode || '',
        raw: item,
    }));
});

const contractLabel = computed(() => {
    const option = contractOptions.value.find((item) => item.value === props.formData.contractCode);
    return option?.text || props.formData.contractCode || '';
});

/**
 * 将当前合同的我方负责人同步到结算表单，供明细业务人员使用。
 * @returns 无返回值
 */
const syncContractDirector = () => {
    const contract = contractList.value.find((item) => item.contractCode === props.formData.contractCode);
    if (!contract) return;
    props.formData.contractDirectorId = contract.directorId || contract.director?.id || contract.director?.code || '';
    props.formData.contractDirectorName = contract.directorName || contract.director?.name || contract.director?.username || '';
    props.formData.contractDirectorLarkId =
        contract.directorLarkId || contract.director?.larkUserId || contract.director?.feishuUserId || '';
};

const isAllChecked = computed(() => settlementRecord.value.length > 0 && settlementRecord.value.every((item) => item.__checked !== false));
const isIndeterminate = computed(() => {
    const checkedLength = settlementRecord.value.filter((item) => item.__checked !== false).length;
    return checkedLength > 0 && checkedLength < settlementRecord.value.length;
});

/**
 * 获取字段展示值。
 * @param value 原始字段值
 * @param placeholder 占位值
 * @returns 展示值
 */
const getCellText = (value: any, placeholder: any = '--') => {
    return value === null || value === undefined || value === '' ? placeholder : value;
};

/**
 * 获取交货地点对应的堆场编码。
 * @param value 堆场编码或堆场名称
 * @returns 堆场编码
 */
const getYardCode = (value: any) => getSettlementYardCode(value, settlementYardOptions.value);

/**
 * 获取交货地点对应的堆场名称。
 * @param value 堆场编码或堆场名称
 * @returns 堆场名称
 */
const getYardName = (value: any) => getSettlementYardName(value, settlementYardOptions.value);

/**
 * 将可结算明细接口返回值规范成列表。
 * @param response 接口返回结果
 * @returns 可结算明细列表
 */
const getSettlementDetailResponseList = (response: any) => {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.financeSettlementDetailDTOList)) return data.financeSettlementDetailDTOList;
    return [];
};

/**
 * 获取结算明细行 key。
 * @param row 当前行
 * @param index 行下标
 * @returns 行 key
 */
const getRowKey = (row: any, index: number) => row.id || `${row.transportOrderCode || ''}-${row.orderNum || index}`;

/**
 * 判断字段是否为有效值，数字 0 视为有效。
 * @param value 待判断字段值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== null && value !== undefined && value !== '';

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
 * @param value 原始值
 * @param defaultValue 默认值
 * @returns 两位小数数字
 */
const getFixedNumber = (value: any, defaultValue: any = DEFAULT_NUMBER) => {
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
 * 获取数字展示值，编辑态空值不补默认值。
 * @param value 原始值
 * @returns 展示数字
 */
const getNumberDisplayValue = (value: any) => {
    if (!hasValue(value)) return shouldUseDefaultValue.value ? DEFAULT_NUMBER : null;
    return getFixedNumber(value);
};

/**
 * 获取发货量展示值，后端未返回时按 0 展示。
 * @param value 发货量原始值
 * @returns 发货量展示值
 */
const getDispatchWeightDisplayValue = (value: any) => {
    return hasValue(value) ? getFixedNumber(value) : DEFAULT_NUMBER;
};

/**
 * 将字典值格式化为展示文案。
 * @param dictName 字典名称
 * @param value 字典值或字典文案
 * @returns 匹配到的字典文案
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
 * 解析成分对象。
 * @param value 原始对象或 JSON 字符串
 * @returns 成分对象
 */
const parseObjectValue = (value: any) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error('解析结算明细成分对象失败:', error);
        return {};
    }
};

/**
 * 获取成分对象默认值，新增态空值补 0，编辑态空值保持 null。
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
 * 确保弹窗中成分对象可双向绑定，编辑态缺省字段保持 null。
 * @param row 当前结算明细行
 * @returns 无返回值
 */
const ensureContentObjects = (row: any) => {
    const useDefault = shouldUseRowDefaultValue(row);
    row.contentMgoObject = getDefaultContentObject(row.contentMgoObject || row.contentMgo, useDefault);
    row.contentFeoObject = getDefaultContentObject(row.contentFeoObject || row.contentFeo, useDefault);
    row.contentAloObject = getDefaultContentObject(row.contentAloObject || row.contentAlo, useDefault);
};

/**
 * 计算结算明细分项金额，公式为结算单价 * 结算量。
 * @param row 当前结算明细行
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
    return getSettlementAmountNumber(
        getFixedNumber(settleWeightSource) * Number(taxIncludedPrice),
        useDefault ? DEFAULT_NUMBER : null
    );
};

/**
 * 根据结算量和结算单价刷新分项金额。
 * @param row 当前结算明细行
 * @returns 无返回值
 */
const updateTaxIncludedAmount = (row: any) => {
    row.taxIncludedPrice = getCalculatedUnitPrice(row);
    row.taxIncludedAmount = getTaxIncludedAmount(row);
};

/**
 * 解析业务人员字段，兼容数组、对象、JSON 字符串和逗号分隔字符串。
 * @param row 当前结算明细行
 * @returns 人员选择组件需要的人员对象数组
 */
const getBusinessPersonList = (row: any) => {
    const source = row.businessPerson || row.businessPersonId;
    if (Array.isArray(source)) {
        return source.map((item: any) => ({
            ...item,
            value: item.value || item.code || item.id || '',
            code: item.code || item.value || item.id || '',
            label: item.label || item.username || item.name || '',
            username: item.username || item.label || item.name || '',
        }));
    }
    if (source && typeof source === 'object') {
        return [
            {
                ...source,
                value: source.value || source.code || source.id || '',
                code: source.code || source.value || source.id || '',
                label: source.label || source.username || source.name || '',
                username: source.username || source.label || source.name || '',
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
 * 将业务人员选择结果同步到行数据。
 * @param row 当前结算明细行
 * @param selectedPersons 选中的人员列表
 * @returns 无返回值
 */
const setBusinessPersons = (row: any, selectedPersons: any[] = []) => {
    const persons = selectedPersons.map((item: any) => ({
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
 * 初始化结算明细默认值。
 * @param row 当前结算明细行
 * @param useDefault 是否按新增态补默认值
 * @returns 无返回值
 */
const normalizeSettlementDetailRow = (row: any, useDefault = shouldUseRowDefaultValue(row)) => {
    if ('enterpriseName' in row) {
        delete row.enterpriseName;
    }
    row.deliveryLocation = getYardCode(row.deliveryLocation);
    row.deliveryLocationName = row.deliveryLocationName || getYardName(row.deliveryLocation);
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
    row.dispatchWeight = hasValue(row.dispatchWeight) ? getFixedNumber(row.dispatchWeight) : DEFAULT_NUMBER;
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
    updateTaxIncludedAmount(row);
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
    row.businessPersonName = row.businessPersonName || row.businessPersonNames.join(',');
};

/**
 * 获取成分字段值，兼容接口对象里的英文 key 和中文 key。
 * @param row 当前结算明细行
 * @param objectKey 成分对象字段名
 * @param jsonKey 成分 JSON 字符串字段名
 * @param fieldKeys 可匹配字段列表
 * @returns 成分字段值
 */
const getContentValue = (row: any, objectKey: string, jsonKey: string, fieldKeys: string[]) => {
    const objectValue = row[objectKey] || parseObjectValue(row[jsonKey]);
    const key = fieldKeys.find((item) => objectValue?.[item] !== undefined && objectValue?.[item] !== null);
    return key ? objectValue[key] : '';
};

type RequiredField = {
    key: string;
    label: string;
    type?: 'select';
};

const COMMON_REQUIRED_FIELDS: RequiredField[] = [
    { key: 'transportOrderCode', label: '运输订单编号' },
    { key: 'acceptanceTime', label: '验收时间', type: 'select' },
    { key: 'deliveryLocation', label: '交货地点', type: 'select' },
    { key: 'businessPersonName', label: '业务人员', type: 'select' },
    { key: 'oreType', label: '矿石种类', type: 'select' },
    { key: 'contractOreGrade', label: '合同约定品位' },
    { key: 'settleOreGrade', label: '结算品位' },
];
const QUANTITY_REQUIRED_FIELDS: RequiredField[] = [
    { key: 'actualReceiptWeight', label: '实收量（吨）' },
    { key: 'settleWeight', label: '结算量（吨）' },
    { key: 'contractUnitPrice', label: '合同单价（元/吨）' },
];
const SUFFIX_REQUIRED_FIELDS: RequiredField[] = [
    { key: 'taxIncludedPrice', label: '结算单价（元/吨）' },
    { key: 'taxIncludedAmount', label: '分项金额（元）' },
];
const TRADER_REQUIRED_FIELDS: RequiredField[] = [
    ...COMMON_REQUIRED_FIELDS,
    { key: 'moisture', label: '水分（%）' },
    { key: 'exceedMoisture', label: '超出水分吨数' },
    ...QUANTITY_REQUIRED_FIELDS,
    { key: 'gradeFloat', label: '品位增减价（元）' },
    ...SUFFIX_REQUIRED_FIELDS,
];
const CHEMICAL_REQUIRED_FIELDS: RequiredField[] = [
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

/**
 * 获取结算明细字段校验值。
 * @param row 当前结算明细行
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
 * 判断必填字段是否为空，数字 0 视为已填写。
 * @param value 字段值
 * @returns 是否为空
 */
const isEmptyRequiredValue = (value: any) => {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || value === '';
};

/**
 * 获取单行结算明细的首个必填校验错误文案。
 * @param row 当前结算明细行
 * @param rowIndex 行序号
 * @returns 校验错误文案，无错误时返回空字符串
 */
const getSettlementDetailErrorMessage = (row: any, rowIndex: number) => {
    for (const field of requiredFields.value) {
        if (isEmptyRequiredValue(getRequiredFieldValue(row, field.key))) {
            const prefix = field.type === 'select' ? '请选择' : '请输入';
            return `${prefix}结算明细${numberToChinese(rowIndex)}的${field.label}`;
        }
    }
    for (const field of settlementNumberFields.value) {
        const numberError = getSettlementNumberValidationMessage(
            getRequiredFieldValue(row, field.key),
            field.key,
            field.label
        );
        if (numberError) return `结算明细${numberToChinese(rowIndex)}的${numberError}`;
    }
    return '';
};

/**
 * 复制结算明细行，避免编辑弹窗未确认时污染原行。
 * @param row 原始行
 * @returns 克隆行
 */
const cloneSettlementRow = (row: any) => {
    try {
        return JSON.parse(JSON.stringify(row || {}));
    } catch (error) {
        console.error('复制结算明细行失败:', error);
        return { ...(row || {}) };
    }
};

/**
 * 数字输入框失焦时格式化为两位小数，编辑态空值保持 null。
 * @param field 字段名
 * @returns 无返回值
 */
const formatEditNumberField = (field: string) => {
    const value = editingSettlementForm.value[field];
    if (!hasValue(value)) {
        editingSettlementForm.value[field] = shouldUseEditingRowDefaultValue.value ? DEFAULT_NUMBER : null;
        return;
    }
    editingSettlementForm.value[field] = normalizeSettlementNumber(value, field, null);
    if (['priceIncrease', 'gradeFloat'].includes(field)) {
        updateTaxIncludedAmount(editingSettlementForm.value);
    }
};

/**
 * 成分数字输入框失焦时格式化为两位小数。
 * @param objectKey 成分对象字段名
 * @param field 成分对象内字段名
 * @returns 无返回值
 */
const formatContentNumberField = (objectKey: string, field: string) => {
    if (!editingSettlementForm.value[objectKey]) {
        editingSettlementForm.value[objectKey] = getDefaultContentObject(null, shouldUseEditingRowDefaultValue.value);
    }
    const value = editingSettlementForm.value[objectKey][field];
    editingSettlementForm.value[objectKey][field] = hasValue(value)
        ? normalizeSettlementNumber(value, field, null)
        : shouldUseEditingRowDefaultValue.value
            ? DEFAULT_NUMBER
            : null;
    if (field === 'priceIncrease') {
        updateTaxIncludedAmount(editingSettlementForm.value);
    }
};

/**
 * 结算量或结算单价失焦时同步刷新分项金额。
 * @param field 字段名
 * @returns 无返回值
 */
const handleSettlementAmountFieldBlur = (field: string) => {
    formatEditNumberField(field);
    updateTaxIncludedAmount(editingSettlementForm.value);
};

/**
 * 打开验收时间选择器。
 * @returns 无返回值
 */
const openAcceptanceDatePicker = () => {
    const date = editingSettlementForm.value.acceptanceTime ? dayjs(editingSettlementForm.value.acceptanceTime) : dayjs();
    acceptanceDateValue.value = date.isValid()
        ? [date.format('YYYY'), date.format('MM'), date.format('DD')]
        : [dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')];
    showAcceptanceDatePicker.value = true;
};

/**
 * 确认验收时间。
 * @param value 日期选择结果
 * @returns 无返回值
 */
const onAcceptanceDateConfirm = (value: any) => {
    const dateArr = value?.selectedValues || acceptanceDateValue.value;
    editingSettlementForm.value.acceptanceTime = `${dateArr[0]}-${dateArr[1]}-${dateArr[2]}`;
    showAcceptanceDatePicker.value = false;
};

/**
 * 业务人员变化时同步名称、编码和原始对象。
 * @param value 人员选择组件返回值
 * @returns 无返回值
 */
const handleBusinessPersonChange = (value: any[] | null) => {
    setBusinessPersons(editingSettlementForm.value, Array.isArray(value) ? value : []);
};

/**
 * 打开结算明细编辑弹窗。
 * @param row 当前结算明细行
 * @param index 行下标
 * @returns 无返回值
 */
const handleEditSettlementDetail = (row: any, index: number) => {
    editingSettlementIndex.value = index;
    settlementEditSession.value += 1;
    editingSettlementForm.value = cloneSettlementRow(row);
    normalizeSettlementDetailRow(editingSettlementForm.value, shouldUseRowDefaultValue(row));
    ensureContentObjects(editingSettlementForm.value);
    showSettlementEditPopup.value = true;
};

/**
 * 保存结算明细编辑弹窗。
 * @returns 无返回值
 */
const handleSaveSettlementDetail = () => {
    const row = editingSettlementForm.value;
    updateTaxIncludedAmount(row);
    const errorMessage = getSettlementDetailErrorMessage(row, editingSettlementIndex.value + 1);
    if (errorMessage) {
        showToast(errorMessage);
        return;
    }
    normalizeSettlementDetailRow(row);
    const currentRow = settlementRecord.value[editingSettlementIndex.value] || {};
    props.formData.tableList.splice(editingSettlementIndex.value, 1, {
        ...currentRow,
        ...row,
        __checked: currentRow.__checked !== false,
    });
    showSettlementEditPopup.value = false;
    emitCheckedRows();
};

/**
 * 格式化成分对象展示值。
 * @param objectValue 成分对象
 * @returns 成分展示文案
 */
const formatContentObject = (objectValue: any) => {
    const value = parseObjectValue(objectValue);
    const content = value.content ?? value.value ?? value['含量'];
    const weightedAverage = value.weightedAverage ?? value.weightedAvg ?? value.weighted ?? value.average ?? value['加权平均'];
    const priceIncrease = value.priceIncrease ?? value.increasePrice ?? value.priceFloat ?? value['增价'] ?? value['增减价'];
    return `含量：${getCellText(content)}；加权平均：${getCellText(weightedAverage)}；增减价：${getCellText(priceIncrease)}`;
};

/**
 * 生成描述项。
 * @param label 标签
 * @param value 值
 * @returns 描述项
 */
const createDescription = (label: string, value: any) => ({
    label,
    value: getCellText(value),
});

/**
 * 获取结算明细卡片描述。
 * @param item 当前结算明细
 * @returns 描述项列表
 */
const getSettlementRecordDescriptions = (item: any) => {
    const leadingDescriptions = [
        createDescription('运输订单编号', item.transportOrderCode),
        createDescription('验收时间', item.acceptanceTime),
        createDescription('交货地点', item.deliveryLocationName || getYardName(item.deliveryLocation)),
        createDescription('业务人员', item.businessPersonName),
        createDescription('验货人员', item.inspectorName),
        createDescription('矿石种类', formatOreType(item.oreType)),
        createDescription('合同约定品位', getNumberDisplayValue(item.contractOreGrade)),
        createDescription('结算品位', item.settleOreGrade),
    ];
    const quantityDescriptions = [
        createDescription('发货量（吨）', getDispatchWeightDisplayValue(item.dispatchWeight)),
        createDescription('实收量（吨）', item.actualReceiptWeight),
        createDescription('结算量（吨）', item.settleWeight),
        createDescription('合同单价（元/吨）', getNumberDisplayValue(item.contractUnitPrice)),
    ];
    const suffixDescriptions = [
        createDescription('结算单价（元/吨）', formatSettlementAmount(item.taxIncludedPrice)),
        createDescription('分项金额（元）', formatSettlementAmount(getTaxIncludedAmount(item))),
        createDescription('备注', item.remark),
    ];

    if (isTraderCustomer.value) {
        return [
            ...leadingDescriptions,
            createDescription('水分（%）', item.moisture),
            createDescription('超出水分吨数', item.exceedMoisture),
            ...quantityDescriptions,
            createDescription('品位增减价（元）', item.gradeFloat),
            ...suffixDescriptions,
        ];
    }

    return [
        ...leadingDescriptions,
        createDescription('增减价', item.priceIncrease),
        createDescription('氧化镁含量≥4.5%', formatContentObject(item.contentMgoObject || item.contentMgo)),
        createDescription('氧化铁含量（≤0.8%）', formatContentObject(item.contentFeoObject || item.contentFeo)),
        createDescription('氧化铝含量（≤1%）', formatContentObject(item.contentAloObject || item.contentAlo)),
        createDescription('水分（%）', item.moisture),
        createDescription('超出水分吨位（吨）', item.exceedMoisture),
        createDescription('粒度≤30mm过筛率%', item.granularity),
        ...quantityDescriptions,
        ...suffixDescriptions,
    ];
};

/**
 * 同步已勾选结算明细到父组件。
 * @returns 无返回值
 */
const emitCheckedRows = () => {
    emit('settlement-rows-change', settlementRecord.value.filter((item) => item.__checked !== false));
};

/**
 * 全选或取消全选结算明细。
 * @param checked 是否全选
 * @returns 无返回值
 */
const toggleAllRows = (checked: boolean) => {
    settlementRecord.value.forEach((item) => {
        item.__checked = checked;
    });
    emitCheckedRows();
};

/**
 * 打开日期选择器并同步当前日期。
 * @returns 无返回值
 */
const openDatePicker = () => {
    receiptDueMinDate.value = getReceiptDueMinDate();
    const minDate = dayjs(receiptDueMinDate.value);
    const selectedDate = props.formData.shoulDate ? dayjs(props.formData.shoulDate) : minDate;
    const date = selectedDate.isValid() && !selectedDate.isBefore(dayjs().startOf('day'), 'day') ? selectedDate : minDate;
    currentDate.value = date.isValid()
        ? [date.format('YYYY'), date.format('MM'), date.format('DD')]
        : [minDate.format('YYYY'), minDate.format('MM'), minDate.format('DD')];
    showDatePicker.value = true;
};

/**
 * 确认回款到期日期。
 * @param value 日期选择结果
 * @returns 无返回值
 */
const onDateConfirm = (value: any) => {
    const dateArr = value?.selectedValues || currentDate.value;
    props.formData.shoulDate = `${dateArr[0]}-${dateArr[1]}-${dateArr[2]}`;
    showDatePicker.value = false;
};

/**
 * 加载执行中销售合同。
 * @returns 无返回值
 */
const loadContractList = async () => {
    try {
        const res: any = await getContractSalesListByStatus(CONTRACT_STATUS_EXECUTING);
        contractList.value = res?.data || [];
        syncContractDirector();
    } catch (error) {
        console.error('加载销售合同失败:', error);
    }
};

/**
 * 根据销售合同编号加载可结算明细。
 * @param contractCode 销售合同编号
 * @returns 无返回值
 */
const loadSettlementDetails = async (contractCode: string) => {
    try {
        const res: any = await getSettlementDetailListByContractCodeApi(contractCode);
        const detailList = getSettlementDetailResponseList(res);
        props.formData.tableList = detailList.map((item: any) => {
            const row = {
                ...item,
                __checked: props.isEdit ? hasValue(item.id) : true,
            };
            normalizeSettlementDetailRow(row, props.isEdit ? !hasValue(row.id) : true);
            return row;
        });
        emitCheckedRows();
    } catch (error) {
        props.formData.tableList = [];
        emitCheckedRows();
        console.error('加载可结算明细失败:', error);
    }
};

/**
 * 选择销售合同时回填合同字段并加载可结算明细。
 * @param selectedOptions 选择项
 * @returns 无返回值
 */
const onContractConfirm = async ({ selectedOptions }: any) => {
    const option = selectedOptions?.[0];
    const raw = option?.raw || {};
    props.formData.contractCode = option?.value || null;
    props.formData.customerId = raw.customerId;
    props.formData.applyUnit = raw.supplierUnit || '';
    props.formData.enterpriseName = raw.customerName || '';
    props.formData.customerType = raw.customerType || null;
    props.formData.contractDirectorId = raw.directorId || raw.director?.id || raw.director?.code || '';
    props.formData.contractDirectorName = raw.directorName || raw.director?.name || raw.director?.username || '';
    props.formData.contractDirectorLarkId =
        raw.directorLarkId || raw.director?.larkUserId || raw.director?.feishuUserId || '';
    props.formData.totalTaxAmount = 0;
    props.formData.settlementTotal = 0;
    props.formData.invoiceDetailList = [];
    showContractPicker.value = false;
    if (option?.value) {
        await loadSettlementDetails(option.value);
        return;
    }
    props.formData.tableList = [];
    props.formData.contractDirectorId = '';
    props.formData.contractDirectorName = '';
    props.formData.contractDirectorLarkId = '';
    emitCheckedRows();
};

watch(
    [() => props.formData.tableList, () => props.isEdit, () => props.yardOptions, () => props.formData.contractDirectorId],
    ([rows]) => {
        const currentRows = Array.isArray(rows) ? rows : [];
        currentRows.forEach((item) => {
            normalizeSettlementDetailRow(item, props.isEdit ? !hasValue(item.id) : true);
            if (item.__checked === undefined) item.__checked = props.isEdit ? hasValue(item.id) : true;
        });
        emitCheckedRows();
    },
    { immediate: true }
);

watch(
    () => props.formData.contractCode,
    () => syncContractDirector()
);

loadContractList();
</script>

<style scoped lang="less">
.edit-content {
    padding: 2px 0 8px;

    .form-card {
        padding: 4px 0px;
        background: #ffffff;
        border-radius: 10px;
        .form-card-title {
            font-size: 16px;
            font-weight: 500;
            color: var(--base-black);
            padding: 12px 12px 0;
        }
        :deep(.van-form) {
            border-radius: 12px;
        }
        :deep(.van-cell) {
            padding: 14px 12px;
        }
        :deep(.van-cell:after) {
            border-bottom: 1px solid #ededed;
        }
        :deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
        }
    }
}
.settlement-item {
    display: flex;
    align-items: flex-start;
    .checkbox {
        margin-right: 8px;
        margin-top: 2px;
    }
    .data-item {
        flex: 1;
        margin-bottom: 12px;
        :deep(.mx-descriptions-item) {
            margin-bottom: 8px;
        }
    }
}
.settlement-detail-popup {
    padding: 12px 12px 8px;
    max-height: 82vh;
    overflow-y: auto;

    .popup-title {
        font-size: 16px;
        font-weight: 500;
        color: #333333;
        text-align: center;
        padding: 8px 0 12px;
    }

    .content-group-title {
        padding: 12px 12px 4px;
        color: #333333;
        font-size: 15px;
        font-weight: 500;
        background: #ffffff;
    }

    .popup-footer {
        display: flex;
        gap: 12px;
        padding-top: 12px;
        background: #ffffff;
    }

    .popup-cancel,
    .popup-confirm {
        flex: 1;
        height: 40px;
        border-radius: 4px;
        border: 1px solid #2c65f2;
        background: #ffffff;
        color: #2c65f2;
        font-size: 16px;
    }

    .popup-confirm {
        background: #2c65f2;
        color: #ffffff;
    }
}
:deep(.van-cell) {
    &:last-child {
        padding-bottom: 0;
    }
}
:deep(.van-field__label) {
    font-size: 16px;
    color: var(--base-grey2);
}
:deep(.van-field__control),
:deep(.van-field__value),
:deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}
:deep(.van-field__word-limit),
:deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}
:deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}
</style>
