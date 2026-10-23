import { computed, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { NButton, NDataTable, NFormItem, NInput, NInputNumber, NSelect, useDialog, useMessage } from 'naive-ui';
import { getYardPageApi } from '@/api';
import {
    getCustomerBaseApi,
    getCustomerBaseDropdownApi,
    getSubsidiaryTraderListApi,
} from '@/api/customerManage';
import { getLatestRateChangeReasonApi } from '@/api/chemicalCompany';
import {
    createSalesPlanMonthlyPlan,
    getSalesPlanBasePricingByMonth,
    getSalesPlanMonthlyPlanDetail,
    getSalesPlanMonthlyPlanHistRemainDetail,
    getSalesPlanMonthlyPlanMonthlyDetail,
    updateSalesPlanMonthlyPlan,
} from '@/api/salesPlan';
import { getSalesPlanAiReportDetail, getSalesPlanAiReportDropDownList, getSalesPlanAiReportPage } from '@/api/aiReport';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import MxCommSelect from '@/components/CommSelect/index.vue';
import MxButton from '@/components/MxButton/index.vue';
import { storeToRefs } from 'pinia';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';
import { AI_REPORT_TYPE_LABEL_MAP } from '../../aiPrediction/commonTs/common';

// 客户类型常量：用于区分化工企业自动带入数据和贸易商手动录入数据。
const CUSTOMER_TYPE_CHEMICAL = 'CHEMICAL';
const CUSTOMER_TYPE_TRADER = 'TRADER';
const DEFAULT_MONTH_TIMESTAMP = dayjs().startOf('month').valueOf();
const DEFAULT_MONTH_TEXT = dayjs(DEFAULT_MONTH_TIMESTAMP).format('YYYY-MM');

const isEmptyValue = (value: any) => value === null || value === undefined || value === '';

const normalizeCustomerType = (value: any) => {
    const type = String(value || '').toUpperCase();
    if (type === CUSTOMER_TYPE_TRADER || value === '贸易商') return CUSTOMER_TYPE_TRADER;
    if (type === CUSTOMER_TYPE_CHEMICAL || value === '化工企业' || value === '化工厂') return CUSTOMER_TYPE_CHEMICAL;
    return CUSTOMER_TYPE_CHEMICAL;
};

// 数值字段统一兜底，避免空值/非法值参与剩余量和品位汇总计算时出现 NaN。
const toNumber = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const toText = (value: any) => (value === null || value === undefined ? '' : String(value));

/**
 * 将接口返回的关联基准定价单编码转换成下拉组件使用的数组。
 * @param value 逗号分隔的基准定价单编码或编码数组
 * @returns 去除空值后的编码数组
 */
const splitCodes = (value: any) => {
    if (Array.isArray(value)) return value.filter((item) => !isEmptyValue(item)).map((item) => String(item));
    if (isEmptyValue(value)) return [];
    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const normalizeGradeKey = (value: any) => {
    if (value === null || value === undefined || value === '') return '';
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return String(value).trim();
    return String(numberValue);
};

const getPersistedId = (value: any) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    return undefined;
};

// 新增计划量的默认行结构，用于贸易商手动新增明细。
const createQty = () => ({
    grade: null,
    deliveryAddress: '',
    deliveryLocationName: '',
    plannedQty: null,
    oreType: null,
    contractQty: null,
});

// 贸易商主表默认行结构；化工企业数据由基准定价单反查接口自动带入。
const createTraderItem = () => ({
    frontId: `trader-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    traderSelectKey: `trader-select-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    demandSource: '客户新增需求',
    contractCode: '',
    customerCode: '',
    customerName: '',
    customerType: CUSTOMER_TYPE_TRADER,
    subsidiaryId: null,
    subsidiaryName: '',
    transportMode: null,
    syncDiffReason: '',
    fundingStatus: '',
    downstreamSupplyChain: '',
    cooperationScaleTrade: '',
    importantChanges: '',
    negotiationStatus: '',
    remark: '',
    qtyDTOList: [createQty()],
});

const renderRequiredTitle = (title: string) =>
    h('span', { class: 'required-column-title' }, [h('span', { class: 'required-mark' }, '*'), title]);

export default () => {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();

    // 页面基础状态：区分新增/编辑、控制加载态和按钮提交态。
    const formRef = ref<any>(null);
    const submitLoading = ref(false);
    const pageLoading = ref(false);
    const { userInfo } = storeToRefs(useUserStore());
    const { dictMap } = storeToRefs(useDictStore());
    const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
    const recordId = computed(() => route.query.id as string | undefined);
    const isEdit = computed(() => Boolean(recordId.value));
    const pageTitle = computed(() => (isEdit.value ? '编辑月发货计划' : '新增月发货计划'));
    const transportModeOptions = computed<any[]>(() => dictMap.value?.['运输方式'] || []);
    const oreTypeOptions = computed<any[]>(() => dictMap.value?.['矿种'] || []);
    const aiModelOptions = computed<any[]>(() => dictMap.value?.['AI模型'] || []);
    const detailDrawerVisible = ref(false);
    const currentReport = ref<any>({});
    const reportDetailLoading = ref(false);
    const findDictOption = (options: any[], value: any) => {
        if (value === null || value === undefined || value === '') return null;
        return options.find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) =>
                    optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
            )
        );
    };
    const findTransportModeOption = (value: any) => {
        return findDictOption(transportModeOptions.value, value);
    };
    const getTransportModeValue = (value: any) => {
        if (value === null || value === undefined || value === '') return null;
        return findTransportModeOption(value)?.value ?? value;
    };
    const getOreTypeValue = (value: any) => {
        if (value === null || value === undefined || value === '') return null;
        return findDictOption(oreTypeOptions.value, value)?.value ?? value;
    };
    const getApplicantLarkUserId = (user: any) => {
        return user?.larkUserId || user?.feishuUserId || user?.larkId || '';
    };
    const formatReportType = (value?: string) => (value ? AI_REPORT_TYPE_LABEL_MAP[value] || value : '--');
    const formatAiModel = (value?: string) => {
        if (!value) return '--';
        const option = aiModelOptions.value.find((item: any) =>
            [item.value, item.label, item.code, item.name, item.text].some(
                (optionValue) =>
                    optionValue !== null && optionValue !== undefined && String(optionValue) === String(value)
            )
        );
        return option?.label || value;
    };
    const formatReportDetail = (row: any) => ({
        ...row,
        reportType: formatReportType(row.reportType),
        generatedAt: row.generationTime,
        historyRange: row.historicalSpan,
        dataSource: row.dataSources,
        modelName: row.aiModelName || formatAiModel(row.aiModel),
        conclusion: row.summaryConclusion,
    });

    // 表单主数据：字段尽量对齐 SalesPlanMonthlyDispatchDTO，提交前再做格式转换。
    const formData = ref<any>({
        monthlyMonth: DEFAULT_MONTH_TIMESTAMP,
        pricingMonthRange: [DEFAULT_MONTH_TIMESTAMP, DEFAULT_MONTH_TIMESTAMP],
        pricingMonthBegin: DEFAULT_MONTH_TEXT,
        pricingMonthEnd: DEFAULT_MONTH_TEXT,
        aiReportCode: '',
        basePricingCodes: [],
        remark: '',
        status: 'DRAFT',
        histRemainDetailList: [],
        monthlyAddDetailList: [],
        gradeSummaryList: [],
        applicantId: userInfo.value?.code || '',
        applicantName: userInfo.value?.username || '',
        larkUserId: getApplicantLarkUserId(userInfo.value),
        approvalRemark: '',
        instruction: '',
        attachmentUrls: [],
        associatedApproval: [],
    });

    const formRules = ref<any>({
        monthlyMonth: [
            { required: true, type: 'number', message: '请选择计划发货月份', trigger: ['change', 'blur'] },
        ],
        pricingMonthRange: [
            {
                required: true,
                type: 'array',
                validator: (_rule: any, value: any) => {
                    if (!Array.isArray(value) || value.length !== 2 || value.some((item) => !item)) {
                        return new Error('请选择定价月份');
                    }
                    if (dayjs(value[0]).isAfter(dayjs(value[1]), 'month')) {
                        return new Error('定价开始月份不能晚于结束月份');
                    }
                    return true;
                },
                trigger: ['change', 'blur'],
            },
        ],
        aiReportCode: [{ required: true, message: '请选择关联AI分析报告编号', trigger: ['change', 'blur'] }],
        basePricingCodes: [
            { required: true, type: 'array', message: '请选择关联基准定价单', trigger: ['change', 'blur'] },
        ],
        applicantId: [{ required: true, message: '请选择申请人', trigger: ['change', 'blur'] }],
        instruction: [{ required: true, message: '请输入事项说明', trigger: ['input', 'blur'] }],
    });

    // 下拉/树形选项数据，均由后端接口加载。
    const basePricingList = ref<any[]>([]);
    const aiReportList = ref<any[]>([]);
    const traderCustomerOptions = ref<any[]>([]);
    const subsidiaryTraderOptions = ref<Array<{ label: string; value: number | string }>>([]);
    const subsidiaryTraderLoading = ref(false);
    const yardOptions = ref<Array<{ label: string; value: string }>>([]);
    const yardLoading = ref(false);
    const basePricingChemicalAddDetailList = ref<any[]>([]);
    const basePricingTraderAddDetailList = ref<any[]>([]);
    const basePricingAddDetailCodes = ref('');

    // 本月新增计划明细按客户类型分 Tab 展示。
    const tabs = [
        { name: '化工企业', key: CUSTOMER_TYPE_CHEMICAL },
        { name: '贸易商', key: CUSTOMER_TYPE_TRADER },
    ];
    const tab = ref<any>(CUSTOMER_TYPE_CHEMICAL);

    const monthlyAddDetailTableList = computed(() =>
        (formData.value.monthlyAddDetailList || []).filter(
            (item: any) => normalizeCustomerType(item.customerType) === tab.value
        )
    );

    // 以下 render helper 统一处理表格内编辑组件，减少列定义里的重复代码。
    const renderInput = (row: any, key: string, maxlength = 255, disabled = false) =>
        h(NInput, {
            value: row[key],
            disabled,
            maxlength,
            showCount: !disabled,
            clearable: !disabled,
            placeholder: disabled ? '--' : '请输入',
            onUpdateValue(value: string) {
                row[key] = value;
            },
        });

    /**
     * 获取接口值对应的堆场编码，兼容接口暂时返回堆场名称的情况。
     * @param value 堆场编码或名称
     * @returns 堆场编码或无法匹配时的原值
     */
    const getYardCode = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const text = String(value);
        const option = yardOptions.value.find((item) => item.value === text || item.label === text);
        return option?.value || text;
    };

    /**
     * 获取堆场下拉选项对应的名称。
     * @param value 堆场编码或名称
     * @returns 下拉选项的 label，无法匹配时返回空字符串
     */
    const getYardName = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const text = String(value);
        const option = yardOptions.value.find((item) => item.value === text || item.label === text);
        return option?.label || '';
    };

    /**
     * 渲染堆场下拉选择框。
     * @param row 当前表格行数据
     * @param key 需要写入的字段名
     * @returns 堆场选择框虚拟节点
     */
    const renderYardSelect = (row: any, key: string) =>
        h(NSelect, {
            value: getYardCode(row[key]) || null,
            options: yardOptions.value,
            loading: yardLoading.value,
            filterable: true,
            clearable: true,
            placeholder: '请选择',
            onUpdateValue(value: string | number | null) {
                row[key] = value === null ? '' : String(value);
            },
        });

    const renderTextarea = (row: any, key: string, disabled = false) =>
        h(NInput, {
            value: row[key],
            disabled,
            type: 'textarea',
            maxlength: 255,
            showCount: !disabled,
            autosize: { minRows: 1, maxRows: 4 },
            placeholder: disabled ? '--' : '请输入',
            onUpdateValue(value: string) {
                row[key] = value;
            },
        });

    const formatPercentText = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const text = String(value).trim();
        return text.endsWith('%') ? text : `${text}%`;
    };

    const formatProductionStatusText = (value: any) => {
        const text = formatPercentText(value);
        return text ? `开工率：${text}` : text;
    };

    const renderReadonlyTextareaText = (value: any) =>
        h(NInput, {
            value,
            disabled: true,
            type: 'textarea',
            autosize: { minRows: 1, maxRows: 4 },
            placeholder: '--',
        });

    const renderNumber = (row: any, key: string, onChange?: () => void, disabled = false) =>
        h(NInputNumber, {
            value: row[key],
            min: 0,
            max: 999999999,
            precision: 2,
            disabled,
            showButton: false,
            placeholder: disabled ? '--' : '请输入',
            onUpdateValue(value: number | null) {
                row[key] = value;
                onChange?.();
            },
        });

    const fillTraderCustomerInfo = (row: any, customer: any) => {
        row.customerId = getPersistedId(customer?.customerId ?? customer?.id ?? customer?.value);
        row.customerCode = customer?.customerCode || (customer?.id ? String(customer.id) : customer?.value || '');
        row.customerName = customer?.customerName || customer?.label || '';
        const traderInfo = Array.isArray(customer?.traderList) ? customer.traderList[0] || {} : {};
        row.fundingStatus = toText(traderInfo.availableFunds);
        row.downstreamSupplyChain = toText(traderInfo.downstreamEnterprises);
        row.cooperationScaleTrade = toText(traderInfo.tradeScale);
    };

    const clearTraderCustomerInfo = (row: any) => {
        row.customerId = null;
        row.customerCode = '';
        row.customerName = '';
        row.fundingStatus = '';
        row.downstreamSupplyChain = '';
        row.cooperationScaleTrade = '';
    };

    const handleTraderCustomerChange = async (row: any, value: string | number | null, selectedCustomer?: any) => {
        if (!value && !selectedCustomer) {
            clearTraderCustomerInfo(row);
            return;
        }
        const customer =
            selectedCustomer || traderCustomerOptions.value.find((item: any) => String(item.value) === String(value));
        if (!customer) {
            row.customerCode = value ? String(value) : '';
            return;
        }

        row.customerCode = customer.customerCode || (value ? String(value) : '');
        row.customerName = customer.customerName || customer.label || '';

        const customerId = getPersistedId(customer.id ?? customer.customerId ?? value);
        if (!customerId) {
            fillTraderCustomerInfo(row, customer);
            return;
        }
        row.customerId = customerId;

        const currentCustomerCode = row.customerCode;
        const res = await getCustomerBaseApi(customerId);
        if (row.customerCode !== currentCustomerCode) return;

        if (res.code === 200 && res.data) {
            fillTraderCustomerInfo(row, {
                ...customer,
                ...res.data,
                customerCode: res.data.customerCode || customer.customerCode || currentCustomerCode,
            });
        } else {
            fillTraderCustomerInfo(row, customer);
        }
    };

    const renderTraderCustomerSelect = (row: any) =>
        h(MxCommSelect, {
            key: row.traderSelectKey || row.frontId,
            modelValue: row.customerCode || null,
            label: row.customerName || '',
            typeName: '企业客户',
            title: '企业客户',
            placeholder: '请选择',
            extraParams: {
                customerType: CUSTOMER_TYPE_TRADER,
                status: 'STORAGE',
            },
            options: traderCustomerOptions.value,
            clearable: true,
            text: false,
            'onUpdate:modelValue': (value: string | string[]) => {
                if (value === null || value === undefined || value === '') {
                    clearTraderCustomerInfo(row);
                    return;
                }
                row.customerCode = String(value);
            },
            'onUpdate:label': (label: string | string[] | null) => {
                row.customerName = Array.isArray(label) ? label.join('、') : label || '';
            },
            onChangeEvt: async (customer: any) => {
                await handleTraderCustomerChange(row, customer?.value ?? null, customer);
            },
        });

    /**
     * 将编辑详情中的子公司贸易商补入下拉选项，保证历史值能够正常回显。
     * @param row 本月新增计划贸易商明细
     */
    const ensureSubsidiaryTraderOption = (row: any) => {
        if (isEmptyValue(row.subsidiaryId) || !row.subsidiaryName) return;
        const exists = subsidiaryTraderOptions.value.some(
            (option) => String(option.value) === String(row.subsidiaryId)
        );
        if (!exists) {
            subsidiaryTraderOptions.value.push({
                label: row.subsidiaryName,
                value: row.subsidiaryId,
            });
        }
    };

    /**
     * 子公司贸易商选择变化时同步提交所需的 ID 和名称。
     * @param row 本月新增计划贸易商明细
     * @param value 子公司贸易商ID
     */
    const handleSubsidiaryTraderChange = (row: any, value: number | string | null) => {
        const option = subsidiaryTraderOptions.value.find(
            (item) => String(item.value) === String(value)
        );
        row.subsidiaryId = value ?? null;
        row.subsidiaryName = option?.label || '';
    };

    const renderSubsidiaryTraderSelect = (row: any) =>
        h(NSelect, {
            value: row.subsidiaryId ?? null,
            options: subsidiaryTraderOptions.value,
            loading: subsidiaryTraderLoading.value,
            placeholder: '请选择',
            filterable: true,
            clearable: true,
            onUpdateValue(value: number | string | null) {
                handleSubsidiaryTraderChange(row, value);
            },
        });

    const getPlanGradeValue = (qty: any) => qty?.grade ?? qty?.planGrade ?? qty?.oreGrade ?? qty?.plannedGrade;

    /**
     * 获取贸易商计划量的“计划品位+交货地址”唯一键。
     * @param qty 贸易商计划量明细
     * @returns 标准化品位与堆场编码组成的唯一键
     */
    const getTraderQtyGradeDeliveryKey = (qty: any) =>
        JSON.stringify([normalizeGradeKey(getPlanGradeValue(qty)), getYardCode(qty?.deliveryAddress)]);

    const renderMonthlyAddFormItem = (...args: any[]) => {
        const renderContent = args[4] as () => any;
        return h(NFormItem, {}, renderContent);
    };

    // 按品位自动汇总：历史剩余量 + 本月新增计划量 = 本月计划总量。
    const calculateGradeSummary = () => {
        const summaryMap = new Map<string, any>();
        const addValue = (grade: any, key: 'histRemainQty' | 'newPlannedQty', value: any) => {
            if (grade === null || grade === undefined || grade === '') return;
            const gradeKey = String(grade);
            const current = summaryMap.get(gradeKey) || {
                grade,
                histRemainQty: 0,
                newPlannedQty: 0,
                totalPlannedQty: 0,
            };
            current[key] += toNumber(value);
            current.totalPlannedQty = current.histRemainQty + current.newPlannedQty;
            summaryMap.set(gradeKey, current);
        };

        (formData.value.histRemainDetailList || []).forEach((item: any) => {
            addValue(item.grade, 'histRemainQty', item.remainQty);
        });
        (formData.value.monthlyAddDetailList || []).forEach((item: any) => {
            (item.qtyDTOList || []).forEach((qty: any) => {
                addValue(qty.grade, 'newPlannedQty', qty.plannedQty);
            });
        });
        formData.value.gradeSummaryList = Array.from(summaryMap.values()).sort(
            (a, b) => Number(a.grade) - Number(b.grade)
        );
    };

    const addQtyToParent = (parent: any) => {
        if (!parent) return;
        parent.qtyDTOList = parent.qtyDTOList || [];
        parent.qtyDTOList.push(createQty());
        calculateGradeSummary();
    };

    const removeQtyFromParent = (parent: any, index: number) => {
        if ((parent.qtyDTOList || []).length <= 1) {
            message.warning('计划量明细至少保留一项');
            return;
        }
        parent.qtyDTOList.splice(index, 1);
        if (!parent.qtyDTOList.length) parent.qtyDTOList.push(createQty());
        calculateGradeSummary();
    };

    const confirmRemoveQtyFromParent = (parent: any, index: number) => {
        if ((parent.qtyDTOList || []).length <= 1) {
            message.warning('计划量明细至少保留一项');
            return;
        }
        dialog.warning({
            title: '确认删除',
            content: '该计划量明细删除后不可恢复，确认要删除吗？',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: () => removeQtyFromParent(parent, index),
        });
    };

    const renderAddButton = (onClick: () => void, border = true) =>
        h(
            MxButton,
            {
                border,
                text: !border,
                type: 'success',
                onClick,
            },
            {
                leftIcon: () => h('i', { class: 'monthly-add-icon' }),
                default: () => '添加',
            }
        );

    // 历史合同剩余明细由后端接口提供，所有列仅用于展示。
    const historyColumns = [
        { key: 'contractCode', width: 180, title: '关联合同编号' },
        { key: 'customerName', width: 200, title: '企业名称' },
        {
            key: 'deliveryLocationName',
            width: 180,
            title: '交货地点',
            render: (row: any) => row.deliveryLocationName || '--',
        },
        {
            key: 'contractDate',
            width: 160,
            title: '合同签订日期',
            render: (row: any) => (row.contractDate ? dayjs(row.contractDate).format('YYYY-MM-DD') : '--'),
        },
        { key: 'grade', width: 140, title: '合同品位(%)' },
        { key: 'totalQty', width: 160, title: '合同总数量(吨)' },
        { key: 'shippedQty', width: 190, title: '累计已发货量(吨)' },
        { key: 'remainQty', width: 170, title: '本月剩余量(吨)' },
        {
            key: 'remark',
            title: '备注',
            width: 220,
            render: (row: any) => row.remark || '--',
        },
    ];

    // 历史剩余表格配置，交给 MxWebDataTable 渲染。
    const remainingDetails = computed<any>(() => ({
        columns: historyColumns,
        tableList: formData.value.histRemainDetailList || [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: { padding: '0px' },
        tableBtns: [],
        isShowPagination: false,
    }));

    // 本月新增计划量子表列：贸易商手动维护地址，化工企业展示接口返回的地址名称。
    const childColumns = computed(() => {
        return (_parIndex: number, parent: any) => {
            const columns: any[] = [
                { title: '序号', key: 'index', width: 80, render: (_row: any, index: number) => index + 1 },
                {
                    title: () => renderRequiredTitle('计划品位(%)'),
                    key: 'grade',
                    width: 160,
                    render: (row: any) =>
                        h(NFormItem, {}, () => {
                            if (normalizeCustomerType(parent.customerType) === CUSTOMER_TYPE_CHEMICAL) {
                                const grade = getPlanGradeValue(row);
                                return h(
                                    'span',
                                    { style: { color: isEmptyValue(grade) ? 'var(--base-grey)' : '' } },
                                    isEmptyValue(grade) ? '--' : grade
                                );
                            }
                            return h(NSelect, {
                                value: row.grade,
                                options: traderGradeOptions.value,
                                placeholder: '请选择',
                                clearable: true,
                                filterable: true,
                                onUpdateValue(value: any) {
                                    row.grade = value;
                                    calculateGradeSummary();
                                },
                            });
                        }),
                },
            ];
            if (normalizeCustomerType(parent.customerType) === CUSTOMER_TYPE_TRADER) {
                columns.push({
                    title: () => renderRequiredTitle('交货地址'),
                    key: 'deliveryAddress',
                    width: 220,
                    render: (row: any) => h(NFormItem, {}, () => renderYardSelect(row, 'deliveryAddress')),
                });
            } else {
                columns.push({
                    title: '交货地址',
                    key: 'deliveryLocationName',
                    width: 220,
                    render: (row: any) => row.deliveryLocationName || '--',
                });
            }
            columns.push(
                {
                    title: () => renderRequiredTitle('本月新增计划量(吨)'),
                    key: 'plannedQty',
                    width: 200,
                    render: (row: any) =>
                        h(NFormItem, {}, () => renderNumber(row, 'plannedQty', calculateGradeSummary)),
                },
                {
                    title: () => renderRequiredTitle('所属矿种'),
                    key: 'oreType',
                    width: 180,
                    render: (row: any) =>
                        h(NFormItem, {}, () =>
                            h(NSelect, {
                                value: getOreTypeValue(row.oreType),
                                options: oreTypeOptions.value,
                                placeholder: '请选择',
                                clearable: true,
                                onUpdateValue(value: string) {
                                    row.oreType = value;
                                },
                            })
                        ),
                },
                {
                    title: '本月新增合同量(吨)',
                    key: 'contractQty',
                    width: 190,
                    render: (row: any) =>
                        h(NFormItem, {}, () =>
                            h(
                                'span',
                                {
                                    style: {
                                        color: isEmptyValue(row.contractQty) ? 'var(--base-grey' : '',
                                    },
                                },
                                isEmptyValue(row.contractQty) ? '后续同步' : row.contractQty
                            )
                        ),
                }
            );
            if (normalizeCustomerType(parent.customerType) === CUSTOMER_TYPE_TRADER) {
                columns.push({
                    title: '操作',
                    key: 'action',
                    width: 100,
                    render: (_row: any, index: number) =>
                        h(
                            NButton,
                            {
                                size: 'tiny',
                                quaternary: true,
                                type: 'error',
                                onClick: () => confirmRemoveQtyFromParent(parent, index),
                            },
                            () => '删除'
                        ),
                });
            }
            return columns;
        };
    });

    const baseMonthlyAddColumns = computed<any[]>(() => [
        {
            type: 'expand',
            fixed: 'left',
            expandable: (row: any) => row.qtyDTOList?.length,
            renderExpand: (row: any) => {
                const realIndex = formData.value.monthlyAddDetailList.findIndex((item: any) => item === row);
                return h('div', { class: 'monthly-add-child-wrap' }, [
                    h('div', { class: 'monthly-add-child-title' }, '计划量'),
                    h(NDataTable, {
                        columns: childColumns.value(realIndex, row),
                        data: row.qtyDTOList || [],
                        pagination: false,
                        bordered: true,
                    }),
                    normalizeCustomerType(row.customerType) === CUSTOMER_TYPE_TRADER
                        ? h('div', { class: 'monthly-add-child-action' }, [
                              renderAddButton(() => addQtyToParent(row), false),
                          ])
                        : null,
                ]);
            },
        },
        { title: '序号', key: 'index', width: 80, fixed: 'left', render: (_row: any, index: number) => index + 1 },
        { title: '需求来源', key: 'demandSource', width: 150, render: (row: any) => row.demandSource || '客户新增需求' },
        {
            title: '关联新增合同编号',
            key: 'contractCode',
            width: 180,
            render: (row: any) => {
                return h(
                    'span',
                    {
                        style: {
                            color: row.contractCode ? '' : 'var(--base-grey',
                        },
                    },
                    row.contractCode || '后续同步'
                );
            },
        },
    ]);

    const transportModeColumn = {
        title: () => renderRequiredTitle('运输方式要求'),
        key: 'transportMode',
        width: 160,
        render: (row: any, index: number) =>
            renderMonthlyAddFormItem(row, index, 'transportMode', '运输方式要求', () =>
                h(NSelect, {
                    value: getTransportModeValue(row.transportMode),
                    options: transportModeOptions.value,
                    placeholder: '请选择',
                    clearable: true,
                    onUpdateValue(value: string) {
                        row.transportMode = value;
                    },
                })
            ),
    };

    const actionColumn = {
        title: '操作',
        key: 'action',
        width: 100,
        render: (row: any) =>
            normalizeCustomerType(row.customerType) === CUSTOMER_TYPE_TRADER
                ? h(
                      NButton,
                      {
                          size: 'tiny',
                          quaternary: true,
                          type: 'error',
                          onClick: () => confirmRemoveTraderItem(row),
                      },
                      () => '删除'
                  )
                : null,
    };

    const chemicalAddColumns = computed<any[]>(() => [
        ...baseMonthlyAddColumns.value,
        {
            title: '子公司贸易商',
            key: 'subsidiaryName',
            width: 200,
            render: (row: any) => row.subsidiaryName || '--',
        },
        {
            title: () => renderRequiredTitle('企业名称'),
            key: 'customerName',
            width: 220,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'customerName', '企业名称', () =>
                    renderInput(row, 'customerName', 100, row.customerType === CUSTOMER_TYPE_CHEMICAL)
                ),
        },
        transportModeColumn,
        {
            title: '合同同步差异原因',
            key: 'syncDiffReason',
            width: 200,
            render: (row: any) =>
                h(NFormItem, {}, () => {
                    return h(
                        'span',
                        {
                            style: {
                                color: row.syncDiffReason ? '' : 'var(--base-grey',
                            },
                        },
                        row.syncDiffReason || '后续同步'
                    );
                }),
        },
        {
            title: '库存情况（万吨）',
            key: 'inventoryStatus',
            width: 200,
            render: (row: any) => h(NFormItem, {}, () => renderTextarea(row, 'inventoryStatus', true)),
        },
        {
            title: '生产情况',
            key: 'productionStatus',
            width: 200,
            render: (row: any) => h(NFormItem, {}, () => renderReadonlyTextareaText(formatProductionStatusText(row.productionStatus))),
        },
        {
            title: '本月采购计划',
            key: 'purchasePlan',
            width: 200,
            render: (row: any) => h(NFormItem, {}, () => renderTextarea(row, 'purchasePlan', true)),
        },
        {
            title: '合作规模（万吨/年）',
            key: 'cooperationScaleChem',
            width: 200,
            render: (row: any) => h(NFormItem, {}, () => renderTextarea(row, 'cooperationScaleChem')),
        },
        {
            title: '重要变化',
            key: 'importantChanges',
            width: 200,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'importantChanges', '重要变化', () =>
                    renderTextarea(row, 'importantChanges')
                ),
        },
        {
            title: '谈判情况',
            key: 'negotiationStatus',
            width: 200,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'negotiationStatus', '谈判情况', () =>
                    renderTextarea(row, 'negotiationStatus')
                ),
        },
        {
            title: '备注',
            key: 'remark',
            width: 180,
            render: (row: any) => h(NFormItem, {}, () => renderInput(row, 'remark')),
        },
    ]);

    const traderAddColumns = computed<any[]>(() => [
        ...baseMonthlyAddColumns.value,
        {
            title: '子公司贸易商',
            key: 'subsidiaryId',
            width: 220,
            render: (row: any) => h(NFormItem, {}, () => renderSubsidiaryTraderSelect(row)),
        },
        {
            title: () => renderRequiredTitle('企业名称'),
            key: 'customerName',
            width: 220,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'customerName', '企业名称', () => renderTraderCustomerSelect(row)),
        },
        transportModeColumn,
        {
            title: '合同同步差异原因',
            key: 'syncDiffReason',
            width: 200,
            render: (row: any) =>
                h(NFormItem, {}, () => {
                    return h(
                        'span',
                        {
                            style: {
                                color: row.syncDiffReason ? '' : 'var(--base-grey',
                            },
                        },
                        row.syncDiffReason || '后续同步'
                    );
                }),
        },
        {
            title: () => renderRequiredTitle('资金情况(万元)'),
            key: 'fundingStatus',
            width: 200,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'fundingStatus', '资金情况', () =>
                    renderTextarea(row, 'fundingStatus')
                ),
        },
        {
            title: () => renderRequiredTitle('下游供应企业'),
            key: 'downstreamSupplyChain',
            width: 220,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'downstreamSupplyChain', '下游供应企业', () =>
                    renderTextarea(row, 'downstreamSupplyChain')
                ),
        },
        {
            title: '合作规模（万吨/年）',
            key: 'cooperationScaleTrade',
            width: 200,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'cooperationScaleTrade', '合作规模（万吨/年）', () =>
                    renderTextarea(row, 'cooperationScaleTrade')
                ),
        },
        {
            title: '重要变化',
            key: 'importantChanges',
            width: 200,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'importantChanges', '重要变化', () =>
                    renderTextarea(row, 'importantChanges')
                ),
        },
        {
            title: '谈判情况',
            key: 'negotiationStatus',
            width: 200,
            render: (row: any, index: number) =>
                renderMonthlyAddFormItem(row, index, 'negotiationStatus', '谈判情况', () =>
                    renderTextarea(row, 'negotiationStatus')
                ),
        },
        {
            title: '备注',
            key: 'remark',
            width: 180,
            render: (row: any) => h(NFormItem, {}, () => renderInput(row, 'remark')),
        },
        actionColumn,
    ]);

    // 本月新增计划明细主表列：化工企业自动带入字段只展示，贸易商按客户档案下拉维护。
    const addRemainingDataColumns = computed<any[]>(() =>
        tab.value === CUSTOMER_TYPE_TRADER ? traderAddColumns.value : chemicalAddColumns.value
    );
    const monthlyAddTableScrollX = computed(() =>
        addRemainingDataColumns.value.reduce((total, column) => total + (Number(column.width) || 48), 0)
    );

    // 按品位汇总表列：数据由 calculateGradeSummary 自动生成，不允许手动编辑。
    const summaryColumns = [
        { key: 'grade', title: '计划品位(%)' },
        { key: 'histRemainQty', title: '历史合同剩余量(吨)' },
        { key: 'newPlannedQty', title: '本月新增计划量(吨)' },
        { key: 'totalPlannedQty', title: '本月计划总量(吨)' },
    ];

    // 汇总表配置。
    const allTableConfig = computed<any>(() => ({
        columns: summaryColumns,
        tableList: formData.value.gradeSummaryList || [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: { padding: '0px' },
        tableBtns: [],
        isShowPagination: false,
    }));

    /**
     * 将日期选择器的值转换成后端要求的月份字符串。
     * @param value 日期时间戳或月份字符串
     * @returns YYYY-MM 格式的月份，值无效时返回空字符串
     */
    const formatPricingMonth = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const date = dayjs(value);
        return date.isValid() ? date.format('YYYY-MM') : '';
    };

    /**
     * 将后端月份字段转换为月份范围选择器的值。
     * @param begin 开始月份
     * @param end 结束月份
     * @returns 月份范围时间戳数组
     */
    const getPricingMonthRange = (begin: any, end: any) => {
        const beginDate = dayjs(begin);
        const endDate = dayjs(end);
        if (!beginDate.isValid() || !endDate.isValid()) {
            return null;
        }
        return [beginDate.startOf('month').valueOf(), endDate.startOf('month').valueOf()];
    };

    /**
     * 同步定价月份展示值和后端提交字段。
     * @param value 月份范围选择器返回的时间戳数组或空值
     * @returns void
     */
    const syncPricingMonthFields = (value: any) => {
        const isValidRange =
            Array.isArray(value) &&
            value.length === 2 &&
            value.every((item) => item !== null && item !== undefined && dayjs(item).isValid());
        const range = isValidRange ? value : null;
        formData.value.pricingMonthRange = range;
        formData.value.pricingMonthBegin = formatPricingMonth(range?.[0]);
        formData.value.pricingMonthEnd = formatPricingMonth(range?.[1]);
    };

    const formatBasePricingOptionLabel = (item: any) => {
        const pricingCode = item.pricingCode || '--';
        if (normalizeCustomerType(item.customerType) === CUSTOMER_TYPE_TRADER) return `贸易商-${pricingCode}`;
        return `${item.customerName || item.projectName || '--'} - ${pricingCode}`;
    };

    /**
     * 将基准定价接口结果转换成去重后的下拉选项。
     * @param list 基准定价接口返回的数据
     * @returns 基准定价下拉选项
     */
    const mapBasePricingOptions = (list: any[]) => {
        const codeSet = new Set<string>();
        return list.reduce((options: any[], item: any) => {
            const pricingCode = String(item?.pricingCode || '').trim();
            if (!pricingCode || codeSet.has(pricingCode)) return options;
            codeSet.add(pricingCode);
            options.push({
                ...item,
                label: formatBasePricingOptionLabel(item),
                value: pricingCode,
            });
            return options;
        }, []);
    };

    /**
     * 将定价月份转换为可比较的时间戳。
     * @param value 定价月份
     * @returns 有效月份的时间戳，无效值返回最小值
     */
    const getComparableMonth = (value: any) => {
        if (value === null || value === undefined || value === '') return Number.NEGATIVE_INFINITY;
        const month = dayjs(value);
        return month.isValid() ? month.startOf('month').valueOf() : Number.NEGATIVE_INFINITY;
    };

    /**
     * 将创建时间转换为可比较的时间戳。
     * @param value 创建时间
     * @returns 有效创建时间的时间戳，无效值返回最小值
     */
    const getComparableDateTime = (value: any) => {
        if (value === null || value === undefined || value === '') return Number.NEGATIVE_INFINITY;
        const dateTime = dayjs(value);
        return dateTime.isValid() ? dateTime.valueOf() : Number.NEGATIVE_INFINITY;
    };

    /**
     * 获取最新的贸易商基准定价单，月份相同时再比较创建时间。
     * @param options 基准定价下拉选项
     * @returns 最新贸易商选项，不存在时返回 null
     */
    const getLatestTraderOption = (options: any[]) =>
        options.reduce((latestOption: any, option: any) => {
            if (normalizeCustomerType(option.customerType) !== CUSTOMER_TYPE_TRADER) return latestOption;
            if (!latestOption) return option;
            const monthDifference =
                getComparableMonth(option.pricingMonth) - getComparableMonth(latestOption.pricingMonth);
            if (monthDifference > 0) return option;
            if (monthDifference < 0) return latestOption;
            return getComparableDateTime(option.createdAt) > getComparableDateTime(latestOption.createdAt)
                ? option
                : latestOption;
        }, null);

    /**
     * 生成基准定价单默认值：全部化工企业和最新的一条贸易商数据。
     * @param options 基准定价下拉选项
     * @returns 默认选中的基准定价单编码
     */
    const getDefaultBasePricingCodes = (options: any[]) => {
        const latestTraderOption = getLatestTraderOption(options);
        return options
            .filter(
                (option: any) =>
                    normalizeCustomerType(option.customerType) === CUSTOMER_TYPE_CHEMICAL ||
                    option === latestTraderOption
            )
            .map((option: any) => option.value);
    };

    /**
     * 请求基准定价列表。
     * @param params 基准定价查询条件
     * @returns 基准定价数据列表
     */
    const fetchBasePricingList = async (params: Record<string, any>) => {
        const res = await getSalesPlanBasePricingByMonth(params);
        if (res.code !== 200) {
            throw new Error('基准定价单查询失败');
        }
        return Array.isArray(res.data) ? res.data : [];
    };

    /**
     * 按定价月份范围加载下拉选项。
     * @param autoSelect 是否在查询成功后应用默认选择规则
     * @returns 异步加载结果
     */
    const loadBasePricingList = async (autoSelect = false) => {
        const pricingMonthBegin = formData.value.pricingMonthBegin;
        const pricingMonthEnd = formData.value.pricingMonthEnd;
        if (!pricingMonthBegin || !pricingMonthEnd) {
            basePricingList.value = [];
            return;
        }
        try {
            const list = await fetchBasePricingList({
                status: 'APPROVED',
                pricingMonthBegin,
                pricingMonthEnd,
            });
            basePricingList.value = mapBasePricingOptions(list);
            if (autoSelect) {
                const basePricingCodes = getDefaultBasePricingCodes(basePricingList.value);
                await handleBasePricingCodesChange(basePricingCodes);
            }
        } catch {
            basePricingList.value = [];
            message.error('基准定价单加载失败，请稍后重试');
        }
    };

    // AI 报告列表只在页面初始化时查询一次，表单仅保存 reportCode。
    const loadAiReports = async () => {
        try {
            const res = await getSalesPlanAiReportDropDownList();
            if (res.code === 200) {
                aiReportList.value = (res.data || []).map((item: any) => ({
                    label: item.reportName,
                    value: item.reportCode,
                    ...item,
                }));
            }
        } catch {
            aiReportList.value = [];
            message.error('AI分析报告加载失败，请稍后重试');
        }
    };

    const findSelectedAiReport = () =>
        aiReportList.value.find(
            (item: any) =>
                String(item.value) === String(formData.value.aiReportCode) ||
                String(item.reportCode) === String(formData.value.aiReportCode)
        );

    const findAiReportByCode = async (reportCode: string) => {
        try {
            const res = await getSalesPlanAiReportPage({
                current: 1,
                size: 10,
                reportCode,
            });
            if (res.code !== 200) return null;
            const records = res.data?.records || [];
            return (
                records.find((item: any) => String(item.reportCode) === String(reportCode)) ||
                records[0] ||
                null
            );
        } catch {
            return null;
        }
    };

    const openSelectedReportDetail = async () => {
        if (!formData.value.aiReportCode) {
            message.warning('请选择关联AI分析报告编号');
            return;
        }
        if (reportDetailLoading.value) return;

        reportDetailLoading.value = true;
        try {
            let report = findSelectedAiReport();
            let reportId = report?.id || report?.reportId || report?.aiReportId;

            if (!reportId) {
                const queriedReport = await findAiReportByCode(String(formData.value.aiReportCode));
                report = queriedReport || report;
                reportId = report?.id || report?.reportId || report?.aiReportId;
            }

            if (!reportId) {
                message.warning('暂无关联AI分析报告详情');
                return;
            }

            currentReport.value = {};
            const res = await getSalesPlanAiReportDetail(reportId);
            if (res.code === 200) {
                currentReport.value = formatReportDetail({
                    ...report,
                    ...(res.data || {}),
                });
                detailDrawerVisible.value = true;
            } else {
                message.error(res.msg || '获取AI分析报告详情失败');
            }
        } catch {
            message.error('获取AI分析报告详情失败');
        } finally {
            reportDetailLoading.value = false;
        }
    };

    const loadTraderCustomers = async () => {
        const res = await getCustomerBaseDropdownApi({
            customerType: CUSTOMER_TYPE_TRADER,
            status: 'STORAGE',
        });
        if (res.code === 200) {
            traderCustomerOptions.value = (res.data || []).map((item: any) => ({
                ...item,
                label: item.customerName,
                value: item.customerCode || String(item.id),
            }));
        }
    };

    /**
     * 获取子公司贸易商下拉选项。
     */
    const loadSubsidiaryTraderOptions = async () => {
        subsidiaryTraderLoading.value = true;
        try {
            const res = await getSubsidiaryTraderListApi();
            if (res.code !== 200) {
                subsidiaryTraderOptions.value = [];
                return;
            }
            subsidiaryTraderOptions.value = (Array.isArray(res.data) ? res.data : []).reduce(
                (options: Array<{ label: string; value: number | string }>, item: any) => {
                    if (isEmptyValue(item?.id) || !item?.customerName) return options;
                    options.push({
                        label: item.customerName,
                        value: item.id,
                    });
                    return options;
                },
                []
            );
        } catch {
            subsidiaryTraderOptions.value = [];
            message.error('子公司贸易商加载失败，请稍后重试');
        } finally {
            subsidiaryTraderLoading.value = false;
        }
    };

    /**
     * 获取启用的堆场并转换为名称展示、编码提交的下拉选项。
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
        } finally {
            yardLoading.value = false;
        }
    };

    /**
     * 查询并展示新增页面的历史合同剩余明细。
     * 历史明细按后端返回结果原样保存，新增或编辑提交时直接透传。
     * @returns 异步加载结果
     */
    const loadHistRemainDetail = async () => {
        try {
            const res = await getSalesPlanMonthlyPlanHistRemainDetail({});
            if (res.code === 200) {
                formData.value.histRemainDetailList = res.data || [];
                calculateGradeSummary();
            }
        } catch {
            formData.value.histRemainDetailList = [];
        }
    };

    // 本月新增明细结构标准化：统一 qtyDTOList、customerType、frontId 等前端渲染必需字段。
    /**
     * 将详情接口返回的本月新增计划主体转换为编辑表格数据。
     * `child` 仅作为当前表格组件的展示别名，真实数据始终来自接口字段 `qtyDTOList`。
     * @param item 本月新增计划主体
     * @param index 主体在接口数组中的下标
     * @returns 编辑表格使用的本月新增计划主体
     */
    const normalizeMonthlyAddItem = (item: any, index = 0) => {
        const customerType = normalizeCustomerType(item.customerType);
        const qtyDTOList = (item.qtyDTOList || []).map((qty: any) => ({
            id: qty.id,
            itemId: qty.itemId,
            monthlyId: qty.monthlyId,
            grade: qty.grade,
            deliveryAddress:
                customerType === CUSTOMER_TYPE_TRADER ? getYardCode(qty.deliveryAddress) : qty.deliveryAddress,
            deliveryLocationName: qty.deliveryLocationName,
            plannedQty: qty.plannedQty,
            oreType: qty.oreType,
            contractQty: qty.contractQty,
            monthlyCode: qty.monthlyCode,
        }));
        return {
            id: item.id,
            monthlyId: item.monthlyId,
            demandSource: item.demandSource,
            customerCode: item.customerCode,
            customerId: item.customerId,
            customerName: item.customerName,
            customerType,
            transportMode: item.transportMode,
            syncDiffReason: item.syncDiffReason,
            remark: item.remark,
            inventoryStatus: item.inventoryStatus,
            productionStatus: item.productionStatus,
            purchasePlan: item.purchasePlan,
            cooperationScaleChem: item.cooperationScaleChem,
            fundingStatus: item.fundingStatus,
            downstreamSupplyChain: item.downstreamSupplyChain,
            cooperationScaleTrade: item.cooperationScaleTrade,
            importantChanges: item.importantChanges,
            negotiationStatus: item.negotiationStatus,
            monthlyCode: item.monthlyCode,
            contractCode: item.contractCode,
            pricingCode: item.pricingCode,
            subsidiaryId: item.subsidiaryId,
            subsidiaryName: item.subsidiaryName,
            qtyDTOList,
            frontId: item.id || `${customerType}-${index}`,
            child: qtyDTOList,
        };
    };

    const isSameMonthlyAddCustomer = (source: any, target: any) => {
        const compareKeys = ['pricingCode', 'customerCode', 'customerId', 'customerName'];
        return compareKeys.some((key) => {
            const sourceValue = toText(source?.[key]).trim();
            const targetValue = toText(target?.[key]).trim();
            return sourceValue && targetValue && sourceValue === targetValue;
        });
    };

    const findTraderMatchedPricing = (item: any, qty: any) => {
        const gradeKey = normalizeGradeKey(getPlanGradeValue(qty));
        if (!gradeKey) return null;

        const findMatchedPricing = (list: any[]) => {
            for (const baseItem of list || []) {
                const matchedQty = (baseItem.qtyDTOList || []).find(
                    (baseQty: any) => normalizeGradeKey(getPlanGradeValue(baseQty)) === gradeKey
                );
                if (matchedQty) return { item: baseItem, qty: matchedQty };
            }
            return null;
        };

        const customerMatchedList = basePricingTraderAddDetailList.value.filter((baseItem: any) =>
            isSameMonthlyAddCustomer(baseItem, item)
        );
        return findMatchedPricing(customerMatchedList) || findMatchedPricing(basePricingTraderAddDetailList.value);
    };

    const getTraderMatchedPricingCode = (item: any, qty: any) => {
        const matchedPricing = findTraderMatchedPricing(item, qty);
        return toText(matchedPricing?.qty?.pricingCode || matchedPricing?.item?.pricingCode).trim();
    };

    const getTraderMatchedItemPricingCode = (item: any) => {
        for (const qty of item.qtyDTOList || []) {
            const pricingCode = getTraderMatchedPricingCode(item, qty);
            if (pricingCode) return pricingCode;
        }
        return toText(item.pricingCode).trim();
    };

    const cleanMonthlyAddItem = (item: any) => {
        const rest = { ...item };
        delete rest.frontId;
        delete rest.child;
        const customerType = normalizeCustomerType(item.customerType);
        return {
            ...rest,
            id: getPersistedId(item.id),
            monthlyId: getPersistedId(item.monthlyId),
            customerId: getPersistedId(item.customerId),
            subsidiaryId: getPersistedId(item.subsidiaryId) ?? null,
            subsidiaryName: item.subsidiaryName || '',
            pricingCode:
                customerType === CUSTOMER_TYPE_TRADER ? getTraderMatchedItemPricingCode(item) : item.pricingCode,
            demandSource: item.demandSource || '客户新增需求',
            transportMode: getTransportModeValue(item.transportMode),
            qtyDTOList: (item.qtyDTOList || []).map((qty: any) => {
                const qtyRest = { ...qty };
                delete qtyRest.frontId;
                delete qtyRest.pricingCode;
                return {
                    ...qtyRest,
                    id: getPersistedId(qty.id),
                    itemId: getPersistedId(qty.itemId),
                    monthlyId: getPersistedId(qty.monthlyId),
                    deliveryAddress:
                        customerType === CUSTOMER_TYPE_TRADER
                            ? getYardCode(qty.deliveryAddress)
                            : qty.deliveryAddress,
                    deliveryLocationName:
                        customerType === CUSTOMER_TYPE_TRADER
                            ? getYardName(qty.deliveryAddress) || qty.deliveryLocationName || ''
                            : qty.deliveryLocationName,
                    oreType: getOreTypeValue(qty.oreType),
                };
            }),
        };
    };

    const buildMonthlyAddDetailList = () =>
        (formData.value.monthlyAddDetailList || []).map((item: any) => cleanMonthlyAddItem(item));

    const parseAssociatedApproval = (value: any) => {
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

    /**
     * 将月发货计划详情接口数据转换为编辑表单模型。
     * 编辑回显只读取详情接口对应字段，不通过其他接口或历史字段推导业务值。
     * @param data 月发货计划详情接口的 data 节点
     * @returns 编辑表单使用的数据模型
     */
    const formatMonthlyDispatchDetailForEdit = (data: any) => {
        const approvalDTO = data.approvalDTO || {};
        const approveUrl = Array.isArray(approvalDTO.approveUrl) ? approvalDTO.approveUrl : [];
        const monthlyMonth = dayjs(data.monthlyMonth);
        return {
            id: data.id,
            monthlyCode: data.monthlyCode,
            monthlyId: data.monthlyId,
            pricingMonthBegin: data.pricingMonthBegin,
            pricingMonthEnd: data.pricingMonthEnd,
            pricingMonthRange: getPricingMonthRange(data.pricingMonthBegin, data.pricingMonthEnd),
            monthlyMonth: monthlyMonth.isValid() ? monthlyMonth.valueOf() : null,
            basePricingCodes: splitCodes(data.basePricingCodes),
            summaryByGrade: data.summaryByGrade,
            contractDiffSummary: data.contractDiffSummary,
            applicantId: data.applicantId,
            applyDeptId: data.applyDeptId,
            companyId: data.companyId,
            instruction: data.instruction,
            remark: data.remark,
            status: data.status,
            approvalInstanceId: data.approvalInstanceId,
            companyName: data.companyName,
            applicantName: data.applicantName,
            aiReportCode: data.aiReportCode,
            aiReportId: data.aiReportId,
            histRemainDetailList: Array.isArray(data.histRemainDetailList) ? data.histRemainDetailList : [],
            monthlyAddDetailList: Array.isArray(data.monthlyAddDetailList)
                ? data.monthlyAddDetailList.map((item: any, index: number) => normalizeMonthlyAddItem(item, index))
                : [],
            gradeSummaryList: Array.isArray(data.gradeSummaryList) ? data.gradeSummaryList : [],
            larkUserId: approvalDTO.larkUserId,
            approvalRemark: approvalDTO.remark,
            attachmentUrls: approveUrl,
            associatedApproval: parseAssociatedApproval(approvalDTO.associatedApproval),
            approvalDTO: {
                id: approvalDTO.id,
                applyDeptName: approvalDTO.applyDeptName,
                companyName: approvalDTO.companyName,
                remark: approvalDTO.remark,
                approveUrl,
                associatedApproval: approvalDTO.associatedApproval,
                larkUserId: approvalDTO.larkUserId,
            },
        };
    };

    const resetBasePricingAddDetailCache = () => {
        basePricingChemicalAddDetailList.value = [];
        basePricingTraderAddDetailList.value = [];
        basePricingAddDetailCodes.value = '';
    };

    const setBasePricingAddDetailCache = (list: any[], codes: string) => {
        basePricingChemicalAddDetailList.value = list.filter(
            (item: any) => normalizeCustomerType(item.customerType) === CUSTOMER_TYPE_CHEMICAL
        );
        basePricingTraderAddDetailList.value = list.filter(
            (item: any) => normalizeCustomerType(item.customerType) === CUSTOMER_TYPE_TRADER
        );
        basePricingAddDetailCodes.value = codes;
    };

    const getAvailableGradeSet = (list: any[]) => {
        const gradeSet = new Set<string>();
        (list || []).forEach((item: any) => {
            (item.qtyDTOList || []).forEach((qty: any) => {
                const gradeKey = normalizeGradeKey(getPlanGradeValue(qty));
                if (gradeKey) gradeSet.add(gradeKey);
            });
        });
        return gradeSet;
    };

    const getAvailableGradeText = (list: any[]) => {
        const grades = Array.from(getAvailableGradeSet(list));
        if (!grades.length) return '无';
        return grades.sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)).join('、');
    };

    const getChemicalAvailableDetailList = (item: any) => {
        const matchedList = basePricingChemicalAddDetailList.value.filter((baseItem: any) =>
            isSameMonthlyAddCustomer(baseItem, item)
        );
        return matchedList.length ? matchedList : basePricingChemicalAddDetailList.value;
    };

    const getChemicalAvailableGradeSet = (item: any) => getAvailableGradeSet(getChemicalAvailableDetailList(item));

    const getChemicalAvailableGradeText = (item: any) => getAvailableGradeText(getChemicalAvailableDetailList(item));

    const traderGradeOptions = computed(() => {
        const gradeMap = new Map<string, any>();
        basePricingTraderAddDetailList.value.forEach((item: any) => {
            (item.qtyDTOList || []).forEach((qty: any) => {
                const grade = getPlanGradeValue(qty);
                const gradeKey = normalizeGradeKey(grade);
                if (gradeKey && !gradeMap.has(gradeKey)) {
                    gradeMap.set(gradeKey, grade);
                }
            });
        });
        return Array.from(gradeMap.values())
            .sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)))
            .map((grade) => ({
                label: String(grade),
                value: grade,
            }));
    });

    const ensureBasePricingAddDetailLoaded = async () => {
        const codes = (formData.value.basePricingCodes || []).join(',');
        if (!codes) {
            resetBasePricingAddDetailCache();
            return;
        }
        if (basePricingAddDetailCodes.value === codes) return;

        const res = await getSalesPlanMonthlyPlanMonthlyDetail(codes);
        if (res.code !== 200) {
            resetBasePricingAddDetailCache();
            throw new Error('基准定价单数据获取失败');
        }
        const fetchedList = (res.data || []).map((item: any, index: number) => normalizeMonthlyAddItem(item, index));
        setBasePricingAddDetailCache(fetchedList, codes);
    };

    const getChemicalSurveyCustomerId = (item: any) => {
        if (item.customerId) return item.customerId;
        const matchedBasePricing = basePricingList.value.find((basePricing: any) => {
            if (item.pricingCode && basePricing.pricingCode) {
                return String(item.pricingCode) === String(basePricing.pricingCode);
            }
            if (item.customerCode && basePricing.customerCode) {
                return String(item.customerCode) === String(basePricing.customerCode);
            }
            return false;
        });
        return matchedBasePricing?.customerId || '';
    };

    const fillChemicalImportantChanges = async (list: any[]) => {
        await Promise.all(
            list
                .filter((item: any) => normalizeCustomerType(item.customerType) === CUSTOMER_TYPE_CHEMICAL)
                .map(async (item: any) => {
                    const customerId = getChemicalSurveyCustomerId(item);
                    if (!customerId) return;
                    try {
                        const res = await getLatestRateChangeReasonApi(customerId);
                        if (res.code === 200) {
                            const rateChangeReason = toText(res.data);
                            if (rateChangeReason) item.importantChanges = rateChangeReason;
                        }
                    } catch {
                        // 调研信息拉取失败时保留原有明细，避免影响主流程。
                    }
                })
        );
    };

    const validateTableData = () => {
        const typeRowIndexMap = {
            [CUSTOMER_TYPE_CHEMICAL]: 0,
            [CUSTOMER_TYPE_TRADER]: 0,
        };

        for (const item of formData.value.monthlyAddDetailList || []) {
            const customerType = normalizeCustomerType(item.customerType);
            const typeName = customerType === CUSTOMER_TYPE_TRADER ? '贸易商' : '化工企业';
            typeRowIndexMap[customerType] += 1;
            const rowIndex = typeRowIndexMap[customerType];
            const requiredFields = [
                { key: 'customerName', label: '企业名称' },
                { key: 'transportMode', label: '运输方式要求' },
            ];

            if (customerType === CUSTOMER_TYPE_TRADER) {
                requiredFields.push(
                    { key: 'fundingStatus', label: '资金情况' },
                    { key: 'downstreamSupplyChain', label: '下游供应企业' }
                );
            }

            const invalidField = requiredFields.find((field) => isEmptyValue(item[field.key]));
            if (invalidField) {
                return `本月新增计划明细(${typeName})第${rowIndex}行的${invalidField.label}必填`;
            }

            if (!item.qtyDTOList?.length) {
                return `本月新增计划明细(${typeName})第${rowIndex}行的计划量明细不能为空`;
            }

            const traderQtyKeyIndexMap = new Map<string, number>();
            for (let qtyIndex = 0; qtyIndex < item.qtyDTOList.length; qtyIndex += 1) {
                const qty = item.qtyDTOList[qtyIndex];
                const grade = getPlanGradeValue(qty);
                if (isEmptyValue(grade)) {
                    return `本月新增计划明细(${typeName})第${rowIndex}行，本月新增计划量第${
                        qtyIndex + 1
                    }行的计划品位必填`;
                }
                if (customerType === CUSTOMER_TYPE_TRADER && isEmptyValue(qty.deliveryAddress)) {
                    return `本月新增计划明细(${typeName})第${rowIndex}行，本月新增计划量第${
                        qtyIndex + 1
                    }行的交货地址必填`;
                }
                if (isEmptyValue(qty.plannedQty)) {
                    return `本月新增计划明细(${typeName})第${rowIndex}行，本月新增计划量第${
                        qtyIndex + 1
                    }行的本月新增计划量必填`;
                }
                if (isEmptyValue(qty.oreType)) {
                    return `本月新增计划明细(${typeName})第${rowIndex}行，本月新增计划量第${
                        qtyIndex + 1
                    }行的所属矿种必填`;
                }
                if (customerType === CUSTOMER_TYPE_TRADER) {
                    const uniqueKey = getTraderQtyGradeDeliveryKey(qty);
                    const duplicateIndex = traderQtyKeyIndexMap.get(uniqueKey);
                    if (duplicateIndex !== undefined) {
                        return `本月新增计划明细(${typeName})第${rowIndex}行，本月新增计划量第${
                            qtyIndex + 1
                        }行的计划品位(%)和交货地址与第${duplicateIndex + 1}行重复`;
                    }
                    traderQtyKeyIndexMap.set(uniqueKey, qtyIndex);
                }
            }
        }

        return '';
    };

    // 根据选中的基准定价单号拉取本月新增计划明细；基准定价单变化后清除旧贸易商数据。
    const loadMonthlyAddDetail = async () => {
        const codes = (formData.value.basePricingCodes || []).join(',');
        if (!codes) {
            resetBasePricingAddDetailCache();
            formData.value.monthlyAddDetailList = [];
            calculateGradeSummary();
            return;
        }
        try {
            const res = await getSalesPlanMonthlyPlanMonthlyDetail(codes);
            if (res.code === 200) {
                const fetchedList = (res.data || []).map((item: any, index: number) =>
                    normalizeMonthlyAddItem(item, index)
                );
                setBasePricingAddDetailCache(fetchedList, codes);
                const displayFetchedList = fetchedList.filter(
                    (item: any) => normalizeCustomerType(item.customerType) !== CUSTOMER_TYPE_TRADER
                );
                await fillChemicalImportantChanges(displayFetchedList);
                formData.value.monthlyAddDetailList = displayFetchedList;
                calculateGradeSummary();
            }
        } catch {
            resetBasePricingAddDetailCache();
            // 该接口当前后端偶发超时，失败时保留页面可编辑状态。
        }
    };

    // 编辑态加载主表详情；历史合同剩余明细由详情接口返回并原样回显。
    const loadDetail = async () => {
        if (!recordId.value) return;
        pageLoading.value = true;
        try {
            const res = await getSalesPlanMonthlyPlanDetail(recordId.value, true);
            if (res.code === 200) {
                const data = res.data || {};
                const approvalDTO = data.approvalDTO || {};
                formData.value = formatMonthlyDispatchDetailForEdit(data);
                (formData.value.monthlyAddDetailList || [])
                    .filter((item: any) => normalizeCustomerType(item.customerType) === CUSTOMER_TYPE_TRADER)
                    .forEach((item: any) => ensureSubsidiaryTraderOption(item));
                try {
                    await ensureBasePricingAddDetailLoaded();
                } catch {
                    // 编辑回显时基准定价明细只用于贸易商品位下拉，失败时保留已回显数据。
                }
                await loadEditApprovalLogs(approvalDTO.id);
            }
        } catch {
            message.error('月发货计划详情加载失败，请稍后重试');
        } finally {
            pageLoading.value = false;
        }
    };

    // 贸易商明细支持手动新增和删除，新增/删除后同步重算汇总。
    const addTraderItem = () => {
        formData.value.monthlyAddDetailList.push(createTraderItem());
        tab.value = CUSTOMER_TYPE_TRADER;
        calculateGradeSummary();
    };

    const removeTraderItem = (row: any) => {
        const index = formData.value.monthlyAddDetailList.indexOf(row);
        if (index > -1) {
            formData.value.monthlyAddDetailList.splice(index, 1);
            calculateGradeSummary();
        }
    };

    const confirmRemoveTraderItem = (row: any) => {
        dialog.warning({
            title: '确认删除',
            content: '该贸易商新增计划明细删除后不可恢复，确认要删除吗？',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: () => removeTraderItem(row),
        });
    };

    /**
     * 校验已选基准定价单中最多包含一个贸易商。
     * @returns 校验是否通过
     */
    const validateBasePricingSelection = () => {
        const selectedCodeSet = new Set(
            (formData.value.basePricingCodes || []).map((code: any) => String(code))
        );
        const selectedTraderCount = basePricingList.value.filter(
            (option: any) =>
                selectedCodeSet.has(String(option.value)) &&
                normalizeCustomerType(option.customerType) === CUSTOMER_TYPE_TRADER
        ).length;
        if (selectedTraderCount <= 1) return true;
        message.error('关联基准定价单中的贸易商类型只能选择一个');
        return false;
    };

    // 保存/提交 payload：日期、多选和审批字段转为后端要求格式。
    const buildPayload = (status: 'DRAFT' | 'REVIEWING') => {
        const monthlyAddDetailList = buildMonthlyAddDetailList();
        const associatedApproval = JSON.stringify(formData.value.associatedApproval || []);
        const { pricingMonthRange, ...formValue } = formData.value;
        const pricingMonthBegin = formatPricingMonth(pricingMonthRange?.[0]);
        const pricingMonthEnd = formatPricingMonth(pricingMonthRange?.[1]);
        const payload = {
            ...formValue,
            histRemainDetailList: formData.value.histRemainDetailList || [],
            status,
            monthlyMonth: formData.value.monthlyMonth ? dayjs(formData.value.monthlyMonth).format('YYYY-MM') : '',
            pricingMonthBegin,
            pricingMonthEnd,
            basePricingCodes: (formData.value.basePricingCodes || []).join(','),
            larkUserId: formData.value.larkUserId,
            approvalDTO: {
                ...(formData.value.approvalDTO || {}),
                applicantId: formData.value.applicantId,
                applicantName: formData.value.applicantName,
                larkUserId: formData.value.larkUserId,
                remark: formData.value.approvalRemark,
                instruction: formData.value.instruction,
                approveUrl: formData.value.attachmentUrls || [],
                associatedApproval,
            },
            monthlyAddDetailList,
        };
        delete payload.attachmentUrls;
        payload.associatedApproval = associatedApproval;
        return payload;
    };

    /**
     * 校验保存月发货计划时的基础必填字段。
     * @returns 首个校验错误文案，校验通过返回 null
     */
    const validateSaveFields = (): string | null => {
        if (isEmptyValue(formData.value.monthlyMonth)) {
            return '请选择计划发货月份';
        }
        const pricingMonthRange = formData.value.pricingMonthRange;
        if (
            !Array.isArray(pricingMonthRange) ||
            pricingMonthRange.length !== 2 ||
            pricingMonthRange.some((item: any) => isEmptyValue(item))
        ) {
            return '请选择定价月份';
        }
        return null;
    };

    // 保存和提交都调用月发货计划主表接口；后端通过 status 区分草稿与审核中状态。
    const confirmEvt = async (type: 'save' | 'submit') => {
        if (submitLoading.value) return;
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
                message.error(errors?.[0]?.[0]?.message || '请完善表单信息');
                return;
            }

            if (!validateBasePricingSelection()) return;
            try {
                await ensureBasePricingAddDetailLoaded();
            } catch {
                message.error('基准定价单数据获取失败，请重新选择基准定价单或稍后重试');
                return;
            }
            const tableErrorMessage = validateTableData();
            if (tableErrorMessage) {
                message.error(tableErrorMessage);
                return;
            }
        }

        submitLoading.value = true;
        try {
            const payload = buildPayload(type === 'submit' ? 'REVIEWING' : 'DRAFT');
            console.log('提交的 payload 是：', payload);
            const res = isEdit.value
                ? await updateSalesPlanMonthlyPlan(payload)
                : await createSalesPlanMonthlyPlan(payload);
            if (res.code === 200) {
                router.back();
            }
        } catch (error) {
            console.error(type === 'save' ? '保存月发货计划失败:' : '提交月发货计划失败:', error);
            message.error(type === 'save' ? '保存失败，请稍后重试' : '提交失败，请稍后重试');
        } finally {
            submitLoading.value = false;
        }
    };

    const handleBasePricingCodesChange = async (value: any) => {
        formData.value.basePricingCodes = Array.isArray(value) ? value : [];
        if (!formData.value.basePricingCodes.length) {
            resetBasePricingAddDetailCache();
            formData.value.monthlyAddDetailList = [];
            calculateGradeSummary();
            return;
        }
        await loadMonthlyAddDetail();
    };

    /**
     * 定价月份变化后同步后端字段，并按新范围应用基准定价单默认选择规则。
     * @param value 月份范围选择器返回的时间戳数组或空值
     * @returns 异步处理结果
     */
    const handlePricingMonthRangeChange = async (value: any) => {
        syncPricingMonthFields(value);
        basePricingList.value = [];
        await handleBasePricingCodesChange([]);
        if (!formData.value.pricingMonthBegin || !formData.value.pricingMonthEnd) return;
        await loadBasePricingList(true);
    };

    // 申请人变化时，默认带出该人员的第一个部门。
    const handleApplicantChange = (user: any) => {
        if (!user || Array.isArray(user)) return;
        formData.value.applicantName = user.label || user.username || '';
        formData.value.larkUserId = getApplicantLarkUserId(user);
    };

    // 初始化加载：AI 报告仅查询一次；新增态应用默认选择规则，编辑态保留后端选择。
    onMounted(async () => {
        await Promise.all([
            loadTraderCustomers(),
            loadSubsidiaryTraderOptions(),
            loadYardOptions(),
            loadAiReports(),
        ]);
        if (isEdit.value) {
            await loadDetail();
            await loadBasePricingList();
        } else {
            await loadHistRemainDetail();
            await loadBasePricingList(true);
        }
    });

    // 暴露给 index.vue 模板使用的状态、配置和事件。
    return {
        confirmEvt,
        formRules,
        formData,
        basePricingList,
        aiReportList,
        remainingDetails,
        tabs,
        tab,
        addRemainingDataColumns,
        monthlyAddTableScrollX,
        allTableConfig,
        formRef,
        pageTitle,
        pageLoading,
        submitLoading,
        monthlyAddDetailTableList,
        addTraderItem,
        handlePricingMonthRangeChange,
        handleBasePricingCodesChange,
        handleApplicantChange,
        approvalLogs,
        currentReport,
        detailDrawerVisible,
        reportDetailLoading,
        openSelectedReportDetail,
    };
};
