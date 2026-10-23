<template>
    <AppPage ref="appPageRef" :title="pageTitle" :showSearch="false" :showList="false">
        <template #content>
            <card title="基础信息">
                <Form ref="formRef" label-width="120px">
                    <Field
                        :model-value="formData.planTypeLabel"
                        name="planType"
                        label="发货类型"
                        placeholder="请选择"
                        required
                        readonly
                        :disabled="isEditMode"
                        :is-link="!isEditMode"
                        @click="handlePlanTypeClick" />
                    <MxCommSelect
                        v-if="isContractPlan"
                        v-model="formData.contractCodes"
                        v-model:label="formData.contractCodeLabels"
                        title="关联合同单号"
                        name="contractCodes"
                        :multiple="true"
                        :required="true"
                        :options="contractOptions"
                        :disabled="contractLoading"
                        :rules="[{ required: true, message: '请选择关联合同单号', trigger: 'onChange' }]"
                        :clearable="true"
                        :text="false"
                        @changeEvt="handleContractCodesChange" />
                </Form>
            </card>
            <card title="发货订单明细">
                <template #header>
                    <div class="detail-header">
                        <button class="detail-select-all" type="button" @click="toggleAllDetails">
                            <img
                                class="detail-select-all-icon"
                                :src="isAllDetailChecked ? checkedIcon : uncheckedIcon"
                                alt="" />
                            <span class="detail-select-all-title">发货计划明细</span>
                        </button>
                        <button v-if="isPrePlan" class="detail-add-button" type="button" @click="handleAddPreDetail">
                            新增
                        </button>
                    </div>
                </template>
                <div v-if="detailLoading" class="detail-loading">
                    <Loading size="24px">加载中...</Loading>
                </div>
                <template v-else>
                    <template v-for="(item, index) in planRecord" :key="item.id || item.frontId">
                        <dataItem
                            title="计划明细"
                            :index="index + 1"
                            :item="item"
                            showEdit
                            showCheck
                            v-model:checked="item.checked"
                            editBtnText="补充内容"
                            @edit="itemEdit(item, index)"
                            :actions="getDetailActions()"
                            @action="(action) => handleDetailAction(action, item)"
                            :descriptions="getPaymentRecordDescriptions(item)" />
                    </template>
                    <empty v-if="planRecord.length == 0" />
                </template>
            </card>
        </template>
        <!-- 底部提交按钮 -->
        <template #footer>
            <div class="bottom-btn-wrapper">
                <Button type="primary" block class="bottom-btn" :disabled="submitLoading || submitConfirming || detailLoading" @click="handleSubmit">提交</Button>
            </div>
        </template>
    </AppPage>
    <!-- 补充内容弹窗 -->
    <Popup
        v-model:show="showEditPopup"
        position="bottom"
        :style="{ height: '85%' }"
        round>
        <div class="edit-popup-header">
            <span class="edit-popup-cancel" @click="showEditPopup = false">取消</span>
            <span class="edit-popup-title">补充内容</span>
            <span class="edit-popup-confirm" @click="handleEditConfirm">确认</span>
        </div>
        <div class="edit-popup-content">
            <Form ref="editFormRef" class="edit-form">
                <Field
                    v-if="isPrePlan"
                    :model-value="editForm.companyname"
                    name="customerId"
                    label="企业名称"
                    placeholder="请选择"
                    required
                    readonly
                    is-link
                    :rules="[{ required: true, message: '请选择企业名称', trigger: 'onChange' }]"
                    @click="showCustomerSelect = true" />
                <MxCommSelect
                    v-if="isPrePlan"
                    v-model="editForm.customerId"
                    v-model:label="editForm.companyname"
                    v-model:show="showCustomerSelect"
                    typeName="企业客户"
                    :app-show-van-field="false"
                    :clearable="true"
                    :text="false"
                    @changeEvt="handlePreDetailCustomerChange" />
                <MxCommSelect
                    v-if="isPrePlan"
                    v-model="editForm.supplierUnit"
                    v-model:label="editForm.supplierUnitLabel"
                    name="supplierUnit"
                    title="供方单位"
                    :required="true"
                    :options="getDictOptions(DICT.SUPPLIER_UNIT)"
                    :rules="[{ required: true, message: '请选择供方单位', trigger: 'onChange' }]"
                    :clearable="true"
                    :text="false" />
                <Field
                    v-if="isPrePlan"
                    v-model="editForm.oreGgrade"
                    name="oreGgrade"
                    label="矿石品位（%）"
                    type="number"
                    placeholder="请输入"
                    required
                    :formatter="formatPreDetailNumberInput"
                    format-trigger="onChange"
                    :rules="[{ required: true, message: '请输入矿石品位（%）', trigger: 'onBlur' }]"
                    clearable
                    @blur="handlePreDetailNumberBlur('oreGgrade')" />
                <MxCommSelect
                    v-if="isPrePlan"
                    v-model="editForm.oreType"
                    v-model:label="editForm.oreTypeLabel"
                    name="oreType"
                    title="矿石种类"
                    :required="true"
                    :options="getDictOptions(DICT.ORE_TYPE)"
                    :rules="[{ required: true, message: '请选择矿石种类', trigger: 'onChange' }]"
                    :clearable="true"
                    :text="false" />
                <Field
                    v-if="isPrePlan"
                    v-model="editForm.contractQuantity"
                    name="contractQuantity"
                    label="合同数量（吨）"
                    type="number"
                    placeholder="请输入"
                    required
                    :formatter="formatPreDetailNumberInput"
                    format-trigger="onChange"
                    :rules="[{ required: true, message: '请输入合同数量（吨）', trigger: 'onBlur' }]"
                    clearable
                    @blur="handlePreDetailNumberBlur('contractQuantity')" />
                <Field
                    :model-value="formatDictField(DICT.PRIORITY, editForm.priority)"
                    name="priority"
                    label="优先级"
                    placeholder="请选择"
                    required
                    readonly
                    is-link
                    :rules="[{ required: true, message: '请选择优先级', trigger: 'onChange' }]"
                    @click="showPriorityPicker = true" />
                <Field
                    v-model="editForm.shipmentThreshold"
                    name="shipmentThreshold"
                    label="发货阈值（%）"
                    type="number"
                    placeholder="请输入"
                    required
                    :formatter="formatShipmentThresholdInput"
                    format-trigger="onChange"
                    :rules="[
                        { required: true, message: '请输入发货阈值（%）', trigger: 'onBlur' },
                        { validator: validateShipmentThreshold, trigger: 'onBlur' },
                    ]"
                    clearable
                    @blur="handleShipmentThresholdBlur" />
                <MxCommSelect
                    v-model="editForm.placeFelivery"
                    v-model:label="editForm.placeFeliveryLabel"
                    name="placeFelivery"
                    title="交货地点"
                    :required="true"
                    :options="yardOptions"
                    :rules="[{ required: true, message: '请选择交货地点', trigger: 'onChange' }]"
                    :clearable="true"
                    :text="false" />
                <Field
                    v-model="editForm.contactInformation"
                    name="contactInformation"
                    label="联系方式"
                    placeholder="请输入"
                    rows="5"
                    autosize
                    maxlength="500"
                    type="textarea"
                    show-word-limit
                    required
                    :rules="[{ required: true, message: '请输入联系方式', trigger: 'onBlur' }]"
                    clearable />
                <Field
                    :model-value="formatDictField(DICT.TRANSPORT_MODE, editForm.modeTransportation)"
                    name="modeTransportation"
                    label="运输方式"
                    placeholder="请选择"
                    required
                    readonly
                    is-link
                    :rules="[{ required: true, message: '请选择运输方式', trigger: 'onChange' }]"
                    @click="showTransportPicker = true" />
                <MxCommSelect
                    v-model="editForm.deliveryMethods"
                    v-model:label="editForm.deliveryMethodLabels"
                    name="deliveryMethods"
                    title="交割方式"
                    :multiple="true"
                    :required="true"
                    :options="getDictOptions(DICT.DELIVERY_METHOD)"
                    :rules="[{ required: true, message: '请选择交割方式', trigger: 'onChange' }]"
                    :clearable="true"
                    :text="false" />
                <Field
                    v-if="isPrePlan"
                    :model-value="editForm.deliveryDeadline"
                    name="deliveryDateRange"
                    label="交货期限"
                    placeholder="请选择"
                    required
                    readonly
                    is-link
                    :rules="[{ required: true, message: '请选择交货期限', trigger: 'onChange' }]"
                    @click="showDeliveryDeadlineCalendar = true" />
                <Field
                    v-model="editForm.remark"
                    name="remark"
                    label-align="top"
                    label="计划备注"
                    placeholder="请输入"
                    type="textarea"
                    maxlength="500"
                    autosize
                    show-word-limit
                    clearable />
            </Form>
        </div>
    </Popup>

    <Calendar
        v-model:show="showDeliveryDeadlineCalendar"
        type="range"
        switch-mode="year-month"
        allow-same-day
        :default-date="deliveryDeadlineDefaultDate"
        :min-date="deliveryDeadlineMinDate"
        :max-date="deliveryDeadlineMaxDate"
        @confirm="onDeliveryDeadlineConfirm" />

    <!-- 发货类型选择器 -->
    <Popup v-model:show="showPlanTypePicker" position="bottom">
        <Picker
            title="发货类型"
            :columns="planTypeColumns"
            @confirm="onPlanTypeConfirm"
            @cancel="showPlanTypePicker = false" />
    </Popup>

    <!-- 优先级选择器 -->
    <Popup v-model:show="showPriorityPicker" position="bottom">
        <Picker
            title="优先级"
            :columns="priorityColumns"
            @confirm="onPriorityConfirm"
            @cancel="showPriorityPicker = false" />
    </Popup>

    <!-- 运输方式选择器 -->
    <Popup v-model:show="showTransportPicker" position="bottom">
        <Picker
            title="运输方式"
            :columns="transportColumns"
            @confirm="onTransportConfirm"
            @cancel="showTransportPicker = false" />
    </Popup>

