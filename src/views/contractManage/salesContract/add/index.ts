import { createContractSale, getContractFrameworkList, getContractSaleDetail, updateContractSale } from '@/api/contractManage';
import { getPreShipmentDetailListApi } from '@/api/dailyShippingPlan';
import { getYardPageApi } from '@/api';
import {
    getSalesPlanContractPricingDetail,
    getSalesPlanContractPricingList,
} from '@/api/salesPlan';
import { useDictStore } from '@/store/commStore';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { NDatePicker, NFormItem, NInput, NInputNumber, NSelect, useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';
import {
    SALES_CONTRACT_AMOUNT_PRECISION,
    SALES_CONTRACT_CODE_MAX_LENGTH,
    SALES_CONTRACT_CODE_PATTERN,
    SALES_CONTRACT_DATE_PICKER_FORMAT,
    SALES_CONTRACT_DATE_FORMAT,
    SALES_CONTRACT_DATE_TIME_FORMAT,
    SALES_CONTRACT_DETAIL_NUMBER_MAX,
    SALES_CONTRACT_DETAIL_TEXTAREA_MAX_LENGTH,
    SALES_CONTRACT_DICT,
    SALES_CONTRACT_DEFAULT_PAYMENT_METHOD_VALUES,
    SALES_CONTRACT_DEFAULT_PRICING_METHOD_VALUES,
    SALES_CONTRACT_DEFAULT_SUPPLIER_UNIT_VALUES,
    SALES_CONTRACT_FRAMEWORK_STATUS_EFFECTIVE,
    SALES_CONTRACT_FILE_ACCEPT,
    SALES_CONTRACT_FILE_SIZE_LIMIT,
    SALES_CONTRACT_FILE_UPLOAD_LIMIT,
    SALES_CONTRACT_MONTH_FORMAT,
    SALES_CONTRACT_MONTH_PICKER_FORMAT,
    SALES_CONTRACT_PRICING_STATUS_CONTRACTED,
    SALES_CONTRACT_QUANTITY_PRECISION,
    SALES_CONTRACT_STATUS_APPROVAL_GENERATING,
    SALES_CONTRACT_SHORT_TEXT_MAX_LENGTH,
    SALES_CONTRACT_STATUS_DRAFT,
    SALES_CONTRACT_TEXTAREA_MAX_LENGTH,
    SALES_CONTRACT_TRANSPORT_FALLBACK_OPTIONS,
} from '../commonTs/conmon';

type Nullable<T> = T | null;
type SaveType = 'save' | 'submit';
type DeliveryMethodValue = string | number;

// 合同多品位明细表中的一行数据。
// 页面允许用户修改合同数量、含税单价，所以这里额外保留 originalContractQuantity、
// originalTaxIncludedPrice 两个“带入时的原始值”。提交时会用当前值和原始值比较：
// 1. 如果有变化，要求填写变更说明；
// 2. 同时生成销售调整记录 salesAdjustRecordDTOS 给后端留痕。
interface DetailRow {
    id?: number | string;
    pricingItemId?: number | string;
    contractSalesId?: number | string;
    oreType: Nullable<string | number>;
    oreGrade: Nullable<number>;
    contractQuantity: Nullable<number>;
    originalContractQuantity: Nullable<number>;
    taxIncludedPrice: Nullable<number>;
    originalTaxIncludedPrice: Nullable<number>;
    subItemAmount: Nullable<number>;
    deliveryLocation: string;
    deliveryLocationName: string;
    deliveryMethods: DeliveryMethodValue[];
    deliveryDateRange: Nullable<[string, string]>;
    transportationMethods: Nullable<string | number>;
    qualityRequirements: string;
    changeDescription: string;
}

// 页面主表单数据。
// 这里既包含真正提交给接口的字段，也包含一些组件回显需要的辅助字段：
// selectedPricingData、selectedMonthlyPlanData 用于保存下拉选中的完整对象；
// directorSelectedPerson、initiatorSelectedPerson 用于人员组件回显；
// contractPricingDetailGradeDTOS 是下方可编辑的多品位明细表。
interface FormData {
    id: Nullable<number | string>;
    contractCode: string;
    deliveryDetailCodes: string[];
    pricingId: Nullable<number | string>;
    pricingCode: string;
    selectedPricingData: any;
    frameworkCode: string;
    shipmentMonth: Nullable<string>;
    monthlyPlanId: Nullable<number | string>;
    monthlyPlanCode: string;
    selectedMonthlyPlanData: any;
    paymentMethod: Nullable<string | number>;
    paymentTerms: string;
    contractName: string;
    totalAmount: Nullable<number>;
    pricingMethod: Nullable<string | number>;
    signDate: Nullable<string>;
    startDate: Nullable<string>;
    endDate: Nullable<string>;
    duration: Nullable<number>;
    supplierUnit: Nullable<string | number>;
    directorId: Nullable<string | number>;
    directorName: string;
    directorLarkId: string;
    directorSelectedPerson: any;
    contractInitiatorId: Nullable<string | number>;
    contractInitiatorName: string;
    contractInitiatorLarkId: string;
    initiatorSelectedPerson: any;
    deptId: Nullable<string | number>;
    deptName: string;
    contractDeptId: Nullable<string | number>;
    contractDeptName: string;
    customerId: Nullable<number | string>;
    customerName: string;
    subsidiaryId: Nullable<number | string>;
    subsidiaryName: string;
    oppositeDuration: string;
    oppositeTel: string;
    contractFileUrlObject: any[];
    fileUrlList: any[];
    associatedApprovalObjects: any[];
    remark: string;
    changeSummary: string;
    contractPricingDetailGradeDTOS: DetailRow[];
}

// 统一判断“没有值”的情况。
// 注意：0 是有效数字，比如合同数量、单价可能为 0，不能用 !value 判断，
// 否则会把 0 当成空值导致校验、计算或回显异常。
const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

// 将接口返回值转成 number。
// 后端有些数字字段可能返回字符串，比如 "12.5"；表格里的 n-input-number 需要 number/null。
// 如果传入的是空值或非法数字，统一返回 null，让页面表现为未填写。
const toNumberOrNull = (value: any) => {
    if (isEmptyValue(value)) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

// 将接口日期统一成日期组件 formatted-value 使用的字符串。
// 页面所有日期选择都直接存格式化字符串，不再在时间戳和字符串之间来回转换。
const formatDate = (value: any, pattern = SALES_CONTRACT_DATE_FORMAT) => {
    if (!value) return '';
    const date = dayjs(value);
    return date.isValid() ? date.format(pattern) : '';
};

// 将月份字段统一成 YYYY-MM。
// 发货月份使用 n-date-picker 的 formatted-value，页面上存的是字符串月份，而不是时间戳。
// 如果接口已经给了非日期字符串，也保留原字符串，避免强行格式化导致值丢失。
const formatMonth = (value: any) => {
    if (!value) return '';
    const date = dayjs(value);
    return date.isValid() ? date.format(SALES_CONTRACT_MONTH_FORMAT) : String(value);
};

// 计算明细行的分项金额。
// 业务单位是：合同数量（吨） * 含税单价（元/吨） = 元，再除以 10000 转成万元。
// 使用 Decimal 是为了避免 JS 浮点数精度问题，比如 0.1 + 0.2 这种误差。
const calculateSubAmount = (quantity: any, price: any) => {
    if (isEmptyValue(quantity) || isEmptyValue(price)) return null;
    try {
        return Number(new Decimal(String(quantity)).mul(new Decimal(String(price))).div(10000).toFixed(2));
    } catch {
        return null;
    }
};

// 判断数量或单价是否发生变化。
// 直接比较数字可能受浮点精度影响，所以统一转成 Decimal 并保留 6 位小数再比较。
// 这个结果会影响两个地方：是否要求填写“变更说明”、是否生成调整记录。
const isChangedNumber = (current: any, original: any) => {
    if (isEmptyValue(current) && isEmptyValue(original)) return false;
    return new Decimal(String(current || 0)).toFixed(6) !== new Decimal(String(original || 0)).toFixed(6);
};

export default () => {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
    const formRef = ref<any>(null);
    const submitLoading = ref(false);
    const pricingOptions = ref<any[]>([]);
    const frameworkOptions = ref<any[]>([]);
    const preShipmentOptions = ref<any[]>([]);
    const preShipmentLoading = ref(false);
    const yardOptions = ref<Array<{ label: string; value: string }>>([]);
    const yardLoading = ref(false);
    const userInfo = computed(() => useUserStore().userInfo);
    const editId = computed(() => route.query.id as string | undefined);
    const supplementId = computed(() => route.query.supplementId as string | undefined);
    const isEdit = computed(() => Boolean(editId.value));
    const pageTitle = computed(() => (isEdit.value ? '编辑销售合同' : '新增销售合同'));
    const associationDisabled = computed(() => isEdit.value);
    const { dictMap } = storeToRefs(useDictStore());

    const getDictEnum = computed(() => {
        return (name: string) => {
            if (dictMap.value) {
                return dictMap.value[name] || [];
            }
            return [];
        };
    });

    const oreTypeOptions = computed<any[]>(() => getDictEnum.value(SALES_CONTRACT_DICT.ORE_TYPE));
    const transportOptions = computed<any[]>(() => getDictEnum.value(SALES_CONTRACT_DICT.TRANSPORT_MODE));
    const deliveryMethodOptions = computed<any[]>(() => getDictEnum.value(SALES_CONTRACT_DICT.DELIVERY_METHOD));

    // 获取字典默认值。
    // 字典数据是异步从 store 里来的：页面刚创建时可能还没加载出来，所以这里允许先返回 null；
    // 后面 watch(dictMap) 会在字典加载完成后再次补默认值。
    // preferredValues 是业务指定的优先默认值，如果字典里找不到，就退回第一个字典项。
    const getDictDefault = (dictName: string, preferredValues: string[] = []) => {
        const options = getDictEnum.value(dictName);
        for (const value of preferredValues) {
            const matched = options.find((item: any) => item.value === value || item.label === value);
            if (matched) return matched.value;
        }
        return options[0]?.value || null;
    };

    const findDictOption = (options: any[], value: any) =>
        options.find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) => !isEmptyValue(optionValue) && String(optionValue) === String(value)
            )
        );

    const getOreTypeValue = (value: any) => {
        if (isEmptyValue(value)) return null;
        return findDictOption(oreTypeOptions.value, value)?.value ?? value;
    };

    const getTransportValue = (value: any) => {
        if (isEmptyValue(value)) return null;
        return findDictOption(transportOptions.value, value)?.value ?? value;
    };

    /**
     * 获取接口值对应的堆场编码，兼容关联数据暂时返回堆场名称的情况。
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
     * @returns 匹配到的堆场名称，未匹配时返回空字符串
     */
    const getYardName = (value: any) => {
        if (isEmptyValue(value)) return '';
        const text = String(value);
        const option = yardOptions.value.find((item) => item.value === text || item.label === text);
        return option?.label || '';
    };

    /**
     * 获取合同多品位明细的“矿石品位+交货地点”唯一键。
     * @param row 合同多品位明细行
     * @returns 标准化品位与堆场编码组成的唯一键，字段不完整时返回空字符串
     */
    const getDetailGradeDeliveryKey = (row: DetailRow) => {
        if (isEmptyValue(row.oreGrade) || isEmptyValue(row.deliveryLocation)) return '';
        const grade = Number(row.oreGrade);
        const yardCode = getYardCode(row.deliveryLocation);
        if (!Number.isFinite(grade) || !yardCode) return '';
        return JSON.stringify([grade, yardCode]);
    };

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
            .map((item) => findDictOption(deliveryMethodOptions.value, item)?.value ?? item);
    };

    /**
     * 将页面多选值转换成接口要求的逗号分隔字符串。
     * @param values 交割方式字典值数组
     * @returns 逗号分隔的交割方式
     */
    const serializeDeliveryMethods = (values: DeliveryMethodValue[]) => {
        return values.filter((item) => !isEmptyValue(item)).join(',');
    };

    const getTransportOptions = () => {
        if (transportOptions.value.length) return transportOptions.value;
        // 运输方式字典如果暂时没返回，先给两个兜底选项。
        // 这样用户不会因为字典接口慢或缺数据而完全无法编辑明细行。
        return SALES_CONTRACT_TRANSPORT_FALLBACK_OPTIONS;
    };

    const getPersonLarkId = (person: any) => {
        console.log(person, 'personid')
        return person?.larkUserId || person?.contractInitiatorLarkId || person?.feishuUserId || person?.larkId || '';
    };

    const createPersonOption = (id?: any, name?: any, larkUserId?: any) => {
        if (!id && !name) return null;
        return {
            value: id || '',
            label: name || '',
            larkUserId: larkUserId || '',
        };
    };

    /**
     * 判断后端是否返回了有效的人员名称。
     * @param value 后端返回的人员名称
     * @returns 是否存在非空人员名称
     */
    const hasPersonName = (value: any) =>
        value !== null && value !== undefined && String(value).trim().length > 0;

    /**
     * 解析编辑状态下的人员回显数据。
     * 有名称时完整使用详情返回的数据；没有名称时使用当前登录人信息兜底。
     * @param detail 销售合同详情
     * @param idKey 人员业务 ID 字段名
     * @param nameKey 人员名称字段名
     * @param larkIdKey 飞书 ID 字段名
     * @returns 人员表单字段及人员选择组件回显对象
     */
    const resolveEditPerson = (detail: any, idKey: string, nameKey: string, larkIdKey: string) => {
        const detailName = detail?.[nameKey];
        if (hasPersonName(detailName)) {
            return {
                id: detail?.[idKey] ?? '',
                name: detailName,
                larkId: detail?.[larkIdKey] ?? '',
                selectedPerson: createPersonOption(detail?.[idKey], detailName, detail?.[larkIdKey]),
            };
        }

        const currentUser = userInfo.value || {};
        const currentUserLarkId = getPersonLarkId(currentUser);
        return {
            id: currentUser.code || '',
            name: currentUser.username || '',
            larkId: currentUserLarkId,
            selectedPerson: createPersonOption(
                currentUser.code,
                currentUser.username,
                currentUserLarkId
            ),
        };
    };

    // 创建一份完整的表单默认值。
    // 新增页直接使用这份默认值；编辑页也会先创建默认值，再用详情接口覆盖。
    // 这样即使详情接口缺少某些字段，页面结构也完整，不容易出现 undefined 报错。
    const createFormData = (): FormData => {
        const defaultDept = userInfo.value?.userDeptList?.[0] || {};
        const userId = userInfo.value?.code || '';
        const username = userInfo.value?.username || '';
        const userLarkId = getPersonLarkId(userInfo.value);
        return {
            id: null,
            contractCode: '',
            deliveryDetailCodes: [],
            pricingId: null,
            pricingCode: null,
            selectedPricingData: null,
            frameworkCode: null,
            // 发货月份绑定的是 n-date-picker 的 formatted-value。
            // 这个组件的空态要用 null；如果给空字符串，Naive UI 内部会尝试格式化非法日期，
            // 进入新增页时就可能抛 RangeError: Invalid time value。
            shipmentMonth: null,
            monthlyPlanId: null,
            monthlyPlanCode: '',
            selectedMonthlyPlanData: null,
            paymentMethod: getDictDefault(SALES_CONTRACT_DICT.PAYMENT_METHOD, SALES_CONTRACT_DEFAULT_PAYMENT_METHOD_VALUES),
            paymentTerms: '',
            contractName: '',
            totalAmount: null,
            pricingMethod: getDictDefault(SALES_CONTRACT_DICT.PRICING_METHOD, SALES_CONTRACT_DEFAULT_PRICING_METHOD_VALUES),
            signDate: dayjs().format(SALES_CONTRACT_DATE_FORMAT),
            startDate: null,
            endDate: null,
            duration: null,
            supplierUnit: getDictDefault(SALES_CONTRACT_DICT.SUPPLIER_UNIT, SALES_CONTRACT_DEFAULT_SUPPLIER_UNIT_VALUES),
            directorId: userId,
            directorName: username,
            directorLarkId: userLarkId,
            directorSelectedPerson: createPersonOption(userId, username, userLarkId),
            contractInitiatorId: userId,
            contractInitiatorName: username,
            contractInitiatorLarkId: userLarkId,
            initiatorSelectedPerson: createPersonOption(userId, username, userLarkId),
            deptId: defaultDept.deptCode || '',
            deptName: defaultDept.deptName || '',
            contractDeptId: null,
            contractDeptName: '',
            customerId: null,
            customerName: '',
            subsidiaryId: null,
            subsidiaryName: '',
            oppositeDuration: '',
            oppositeTel: '',
            contractFileUrlObject: [],
            fileUrlList: [],
            associatedApprovalObjects: [],
            remark: '',
            changeSummary: '',
            contractPricingDetailGradeDTOS: [],
        };
    };

    const formData = ref<FormData>(createFormData());

    // 表单必填规则的公共生成器。
    // 大多数字段只需要 required + message；个别字段还需要声明类型。
    const requiredMessage = (messageText: string, type?: string) => ({
        required: true,
        message: messageText,
        trigger: ['blur', 'change'],
        ...(type ? { type } : {}),
    });

    const formRules = ref<any>({
        contractCode: [
            { ...requiredMessage('请输入合同编号'), saveOnly: true },
            {
                max: SALES_CONTRACT_CODE_MAX_LENGTH,
                message: `合同编号不能超过${SALES_CONTRACT_CODE_MAX_LENGTH}个字符`,
                trigger: ['blur', 'input'],
                saveOnly: true,
            },
            {
                pattern: SALES_CONTRACT_CODE_PATTERN,
                message: '合同编号只能包含英文字母、数字、短横线和括号',
                trigger: ['blur', 'input'],
                saveOnly: true,
            },
        ],
        pricingCode: [requiredMessage('请选择关联定价单')],
        shipmentMonth: [requiredMessage('请选择发货月份')],
        monthlyPlanCode: [requiredMessage('请选择关联月发货计划')],
        paymentMethod: [requiredMessage('请选择结算方式')],
        contractName: [
            { ...requiredMessage('请输入合同名称'), saveOnly: true },
            { max: SALES_CONTRACT_SHORT_TEXT_MAX_LENGTH, message: '合同名称不能超过50个字符', trigger: ['blur', 'input'] },
        ],
        totalAmount: [requiredMessage('请确认含税总金额', 'number')],
        pricingMethod: [requiredMessage('请选择计价方式')],
        signDate: [requiredMessage('请选择签订时间')],
        startDate: [requiredMessage('请选择开始时间')],
        endDate: [requiredMessage('请选择结束时间')],
        supplierUnit: [requiredMessage('请选择供方单位')],
        directorId: [requiredMessage('请选择我方负责人')],
        contractInitiatorId: [requiredMessage('请选择合同发起人')],
        deptId: [requiredMessage('请选择所属部门')],
        contractDeptId: [requiredMessage('请选择合同发起部门')],
        customerName: [requiredMessage('请选择关联定价单带出需方单位')],
        oppositeDuration: [requiredMessage('请输入对方负责人')],
        contractFileUrlObject: [
            { required: true, type: 'array', min: 1, message: '请上传合同初稿', trigger: ['change', 'blur'] },
        ],
    });

    // 附件提交给接口时序列化为字符串；详情回显直接使用后端返回的附件字段。
    const parseFileList = (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const serializeFileList = (value: any[]) => {
        const list = parseFileList(value);
        return list.length ? JSON.stringify(list) : '';
    };

    // 获取明细行默认交货期限。
    // 业务要求交货期限在发货月份内，所以默认给“发货月份第一天 ~ 发货月份最后一天”。
    // 返回的是字符串数组，因为明细表里的日期范围组件使用 formatted-value。
    const getDefaultDeliveryRange = (shipmentMonth = formData.value.shipmentMonth): Nullable<[string, string]> => {
        if (!shipmentMonth) return null;
        const month = dayjs(shipmentMonth);
        if (!month.isValid()) return null;
        return [month.startOf('month').format(SALES_CONTRACT_DATE_FORMAT), month.endOf('month').format(SALES_CONTRACT_DATE_FORMAT)];
    };

    // 根据定价单数据推导发货月份。
    // PRD 3.1.5.2 要求销售合同发货月份随定价单带入；
    // pricing-ById 返回的定价单主表中，当前字段为 planMonth。
    const getShipmentMonthByPricing = (pricing: any): Nullable<string> => {
        return pricing?.planMonth ? formatMonth(pricing.planMonth) : null;
    };

    // 刷新金额。
    // 先逐行计算 subItemAmount，再把所有行的分项金额累加为合同含税总金额 totalAmount。
    // 用户修改合同数量或含税单价后会调用这里，选择明细后也会调用这里。
    const refreshAmount = () => {
        formData.value.contractPricingDetailGradeDTOS.forEach((row) => {
            row.subItemAmount = calculateSubAmount(row.contractQuantity, row.taxIncludedPrice);
        });
        const total = formData.value.contractPricingDetailGradeDTOS.reduce(
            (sum, row) => sum.add(new Decimal(String(row.subItemAmount || 0))),
            new Decimal(0)
        );
        formData.value.totalAmount = Number(total.toFixed(2));
    };

    // 自动计算合同时长。
    // startDate、endDate 是 YYYY-MM-DD 字符串；两个日期都填写后计算包含首尾的自然日天数。
    // 如果结束日期早于开始日期，这里先置空，提交时再给出明确错误提示。
    const calculateDuration = () => {
        const start = formData.value.startDate;
        const end = formData.value.endDate;
        if (!start || !end) {
            formData.value.duration = null;
            return;
        }
        const diff = dayjs(end).diff(dayjs(start), 'day') + 1;
        formData.value.duration = diff > 0 ? diff : null;
    };

    // 将定价单详情中的 contractPricingList 转换成页面合同多品位明细。
    // PRD 3.1.5.2「合同多品位明细（表格录入）」要求自动带入定价单最终确认的明细。
    // 来源为 pricing-ById(/pricing/get/{id}) 返回的 contractPricingList，不再从其他字段兜底取值。
    // 这里把接口字段统一成 DetailRow，并把带入的数量、单价同时保存为 original 值，
    // 这样用户后续在页面修改后，提交时可以判断是否产生变更。
    const normalizeDetailFromPricing = (item: any): DetailRow => {
        const contractQuantity = toNumberOrNull(item.actualWeight);
        const taxIncludedPrice = toNumberOrNull(item.taxUnitPrice);
        const range = getDefaultDeliveryRange();
        return {
            pricingItemId: item.id,
            oreType: getOreTypeValue(item.oreType) || null,
            oreGrade: toNumberOrNull(item.grade),
            contractQuantity,
            originalContractQuantity: contractQuantity,
            taxIncludedPrice,
            originalTaxIncludedPrice: taxIncludedPrice,
            subItemAmount: toNumberOrNull(item.subAmount) ?? null,
            deliveryLocation: getYardCode(item.deliveryAddress),
            deliveryLocationName: item.deliveryLocationName || getYardName(item.deliveryAddress),
            deliveryMethods: normalizeDeliveryMethodValues(item.deliveryMethods),
            deliveryDateRange: range,
            transportationMethods: getTransportValue(item.transportMode),
            qualityRequirements: '',
            changeDescription: '',
            id: undefined,
            contractSalesId: undefined,
        };
    };

    // 将编辑详情里的 contractPricingDetailGradeDTOS 转换成页面合同多品位明细。
    // 编辑也按销售合同详情接口的确定字段回显，不走模糊字段兜底。
    const normalizeDetailFromContract = (item: any): DetailRow => {
        const quantity = toNumberOrNull(item.contractQuantity);
        const price = toNumberOrNull(item.taxIncludedPrice);
        const start = formatDate(item.startDate);
        const end = formatDate(item.endDate);
        return {
            ...item,
            id: item.id,
            contractSalesId: item.contractSalesId,
            oreType: getOreTypeValue(item.oreType),
            oreGrade: toNumberOrNull(item.oreGrade),
            contractQuantity: quantity,
            originalContractQuantity: toNumberOrNull(item.originalContractQuantity) ?? quantity,
            taxIncludedPrice: price,
            originalTaxIncludedPrice: toNumberOrNull(item.originalTaxIncludedPrice) ?? price,
            subItemAmount: toNumberOrNull(item.subItemAmount),
            deliveryLocation: getYardCode(item.deliveryLocation),
            deliveryLocationName: item.deliveryLocationName || getYardName(item.deliveryLocation),
            deliveryMethods: normalizeDeliveryMethodValues(item.deliveryMethods),
            deliveryDateRange: start && end ? [start, end] : getDefaultDeliveryRange(item.shipmentMonth),
            transportationMethods: getTransportValue(item.transportationMethods),
            qualityRequirements: item.qualityRequirements || '',
            changeDescription: item.changeDescription || '',
        };
    };

    // 确保关联定价单能在下拉框中回显。
    // 编辑页加载的可选定价单列表只查 CONTRACTED 状态，历史合同关联的定价单可能不在列表里；
    // 如果不手动补进去，n-select 只有 value 没有 option，页面上可能显示不出 label。
    const ensurePricingOption = (item: any) => {
        const pricingCode = item?.contractPricingCode;
        if (!pricingCode) return;
        if (pricingOptions.value.some((option) => String(option.value) === String(pricingCode))) return;
        pricingOptions.value.unshift({
            label: pricingCode,
            value: pricingCode,
            ...item,
        });
    };

    const getPricingId = (pricing: any) => pricing?.id;

    const getPricingCode = (pricing: any) => pricing?.contractPricingCode;

    const getPricingMonthlyCode = (pricing: any) => pricing?.monthlyCode;

    const getPricingDetailList = (pricing: any) => {
        const list = pricing?.contractPricingList;
        return Array.isArray(list) ? list : [];
    };

    // 选择定价单后回显主表基础信息。
    // 定价单 id/code 需要保留，用于提交和通过 pricing-ById 加载多品位明细。
    const fillBaseByPricing = (pricing: any) => {
        const pricingId = getPricingId(pricing);
        const pricingCode = getPricingCode(pricing);
        const monthlyCode = getPricingMonthlyCode(pricing);
        formData.value.selectedPricingData = pricing || null;
        formData.value.pricingId = pricingId || null;
        formData.value.pricingCode = pricingCode || '';
        formData.value.customerId = pricing?.customerId || null;
        formData.value.customerName = pricing?.customerName || '';
        formData.value.subsidiaryName = pricing?.subsidiaryName || '';
        formData.value.shipmentMonth = getShipmentMonthByPricing(pricing);
        formData.value.monthlyPlanCode = monthlyCode || '';
    };

    // 根据定价单 ID 加载多品位明细。
    // 明细来源为 pricing-ById(/pricing/get/{id})，不再通过月计划编号接口取数。
    const loadPricingDetailsById = async (pricing: any) => {
        const pricingId = getPricingId(pricing);
        if (!pricingId) {
            formData.value.contractPricingDetailGradeDTOS = [];
            refreshAmount();
            return;
        }
        const res = await getSalesPlanContractPricingDetail(pricingId);
        if (res.code !== 200 || !res.data) return;
        const pricingDetail = {
            ...pricing,
            ...res.data,
        };
        fillBaseByPricing(pricingDetail);
        formData.value.contractPricingDetailGradeDTOS = getPricingDetailList(pricingDetail).map((item: any) =>
            normalizeDetailFromPricing(item)
        );
        refreshAmount();
    };

    // 处理关联定价单变更。
    // 清空时：要把定价单带出的客户、发货月份、月计划、明细和金额一起清掉；
    // 选择时：先回显定价单基础信息，再通过定价单详情接口带入合同多品位明细。
    const handlePricingChange = async (pricing: any) => {
        if (!pricing) {
            formData.value.pricingId = null;
            formData.value.pricingCode = '';
            formData.value.selectedPricingData = null;
            formData.value.frameworkCode = '';
            formData.value.shipmentMonth = null;
            formData.value.monthlyPlanId = null;
            formData.value.monthlyPlanCode = '';
            formData.value.selectedMonthlyPlanData = null;
            formData.value.customerId = null;
            formData.value.customerName = '';
            formData.value.subsidiaryName = '';
            formData.value.contractPricingDetailGradeDTOS = [];
            preShipmentOptions.value = [];
            refreshAmount();
            return;
        }

        fillBaseByPricing(pricing);
        formData.value.contractPricingDetailGradeDTOS = [];
        refreshAmount();
        await loadPricingDetailsById(pricing);
        await loadPreShipmentOptions(formData.value.customerId);
    };

    // 我方负责人变更时同步飞书 ID。
    const handleDirectorChange = (person: any) => {
        console.log(person, '---000')
        const selected = Array.isArray(person) ? person[0] : person;
        formData.value.directorLarkId = getPersonLarkId(selected);
    };

    // 合同发起人变更时同步所属部门。
    // 人员组件返回的人可能是数组，也可能是单个对象，所以这里先统一取 selected。
    // 所属部门取该人员 userDeptList 的第一个部门。
    const handleInitiatorChange = (person: any) => {
        const selected = Array.isArray(person) ? person[0] : person;
        formData.value.contractInitiatorLarkId = getPersonLarkId(selected);
        const dept = selected?.userDeptList?.[0];
        if (dept) {
            formData.value.deptId = dept.deptCode || '';
            formData.value.deptName = dept.deptName || '';
        }
    };

    /**
     * 新增时同步当前登录人的默认信息，不覆盖用户已选择的字段。
     * @returns 无返回值
     */
    const syncUserDefaults = () => {
        if (isEdit.value || !userInfo.value) return;
        const defaultDept = userInfo.value?.userDeptList?.[0] || {};
        const userLarkId = getPersonLarkId(userInfo.value);
        if (!formData.value.directorId) {
            formData.value.directorId = userInfo.value.code || '';
            formData.value.directorName = userInfo.value.username || '';
            formData.value.directorLarkId = userLarkId;
            formData.value.directorSelectedPerson = createPersonOption(
                formData.value.directorId,
                formData.value.directorName,
                userLarkId
            );
        } else if (!formData.value.directorLarkId && String(formData.value.directorId) === String(userInfo.value.code || '')) {
            formData.value.directorLarkId = userLarkId;
        }
        if (!formData.value.contractInitiatorId) {
            formData.value.contractInitiatorId = userInfo.value.code || '';
            formData.value.contractInitiatorName = userInfo.value.username || '';
            formData.value.contractInitiatorLarkId = userLarkId;
            formData.value.initiatorSelectedPerson = createPersonOption(
                formData.value.contractInitiatorId,
                formData.value.contractInitiatorName,
                userLarkId
            );
        } else if (
            !formData.value.contractInitiatorLarkId &&
            String(formData.value.contractInitiatorId) === String(userInfo.value.code || '')
        ) {
            formData.value.contractInitiatorLarkId = userLarkId;
        }
        if (!formData.value.deptId) {
            formData.value.deptId = defaultDept.deptCode || '';
            formData.value.deptName = defaultDept.deptName || '';
        }
    };

    /**
     * 将后端逗号分隔的发货明细编码转换成多选组件数组。
     * @param value 发货明细编码字符串或数组
     * @returns 去重后的发货明细编码数组
     */
    const normalizeDeliveryDetailCodes = (value: any): string[] => {
        if (isEmptyValue(value)) return [];
        const values = Array.isArray(value) ? value : String(value).split(',');
        return Array.from(
            new Set(
                values
                    .map((item) => String(item ?? '').trim())
                    .filter(Boolean)
            )
        );
    };

    /**
     * 获取预发货明细对应的发货订单编码。
     * @param item 预发货明细
     * @returns 发货订单编码
     */
    const getDeliveryDetailCode = (item: any) => String(item?.deliveryOrderCode || '').trim();

    /**
     * 将预发货明细转换成多选下拉选项。
     * @param list 预发货明细列表
     * @returns 以发货订单编码作为值的下拉选项
     */
    const createPreShipmentOptions = (list: any[] = []) => {
        const codeSet = new Set<string>();
        return list.reduce((options: any[], item: any) => {
            const deliveryDetailCode = getDeliveryDetailCode(item);
            if (!deliveryDetailCode || codeSet.has(deliveryDetailCode)) return options;
            codeSet.add(deliveryDetailCode);
            options.push({
                ...item,
                label: deliveryDetailCode,
                value: deliveryDetailCode,
            });
            return options;
        }, []);
    };

    /**
     * 将详情已关联明细合并进预发货选项，保证编辑时已选项可以正常回显。
     * @param codes 详情中的已选发货明细编码
     * @param details 详情中的预发货明细集合
     * @returns void
     */
    const ensurePreShipmentOptions = (codes: string[], details: any[] = []) => {
        const optionMap = new Map<string, any>();
        [...preShipmentOptions.value, ...createPreShipmentOptions(details)].forEach((option: any) => {
            optionMap.set(String(option.value), option);
        });
        codes.forEach((code) => {
            if (!optionMap.has(code)) {
                optionMap.set(code, { label: code, value: code });
            }
        });
        preShipmentOptions.value = Array.from(optionMap.values());
    };

    /**
     * 获取当前已选择的完整预发货明细。
     * @returns 当前下拉选项中匹配到的预发货明细集合
     */
    const getSelectedDeliveryDetailDTOS = () => {
        const selectedCodes = normalizeDeliveryDetailCodes(formData.value.deliveryDetailCodes);
        const optionMap = new Map<string, any>();
        preShipmentOptions.value.forEach((option: any) => {
            optionMap.set(String(option.value), option);
        });
        return selectedCodes
            .map((code) => optionMap.get(code))
            .filter(Boolean)
            .map((item) => {
                const detail: any = {};
                Object.keys(item).forEach((key) => {
                    if (key !== 'label' && key !== 'value') {
                        detail[key] = item[key];
                    }
                });
                return detail;
            })
            .filter((detail) => Object.keys(detail).length);
    };

    /**
     * 加载所有可以关联销售合同的预发货明细。
     * @param customerId 客户 ID
     * @param selectedDeliveryDetailCodes 当前已选的发货订单编码
     * @param selectedDeliveryDetailDTOS 当前已选发货明细的完整数据
     * @returns 异步加载结果
     */
    const loadPreShipmentOptions = async (
        customerId?: string | number | null,
        selectedDeliveryDetailCodes: string[] = [],
        selectedDeliveryDetailDTOS: any[] = []
    ) => {
        preShipmentLoading.value = true;
        try {
            if (isEmptyValue(customerId)) {
                preShipmentOptions.value = [];
                if (selectedDeliveryDetailCodes.length) {
                    ensurePreShipmentOptions(selectedDeliveryDetailCodes, selectedDeliveryDetailDTOS);
                }
                return;
            }
            const res = await getPreShipmentDetailListApi(customerId);
            if (res.code !== 200) {
                preShipmentOptions.value = [];
                return;
            }
            preShipmentOptions.value = createPreShipmentOptions(Array.isArray(res.data) ? res.data : []);
            if (selectedDeliveryDetailCodes.length) {
                ensurePreShipmentOptions(selectedDeliveryDetailCodes, selectedDeliveryDetailDTOS);
            }
        } catch {
            preShipmentOptions.value = [];
            message.error('预发货明细加载失败，请稍后重试');
        } finally {
            preShipmentLoading.value = false;
        }
    };

    // 加载可关联的定价单列表。
    // 这里按 CONTRACTED 状态过滤，表示只展示已经可以生成销售合同的定价单。
    const loadPricingOptions = async () => {
        const res = await getSalesPlanContractPricingList({ status: SALES_CONTRACT_PRICING_STATUS_CONTRACTED });
        if (res.code !== 200) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.records || [];
        pricingOptions.value = list
            .filter((item: any) => item.contractPricingCode)
            .map((item: any) => ({
                label: item.contractPricingCode,
                value: item.contractPricingCode,
                ...item,
            }));
    };

    // 加载生效中的框架合同，供“关联框架合同编号”下拉选择。
    const loadFrameworkOptions = async () => {
        const res = await getContractFrameworkList({ status: SALES_CONTRACT_FRAMEWORK_STATUS_EFFECTIVE });
        if (res.code !== 200) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.records || [];
        frameworkOptions.value = list.map((item: any) => {
            return {
                label: item.contractName,
                value: item.contractCode,
                ...item,
            };
        });
    };

    /**
     * 加载启用的堆场，并转换为名称展示、编码提交的下拉选项。
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

    const clearSupplementIdentity = (data: FormData) => ({
        ...data,
        id: null,
        contractCode: '',
        deliveryDetailCodes: [],
        contractPricingDetailGradeDTOS: data.contractPricingDetailGradeDTOS.map((item) => ({
            ...item,
            id: undefined,
            contractSalesId: undefined,
        })),
    });

    // 加载编辑详情或补充合同原合同详情并回显到页面。
    // 编辑页通过 id 进入，补充合同通过 supplementId 进入。
    // 补充合同只复用业务字段，主表 id/contractCode 和明细关联 id 会清掉，提交时按新增处理。
    const getDetail = async () => {
        const detailId = editId.value || supplementId.value;
        if (!detailId) return;
        const res = await getContractSaleDetail(detailId);
        if (res.code !== 200 || !res.data) return;
        const detail = res.data;
        ensurePricingOption({
            ...detail,
            id: detail.pricingId,
            contractPricingCode: detail.pricingCode,
            planMonth: detail.shipmentMonth,
        });
        const deliveryDetailDTOS = Array.isArray(detail.deliveryDetailDTOS) ? detail.deliveryDetailDTOS : [];
        const deliveryDetailCodes = normalizeDeliveryDetailCodes(detail.deliveryDetailCodes);
        const selectedDeliveryDetailCodes = deliveryDetailCodes.length
            ? deliveryDetailCodes
            : normalizeDeliveryDetailCodes(deliveryDetailDTOS.map((item: any) => getDeliveryDetailCode(item)));
        const directorPerson = isEdit.value
            ? resolveEditPerson(detail, 'directorId', 'directorName', 'directorLarkId')
            : null;
        const initiatorPerson = isEdit.value
            ? resolveEditPerson(detail, 'contractInitiatorId', 'contractInitiatorName', 'contractInitiatorLarkId')
            : null;
        const nextFormData: FormData = {
            ...createFormData(),
            ...detail,
            id: isEdit.value ? detail.id || editId.value : null,
            contractCode: detail.contractCode || '',
            deliveryDetailCodes: isEdit.value ? selectedDeliveryDetailCodes : [],
            pricingId: detail.pricingId || null,
            pricingCode: detail.pricingCode || '',
            subsidiaryId: detail.subsidiaryId ?? null,
            subsidiaryName: detail.subsidiaryName || '',
            selectedPricingData: detail.pricingCode
                ? {
                      ...detail,
                      value: detail.pricingCode,
                      label: detail.pricingCode,
                      id: detail.pricingId,
                      contractPricingCode: detail.pricingCode,
                      planMonth: detail.shipmentMonth,
                  }
                : null,
            shipmentMonth: detail.shipmentMonth ? formatMonth(detail.shipmentMonth) : null,
            monthlyPlanId: detail.monthlyPlanId || null,
            monthlyPlanCode: detail.monthlyPlanCode || '',
            selectedMonthlyPlanData: detail.monthlyPlanCode
                ? {
                      value: detail.monthlyPlanCode,
                      label: detail.monthlyPlanCode,
                      ...detail,
                  }
                : null,
            signDate: detail.signDate ? formatDate(detail.signDate) : null,
            startDate: detail.startDate ? formatDate(detail.startDate) : null,
            endDate: detail.endDate ? formatDate(detail.endDate) : null,
            totalAmount: toNumberOrNull(detail.totalAmount),
            duration: toNumberOrNull(detail.duration),
            ...(isEdit.value
                ? {
                      directorId: directorPerson?.id,
                      directorName: directorPerson?.name,
                      directorLarkId: directorPerson?.larkId,
                      directorSelectedPerson: directorPerson?.selectedPerson,
                      contractInitiatorId: initiatorPerson?.id,
                      contractInitiatorName: initiatorPerson?.name,
                      contractInitiatorLarkId: initiatorPerson?.larkId,
                      initiatorSelectedPerson: initiatorPerson?.selectedPerson,
                  }
                : {
                      directorLarkId: detail.directorLarkId || '',
                      directorSelectedPerson: createPersonOption(
                          detail.directorId,
                          detail.directorName,
                          detail.directorLarkId
                      ),
                      contractInitiatorLarkId: detail.contractInitiatorLarkId || '',
                      initiatorSelectedPerson: createPersonOption(
                          detail.contractInitiatorId,
                          detail.contractInitiatorName,
                          detail.contractInitiatorLarkId
                      ),
                  }),
            contractFileUrlObject: detail.contractFileUrlObject || detail.contractFileUrl || [],
            fileUrlList: detail.fileUrlList || detail.fileUrl || [],
            associatedApprovalObjects: Array.isArray(detail.associatedApprovalObjects) ? detail.associatedApprovalObjects : [],
            contractPricingDetailGradeDTOS: Array.isArray(detail.contractPricingDetailGradeDTOS)
                ? detail.contractPricingDetailGradeDTOS.map((item: any) => normalizeDetailFromContract(item))
                : [],
        };
        formData.value = supplementId.value && !isEdit.value ? clearSupplementIdentity(nextFormData) : nextFormData;
        refreshAmount();
        calculateDuration();
        if (isEdit.value) {
            await loadPreShipmentOptions(formData.value.customerId, selectedDeliveryDetailCodes, deliveryDetailDTOS);
            await loadEditApprovalLogs(detail.approvalId);
        }
    };

    // 提交前校验多品位明细表整体状态。
    // 字段必填、交货期限范围、变更说明条件必填已下沉到表格行内 NFormItem 规则里。
    const validateDetails = () => {
        const list = formData.value.contractPricingDetailGradeDTOS;
        if (!list.length) return '请先选择关联定价单并带入合同多品位明细';

        const gradeDeliveryIndexMap = new Map<string, number>();
        for (let index = 0; index < list.length; index += 1) {
            const uniqueKey = getDetailGradeDeliveryKey(list[index]);
            if (!uniqueKey) continue;
            const duplicateIndex = gradeDeliveryIndexMap.get(uniqueKey);
            if (duplicateIndex !== undefined) {
                return `合同多品位明细第${index + 1}行的矿石品位(%)和交货地点与第${
                    duplicateIndex + 1
                }行重复`;
            }
            gradeDeliveryIndexMap.set(uniqueKey, index);
        }
        return '';
    };

    // 生成销售调整记录。
    // 用户如果修改了合同数量或含税单价，就把变更前后的值记录下来；
    // 后端可以据此保存调整历史。没有变化的字段不会生成记录。
    const buildAdjustRecords = () => {
        const records: any[] = [];
        formData.value.contractPricingDetailGradeDTOS.forEach((row) => {
            const common = {
                contractPricingCode: formData.value.pricingCode,
                contractCode: formData.value.contractCode || '',
                grade: row.oreGrade ?? 0,
                adjustTime: dayjs().format(SALES_CONTRACT_DATE_TIME_FORMAT),
                adjustPerson: userInfo.value?.username || formData.value.contractInitiatorName || '',
                adjustReason: row.changeDescription,
            };
            if (isChangedNumber(row.contractQuantity, row.originalContractQuantity)) {
                records.push({
                    ...common,
                    adjustField: '合同数量',
                    originalValue: String(row.originalContractQuantity ?? ''),
                    newValue: String(row.contractQuantity ?? ''),
                });
            }
            if (isChangedNumber(row.taxIncludedPrice, row.originalTaxIncludedPrice)) {
                records.push({
                    ...common,
                    adjustField: '含税单价',
                    originalValue: String(row.originalTaxIncludedPrice ?? ''),
                    newValue: String(row.taxIncludedPrice ?? ''),
                });
            }
        });
        return records;
    };

    const formatChangeValue = (value: any) => (isEmptyValue(value) ? '' : String(value));

    // 生成变更摘要。
    // 摘要按明细行合并展示，同一品位同时变更数量和单价时只生成一段文本。
    const buildChangeSummary = () => {
        const summaries: string[] = [];
        formData.value.contractPricingDetailGradeDTOS.forEach((row) => {
            const changes = [`品位：${formatChangeValue(row.oreGrade)}%`];
            if (isChangedNumber(row.contractQuantity, row.originalContractQuantity)) {
                changes.push(
                    `数量：${formatChangeValue(row.originalContractQuantity)}吨->${formatChangeValue(
                        row.contractQuantity
                    )}吨`
                );
            }
            if (isChangedNumber(row.taxIncludedPrice, row.originalTaxIncludedPrice)) {
                changes.push(
                    `单价：${formatChangeValue(row.originalTaxIncludedPrice)}元/吨->${formatChangeValue(
                        row.taxIncludedPrice
                    )}元/吨`
                );
            }
            if (changes.length > 1) {
                summaries.push(changes.join('；'));
            }
        });
        return summaries.join('，');
    };

    // 组装新增/编辑接口入参。
    // 这里会做几件事：
    // 1. 重新计算金额，保证提交的是最新金额；
    // 2. 生成调整记录和变更摘要；
    // 3. 把页面组件用的数据格式转换成接口需要的数据格式；
    // 4. 新增时按 /contractSales/create 文档只提交必要字段，编辑时保留完整字段。
    const buildPayload = (status: string) => {
        refreshAmount();
        const adjustRecords = buildAdjustRecords();
        const newChangeSummary = buildChangeSummary();
        const changeSummary = isEdit.value && !newChangeSummary ? formData.value.changeSummary || '' : newChangeSummary;
        formData.value.changeSummary = changeSummary;
        const data = formData.value;
        const isUpdate = isEdit.value || Boolean(data.id);
        const detailList = data.contractPricingDetailGradeDTOS.map((item) => ({
            ...(isUpdate
                ? {
                      id: item.id,
                      contractSalesId: item.contractSalesId,
                  }
                : {}),
            oreType: getOreTypeValue(item.oreType),
            oreGrade: item.oreGrade,
            contractQuantity: item.contractQuantity,
            taxIncludedPrice: item.taxIncludedPrice,
            subItemAmount: item.subItemAmount,
            deliveryLocation: getYardCode(item.deliveryLocation),
            deliveryLocationName: item.deliveryLocationName || getYardName(item.deliveryLocation),
            deliveryMethods: serializeDeliveryMethods(item.deliveryMethods),
            startDate: item.deliveryDateRange?.[0] || '',
            endDate: item.deliveryDateRange?.[1] || '',
            transportationMethods: getTransportValue(item.transportationMethods),
            qualityRequirements: item.qualityRequirements,
            changeDescription: item.changeDescription,
        }));
        const payload: any = {
            contractCode: data.contractCode,
            deliveryDetailCodes: normalizeDeliveryDetailCodes(data.deliveryDetailCodes).join(','),
            deliveryDetailDTOS: getSelectedDeliveryDetailDTOS(),
            customerId: data.customerId ? Number(data.customerId) : null,
            customerName: data.customerName,
            subsidiaryId: data.subsidiaryId,
            subsidiaryName: data.subsidiaryName || '',
            pricingCode: data.pricingCode,
            shipmentMonth: data.shipmentMonth || '',
            totalAmount: data.totalAmount,
            status,
            paymentMethod: data.paymentMethod,
            frameworkCode: data.frameworkCode,
            monthlyPlanCode: data.monthlyPlanCode,
            remark: data.remark,
            signDate: data.signDate || '',
            paymentTerms: data.paymentTerms,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            duration: data.duration,
            pricingMethod: data.pricingMethod,
            contractName: data.contractName,
            supplierUnit: data.supplierUnit,
            directorId: data.directorId ? String(data.directorId) : '',
            directorName: data.directorName,
            directorLarkId: data.directorLarkId,
            contractInitiatorId: data.contractInitiatorId ? String(data.contractInitiatorId) : '',
            contractInitiatorName: data.contractInitiatorName,
            contractInitiatorLarkId: data.contractInitiatorLarkId,
            deptId: data.deptId ? String(data.deptId) : '',
            deptName: data.deptName,
            contractDeptId: data.contractDeptId ? String(data.contractDeptId) : '',
            contractDeptName: data.contractDeptName,
            oppositeDuration: data.oppositeDuration,
            oppositeTel: data.oppositeTel,
            changeSummary,
            contractPricingDetailGradeDTOS: detailList,
            salesAdjustRecordDTOS: adjustRecords,
            contractFileUrl: serializeFileList(data.contractFileUrlObject),
            contractFileUrlObject: data.contractFileUrlObject,
            fileUrl: serializeFileList(data.fileUrlList),
            fileUrlList: data.fileUrlList,
            associatedApprovalObjects: data.associatedApprovalObjects || [],
        };
        if (isUpdate) {
            payload.id = Number(data.id || editId.value);
        }
        return payload;
    };

    // 保存合同。
    // “保存”和“提交”走同一个接口组装逻辑，只是状态不同：
    // 保存为草稿 SALES_CONTRACT_STATUS_DRAFT，提交为审批生成中 SALES_CONTRACT_STATUS_APPROVAL_GENERATING。
    // 新增保存成功后，如果后端返回 id，需要回填到 formData，避免再次保存时重复新增。
    const saveContract = async (type: SaveType) => {
        const status = type === 'submit' ? SALES_CONTRACT_STATUS_APPROVAL_GENERATING : SALES_CONTRACT_STATUS_DRAFT;
        const payload = buildPayload(status);
        const res = isEdit.value || payload.id ? await updateContractSale(payload) : await createContractSale(payload);
        if (res.code === 200 && res.data && !formData.value.id) {
            formData.value.id = res.data;
        }
        return res;
    };

    // 顶部“保存/提交”按钮入口。
    // 保存校验合同编号和合同名称；提交执行完整表单、明细和日期校验。
    const confirmEvt = (type: SaveType) => {
        formRef.value?.validate(async (errors: any) => {
            if (errors) {
                message.error(errors[0]?.[0]?.message || '请完善必填项');
                return;
            }
            if (type === 'submit') {
                const detailError = validateDetails();
                if (detailError) {
                    message.error(detailError);
                    return;
                }
                if (
                    formData.value.startDate &&
                    formData.value.endDate &&
                    dayjs(formData.value.startDate).isAfter(dayjs(formData.value.endDate), 'day')
                ) {
                    message.error('开始时间不能大于结束时间');
                    return;
                }
            }
            if (submitLoading.value) return;
            submitLoading.value = true;
            try {
                const res = await saveContract(type);
                if (res.code !== 200) return;
                router.back();
            } finally {
                submitLoading.value = false;
            }
        }, type === 'save' ? (rule: any) => rule.saveOnly === true : undefined);
    };

    const renderRequiredTitle = (title: string) =>
        h('span', { class: 'sales-contract-required-title' }, [
            h('span', { class: 'sales-contract-required-mark' }, '*'),
            title,
        ]);

    const createDetailRule = (row: DetailRow, index: number, key: keyof DetailRow, messageText: string) => ({
        trigger: ['blur', 'change', 'input'],
        validator: () => {
            if (key === 'deliveryDateRange') {
                if (!row.deliveryDateRange?.[0] || !row.deliveryDateRange?.[1]) return new Error(messageText);
                const monthStart = formData.value.shipmentMonth ? dayjs(formData.value.shipmentMonth).startOf('month') : null;
                const monthEnd = formData.value.shipmentMonth ? dayjs(formData.value.shipmentMonth).endOf('month') : null;
                if (monthStart && monthEnd) {
                    const start = dayjs(row.deliveryDateRange[0]);
                    const end = dayjs(row.deliveryDateRange[1]);
                    if (start.isBefore(monthStart, 'day') || end.isAfter(monthEnd, 'day')) {
                        return new Error(`第${index + 1}行交货期限需在发货月份内`);
                    }
                }
                return true;
            }
            if (key === 'changeDescription') {
                const needChangeDescription =
                    isChangedNumber(row.contractQuantity, row.originalContractQuantity) ||
                    isChangedNumber(row.taxIncludedPrice, row.originalTaxIncludedPrice);
                if (needChangeDescription && isEmptyValue(row.changeDescription)) return new Error(messageText);
                return true;
            }
            if (isEmptyValue(row[key]) || (Array.isArray(row[key]) && !row[key].length)) return new Error(messageText);
            return true;
        },
    });

    // 渲染明细表单元格里的表单项。
    // 表格每一行都是 contractPricingDetailGradeDTOS 数组的一项，
    // path 保留具体行字段，方便表单状态和动态行稳定关联。
    const renderFormItem = (row: DetailRow, index: number, key: keyof DetailRow, messageText: string, children: any) =>
        h(
            NFormItem,
            {
                path: `contractPricingDetailGradeDTOS[${index}].${String(key)}`,
                rule: createDetailRule(row, index, key, messageText),
                showLabel: false,
                style: { width: '100%', marginBottom: 0 },
            },
            children
        );

    const TEXTAREA_DETAIL_FIELDS: Array<keyof DetailRow> = [
        'deliveryMethods',
        'qualityRequirements',
        'changeDescription',
    ];

    const isTextareaDetailField = (key: keyof DetailRow) => TEXTAREA_DETAIL_FIELDS.includes(key);

    const editableCellColumn = {
        ellipsis: false,
        className: 'sales-contract-detail-edit-cell',
    };

    // 渲染明细表文本输入框。
    // 长文本字段使用 textarea，其余字段使用普通 input。
    // 输入变化后直接写回当前行对象，表格数据和表单数据是同一份引用。
    const renderInput = (row: DetailRow, index: number, key: keyof DetailRow, messageText: string, placeholder = '请输入') =>
        renderFormItem(row, index, key, messageText, () =>
            h(
                'div',
                { style: { width: '100%' } },
                h(NInput, {
                    value: row[key] as any,
                    placeholder,
                    type: isTextareaDetailField(key) ? 'textarea' : 'text',
                    autosize: isTextareaDetailField(key) ? { minRows: 2, maxRows: 4 } : undefined,
                    maxlength: isTextareaDetailField(key) ? SALES_CONTRACT_DETAIL_TEXTAREA_MAX_LENGTH : undefined,
                    showCount: isTextareaDetailField(key),
                    style: { width: '100%' },
                    'onUpdate:value': (value: string) => {
                        (row as any)[key] = value;
                    },
                })
            )
        );

    // 渲染明细表数字输入框。
    // 当前只用于合同数量和含税单价。用户修改后会：
    // 1. 更新当前字段；
    // 2. 重新计算当前行分项金额；
    // 3. 重新汇总合同含税总金额。
    const renderNumberInput = (
        row: DetailRow,
        index: number,
        key: 'contractQuantity' | 'taxIncludedPrice',
        messageText: string
    ) =>
        renderFormItem(row, index, key, messageText, () =>
            h(NInputNumber, {
                value: row[key],
                min: 0,
                max: SALES_CONTRACT_DETAIL_NUMBER_MAX,
                precision: key === 'taxIncludedPrice' ? SALES_CONTRACT_AMOUNT_PRECISION : SALES_CONTRACT_QUANTITY_PRECISION,
                clearable: true,
                showButton: false,
                placeholder: '请输入',
                'onUpdate:value': (value: number | null) => {
                    row[key] = value;
                    row.subItemAmount = calculateSubAmount(row.contractQuantity, row.taxIncludedPrice);
                    refreshAmount();
                },
            })
        );

    // 多品位明细表配置。
    // 这里不是静态展示表格，而是在每个可编辑列里通过 render 函数嵌入 Naive UI 表单组件。
    // tableList 直接引用 formData.contractPricingDetailGradeDTOS，所以编辑表格就是编辑表单数据。
    const detailTableConfig = computed(() => ({
        columns: [
            {
                key: 'oreType',
                title: () => renderRequiredTitle('矿石种类'),
                width: 160,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderFormItem(row, index, 'oreType', `第${index + 1}行矿石种类必填`, () =>
                        h(NSelect, {
                            value: row.oreType,
                            options: oreTypeOptions.value,
                            placeholder: '请选择',
                            clearable: true,
                            'onUpdate:value': (value: string | number | null) => {
                                row.oreType = getOreTypeValue(value);
                            },
                        })
                    ),
            },
            {
                key: 'oreGrade',
                title: () => renderRequiredTitle('矿石品位(%)'),
                width: 130,
                render: (row: DetailRow, index: number) =>
                    renderFormItem(row, index, 'oreGrade', `第${index + 1}行矿石品位必填`, () => row.oreGrade ?? '--'),
            },
            {
                key: 'contractQuantity',
                title: () => renderRequiredTitle('合同数量(吨)'),
                width: 160,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderNumberInput(row, index, 'contractQuantity', `第${index + 1}行合同数量必填`),
            },
            {
                key: 'taxIncludedPrice',
                title: () => renderRequiredTitle('含税单价(元/吨)'),
                width: 170,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderNumberInput(row, index, 'taxIncludedPrice', `第${index + 1}行含税单价必填`),
            },
            {
                key: 'subItemAmount',
                title: '分项金额(万元)',
                width: 150,
                render: (row: DetailRow) => row.subItemAmount ?? '--',
            },
            {
                key: 'deliveryLocation',
                title: () => renderRequiredTitle('交货地点'),
                width: 180,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderFormItem(row, index, 'deliveryLocation', `第${index + 1}行交货地点必填`, () =>
                        h(NSelect, {
                            value: row.deliveryLocation,
                            options: yardOptions.value,
                            loading: yardLoading.value,
                            placeholder: '请选择',
                            filterable: true,
                            clearable: true,
                            'onUpdate:value': (value: string | null) => {
                                row.deliveryLocation = value || '';
                                row.deliveryLocationName = getYardName(value);
                            },
                        })
                    ),
            },
            {
                key: 'deliveryMethods',
                title: () => renderRequiredTitle('交割方式'),
                width: 220,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderFormItem(row, index, 'deliveryMethods', `第${index + 1}行交割方式必填`, () =>
                        h(NSelect, {
                            value: row.deliveryMethods,
                            options: deliveryMethodOptions.value,
                            multiple: true,
                            placeholder: '请选择',
                            clearable: true,
                            'onUpdate:value': (value: DeliveryMethodValue[] | null) => {
                                row.deliveryMethods = normalizeDeliveryMethodValues(value);
                            },
                        })
                    ),
            },
            {
                key: 'deliveryDateRange',
                title: () => renderRequiredTitle('交货期限'),
                width: 250,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderFormItem(row, index, 'deliveryDateRange', `第${index + 1}行交货期限必填`, () =>
                        h(NDatePicker, {
                            formattedValue: row.deliveryDateRange,
                            type: 'daterange',
                            valueFormat: SALES_CONTRACT_DATE_PICKER_FORMAT,
                            clearable: true,
                            style: { width: '100%' },
                            'onUpdate:formattedValue': (value: [string, string] | null) => {
                                row.deliveryDateRange = value;
                            },
                        })
                    ),
            },
            {
                key: 'transportationMethods',
                title: () => renderRequiredTitle('运输方式要求'),
                width: 160,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderFormItem(row, index, 'transportationMethods', `第${index + 1}行运输方式要求必填`, () =>
                        h(NSelect, {
                            value: row.transportationMethods,
                            options: getTransportOptions(),
                            placeholder: '请选择',
                            clearable: true,
                            'onUpdate:value': (value: string | number | null) => {
                                row.transportationMethods = getTransportValue(value);
                            },
                        })
                    ),
            },
            {
                key: 'qualityRequirements',
                title: () => renderRequiredTitle('质量要求与技术标准'),
                width: 260,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderInput(row, index, 'qualityRequirements', `第${index + 1}行质量要求与技术标准必填`),
            },
            {
                key: 'changeDescription',
                title: () => renderRequiredTitle('变更说明'),
                width: 220,
                ...editableCellColumn,
                render: (row: DetailRow, index: number) =>
                    renderInput(row, index, 'changeDescription', `第${index + 1}行发生数量或单价变更，请填写变更说明`),
            },
        ],
        tableList: formData.value.contractPricingDetailGradeDTOS,
        tableBtns: [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        isShowPagination: false,
        styleOption: {
            padding: '0px',
        },
    }));

    // 监听合同起止日期，自动刷新“时长(天)”。
    // startDate/endDate 绑定的是 formatted-value，值变化后会触发这里。
    watch(
        () => [formData.value.startDate, formData.value.endDate],
        () => {
            calculateDuration();
        }
    );

    // 监听发货月份变化，给明细补默认交货期限。
    // 只给没有 deliveryDateRange 的行补默认值，避免覆盖用户已经手动选择的交货期限。
    watch(
        () => formData.value.shipmentMonth,
        () => {
            const defaultRange = getDefaultDeliveryRange();
            formData.value.contractPricingDetailGradeDTOS.forEach((row) => {
                if (!row.deliveryDateRange) row.deliveryDateRange = defaultRange;
            });
        }
    );

    // 监听字典变化，补齐依赖字典的默认值。
    // 页面初始化时字典可能还没回来，createFormData 里可能拿不到默认值；
    // 字典加载完成后这里再检查一次，只补空字段，不覆盖用户已选择的值。
    watch(
        () => dictMap.value,
        () => {
            if (!formData.value.paymentMethod) {
                formData.value.paymentMethod = getDictDefault(SALES_CONTRACT_DICT.PAYMENT_METHOD, SALES_CONTRACT_DEFAULT_PAYMENT_METHOD_VALUES);
            }
            if (!formData.value.pricingMethod) {
                formData.value.pricingMethod = getDictDefault(SALES_CONTRACT_DICT.PRICING_METHOD, SALES_CONTRACT_DEFAULT_PRICING_METHOD_VALUES);
            }
            if (!formData.value.supplierUnit) {
                formData.value.supplierUnit = getDictDefault(SALES_CONTRACT_DICT.SUPPLIER_UNIT, SALES_CONTRACT_DEFAULT_SUPPLIER_UNIT_VALUES);
            }
            formData.value.contractPricingDetailGradeDTOS.forEach((row) => {
                row.deliveryMethods = normalizeDeliveryMethodValues(row.deliveryMethods);
            });
        },
        { deep: true }
    );

    // 监听用户信息变化，补齐人员和部门默认值。
    // immediate: true 表示页面初始化时立即执行一次；后面 userInfo 异步更新时也会再执行。
    watch(
        () => userInfo.value,
        () => {
            syncUserDefaults();
        },
        { deep: true, immediate: true }
    );

    // 页面初始化。
    // 先加载可关联的定价单、框架合同、预发货明细和堆场；如果 URL 上带 id，再加载销售合同详情做编辑回显。
    onMounted(async () => {
        try {
            await Promise.all([
                loadPricingOptions(),
                loadFrameworkOptions(),
                loadYardOptions(),
            ]);
            await getDetail();
        } catch {
            message.error('页面数据加载失败，请稍后重试');
        }
    });

    return {
        confirmEvt,
        formData,
        formRules,
        formRef,
        getDictEnum,
        pricingOptions,
        frameworkOptions,
        preShipmentOptions,
        preShipmentLoading,
        detailTableConfig,
        handlePricingChange,
        handleDirectorChange,
        handleInitiatorChange,
        submitLoading,
        pageTitle,
        associationDisabled,
        FILE_ACCEPT: SALES_CONTRACT_FILE_ACCEPT,
        FILE_SIZE_LIMIT: SALES_CONTRACT_FILE_SIZE_LIMIT,
        FILE_UPLOAD_LIMIT: SALES_CONTRACT_FILE_UPLOAD_LIMIT,
        CONTRACT_CODE_MAX_LENGTH: SALES_CONTRACT_CODE_MAX_LENGTH,
        TEXTAREA_MAX_LENGTH: SALES_CONTRACT_TEXTAREA_MAX_LENGTH,
        SHORT_TEXT_MAX_LENGTH: SALES_CONTRACT_SHORT_TEXT_MAX_LENGTH,
        DATE_PICKER_FORMAT: SALES_CONTRACT_DATE_PICKER_FORMAT,
        MONTH_PICKER_FORMAT: SALES_CONTRACT_MONTH_PICKER_FORMAT,
        DICT: SALES_CONTRACT_DICT,
        approvalLogs,
    };
};
