import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { NFormItem, NInputNumber, NSelect, useMessage } from 'naive-ui';
import { computed, h, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
    createSalesPlanContractPricing,
    getSalesPlanContractPricingDetail,
    getSalesPlanContractPricingItems,
    getSalesPlanContractPricingMonthlyList,
    getSalesPlanContractPricingPlanNewItems,
    updateSalesPlanContractPricing,
} from '@/api/salesPlan';
import { getDeptTree, getYardPageApi } from '@/api';
import { useDictStore } from '@/store/commStore';
import { useUserStore } from '@/store/userStore';
import { PRICING_STATUS_DRAFT, PRICING_STATUS_REVIEWING } from '../commonTs/common';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';

const ATTACHMENT_ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
const CUSTOMER_TYPE_CHEMICAL = 'CHEMICAL';
const CUSTOMER_TYPE_TRADER = 'TRADER';
const SPLIT_CONTRACT_NO = 2;

interface PricingDetail {
    id?: string | number;
    contractPricingId?: string | number;
    customerCode?: string;
    pricingCode?: string;
    customerType: string;
    grade: number | null;
    deliveryAddress: string;
    deliveryLocationName?: string;
    transportMode?: string | number | null;
    oreType: string | number | null;
    plannedWeight: number | null;
    actualWeight: number | null;
    basePrice: number | null;
    traderBillMinPrice: number | null;
    traderCashMinPrice: number | null;
    taxUnitPrice: number | null;
    subAmount: number | null;
    sortOrder?: number;
}

interface ContractPriceForm {
    id?: string | number;
    contractPricingCode: string;
    customerId: string | number | null;
    customerCode: string;
    customerSelectValue: string;
    selectedPricingCode: string;
    customerName: string;
    subsidiaryId: string | number | null;
    subsidiaryName: string;
    customerType: string;
    monthlyCode: string | null;
    itemIds: string;
    planMonth: number | null;
    totalTaxAmount: number | null;
    attachmentUrls: any[];
    pricingRemark: string;
    isSplit: 1 | 2;
    contractPricingList: PricingDetail[];
    contractCode: string;
    applicantId: string | number | null;
    applicantName: string;
    larkUserId: string;
    applyDeptId: string | number | null;
    applyDeptName: string;
    companyId: string | number | null;
    companyName: string;
    instruction: string;
    approvalDTO?: Record<string, any>;
    associatedApproval: any[];
    relatedApprovalList: any[];
}

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const getFirstValue = (row: any, keys: string[]) =>
    keys.map((key) => row?.[key]).find((value) => value !== undefined && value !== null && value !== '');

/**
 * 将月发货计划明细 ID 统一转换为后端要求的逗号分隔字符串。
 * @param value 单个 ID、ID 数组或逗号分隔的 ID 字符串
 * @returns 逗号分隔的明细 ID
 */
const normalizeItemIds = (value: any) => {
    if (Array.isArray(value)) {
        return value.filter((itemId) => !isEmptyValue(itemId)).map((itemId) => String(itemId)).join(',');
    }
    return String(value || '')
        .split(',')
        .map((itemId) => itemId.trim())
        .filter(Boolean)
        .join(',');
};

/**
 * 获取客户下拉选项外层主项 ID。
 * @param option 客户下拉选项
 * @returns 使用逗号格式传递的外层主项 ID
 */
const getPlanItemIds = (option: any) => normalizeItemIds(option?.id);