</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Form, Popup, Picker, Field, Button, Calendar, Loading, showConfirmDialog, showToast } from 'vant';

import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import card from '../card.vue';
import dataItem from '../data-item.vue';
import { useDictStore } from '@/store/commStore';
import checkedIcon from '@/assets/images/comm/icon_com_mchoice_sel@3x.png';
import uncheckedIcon from '@/assets/images/comm/icon_com_mchoice_nor@3x.png';
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
const detailData = ref<any>({});
const appPageRef = ref<any>(null);
const route = useRoute();
const router = useRouter();
const submitLoading = ref(false);
const submitConfirming = ref(false);
const { dictMap } = storeToRefs(useDictStore());
const yardOptions = ref<Array<{ label: string; value: string }>>([]);

const pageTitle = computed(() => (route.query.id ? '编辑发货订单' : '新增发货订单'));
const isEditMode = computed(() => Boolean(route.query.id));
// 发货订单明细使用的业务字典名称。
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
 * 将字典选项转换为 Vant Picker 可用列。
 * @param options 字典选项
 * @returns Picker 列数据
 */
const toPickerColumns = (options: any[]) =>
    options.map((item: any) => ({
        text: item.label || item.name || item.text || item.value,
        value: item.value ?? item.code ?? item.name ?? item.label ?? item.text,
    }));
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
 * 格式化移动端表单字典字段。
 * @param dictName 字典名称
 * @param value 字典值
 * @returns 表单展示文案，空值返回空字符串
 */
const formatDictField = (dictName: string, value: any) => {
    if (value === null || value === undefined || value === '') return '';
    return formatDict(dictName, value);
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
 * 将预发货数量格式化为固定两位小数文案。
 * @param value 预发货数量
 * @returns 固定两位小数文案
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
/**
 * 格式化 App 预发货明细数字输入，过滤非数字字符并最多保留两位小数。
 * @param value 输入值
 * @returns 格式化后的输入值
 */
const formatPreDetailNumberInput = (value: any) => {
    const valueText = String(value ?? '').replace(/[^\d.]/g, '');
    if (!valueText) return '';
    const hasDecimalPoint = valueText.includes('.');
    const parts = valueText.split('.');
    const integerText = parts[0] || String(PRE_DETAIL_NUMBER_MIN);
    const decimalText = parts.slice(1).join('').slice(0, PRE_DETAIL_NUMBER_PRECISION);
    return hasDecimalPoint ? `${integerText}.${decimalText}` : integerText;
};
/**
 * 将预发货明细数字格式化为固定两位小数文案。
 * @param value 数字值
 * @returns 固定两位小数文案，空值返回空字符串
 */
const formatPreDetailNumber = (value: any) => {
    const numberValue = normalizePreDetailNumber(value);
    return typeof numberValue === 'number' ? numberValue.toFixed(PRE_DETAIL_NUMBER_PRECISION) : '';
};
/**
 * 过滤发货阈值输入中的非数字字符。
 * @param value 发货阈值输入值
 * @returns 仅保留数字和一个小数点的输入值
 */
const formatShipmentThresholdInput = (value: any) => {
    const valueText = String(value ?? '').replace(/[^\d.]/g, '');
    if (!valueText) return '';
    const [integerText, ...decimalParts] = valueText.split('.');
    return decimalParts.length ? `${integerText || '0'}.${decimalParts.join('')}` : integerText;
};
/**
 * 校验发货阈值是否为空或超出允许范围。
 * @param value 发货阈值输入值
 * @returns 校验通过返回 true，否则返回错误文案
 */
const validateShipmentThreshold = (value: any) => {
    if (isEmptyValue(value)) return true;
    const threshold = Number(value);
    return Number.isFinite(threshold) && threshold >= SHIPMENT_THRESHOLD_MIN && threshold <= SHIPMENT_THRESHOLD_MAX
        ? true
        : '发货阈值必须在0-100之间';
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
 * 获取堆场编码对应的展示名称，映射不到时保留原值。
 * @param value 堆场编码或堆场名称
 * @returns 堆场名称
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
/**
 * 将交割方式多选值逐项转换为字典文案。
 * @param value 交割方式数组或逗号分隔字符串
 * @returns 使用顿号连接的交割方式文案
 */
const formatDeliveryMethods = (value: any) => {
    const values = normalizeDeliveryMethodValues(value);
    return values.map((item) => formatDict(DICT.DELIVERY_METHOD, item)).join('、') || '--';
};
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
const formData = reactive<any>({
    id: '',
    planType: DAILY_SHIPPING_PLAN_TYPE.CONTRACT,
    planTypeLabel: '合同发货',
    contractCodes: [],
    contractCodeLabels: [],
});
const planRecord = ref<any[]>([]);
const contractOptions = ref<any[]>([]);
const contractLoading = ref(false);
const detailLoading = ref(false);
const TEMP_DETAIL_ROW_PREFIX = 'TEMP_DAILY_SHIPPING_DETAIL';
let detailRequestSerial = 0;
const showEditPopup = ref(false);
const currentEditIndex = ref(-1);
const editForm = reactive<any>({
    customerId: '',
    companyname: '',
    subsidiaryId: null,
    subsidiaryName: '',
    supplierUnit: '',
    supplierUnitLabel: '',
    oreGgrade: '',
    oreType: '',
    oreTypeLabel: '',
    contractQuantity: '',
    preDeliveryQuantity: PRE_DELIVERY_QUANTITY_MIN,
    priority: '',
    shipmentThreshold: SHIPMENT_THRESHOLD_DEFAULT,
    plannedSshipmentQuantity: '',
    placeFelivery: '',
    placeFeliveryLabel: '',
    contactInformation: '',
    modeTransportation: '',
    deliveryMethods: [],
    deliveryMethodLabels: [],
    deliveryDateRange: null,
    deliveryDeadline: '',
    remark: '',
});
const editFormRef = ref<any>(null);
const showPlanTypePicker = ref(false);
const showPriorityPicker = ref(false);
const showTransportPicker = ref(false);
const showCustomerSelect = ref(false);
const showDeliveryDeadlineCalendar = ref(false);
const isAllDetailChecked = computed(() => planRecord.value.length > 0 && planRecord.value.every((item: any) => item.checked));
const isContractPlan = computed(() => formData.planType === DAILY_SHIPPING_PLAN_TYPE.CONTRACT);
const isPrePlan = computed(() => formData.planType === DAILY_SHIPPING_PLAN_TYPE.PRE);

const planTypeColumns = toPickerColumns(dailyShippingPlanTypeOptions);
const priorityColumns = computed(() => toPickerColumns(getDictOptions(DICT.PRIORITY)));
const transportColumns = computed(() => toPickerColumns(getDictOptions(DICT.TRANSPORT_MODE)));
const deliveryDeadlineDefaultDate = computed(() => {
    const range = editForm.deliveryDateRange as DeliveryDateRange;
    return range?.[0] && range?.[1] ? [dayjs(range[0]).toDate(), dayjs(range[1]).toDate()] : null;
});
const deliveryDeadlineMinDate = new Date(2000, 0, 1);
const deliveryDeadlineMaxDate = new Date(2100, 11, 31);

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
 * @param item 销售合同或发货明细
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
 * 切换全部发货订单明细的勾选状态。
 * @returns 无返回值
 */
const toggleAllDetails = () => {
    const nextChecked = !isAllDetailChecked.value;
    planRecord.value.forEach((item: any) => {
        item.checked = nextChecked;
    });
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
 * 获取合同编号对应的客户名称列表，用于 App 选择器回显。
 * @param contractCodes 当前选中的合同编号
 * @returns 与合同编号顺序一致的客户名称列表
 */
const getContractLabels = (contractCodes: string[]) =>
    contractCodes.map(
        (contractCode) =>
            contractOptions.value.find((item: any) => String(item.value) === contractCode)?.label || contractCode
    );
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
        showToast('销售合同加载失败，请稍后重试');
    } finally {
        contractLoading.value = false;
    }
};
/**
 * 加载启用的堆场，并转换为名称展示、编码提交的下拉选项。
 * @returns 无返回值，结果写入堆场下拉选项
 */
const loadYardOptions = async () => {
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
        showToast('堆场信息加载失败，请稍后重试');
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
 * @returns 候选明细与已保存明细合并后的卡片数据
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
        planRecord.value = (savedDetails || []).map((item: any) =>
            formatDetailItem(item, hasPersistedDetailId(item))
        );
        return;
    }
    detailLoading.value = true;
    try {
        const res = await getDailyShippingPlanDetailListByContractCodeApi(contractCodes);
        if (requestSerial !== detailRequestSerial) return;
        if (res?.code !== 200) {
            planRecord.value = (savedDetails || []).map((item: any) =>
                formatDetailItem(item, hasPersistedDetailId(item))
            );
            showToast('发货订单明细加载失败，请稍后重试');
            return;
        }
        const details = Array.isArray(res.data) ? res.data : [];
        const candidateDetails = details.map((item: any) => ({
            ...item,
            planType: DAILY_SHIPPING_PLAN_TYPE.CONTRACT,
            salesContractCode:
                item.salesContractCode || (contractCodes.length === 1 ? contractCodes[0] : ''),
        }));
        planRecord.value =
            savedDetails === null
                ? candidateDetails.map((item: any) => formatDetailItem(item, true, true))
                : mergeEditDetailList(candidateDetails, savedDetails);
    } catch {
        if (requestSerial === detailRequestSerial) {
            planRecord.value = (savedDetails || []).map((item: any) =>
                formatDetailItem(item, hasPersistedDetailId(item))
            );
            showToast('发货订单明细加载失败，请稍后重试');
        }
    } finally {
        if (requestSerial === detailRequestSerial) detailLoading.value = false;
    }
};
/**
 * 处理关联合同单号多选变化并重新获取发货订单明细。
 * @param options 选中的合同选项
 * @returns 异步加载结果
 */