const toNumberOrNull = (value: any) => {
    if (isEmptyValue(value)) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const formatNumber = (value: any, precision = 2, minimumFractionDigits = 0) => {
    if (isEmptyValue(value)) return '--';
    const numberValue = Number(value);
    return Number.isFinite(numberValue)
        ? numberValue.toLocaleString(undefined, {
              minimumFractionDigits,
              maximumFractionDigits: precision,
          })
        : value;
};

const formatMonthlyPlanLabel = (item: any) => {
    const monthlyCode = item?.monthlyCode || item?.monthlyPlanCode || '';
    const monthlyMonth = item?.monthlyMonth || item?.planMonth;
    if (!monthlyMonth) return monthlyCode || '--';
    return `${dayjs(monthlyMonth).format('YYYY-MM')}发货计划 - ${monthlyCode}`;
};

const calculateSubAmount = (actualWeight: any, taxUnitPrice: any) => {
    if (isEmptyValue(actualWeight) || isEmptyValue(taxUnitPrice)) return null;
    try {
        return Number(
            new Decimal(String(actualWeight))
                .mul(new Decimal(String(taxUnitPrice)))
                .div(10000)
                .toFixed(6)
        );
    } catch {
        return null;
    }
};

const normalizeCustomerType = (value: any) => {
    if (!value) return '';
    const text = String(value).trim().toUpperCase();
    if (['TRADER', 'TRADE', '贸易商'].includes(text)) return CUSTOMER_TYPE_TRADER;
    if (['CHEMICAL', 'CHEMICAL_COMPANY', '化工企业'].includes(text)) return CUSTOMER_TYPE_CHEMICAL;
    return text;
};

/**
 * 生成客户下拉唯一值，避免同一客户关联相同基准定价单时选项冲突。
 * @param customerCode 客户编码
 * @param pricingCode 基准定价单号
 * @param id 月发货计划新增明细主项 ID
 * @returns customerCode-pricingCode-id 格式的下拉值
 */
const createCustomerSelectValue = (customerCode: any, pricingCode: any, id: any) => {
    const normalizedCustomerCode = String(customerCode || '').trim();
    const normalizedPricingCode = String(pricingCode || '').trim();
    const normalizedId = String(id || '').trim();
    if (!normalizedCustomerCode) return '';
    return [normalizedCustomerCode, normalizedPricingCode, normalizedId].filter(Boolean).join('-');
};

/**
 * 从客户下拉组合值中获取客户编码，仅作为选项数据缺失时的兜底。
 * @param value customerCode-pricingCode-id 格式的下拉值
 * @returns 客户编码
 */
const getCustomerCodeFromSelectValue = (value: any) => {
    const text = String(value || '').trim();
    const separatorIndex = text.indexOf('-');
    return separatorIndex > -1 ? text.slice(0, separatorIndex) : text;
};

/**
 * 获取客户数据关联的基准定价单号，编辑回显时兼容从明细首行读取。
 * @param item 客户选项或合同定价详情
 * @returns 基准定价单号
 */
const getCustomerPricingCode = (item: any) => {
    const pricingCode = getFirstValue(item, ['selectedPricingCode', 'pricingCode', 'basePricingCode']);
    if (pricingCode) return String(pricingCode);
    const firstDetail = (item?.contractPricingList || item?.pricingDetailList || [])[0];
    return String(getFirstValue(firstDetail, ['pricingCode', 'basePricingCode']) || '');
};

/**
 * 将接口客户数据转换为下拉选项。
 * @param item 月发货计划客户数据
 * @returns 客户下拉选项
 */
const createPlanCustomerOption = (item: any) => {
    const customerCode = String(item?.customerCode || '').trim();
    const pricingCode = getCustomerPricingCode(item);
    const customerName = item?.customerName || item?.companyName || customerCode;
    return {
        ...item,
        label: pricingCode ? `${customerName} - ${pricingCode}` : customerName,
        value: createCustomerSelectValue(customerCode, pricingCode, item?.id),
        itemIds: normalizeItemIds(item?.itemIds) || getPlanItemIds(item),
        customerCode,
        pricingCode,
        customerName: item?.customerName || item?.companyName || '',
        customerType: normalizeCustomerType(item?.customerType || item?.type),
        customerId: item?.customerId,
    };
};

const createPricingDetail = (data: Partial<PricingDetail> = {}): PricingDetail => {
    return {
        customerType: '',
        grade: null,
        deliveryAddress: '',
        deliveryLocationName: '',
        oreType: null,
        plannedWeight: null,
        actualWeight: null,
        basePrice: null,
        traderBillMinPrice: null,
        traderCashMinPrice: null,
        taxUnitPrice: null,
        subAmount: null,
        ...data,
    };
};

const createFormData = (): ContractPriceForm => {
    return {
        contractPricingCode: '',
        customerId: null,
        customerCode: '',
        customerSelectValue: '',
        selectedPricingCode: '',
        customerName: '',
        subsidiaryId: null,
        subsidiaryName: '',
        customerType: '',
        monthlyCode: null,
        itemIds: '',
        planMonth: null,
        totalTaxAmount: null,
        attachmentUrls: [],
        pricingRemark: '',
        isSplit: SPLIT_CONTRACT_NO,
        contractPricingList: [],
        contractCode: '',
        applicantId: null,
        applicantName: '',
        larkUserId: '',
        applyDeptId: null,
        applyDeptName: '',
        companyId: null,
        companyName: '',
        instruction: '',
        approvalDTO: {},
        associatedApproval: [],
        relatedApprovalList: [],
    };
};

export default () => {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
    const formRef = ref<any>(null);
    const formData = ref<ContractPriceForm>(createFormData());
    const monthlyPlanOptions = ref<any[]>([]);
    const planCustomerOptions = ref<any[]>([]);
    const deptTree = ref<any[]>([]);
    const yardOptions = ref<Array<{ label: string; value: string }>>([]);
    const pageId = computed(() => route.query.id as string | undefined);
    const isEdit = computed(() => !!pageId.value);
    const isDetail = computed(() => route.query.type === 'detail');
    const pageTitle = computed(() => {
        if (isDetail.value) return '合同定价详情';
        return isEdit.value ? '编辑合同定价' : '新增合同定价';
    });
    const { dictMap } = storeToRefs(useDictStore());
    const { userInfo } = storeToRefs(useUserStore());

    const oreTypeOptions = computed<any[]>(() => dictMap.value?.['矿种'] || dictMap.value?.['矿石种类'] || []);
    const splitContractOptions = [
        { label: '否', value: SPLIT_CONTRACT_NO },
        { label: '是', value: 1 },
    ];
    const isMonthlyCodeDisabled = computed(() => isEdit.value || isDetail.value);
    const isCustomerDisabled = computed(() => isEdit.value || isDetail.value || !formData.value.monthlyCode);

    const formRules = ref<any>({
        customerSelectValue: [{ required: true, message: '请选择客户名称', trigger: ['change', 'blur'] }],
        monthlyCode: [{ required: true, message: '请选择关联月发货计划', trigger: ['change', 'blur'] }],
        planMonth: [
            {
                required: true,
                type: 'number',
                message: '请选择发货月份',
                trigger: ['change', 'blur'],
            },
        ],
        totalTaxAmount: [
            {
                required: true,
                type: 'number',
                message: '请确认含税总金额',
                trigger: ['change', 'blur'],
            },
        ],
        attachmentUrls: [
            {
                required: true,
                type: 'array',
                message: '请上传定价附件',
                trigger: ['change', 'blur'],
            },
        ],
        isSplit: [
            {
                required: true,
                type: 'number',
                message: '请选择是否拆分合同',
                trigger: ['change', 'blur'],
            },
        ],
        applicantId: [{ required: true, message: '请选择申请人', trigger: ['change', 'blur'] }],
        applyDeptId: [{ required: true, message: '请选择申请部门', trigger: ['change', 'blur'] }],
        companyId: [{ required: true, message: '请选择定价所属公司', trigger: ['change', 'blur'] }],
        instruction: [{ required: true, message: '请输入事项说明', trigger: ['input', 'blur'] }],
    });

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

    /**
     * 获取接口值对应的堆场编码，兼容接口暂时返回堆场名称的情况。
     * @param value 堆场编码或名称
     * @returns 堆场编码或无法匹配时的原值
     */
    const getYardCode = (value: any) => {
        if (isEmptyValue(value)) return '';
        const text = String(value);
        const option = yardOptions.value.find((item) => item.value === text || item.label === text);
        return option?.value || text;
    };

    const normalizeAttachmentList = (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return value
                    .split(',')
                    .map((url) => url.trim())
                    .filter(Boolean)
                    .map((url) => ({
                        name: decodeURIComponent(url.split('/').pop() || '附件'),
                        url,
                    }));
            }
        }
        return [];
    };

    const parseAssociatedApproval = (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
        return [];
    };

    const companyOptions = computed<any[]>(() => dictMap.value?.['合同定价所属公司'] || []);

    const findCompany = (companyId: any, companyName?: string) => {
        return companyOptions.value.find(
            (item: any) => String(item.value) === String(companyId) || item.label === companyName
        );
    };

    const getDefaultCompany = () => {
        return companyOptions.value.find((item: any) => item.label === '四川火石子贸易有限公司') || companyOptions.value[0];
    };

    const getApplicantLarkUserId = (user: any) => {
        return user?.larkUserId || user?.feishuUserId || user?.larkId || '';
    };

    const fillDefaultApprovalInfo = () => {
        const info: any = userInfo.value || {};
        const defaultDept = info.userDeptList?.[0] || {};
        formData.value.applicantId = info.code || formData.value.applicantId;
        formData.value.applicantName = info.username || formData.value.applicantName;
        formData.value.larkUserId = getApplicantLarkUserId(info) || formData.value.larkUserId;
        formData.value.applyDeptId = defaultDept.deptCode || formData.value.applyDeptId;
        formData.value.applyDeptName = defaultDept.deptName || formData.value.applyDeptName;
        if (!formData.value.companyId) {
            const defaultCompany = getDefaultCompany();
            formData.value.companyId = defaultCompany?.value || null;
            formData.value.companyName = defaultCompany?.label || '';
        } else {
            formData.value.companyName = formData.value.companyName || findCompany(formData.value.companyId)?.label || '';
        }
    };

    const loadDeptTree = async () => {
        const res = await getDeptTree();
        if (res.code === 200) {
            deptTree.value = res.data || [];
        }
    };

    /**
     * 获取启用的堆场并转换为名称展示、编码提交的下拉选项。
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
            const yardCodes = new Set<string>();
            yardOptions.value = (res.data?.records || []).reduce(
                (options: Array<{ label: string; value: string }>, item: any) => {
                    const yardName = String(item?.yardName || '').trim();
                    const yardCode = String(item?.yardCode || '').trim();
                    if (!yardName || !yardCode || yardCodes.has(yardCode)) {
                        return options;
                    }
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
        }
    };

    const handleApplicantChange = (user: any) => {
        if (!user || Array.isArray(user)) return;
        formData.value.applicantName = user.label || user.username || '';
        formData.value.larkUserId = getApplicantLarkUserId(user);
        const dept = user.userDeptList?.[0];
        if (dept) {
            formData.value.applyDeptId = dept.deptCode || '';
            formData.value.applyDeptName = dept.deptName || '';
        }
    };

    const updateSubAmount = (row: PricingDetail) => {
        row.subAmount = calculateSubAmount(row.actualWeight, row.taxUnitPrice);
    };

    const calculateTotalAmount = () => {
        const total = currentPricingDetailList.value.reduce(
            (sum, item) => sum.add(new Decimal(String(item.subAmount || 0))),
            new Decimal(0)
        );
        formData.value.totalTaxAmount = Number(total.toFixed(6));
    };

    const refreshPricingAmounts = () => {
        currentPricingDetailList.value.forEach(updateSubAmount);
        calculateTotalAmount();
    };

    const normalizePricingDetail = (item: any, index: number, fallbackCustomerType = '') => {
        const plannedWeight = toNumberOrNull(getFirstValue(item, ['plannedWeight', 'planWeight', 'plannedQty', 'qty']));
        const actualWeight =
            toNumberOrNull(getFirstValue(item, ['actualWeight', 'realWeight'])) ?? plannedWeight ?? null;
        const traderBillMinPrice = toNumberOrNull(
            getFirstValue(item, ['traderBillMinPrice', 'traderDraftMinPrice', 'draftMinPrice'])
        );
        const traderCashMinPrice = toNumberOrNull(getFirstValue(item, ['traderCashMinPrice', 'cashMinPrice']));
        const basePrice = toNumberOrNull(getFirstValue(item, ['basePrice', 'taxIncludedPrice']));
        const taxUnitPrice =
            toNumberOrNull(getFirstValue(item, ['taxUnitPrice', 'taxIncludedPrice'])) ??
            basePrice ??
            traderCashMinPrice ??
            traderBillMinPrice ??
            null;
        const row = createPricingDetail({
            ...item,
            customerType: normalizeCustomerType(
                getFirstValue(item, [
                    'customerType',
                    'companyType',
                    'customerCategory',
                    'pricingCustomerType',
                    'clientType',
                    'enterpriseType',
                ]) || fallbackCustomerType
            ),
            grade: toNumberOrNull(getFirstValue(item, ['grade', 'oreGrade', 'plannedGrade'])),
            deliveryAddress: getYardCode(getFirstValue(item, ['deliveryAddress', 'deliveryLocation'])),
            deliveryLocationName: getFirstValue(item, ['deliveryLocationName']) || '',
            transportMode: getFirstValue(item, ['transportMode']),
            oreType: getOreTypeValue(getFirstValue(item, ['oreType', 'mineralType'])),
            plannedWeight,
            actualWeight,
            basePrice,
            traderBillMinPrice,
            traderCashMinPrice,
            taxUnitPrice,
            subAmount: toNumberOrNull(getFirstValue(item, ['subAmount', 'lineTotal'])),
            sortOrder: item.sortOrder || index + 1,
        });
        updateSubAmount(row);
        return row;
    };

    /**
     * 将合同定价详情接口的明细转换为编辑表单数据。
     * 详情接口字段已经确定，编辑回显只读取接口字段，不使用历史字段别名或重新计算金额。
     * @param item 合同定价详情明细
     * @param index 明细在接口数组中的下标
     * @returns 编辑表单使用的合同定价明细
     */
    const normalizeContractPricingDetail = (item: any, index: number): PricingDetail =>
        createPricingDetail({
            id: item.id,
            contractPricingId: item.contractPricingId,
            customerCode: item.customerCode,
            customerType: normalizeCustomerType(item.customerType),
            grade: toNumberOrNull(item.grade),
            deliveryAddress: getYardCode(item.deliveryAddress),
            deliveryLocationName: item.deliveryLocationName ?? '',
            transportMode: item.transportMode ?? null,
            oreType: getOreTypeValue(item.oreType),
            plannedWeight: toNumberOrNull(item.plannedWeight),
            actualWeight: toNumberOrNull(item.actualWeight),
            basePrice: toNumberOrNull(item.basePrice),
            traderBillMinPrice: toNumberOrNull(item.traderBillMinPrice),
            traderCashMinPrice: toNumberOrNull(item.traderCashMinPrice),
            taxUnitPrice: toNumberOrNull(item.taxUnitPrice),
            subAmount: toNumberOrNull(item.subAmount),
            sortOrder: item.sortOrder ?? index + 1,
        });

    const renderReadonlyNumber = (value: any, precision = 2, minimumFractionDigits = 0) =>
        formatNumber(value, precision, minimumFractionDigits);

    const getPricingDetailCustomerType = (row: PricingDetail) => {
        const customerType = normalizeCustomerType(row.customerType);
        if (customerType === CUSTOMER_TYPE_CHEMICAL || customerType === CUSTOMER_TYPE_TRADER) return customerType;
        if (!isEmptyValue(row.traderBillMinPrice) || !isEmptyValue(row.traderCashMinPrice)) return CUSTOMER_TYPE_TRADER;
        if (!isEmptyValue(row.basePrice)) return CUSTOMER_TYPE_CHEMICAL;
        if (!isEmptyValue(formData.value.customerType)) return normalizeCustomerType(formData.value.customerType);
        return CUSTOMER_TYPE_CHEMICAL;
    };
    const getPricingDetailCustomerCode = (item: any) => item.customerCode;

    const selectedCustomerType = computed(() => normalizeCustomerType(formData.value.customerType));

    const chemicalPricingDetailList = computed(() =>
        formData.value.contractPricingList.filter(
            (item) => getPricingDetailCustomerType(item) === CUSTOMER_TYPE_CHEMICAL
        )
    );

    const traderPricingDetailList = computed(() =>
        formData.value.contractPricingList.filter((item) => getPricingDetailCustomerType(item) === CUSTOMER_TYPE_TRADER)
    );

    const currentPricingDetailList = computed(() => {
        if (selectedCustomerType.value === CUSTOMER_TYPE_TRADER) return traderPricingDetailList.value;
        if (selectedCustomerType.value === CUSTOMER_TYPE_CHEMICAL) return chemicalPricingDetailList.value;
        return [];
    });

    const hasMultiplePricingDetails = computed(() => currentPricingDetailList.value.length >= 2);

    const hasSelectedCustomerType = computed(() =>
        [CUSTOMER_TYPE_CHEMICAL, CUSTOMER_TYPE_TRADER].includes(selectedCustomerType.value)
    );

    const getPricingDetailFormIndex = (row: PricingDetail, fallbackIndex: number) => {
        const index = formData.value.contractPricingList.indexOf(row);
        return index > -1 ? index : fallbackIndex;
    };

    const renderOreTypeSelect = (row: PricingDetail, index: number, tableName: string) =>
        h(
            NFormItem,
            {
                path: `contractPricingList[${getPricingDetailFormIndex(row, index)}].oreType`,
                rule: {
                    required: true,
                    trigger: ['change', 'blur'],
                    message: `${tableName}第${index + 1}行的矿石种类必填`,
                },
                showLabel: false,
            },
            () =>
                h(NSelect, {
                    value: row.oreType,
                    options: oreTypeOptions.value,
                    disabled: isDetail.value,
                    clearable: true,
                    style: { width: '200px' },
                    placeholder: '请选择',
                    'onUpdate:value': (value: string | number | null) => {
                        row.oreType = getOreTypeValue(value);
                    },
                })
        );

    const renderNumberInput = (
        row: PricingDetail,
        index: number,
        key: 'actualWeight' | 'taxUnitPrice',
        messageText: string
    ) =>
        h(
            NFormItem,
            {
                path: `contractPricingList[${getPricingDetailFormIndex(row, index)}].${key}`,
                rule: {
                    required: true,
                    type: 'number',
                    trigger: ['input', 'blur'],
                    message: messageText,
                },
                showLabel: false,
            },
            () =>
                h(NInputNumber, {
                    value: row[key],
                    min: 0,
                    max: 999999999,
                    precision: 2,
                    disabled: isDetail.value,
                    clearable: true,
                    showButton: false,
                    placeholder: '请输入',
                    'onUpdate:value': (value: number | null) => {
                        row[key] = value;
                        updateSubAmount(row);
                        calculateTotalAmount();
                    },
                })
        );

    const createCommonPricingColumns = (tableName: string) => [
        {
            key: 'grade',
            title: '矿石品位(%)',
            width: 130,
            render: (row: PricingDetail) => renderReadonlyNumber(row.grade),
        },
        {
            key: 'oreType',
            title: '矿石种类',
            width: 180,
            isRule: true,
            render: (row: PricingDetail, index: number) => renderOreTypeSelect(row, index, tableName),
        },
        {
            key: 'plannedWeight',
            title: '计划重量(吨)',
            width: 140,
            render: (row: PricingDetail) => renderReadonlyNumber(row.plannedWeight),
        },
        {
            key: 'actualWeight',
            title: '实际重量(吨)',
            width: 160,
            isRule: true,
            render: (row: PricingDetail, index: number) =>
                renderNumberInput(row, index, 'actualWeight', `${tableName}第${index + 1}行的实际重量必填`),
        },
    ];

    const createTailPricingColumns = (tableName: string) => [
        {
            key: 'taxUnitPrice',
            title: '含税单价(元/吨)',
            width: 170,
            isRule: true,
            render: (row: PricingDetail, index: number) =>
                renderNumberInput(row, index, 'taxUnitPrice', `${tableName}第${index + 1}行的含税单价必填`),
        },
        {
            key: 'subAmount',
            title: '分项金额(万元)',
            width: 150,
            render: (row: PricingDetail) => renderReadonlyNumber(row.subAmount, 6, 6),
        },
    ];

    const createPricingTableConfig = (columns: any[], tableList: PricingDetail[]) => ({
        columns,
        tableList,
        tableBtns: [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        isShowPagination: false,
        styleOption: {
            padding: '0px',
        },
    });

    const chemicalPricingDetailConfig = computed(() => {
        const tableName = '化工企业定价明细表';
        const commonColumns = createCommonPricingColumns(tableName);
        const columns: any[] = [
            commonColumns[0],
            {
                key: 'deliveryLocationName',
                title: '交货地址',
                width: 180,
                render: (row: PricingDetail) => row.deliveryLocationName || '--',
            },
            ...commonColumns.slice(1),
            {
                key: 'basePrice',
                title: '基准定价',
                width: 130,
                isRule: true,
                render: (row: PricingDetail) => renderReadonlyNumber(row.basePrice),
            },
            ...createTailPricingColumns(tableName),
        ];
        return createPricingTableConfig(columns, chemicalPricingDetailList.value);
    });

    const traderPricingDetailConfig = computed(() => {
        const tableName = '贸易商定价明细表';
        const columns: any[] = [
            {
                key: 'grade',
                title: '矿石品位(%)',
                width: 130,
                render: (row: PricingDetail) => renderReadonlyNumber(row.grade),
            },
            {
                key: 'deliveryLocationName',
                title: '交货地址',
                width: 180,
                isRule: true,
                render: (row: PricingDetail) => row.deliveryLocationName || '--',
            },
            ...createCommonPricingColumns(tableName).filter((column) => column.key !== 'grade'),
            {
                key: 'traderBillMinPrice',
                title: '贸易商汇票最低报价(元/吨)',
                width: 230,
                isRule: true,
                render: (row: PricingDetail) => renderReadonlyNumber(row.traderBillMinPrice),
            },
            {
                key: 'traderCashMinPrice',
                title: '贸易商现金最低报价(元/吨)',
                width: 230,
                render: (row: PricingDetail) => renderReadonlyNumber(row.traderCashMinPrice),
            },
            ...createTailPricingColumns(tableName),
        ];
        return createPricingTableConfig(columns, traderPricingDetailList.value);
    });

    const hasChemicalPricingDetail = computed(() => selectedCustomerType.value === CUSTOMER_TYPE_CHEMICAL);
    const hasTraderPricingDetail = computed(() => selectedCustomerType.value === CUSTOMER_TYPE_TRADER);

    const clearCustomer = () => {
        formData.value.customerId = null;
        formData.value.customerCode = '';
        formData.value.customerSelectValue = '';
        formData.value.selectedPricingCode = '';
        formData.value.itemIds = '';
        formData.value.customerName = '';
        formData.value.subsidiaryId = null;
        formData.value.subsidiaryName = '';
        formData.value.customerType = '';
        formData.value.isSplit = SPLIT_CONTRACT_NO;
    };

    /**
     * 按客户编码、基准定价单号和月计划明细 ID 查找客户选项。
     * @param customerCode 客户编码
     * @param pricingCode 基准定价单号
     * @param itemIds 月发货计划新增明细外层主项 ID
     * @returns 精确匹配的客户选项
     */
    const findCustomerOption = (customerCode: any, pricingCode: any, itemIds = '') => {
        const normalizedCustomerCode = String(customerCode || '');
        const normalizedPricingCode = String(pricingCode || '');
        const normalizedItemIds = normalizeItemIds(itemIds);
        return planCustomerOptions.value.find(
            (option) =>
                String(option.customerCode) === normalizedCustomerCode &&
                (!normalizedPricingCode || String(option.pricingCode) === normalizedPricingCode) &&
                (!normalizedItemIds || getPlanItemIds(option) === normalizedItemIds)
        );
    };

    const loadPlanCustomerOptions = async (monthlyCode: string | null) => {
        if (!monthlyCode) {
            planCustomerOptions.value = [];
            return;
        }
        const res = await getSalesPlanContractPricingPlanNewItems(monthlyCode);
        if (res.code === 200) {
            planCustomerOptions.value = (res.data || []).map((item: any) => createPlanCustomerOption(item));
        }
    };

    const filterPricingDetailByCustomer = (list: any[]) => {
        const customerCode = formData.value.customerCode;
        const customerType = selectedCustomerType.value;
        if (!customerCode || !customerType) return [];
        return list.filter(
            (item: any) =>
                String(getPricingDetailCustomerCode(item)) === String(customerCode) &&
                getPricingDetailCustomerType(item) === customerType
        );
    };

    const handleCustomerChange = async (customerSelectValue: string | null) => {
        const option = planCustomerOptions.value.find(
            (item) => String(item.value) === String(customerSelectValue)
        );
        if (!option) {
            clearCustomer();
            formData.value.contractPricingList = [];
            calculateTotalAmount();
            return;
        }
        formData.value.customerSelectValue = customerSelectValue || '';
        formData.value.customerId = option.customerId || null;
        formData.value.customerCode = option.customerCode || getCustomerCodeFromSelectValue(customerSelectValue);
        formData.value.selectedPricingCode = option.pricingCode || '';
        formData.value.itemIds = getPlanItemIds(option);
        formData.value.customerName = option.customerName || option.label || '';
        formData.value.subsidiaryId = option.subsidiaryId ?? null;
        formData.value.subsidiaryName = option.subsidiaryName || '';
        formData.value.customerType = normalizeCustomerType(option.customerType || option.type);
        formData.value.isSplit = SPLIT_CONTRACT_NO;
        await loadPricingDetail(formData.value.monthlyCode, option.pricingCode || '', getPlanItemIds(option));
        calculateTotalAmount();
    };

    const ensureMonthlyOption = (item: any) => {
        const monthlyCode = item?.monthlyCode || item?.monthlyPlanCode;
        if (!monthlyCode) return;
        if (monthlyPlanOptions.value.some((option) => String(option.value) === String(monthlyCode))) return;
        monthlyPlanOptions.value.unshift({
            label: formatMonthlyPlanLabel(item),
            value: monthlyCode,
            ...item,
        });
    };

    const fillBaseInfoByMonthlyPlan = (monthlyCode: string | null) => {
        const selected = monthlyPlanOptions.value.find((item) => String(item.value) === String(monthlyCode));
        if (!selected) return;
        const monthValue = getFirstValue(selected, ['monthlyMonth', 'planMonth']);
        formData.value.planMonth = monthValue ? dayjs(monthValue).valueOf() : null;
    };

    /**
     * 根据当前月发货计划和客户下拉选中的定价单号加载明细。
     * @param monthlyCode 月发货计划编号
     * @param pricingCode 客户下拉选项中的基准定价单号
     * @param itemIds 客户下拉选项中月发货计划新增明细外层主项 ID
     * @returns 异步加载结果
     */
    const loadPricingDetail = async (monthlyCode: string | null, pricingCode: string | null, itemIds: string) => {
        if (!monthlyCode || !pricingCode || !itemIds) {
            formData.value.contractPricingList = [];
            calculateTotalAmount();
            return;
        }
        try {
            const res = await getSalesPlanContractPricingItems(monthlyCode, pricingCode, itemIds);
            if (res.code === 200) {
                formData.value.contractPricingList = filterPricingDetailByCustomer(res.data || []).map(
                    (item: any, index: number) => normalizePricingDetail(item, index, formData.value.customerType)
                );
            }
            calculateTotalAmount();
        } catch {
            formData.value.contractPricingList = [];
            calculateTotalAmount();
            message.error('合同定价明细加载失败，请稍后重试');
        }
    };

    const handleMonthlyPlanChange = async (value: string | null) => {
        formData.value.monthlyCode = value;
        clearCustomer();
        planCustomerOptions.value = [];
        formData.value.contractPricingList = [];
        calculateTotalAmount();
        fillBaseInfoByMonthlyPlan(value);
        await loadPlanCustomerOptions(value);
    };

    const validateApprovalInfo = () => {
        if (isEmptyValue(formData.value.applicantId)) return '请选择申请人';
        if (isEmptyValue(formData.value.applyDeptId)) return '请选择申请部门';
        if (isEmptyValue(formData.value.companyId)) return '请选择定价所属公司';
        if (isEmptyValue(formData.value.instruction)) return '请输入事项说明';
        return '';
    };

    const validatePricingDetailList = (
        list: PricingDetail[],
        tableName: string,
        validateCustomerTypeFields: (row: PricingDetail, index: number) => string
    ) => {
        for (let index = 0; index < list.length; index += 1) {
            const row = list[index];
            if (isEmptyValue(row.grade)) return `${tableName}第${index + 1}行的矿石品位必填`;
            if (isEmptyValue(row.oreType)) return `${tableName}第${index + 1}行的矿石种类必填`;
            if (isEmptyValue(row.plannedWeight)) return `${tableName}第${index + 1}行的计划重量必填`;
            if (isEmptyValue(row.actualWeight)) return `${tableName}第${index + 1}行的实际重量必填`;
            const customerTypeError = validateCustomerTypeFields(row, index);
            if (customerTypeError) return customerTypeError;
            if (isEmptyValue(row.taxUnitPrice)) return `${tableName}第${index + 1}行的含税单价必填`;
        }
        return '';
    };

    /**
     * 校验定价明细中的“矿石品位+交货地址”组合不可重复。
     * @param list 定价明细列表
     * @param tableName 表格名称
     * @returns 重复校验提示，无重复时返回空字符串
     */
    const validateGradeDeliveryAddressUnique = (list: PricingDetail[], tableName: string) => {
        const gradeDeliveryIndexMap = new Map<string, number>();
        for (let index = 0; index < list.length; index += 1) {
            const row = list[index];
            if (isEmptyValue(row.grade) || isEmptyValue(row.deliveryAddress)) continue;
            const grade = Number(row.grade);
            const yardCode = getYardCode(row.deliveryAddress);
            if (!Number.isFinite(grade) || !yardCode) continue;
            const uniqueKey = JSON.stringify([grade, yardCode]);
            const duplicateIndex = gradeDeliveryIndexMap.get(uniqueKey);
            if (duplicateIndex !== undefined) {
                return `${tableName}第${index + 1}行的矿石品位(%)和交货地址与第${duplicateIndex + 1}行重复`;
            }
            gradeDeliveryIndexMap.set(uniqueKey, index);
        }
        return '';
    };

    const validatePricingDetails = () => {
        if (!hasSelectedCustomerType.value) return '请选择客户名称';
        if (!currentPricingDetailList.value.length) return '请先选择月发货计划并带入当前客户类型定价明细';

        if (selectedCustomerType.value === CUSTOMER_TYPE_CHEMICAL) {
            const chemicalError = validatePricingDetailList(
                chemicalPricingDetailList.value,
                '化工企业定价明细表',
                (row, index) => {
                    if (isEmptyValue(row.basePrice)) return `化工企业定价明细表第${index + 1}行的基准定价必填`;
                    return '';
                }
            );
            if (chemicalError) return chemicalError;
            const duplicateError = validateGradeDeliveryAddressUnique(
                chemicalPricingDetailList.value,
                '化工企业定价明细表'
            );
            if (duplicateError) return duplicateError;
        }

        if (selectedCustomerType.value === CUSTOMER_TYPE_TRADER) {
            const traderError = validatePricingDetailList(
                traderPricingDetailList.value,
                '贸易商定价明细表',
                (row, index) => {
                    if (isEmptyValue(row.deliveryAddress)) return `贸易商定价明细表第${index + 1}行的交货地址必填`;
                    if (isEmptyValue(row.traderBillMinPrice)) {
                        return `贸易商定价明细表第${index + 1}行的贸易商汇票最低报价必填`;
                    }
                    return '';
                }
            );
            if (traderError) return traderError;
            const duplicateError = validateGradeDeliveryAddressUnique(
                traderPricingDetailList.value,
                '贸易商定价明细表'
            );
            if (duplicateError) return duplicateError;
        }

        return '';
    };

    const buildSubmitData = (type: 'save' | 'submit') => {
        refreshPricingAmounts();
        const approvalList = formData.value.associatedApproval?.length
            ? formData.value.associatedApproval
            : formData.value.relatedApprovalList || [];
        const associatedApproval = JSON.stringify(approvalList);
        const companyName = formData.value.companyName || findCompany(formData.value.companyId)?.label || '';
        const customerCode =
            formData.value.customerCode || getCustomerCodeFromSelectValue(formData.value.customerSelectValue);
        return {
            id: pageId.value,
            contractPricingCode: formData.value.contractPricingCode,
            customerId: formData.value.customerId,
            customerCode,
            customerName: formData.value.customerName,
            subsidiaryId: formData.value.subsidiaryId,
            subsidiaryName: formData.value.subsidiaryName || '',
            customerType: formData.value.customerType,
            monthlyCode: formData.value.monthlyCode,
            itemIds: normalizeItemIds(formData.value.itemIds),
            planMonth: formData.value.planMonth ? dayjs(formData.value.planMonth).format('YYYY-MM') : '',
            totalTaxAmount: formData.value.totalTaxAmount,
            status: type === 'submit' ? PRICING_STATUS_REVIEWING : PRICING_STATUS_DRAFT,
            pricingRemark: formData.value.pricingRemark,
            attachmentUrls: formData.value.attachmentUrls || [],
            ...(hasMultiplePricingDetails.value ? { isSplit: formData.value.isSplit } : {}),
            applicantId: formData.value.applicantId,
            applicantName: formData.value.applicantName,
            larkUserId: formData.value.larkUserId,
            applyDeptId: formData.value.applyDeptId,
            applyDeptName: formData.value.applyDeptName,
            companyId: formData.value.companyId,
            companyName,
            instruction: formData.value.instruction,
            approvalDTO: {
                ...(formData.value.approvalDTO || {}),
                applicantId: formData.value.applicantId,
                applicantName: formData.value.applicantName,
                larkUserId: formData.value.larkUserId,
                applyDeptId: formData.value.applyDeptId,
                applyDeptName: formData.value.applyDeptName,
                companyId: formData.value.companyId,
                companyName,
                instruction: formData.value.instruction,
                associatedApproval,
            },
            associatedApproval,
            relatedApprovalList: approvalList,
            contractPricingList: currentPricingDetailList.value.map((item, index) => ({
                id: item.id,
                contractPricingId: item.contractPricingId,
                grade: item.grade,
                deliveryAddress: getYardCode(item.deliveryAddress),
                deliveryLocationName: item.deliveryLocationName,
                transportMode: item.transportMode,
                oreType: getOreTypeValue(item.oreType),
                plannedWeight: item.plannedWeight,
                actualWeight: item.actualWeight,
                customerType: getPricingDetailCustomerType(item),
                basePrice: item.basePrice,
                traderBillMinPrice: item.traderBillMinPrice,
                traderCashMinPrice: item.traderCashMinPrice,
                taxUnitPrice: item.taxUnitPrice,
                subAmount: item.subAmount,
                sortOrder: item.sortOrder || index + 1,
                contractPricingCode: formData.value.contractPricingCode,
            })),
        };
    };

    /**
     * 校验保存合同定价时的基础必填字段。
     * @returns 首个校验错误文案，校验通过返回 null
     */
    const validateSaveFields = (): string | null => {
        if (isEmptyValue(formData.value.monthlyCode)) {
            return '请选择关联月发货计划';
        }
        if (!String(formData.value.customerSelectValue || '').trim()) {
            return '请选择客户名称';
        }
        return null;
    };

    const confirmEvt = async (type: 'save' | 'submit') => {
        if (isDetail.value) return;
        formRef.value?.restoreValidation();

        if (type === 'save') {
            const saveError = validateSaveFields();
            if (saveError) {
                message.error(saveError);
                return;
            }
        } else {
            try {
                await formRef.value?.validate();
            } catch (errors: any) {
                message.error(errors?.[0]?.[0]?.message || '请完善必填信息');
                return;
            }

            const detailError = validatePricingDetails();
            if (detailError) {
                message.error(detailError);
                return;
            }
            const approvalError = validateApprovalInfo();
            if (approvalError) {
                message.error(approvalError);
                return;
            }
        }

        try {
            const payload = buildSubmitData(type);
            const res = pageId.value
                ? await updateSalesPlanContractPricing(payload)
                : await createSalesPlanContractPricing(payload);
            if (res.code === 200) {
                router.back();
            }
        } catch (error) {
            console.error(type === 'save' ? '保存合同定价失败:' : '提交合同定价失败:', error);
            message.error(type === 'save' ? '保存失败，请稍后重试' : '提交失败，请稍后重试');
        }
    };

    const loadMonthlyPlanOptions = async () => {
        const res = await getSalesPlanContractPricingMonthlyList();
        if (res.code === 200) {
            monthlyPlanOptions.value = (res.data || []).map((item: any) => ({
                label: formatMonthlyPlanLabel(item),
                value: item.monthlyCode,
                ...item,
            }));
        }
    };

    /**
     * 加载合同定价详情并按详情接口字段精准组装编辑表单。
     * @returns 详情加载完成的异步任务
     */
    const getDetail = async () => {
        if (!pageId.value) {
            calculateTotalAmount();
            return;
        }
        try {
            const res = await getSalesPlanContractPricingDetail(pageId.value);
            if (res.code !== 200 || !res.data) return;

            const data = res.data;
            const approvalDTO = data.approvalDTO || {};
            const associatedApproval = parseAssociatedApproval(approvalDTO.associatedApproval);
            ensureMonthlyOption({ monthlyCode: data.monthlyCode, planMonth: data.planMonth });
            formData.value = {
                ...createFormData(),
                id: data.id,
                contractPricingCode: data.contractPricingCode || '',
                customerId: data.customerId ?? null,
                customerCode: data.customerCode || '',
                customerSelectValue: '',
                selectedPricingCode: '',
                customerName: data.customerName || '',
                subsidiaryId: data.subsidiaryId ?? null,
                subsidiaryName: data.subsidiaryName || '',
                customerType: normalizeCustomerType(data.customerType),
                monthlyCode: data.monthlyCode || null,
                itemIds: normalizeItemIds(data.itemIds),
                planMonth: data.planMonth ? dayjs(data.planMonth).valueOf() : null,
                totalTaxAmount: toNumberOrNull(data.totalTaxAmount),
                attachmentUrls: normalizeAttachmentList(data.attachmentUrls),
                pricingRemark: data.pricingRemark || '',
                isSplit: data.isSplit ?? SPLIT_CONTRACT_NO,
                contractPricingList: (data.contractPricingList || []).map(
                    (item: any, index: number) => normalizeContractPricingDetail(item, index)
                ),
                contractCode: data.contractCode || '',
                applicantId: data.applicantId ?? null,
                applicantName: data.applicantName || '',
                larkUserId: approvalDTO.larkUserId || '',
                applyDeptId: approvalDTO.applyDeptId ?? null,
                applyDeptName: approvalDTO.applyDeptName || '',
                companyId: approvalDTO.companyId ?? null,
                companyName: approvalDTO.companyName || '',
                instruction: approvalDTO.instruction || '',
                approvalDTO,
                associatedApproval,
                relatedApprovalList: associatedApproval,
            };
            if (formData.value.monthlyCode) {
                await loadPlanCustomerOptions(formData.value.monthlyCode);
                const customerOption = findCustomerOption(data.customerCode, '', data.itemIds);
                formData.value.customerSelectValue = customerOption?.value || '';
                formData.value.selectedPricingCode = customerOption?.pricingCode || '';
            }
            await loadEditApprovalLogs(approvalDTO.id);
        } catch (error) {
            console.error('加载合同定价详情失败:', error);
            message.error('合同定价详情加载失败，请稍后重试');
        }
    };

    onMounted(async () => {
        await Promise.all([loadMonthlyPlanOptions(), loadDeptTree(), loadYardOptions()]);
        await getDetail();
        if (!pageId.value) {
            fillDefaultApprovalInfo();
        }
    });

    watch(
        companyOptions,
        () => {
            if (!pageId.value && !formData.value.companyId) {
                fillDefaultApprovalInfo();
            }
        },
        { immediate: true }
    );

    return {
        formRef,
        formData,
        formRules,
        pageTitle,
        isEdit,
        isDetail,
        isMonthlyCodeDisabled,
        isCustomerDisabled,
        monthlyPlanOptions,
        planCustomerOptions,
        deptTree,
        chemicalPricingDetailConfig,
        traderPricingDetailConfig,
        hasMultiplePricingDetails,
        hasChemicalPricingDetail,
        hasTraderPricingDetail,
        hasSelectedCustomerType,
        splitContractOptions,
        ATTACHMENT_ACCEPT,
        confirmEvt,
        handleCustomerChange,
        handleApplicantChange,
        handleMonthlyPlanChange,
        approvalLogs,
    };
};