const handleContractCodesChange = async (options: any) => {
    const selectedOptions = Array.isArray(options) ? options : options ? [options] : [];
    const optionCodes = selectedOptions.map((item: any) => item?.value);
    formData.contractCodes = normalizeContractCodes(
        optionCodes.length ? optionCodes : formData.contractCodes
    );
    formData.contractCodeLabels = selectedOptions.length
        ? selectedOptions.map((item: any) => item?.label || item?.value).filter(Boolean)
        : [];
    await loadContractDetailList(formData.contractCodes);
};
/**
 * 新增一条可手工补录的预发货明细。
 * @returns 无返回值
 */
const handleAddPreDetail = () => {
    planRecord.value.push(
        formatDetailItem(
            {
                planType: DAILY_SHIPPING_PLAN_TYPE.PRE,
                priority: getDefaultPriority(),
                shipmentThreshold: SHIPMENT_THRESHOLD_DEFAULT,
            },
            true,
            true
        )
    );
};
/**
 * 获取预发货明细操作按钮。
 * @returns 明细操作按钮配置
 */
const getDetailActions = () =>
    isPrePlan.value ? [{ action: 'delete', text: '删除' }] : [];
/**
 * 处理预发货明细操作。
 * @param action 操作按钮配置
 * @param item 当前明细
 * @returns 无返回值
 */
const handleDetailAction = (action: any, item: any) => {
    if (action?.action !== 'delete') return;
    planRecord.value = planRecord.value.filter(
        (row: any) => String(row.id || row.frontId) !== String(item.id || item.frontId)
    );
};
/**
 * 应用发货类型变化并清理另一类型的数据。
 * @param value 新的发货类型
 * @param label 新发货类型文案
 * @returns 无返回值
 */
const applyPlanTypeChange = (value: string, label: string) => {
    detailRequestSerial += 1;
    detailLoading.value = false;
    formData.planType = value;
    formData.planTypeLabel = label;
    formData.contractCodes = [];
    formData.contractCodeLabels = [];
    planRecord.value = [];
};
/**
 * 打开发货类型选择器，编辑状态下不允许修改发货类型。
 * @returns 无返回值
 */
const handlePlanTypeClick = () => {
    if (isEditMode.value) return;
    showPlanTypePicker.value = true;
};
/**
 * 确认发货类型选择，有明细时先确认是否清空。
 * @param selectedOptions Picker 选中项
 * @returns 异步处理结果
 */
const onPlanTypeConfirm = async ({ selectedOptions }: any) => {
    if (isEditMode.value) {
        showPlanTypePicker.value = false;
        return;
    }
    const option = selectedOptions?.[0];
    const value = String(option?.value || '');
    const label = String(option?.text || '');
    showPlanTypePicker.value = false;
    if (!value || value === formData.planType) return;
    if (planRecord.value.length) {
        try {
            await showConfirmDialog({
                title: '切换发货类型',
                message: '切换后将清空当前发货订单明细，是否继续？',
                confirmButtonText: '确认切换',
                cancelButtonText: '取消',
            });
        } catch {
            return;
        }
    }
    applyPlanTypeChange(value, label);
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
const getCheckedDetailList = () => (planRecord.value || []).filter((item: any) => item.checked);
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
 * 构建发货订单新增或编辑提交参数。
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
    if (!formData.planType) {
        showToast('请选择发货类型');
        return false;
    }
    if (isContractPlan.value && !normalizeContractCodes(formData.contractCodes).length) {
        showToast('请选择关联合同单号');
        return false;
    }
    const checkedDetails = getCheckedDetailList();
    if (!checkedDetails.length) {
        showToast('请至少勾选一条发货订单明细');
        return false;
    }
    const missingContractMessage = validateContractDetailSelection(checkedDetails);
    if (missingContractMessage) {
        showToast(missingContractMessage);
        return false;
    }
    const currentRequiredFields = getRequiredDetailFields();
    const invalidRow = checkedDetails.find((row: any) =>
        currentRequiredFields.some((field) => isDetailFieldEmpty(row, field.key))
    );
    if (invalidRow) {
        const invalidRowIndex = planRecord.value.findIndex((row: any) => row === invalidRow);
        const invalidField = currentRequiredFields.find((field) =>
            isDetailFieldEmpty(invalidRow, field.key)
        );
        showToast(`发货订单明细第${invalidRowIndex + 1}行的${invalidField?.label}必填`);
        return false;
    }
    const invalidThresholdRow = checkedDetails.find((row: any) => {
        const threshold = Number(row.shipmentThreshold);
        return !Number.isFinite(threshold) || threshold < SHIPMENT_THRESHOLD_MIN || threshold > SHIPMENT_THRESHOLD_MAX;
    });
    if (invalidThresholdRow) {
        const invalidRowIndex = planRecord.value.findIndex((row: any) => row === invalidThresholdRow);
        showToast(`发货订单明细第${invalidRowIndex + 1}行的发货阈值必须在0-100之间`);
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
            const invalidRowIndex = planRecord.value.findIndex((row: any) => row === invalidNumberRow);
            const invalidField = numberFields.find(
                (field) =>
                    !Number.isFinite(Number(invalidNumberRow[field.key])) ||
                    Number(invalidNumberRow[field.key]) < PRE_DETAIL_NUMBER_MIN
            );
            showToast(`发货订单明细第${invalidRowIndex + 1}行的${invalidField?.label}不能小于0`);
            return false;
        }
    }
    return true;
};
/**
 * 编辑发货订单时获取详情并回填表单。
 * @returns 无返回值
 */
const getDetaily = async () => {
    try {
        const res = await getDailyShippingPlanDetailApi(route.query.id, true);
        detailData.value = res.data || {};
        const detailList = Array.isArray(res.data?.details) ? res.data.details : [];
        formData.id = res.data?.id || '';
        formData.planType =
            res.data?.planType || detailList[0]?.planType || DAILY_SHIPPING_PLAN_TYPE.CONTRACT;
        formData.planTypeLabel =
            dailyShippingPlanTypeOptions.find((item) => item.value === formData.planType)?.label || formData.planType;
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
        formData.contractCodeLabels = getContractLabels(formData.contractCodes);
        if (isContractPlan.value) {
            await loadContractDetailList(formData.contractCodes, detailList);
        } else {
            planRecord.value = detailList.map((item: any) =>
                formatDetailItem(item, hasPersistedDetailId(item))
            );
        }
    } catch (error) {
        console.error('Failed to obtain details:', error);
    }
};

/**
 * 执行已经确认的发货订单提交请求。
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
        console.error('提交发货订单失败', error);
    } finally {
        submitLoading.value = false;
    }
};
/**
 * 校验并提交发货订单。
 * @returns 无返回值
 */
const handleSubmit = async () => {
    if (submitLoading.value || submitConfirming.value || detailLoading.value) return;
    try {
        const valid = await validateBeforeSubmit();
        if (!valid) return;
        submitConfirming.value = true;
        await showConfirmDialog({
            title: '提交确认',
            message: '提交后，所有发货明细将推送至物流系统，请确认！',
            confirmButtonText: '确认提交',
            cancelButtonText: '取消',
        });
        await executeSubmit();
    } catch (error) {
        // 用户取消确认时不提示错误，接口异常由提交函数统一处理。
        if (error !== 'cancel' && error !== 'close') {
            console.error('Failed to confirm daily shipping plan submission:', error);
        }
    } finally {
        submitConfirming.value = false;
    }
};
/**
 * 组装 App 明细卡片描述字段。
 * @param item 发货订单明细
 * @returns 描述组件需要的字段列表
 */
const getPaymentRecordDescriptions = (item) => {
    const descriptions = [
        { label: '优先级', value: formatDict(DICT.PRIORITY, item.priority) },
        { label: '发货阈值（%）', value: item.shipmentThreshold ?? '--' },
        { label: '供方单位', value: formatDict(DICT.SUPPLIER_UNIT, item.supplierUnit) },
        { label: '企业名称', value: item.companyname },
        ...(isPrePlan.value ? [] : [{ label: '子公司贸易商', value: item.subsidiaryName || '--' }]),
        { label: '联系方式', value: item.contactInformation },
        {
            label: '矿石品位（%）',
            value: isPrePlan.value ? formatPreDetailNumber(item.oreGgrade) || '--' : item.oreGgrade,
        },
        { label: '矿石种类', value: formatDict(DICT.ORE_TYPE, item.oreType) },
        { label: '交货地点', value: item.deliveryLocationName || getYardName(item.placeFelivery) || '--' },
        { label: '运输方式', value: formatDict(DICT.TRANSPORT_MODE, item.modeTransportation) },
        { label: '交割方式', value: formatDeliveryMethods(item.deliveryMethods) },
        { label: '交货期限', value: item.deliveryDeadline },
        { label: '计划备注', value: item.remark },
    ];
    if (isContractPlan.value) {
        descriptions.unshift(
            { label: '关联销售合同编号', value: item.salesContractNumber || '--' },
            { label: '合同数量（吨）', value: item.contractQuantity ?? '--' },
            { label: '预发货数量', value: formatPreDeliveryQuantity(item.preDeliveryQuantity) }
        );
    } else {
        descriptions.splice(7, 0, {
            label: '合同数量（吨）',
            value: formatPreDetailNumber(item.contractQuantity) || '--',
        });
    }
    return descriptions;
};
/**
 * 打开明细补充内容弹窗并回填当前行。
 * @param item 当前明细数据
 * @param index 当前明细索引
 * @returns 无返回值
 */
const itemEdit = (item: any, index: number) => {
    currentEditIndex.value = index;
    editForm.customerId = item.customerId || '';
    editForm.companyname = item.companyname || '';
    editForm.subsidiaryId = item.subsidiaryId ?? null;
    editForm.subsidiaryName = item.subsidiaryName || '';
    editForm.supplierUnit = item.supplierUnit || '';
    editForm.supplierUnitLabel = formatDictField(DICT.SUPPLIER_UNIT, item.supplierUnit);
    editForm.oreGgrade = isPrePlan.value ? formatPreDetailNumber(item.oreGgrade) : item.oreGgrade ?? '';
    editForm.oreType = item.oreType || '';
    editForm.oreTypeLabel = formatDictField(DICT.ORE_TYPE, item.oreType);
    editForm.contractQuantity = isPrePlan.value
        ? formatPreDetailNumber(item.contractQuantity)
        : item.contractQuantity ?? '';
    editForm.shipmentThreshold = item.shipmentThreshold;
    editForm.preDeliveryQuantity = formatPreDeliveryQuantity(item.preDeliveryQuantity);
    editForm.priority = item.priority || getDefaultPriority();
    editForm.placeFelivery = getYardCode(item.placeFelivery);
    editForm.placeFeliveryLabel = item.deliveryLocationName || getYardName(item.placeFelivery);
    editForm.contactInformation = item.contactInformation || '';
    editForm.modeTransportation = item.modeTransportation || '';
    editForm.deliveryMethods = normalizeDeliveryMethodValues(item.deliveryMethods);
    editForm.deliveryMethodLabels = editForm.deliveryMethods.map((value: DeliveryMethodValue) =>
        formatDict(DICT.DELIVERY_METHOD, value)
    );
    editForm.deliveryDateRange = getDeliveryDateRange(item);
    editForm.deliveryDeadline = editForm.deliveryDateRange?.join('至') || item.deliveryDeadline || '';
    editForm.remark = item.remark || '';
    showEditPopup.value = true;
};
/**
 * 确认补充内容并同步到当前明细。
 * @returns 无返回值
 */
const handleEditConfirm = async () => {
    try {
        await editFormRef.value?.validate?.();
    } catch {
        return;
    }
    if (currentEditIndex.value > -1 && planRecord.value[currentEditIndex.value]) {
        const target = planRecord.value[currentEditIndex.value];
        if (isPrePlan.value) target.customerId = editForm.customerId;
        target.companyname = editForm.companyname;
        target.customerName = editForm.companyname;
        target.subsidiaryId = editForm.subsidiaryId;
        target.subsidiaryName = editForm.subsidiaryName || '';
        target.supplierUnit = editForm.supplierUnit;
        target.oreGgrade = isPrePlan.value
            ? normalizePreDetailNumber(editForm.oreGgrade)
            : editForm.oreGgrade;
        target.oreType = editForm.oreType;
        target.contractQuantity = isPrePlan.value
            ? normalizePreDetailNumber(editForm.contractQuantity)
            : target.contractQuantity;
        target.priority = editForm.priority;
        target.shipmentThreshold = isEmptyValue(editForm.shipmentThreshold)
            ? editForm.shipmentThreshold
            : Number(editForm.shipmentThreshold);
        target.placeFelivery = editForm.placeFelivery;
        target.deliveryLocationName = editForm.placeFeliveryLabel || getYardName(editForm.placeFelivery);
        target.contactInformation = editForm.contactInformation;
        target.modeTransportation = editForm.modeTransportation;
        target.deliveryMethods = [...editForm.deliveryMethods];
        if (isPrePlan.value) {
            target.deliveryDateRange = editForm.deliveryDateRange;
            target.startDate = editForm.deliveryDateRange?.[0] || '';
            target.endDate = editForm.deliveryDateRange?.[1] || '';
            target.deliveryDeadline = editForm.deliveryDeadline;
        }
        target.remark = editForm.remark;
    }
    showEditPopup.value = false;
    showToast('补充成功');
};
/**
 * 预发货明细数字字段失焦时补齐两位小数，空值保持为空等待必填校验。
 * @param key 数字字段名
 * @returns 无返回值
 */
const handlePreDetailNumberBlur = (key: 'oreGgrade' | 'contractQuantity') => {
    editForm[key] = formatPreDetailNumber(editForm[key]);
};
/**
 * 统一发货阈值输入框失焦后的数据类型。
 * @returns 无返回值
 */
const handleShipmentThresholdBlur = () => {
    if (!isEmptyValue(editForm.shipmentThreshold)) editForm.shipmentThreshold = Number(editForm.shipmentThreshold);
};
/**
 * 将客户选择结果同步到预发货明细编辑表单。
 * @param customer 客户选择组件返回的客户
 * @returns 无返回值
 */
const handlePreDetailCustomerChange = (customer: any) => {
    const selectedCustomer = Array.isArray(customer) ? customer[0] : customer;
    editForm.customerId = selectedCustomer?.id || selectedCustomer?.value || '';
    editForm.companyname = selectedCustomer?.customerName || selectedCustomer?.label || '';
    editForm.subsidiaryId = selectedCustomer?.subsidiaryId ?? null;
    editForm.subsidiaryName = selectedCustomer?.subsidiaryName || '';
};
/**
 * 确认预发货明细交货期限。
 * @param dates Vant Calendar 返回的开始、结束日期
 * @returns 无返回值
 */
const onDeliveryDeadlineConfirm = (dates: Date[]) => {
    if (!Array.isArray(dates) || dates.length < 2) return;
    const startDate = dayjs(dates[0]).format('YYYY-MM-DD');
    const endDate = dayjs(dates[1]).format('YYYY-MM-DD');
    editForm.deliveryDateRange = [startDate, endDate];
    editForm.deliveryDeadline = `${startDate}至${endDate}`;
    showDeliveryDeadlineCalendar.value = false;
};
/**
 * 确认优先级选择。
 * @param selectedOptions Picker 选中项
 * @returns 无返回值
 */
const onPriorityConfirm = ({ selectedOptions }: any) => {
    editForm.priority = selectedOptions[0]?.value || '';
    showPriorityPicker.value = false;
};
/**
 * 确认运输方式选择。
 * @param selectedOptions Picker 选中项
 * @returns 无返回值
 */
const onTransportConfirm = ({ selectedOptions }: any) => {
    editForm.modeTransportation = selectedOptions[0]?.value || '';
    showTransportPicker.value = false;
};
/**
 * 初始化堆场、销售合同和新增或编辑页面数据。
 * @returns 无返回值
 */
const initializePage = async () => {
    try {
        await Promise.all([loadYardOptions(), loadContractOptions()]);
        if (route.query.id) {
            await getDetaily();
        }
    } catch (error) {
        console.error('Failed to initialize daily shipping plan page:', error);
    }
};
initializePage();
</script>

<style scoped lang="less">
.wrapper-white {
    background-color: var(--base-white);
}
.head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 12px 0px;
    .title {
        font-size: 16px;
        color: #333333;
        font-weight: 500;
        margin-bottom: 8px;
    }
    .status-tag {
        padding: 2px 8px;
        font-size: 12px;
        color: #67c23a;
        background: #e8f5e8;
        border-radius: 4px;
        line-height: 1.4;
        margin-right: 8px;
        font-weight: normal;
    }
}

:deep(.van-cell) {
    padding: 14px 0px;
}
:deep(.van-cell:after) {
    border-bottom: 1px solid #ededed;
}

:deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
        }

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
}
:deep(.card .head) {
    align-items: center;
}
.detail-select-all {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: flex-start;
    padding: 0;
    border: 0;
    background: transparent;
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
}
.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
}
.detail-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    color: var(--base-grey);
}
.detail-add-button {
    flex: none;
    padding: 0;
    border: 0;
    background: transparent;
    color: #2c65f2;
    font-size: 14px;
    line-height: 22px;
}
.detail-select-all-icon {
    display: block;
    width: 16px;
    height: 16px;
    flex: none;
}
.detail-select-all-title {
    line-height: 22px;
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

.edit-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #ededed;
    .edit-popup-cancel {
        font-size: 15px;
        color: #666;
    }
    .edit-popup-title {
        font-size: 16px;
        font-weight: 500;
        color: #333;
    }
    .edit-popup-confirm {
        font-size: 15px;
        color: #2c65f2;
    }
}
.edit-popup-content {
    height: calc(100% - 49px);
    padding: 8px 12px 24px;
    box-sizing: border-box;
    overflow-y: auto;
}
.edit-form {
    :deep(.van-cell) {
        padding: 11px 0;
    }
    :deep(.van-field__label) {
        font-size: 16px;
        color: var(--base-grey2);
    }
    :deep(.van-field__control) {
        color: var(--base-black);
        font-size: 16px;
        text-align: right;
    }
    :deep(.van-field__control--textarea) {
        text-align: left;
    }
}
:deep(.van-search) {
     .van-field__control {
        color: var(--base-black);
        font-size: 16px;
        text-align: left;
    }
}
</style>
