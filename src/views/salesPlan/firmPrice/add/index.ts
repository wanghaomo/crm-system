import { computed, h, nextTick, onMounted, ref, watch, resolveComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NFormItem, NInput, NInputNumber, NSelect, useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import _ from 'lodash';
import { getDeptTree, getYardPageApi } from '@/api';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import type { FirmPriceFormData } from '../commonTs/conmon';
import {
    ATTACHMENT_ACCEPT,
    CUSTOMER_TYPE_CHEMICAL,
    FIRM_PRICE_ATTACHMENT_LIMIT,
    FIRM_PRICE_ATTACHMENT_SIZE,
    LOGISTICS_ATTACHMENT_ACCEPT,
    SECOND_QUOTE_APPROVAL_OPTIONS,
    PRICING_STATUS_DRAFT,
    PRICING_STATUS_REVIEWING,
    createFirmPriceFormData,
    createItemDTOItem,
    createLogisticsDTOItem,
    createRefDTOItem,
} from '../commonTs/conmon';
import { createSalesPlanBasePricing, getSalesPlanBasePricingDetail, updateSalesPlanBasePricing } from '@/api/salesPlan';
import { queryChemicalCompanyByCustomerIdApi } from '@/api/chemicalCompany';
import { queryLatestContractSaleByCustomerId } from '@/api/contractManage';
import { getSubsidiaryTraderListApi } from '@/api/customerManage';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';

export default () => {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const { userInfo } = storeToRefs(useUserStore());
    const { dictMap } = storeToRefs(useDictStore());
    const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
    const formRef = ref<any>(null);
    const getApplicantLarkUserId = (user: any) => {
        return user?.larkUserId || user?.feishuUserId || user?.larkId || '';
    };
    const createDefaultFormData = (): FirmPriceFormData => {
        const dept = userInfo.value?.userDeptList?.[0] || {};
        return {
            ...createFirmPriceFormData(),
            applicantId: userInfo.value?.code || '',
            applicantName: userInfo.value?.username || '',
            larkUserId: getApplicantLarkUserId(userInfo.value),
            applyDeptId: dept.deptCode || '',
            applyDeptName: dept.deptName || '',
        };
    };
    const formData = ref<FirmPriceFormData>(createDefaultFormData());
    const pageLoading = ref(false);
    const submitLoading = ref(false);
    const deptTree = ref<any[]>([]);
    const yardOptions = ref<Array<{ label: string; value: string }>>([]);
    const yardLoading = ref(false);
    const subsidiaryTraderOptions = ref<Array<{ label: string; value: number | string; customerCode?: string }>>([]);
    const subsidiaryTraderLoading = ref(false);
    const companyOptions = computed<any[]>(() => dictMap.value?.['所属公司'] || []);
    const secondQuoteApprovalOptions = SECOND_QUOTE_APPROVAL_OPTIONS;
    const recordId = computed(() => route.query.id as string | undefined);
    const copyId = computed(() => route.query.copyId as string | undefined);
    const isCopy = computed(() => !!copyId.value);
    const isEdit = computed(() => !!recordId.value && !isCopy.value);
    const pageTitle = computed(() => {
        if (isCopy.value) return '复制化工企业基准定价';
        return isEdit.value ? '编辑化工企业基准定价' : '新增化工企业基准定价';
    });
    const editInitialLinkageKey = ref('');
    const editInitialCustomerId = ref<number | string | null>(null);
    const editInitialPricingMonth = ref<number | null>(null);
    // 编辑/复制详情初始化期间禁止企业选择组件触发联动接口覆盖详情数据。
    // 必须在组件创建时就加锁，避免下拉选项接口先于详情接口返回而触发企业变更回调。
    const isInitializingDetail = ref(Boolean(route.query.id || route.query.copyId));

    const validationMode = ref<'save' | 'submit'>('submit');
    const fullFormRules: Record<string, any> = {
        customerId: [{ required: true, message: '请选择企业名称', trigger: ['blur', 'change'] }],
        pricingMonth: [{ required: true, type: 'number', message: '请选择定价月份', trigger: ['blur', 'change'] }],
        projectName: [{ required: true, message: '请输入项目名称', trigger: ['blur', 'input'] }],
        attendees: [{ required: true, type: 'array', message: '请选择与会人员', trigger: ['blur', 'change'] }],
        'extChemicalDTO.productScale': [
            { required: true, message: '请输入企业主要产品规模', trigger: ['blur', 'input'] },
        ],
        'extChemicalDTO.inventoryStatus': [{ required: true, message: '请输入库存情况', trigger: ['blur', 'input'] }],
        'extChemicalDTO.operatingRate': [
            { required: true, type: 'number', message: '请输入开工率', trigger: ['blur', 'input'] },
        ],
        'extChemicalDTO.annualPurchaseVolume': [
            { required: true, message: '请输入年矿石采购量', trigger: ['blur', 'input'] },
        ],
        'extChemicalDTO.planPurchaseVolume': [
            { required: true, message: '请输入计划采购量', trigger: ['blur', 'input'] },
        ],
        'extChemicalDTO.paymentTerms': [{ required: true, message: '请输入支付情况', trigger: ['blur', 'input'] }],
        'extChemicalDTO.importantContractTerms': [
            { required: true, message: '请输入重要合同条件', trigger: ['blur', 'input'] },
        ],
        'extChemicalDTO.financialCost': [{ required: true, message: '请输入财务费用', trigger: ['blur', 'input'] }],
        applicantId: [{ required: true, message: '请选择申请人', trigger: ['blur', 'change'] }],
        applyDeptId: [{ required: true, message: '请选择申请部门', trigger: ['blur', 'change'] }],
        companyId: [{ required: true, message: '请选择所属公司', trigger: ['blur', 'change'] }],
        logistics: [{ required: true, type: 'array', message: '请上传物流运输费用附件', trigger: ['blur', 'change'] }],
        isTwoApprove: [
            {
                trigger: ['blur', 'change'],
                validator(_rule: any, value: any) {
                    if (!value) {
                        return new Error('请选择流程是否需要二次报价报量审批');
                    }
                    return true;
                },
            },
        ],
        instruction: [{ required: true, message: '请输入事项说明', trigger: ['blur', 'input'] }],
    };
    const saveFormRules: Record<string, any> = {
        customerId: fullFormRules.customerId,
        pricingMonth: fullFormRules.pricingMonth,
        projectName: fullFormRules.projectName,
    };
    const formRules = computed(() =>
        validationMode.value === 'save' ? saveFormRules : fullFormRules
    );

    const getCompanyOption = (value: any, label?: string) => {
        return companyOptions.value.find((item: any) => String(item.value) === String(value) || item.label === label);
    };

    const getDefaultCompany = () => {
        return companyOptions.value.find((item: any) => item.label === '四川火石子贸易有限公司') || companyOptions.value[0];
    };

    /**
     * 获取子公司贸易商列表并转换为下拉选项。
     * @returns 子公司贸易商下拉选项
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
                (options: Array<{ label: string; value: number | string; customerCode?: string }>, item: any) => {
                    if (item?.id === null || item?.id === undefined || !item?.customerName) return options;
                    options.push({
                        label: item.customerName,
                        value: item.id,
                        customerCode: item.customerCode,
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
     * 确保编辑详情中的子公司贸易商存在于下拉选项中。
     * @param subsidiaryId 子公司贸易商ID
     * @param subsidiaryName 子公司贸易商名称
     */
    const ensureSubsidiaryTraderOption = (subsidiaryId: number | string | null, subsidiaryName: string) => {
        if (subsidiaryId === null || subsidiaryId === undefined || !subsidiaryName) return;
        const exists = subsidiaryTraderOptions.value.some(
            (item) => String(item.value) === String(subsidiaryId)
        );
        if (!exists) {
            subsidiaryTraderOptions.value.push({
                label: subsidiaryName,
                value: subsidiaryId,
            });
        }
    };

    const getCustomerPricingKey = (
        customerId = formData.value.customerId,
        pricingMonth = formData.value.pricingMonth
    ) => {
        if (!customerId || !pricingMonth) return '';
        return `${customerId}_${dayjs(pricingMonth).format('YYYY-MM')}`;
    };

    const isSameCustomer = (customerId: any) => {
        return (
            editInitialCustomerId.value !== null &&
            customerId !== null &&
            customerId !== undefined &&
            String(customerId) === String(editInitialCustomerId.value)
        );
    };

    const isSamePricingMonth = (pricingMonth: any) => {
        return (
            editInitialPricingMonth.value !== null &&
            pricingMonth !== null &&
            pricingMonth !== undefined &&
            dayjs(pricingMonth).format('YYYY-MM') === dayjs(editInitialPricingMonth.value).format('YYYY-MM')
        );
    };

    /**
     * 判断当前企业和定价月份是否仍是编辑/复制详情的初始值。
     * 通用选择组件会在选项异步加载后再次触发 changeEvt，需要持续跳过初始值联动。
     * @param customerId 当前企业ID
     * @param pricingMonth 当前定价月份
     * @returns 是否跳过企业调研和合同框架接口调用
     */
    const shouldSkipDetailInitialLinkage = (
        customerId = formData.value.customerId,
        pricingMonth = formData.value.pricingMonth
    ) => {
        const currentKey = getCustomerPricingKey(customerId, pricingMonth);
        const sameCustomer = isSameCustomer(customerId);
        const sameMonth = isSamePricingMonth(pricingMonth);
        if (
            (isEdit.value || isCopy.value) &&
            editInitialLinkageKey.value &&
            ((sameCustomer && (!pricingMonth || sameMonth)) || (sameMonth && (!customerId || sameCustomer)))
        ) {
            return true;
        }
        if (!(isEdit.value || isCopy.value) || !editInitialLinkageKey.value || currentKey !== editInitialLinkageKey.value) {
            if (editInitialLinkageKey.value && currentKey && currentKey !== editInitialLinkageKey.value) {
                editInitialLinkageKey.value = '';
                editInitialCustomerId.value = null;
                editInitialPricingMonth.value = null;
            }
            return false;
        }
        return true;
    };

    /**
     * 渲染表格中的文本输入框
     */
    const renderInput = (row: any, key: string, maxlength = 50) => {
        return h(NInput, {
            value: row[key],
            maxlength,
            showCount: true,
            clearable: true,
            placeholder: '请输入',
            onUpdateValue(value: string) {
                row[key] = value;
            },
        });
    };

    /**
     * 渲染堆场下拉选择框。
     * @param row 当前表格行数据
     * @param key 需要写入的字段名
     * @returns 堆场选择框虚拟节点
     */
    const renderYardSelect = (row: any, key: string) => {
        return h(NSelect, {
            value: row[key] || null,
            options: yardOptions.value,
            loading: yardLoading.value,
            filterable: true,
            clearable: true,
            placeholder: '请选择',
            onUpdateValue(value: string | number | null) {
                row[key] = value === null ? '' : String(value);
            },
        });
    };

    /**
     * 渲染表格中的数字输入框
     */
    const renderNumber = (
        row: any,
        key: string,
        onChange?: (row: any) => void,
        disabled = false,
        precision = 2,
        max = 999999999
    ) => {
        return h(NInputNumber, {
            value: row[key],
            min: 0,
            max,
            precision,
            disabled,
            showButton: false,
            placeholder: '请输入',
            onUpdateValue(value: number | null) {
                row[key] = value;
                onChange?.(row);
            },
        });
    };

    /**
     * 生成动态表格必填校验规则
     */
    const requiredRule = (messageText: string, row: any, key: string, type?: 'number') => ({
        trigger: ['input', 'blur'],
        type,
        validator() {
            if (validationMode.value === 'save') return true;
            if (row[key] === null || row[key] === undefined || row[key] === '') {
                return new Error(messageText);
            }
            return true;
        },
    });

    type DeliveryField = 'deliveryLocation' | 'deliveryAddress';

    /**
     * 获取堆场编码，兼容明细暂时返回堆场名称的情况。
     * @param value 堆场编码或堆场名称
     * @returns 匹配到的堆场编码，未匹配时保留原值
     */
    const getYardCode = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const text = String(value).trim();
        const option = yardOptions.value.find((item) => item.value === text || item.label === text);
        return option?.value || text;
    };

    /**
     * 获取堆场下拉选项对应的名称。
     * @param value 堆场编码或堆场名称
     * @returns 下拉选项的 label，无法匹配时返回空字符串
     */
    const getYardName = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const text = String(value).trim();
        const option = yardOptions.value.find((item) => item.value === text || item.label === text);
        return option?.label || '';
    };

    /**
     * 生成品位与交货地点的组合键，字段不完整时不参与重复校验。
     * @param row 当前明细行
     * @param deliveryField 交货地点字段名
     * @returns 标准化后的组合键
     */
    const getGradeDeliveryKey = (row: any, deliveryField: DeliveryField) => {
        if (row?.grade === null || row?.grade === undefined || row?.grade === '') return '';
        const grade = Number(row.grade);
        const yardCode = getYardCode(row?.[deliveryField]);
        if (!Number.isFinite(grade) || !yardCode) return '';
        return JSON.stringify([grade, yardCode]);
    };

    /**
     * 生成品位与交货地点不可重复的动态表格校验规则。
     * @param list 当前表格数据
     * @param row 当前明细行
     * @param index 当前行下标
     * @param deliveryField 交货地点字段名
     * @param sectionLabel 表格名称
     * @param gradeLabel 品位字段名称
     * @param deliveryLabel 交货地点字段名称
     * @returns Naive UI 表单校验规则
     */
    const uniqueGradeDeliveryRule = (
        list: any[],
        row: any,
        index: number,
        deliveryField: DeliveryField,
        sectionLabel: string,
        gradeLabel: string,
        deliveryLabel: string
    ) => ({
        trigger: ['change', 'blur', 'input'],
        validator() {
            if (validationMode.value === 'save') return true;
            const currentKey = getGradeDeliveryKey(row, deliveryField);
            if (!currentKey) return true;
            const duplicateIndex = list.findIndex(
                (item, itemIndex) =>
                    itemIndex < index && getGradeDeliveryKey(item, deliveryField) === currentKey
            );
            if (duplicateIndex >= 0) {
                return new Error(
                    `${sectionLabel}第${index + 1}行的${gradeLabel}和${deliveryLabel}与第${duplicateIndex + 1}行重复`
                );
            }
            return true;
        },
    });

    /**
     * textarea 字段统一转字符串，避免接口返回数字时触发 NInput show-count 遍历报错。
     */
    const toInputText = (value: any) => {
        if (value === null || value === undefined) return '';
        return String(value);
    };

    /**
     * 计算物流运输费用合计
     */
    const calculateLogisticsTotal = (row: any) => {
        row.totalFee =
            Number(row.freightFee || 0) +
            Number(row.loadingUnloadingFee || 0) +
            Number(row.transferFee || 0) +
            Number(row.terminalFee || 0);
    };

    /**
     * 计算预估总金额
     */
    const calculateTotalAmount = () => {
        formData.value.totalAmount = formData.value.itemDTOList.reduce((total, item) => {
            return total + Number(item.planWeight || 0) * Number(item.taxIncludedPrice || 0);
        }, 0);
    };

    /**
     * 回填化工企业调研信息
     */
    const fillChemicalSurvey = (survey: any) => {
        const extChemicalDTO = formData.value.extChemicalDTO;
        extChemicalDTO.productScale = toInputText(survey.mainProductScale);
        extChemicalDTO.inventoryStatus = toInputText(survey.inventory);
        extChemicalDTO.operatingRate = survey.operatingRate ?? null;
        extChemicalDTO.planPurchaseVolume =
            survey.nextMonthPlan === null || survey.nextMonthPlan === undefined
                ? ''
                : `本月采购${survey.nextMonthPlan}万吨`;
    };

    /**
     * 清空化工企业调研回显信息
     */
    const clearChemicalSurvey = () => {
        const extChemicalDTO = formData.value.extChemicalDTO;
        extChemicalDTO.productScale = '';
        extChemicalDTO.inventoryStatus = '';
        extChemicalDTO.operatingRate = null;
        extChemicalDTO.planPurchaseVolume = '';
    };

    /**
     * 根据企业和当前月份查询化工企业调研信息
     */
    const getChemicalSurveyByCustomer = async (customerId = formData.value.customerId) => {
        if (isInitializingDetail.value) return;
        const pricingMonth = formData.value.pricingMonth;
        if (shouldSkipDetailInitialLinkage(customerId, pricingMonth)) {
            return;
        }
        if (!customerId) {
            clearChemicalSurvey();
            return;
        }
        const params = {
            customerId,
        };
        try {
            const res = await queryChemicalCompanyByCustomerIdApi(params);
            if (res.code === 200) {
                if (res.data) {
                    fillChemicalSurvey(res.data);
                } else {
                    clearChemicalSurvey();
                }
            }
        } catch (error) {
            console.error('获取化工企业调研信息失败:', error);
        }
    };

    /**
     * 企业改变获取年矿石采购量
     */
    const getContractFramework = async (customerId: number | string) => {
        if (isInitializingDetail.value) return;
        try {
            const res = await queryLatestContractSaleByCustomerId(customerId);
            if (res.code === 200) {
                formData.value.extChemicalDTO.annualPurchaseVolume = toInputText(res.data?.annualQuantity);
            } else {
                formData.value.extChemicalDTO.annualPurchaseVolume = '';
            }
        } catch (error) {
            console.error('获取合同框架采购量失败:', error);
            formData.value.extChemicalDTO.annualPurchaseVolume = '';
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

    // 物流运输费用表格配置
    const transportConfig = computed(() => ({
        columns: [
            {
                key: 'routeInfo',
                width: 200,
                title: () => h('span', { class: 'require-label' }, '路线'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `logisticsDTOList[${index}].routeInfo`,
                            rule: requiredRule(`物流运输费用第${index + 1}行的路线必填`, row, 'routeInfo'),
                        },
                        () => renderInput(row, 'routeInfo')
                    ),
            },
            {
                key: 'freightFee',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '运费(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `logisticsDTOList[${index}].freightFee`,
                            rule: requiredRule(`物流运输费用第${index + 1}行的运费必填`, row, 'freightFee', 'number'),
                        },
                        () => renderNumber(row, 'freightFee', calculateLogisticsTotal)
                    ),
            },
            {
                key: 'loadingUnloadingFee',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '装卸费(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `logisticsDTOList[${index}].loadingUnloadingFee`,
                            rule: requiredRule(
                                `物流运输费用第${index + 1}行的装卸费必填`,
                                row,
                                'loadingUnloadingFee',
                                'number'
                            ),
                        },
                        () => renderNumber(row, 'loadingUnloadingFee', calculateLogisticsTotal)
                    ),
            },
            {
                key: 'transferFee',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '翻坝费(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `logisticsDTOList[${index}].transferFee`,
                            rule: requiredRule(
                                `物流运输费用第${index + 1}行的翻坝费必填`,
                                row,
                                'transferFee',
                                'number'
                            ),
                        },
                        () => renderNumber(row, 'transferFee', calculateLogisticsTotal)
                    ),
            },
            {
                key: 'terminalFee',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '码头费(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `logisticsDTOList[${index}].terminalFee`,
                            rule: requiredRule(
                                `物流运输费用第${index + 1}行的码头费必填`,
                                row,
                                'terminalFee',
                                'number'
                            ),
                        },
                        () => renderNumber(row, 'terminalFee', calculateLogisticsTotal)
                    ),
            },
            {
                key: 'totalFee',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '合计(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `logisticsDTOList[${index}].totalFee`,
                            rule: requiredRule(`物流运输费用第${index + 1}行的合计必填`, row, 'totalFee', 'number'),
                        },
                        () => renderNumber(row, 'totalFee', undefined, true, 2, 999999999 * 4)
                    ),
            },
            {
                key: 'remark',
                width: 220,
                title: '备注',
                render: (row: any) =>
                    h(NFormItem, {}, () =>
                        h(NInput, {
                            value: row.remark,
                            type: 'textarea',
                            maxlength: 250,
                            showCount: true,
                            placeholder: '请输入',
                            onUpdateValue(value: string) {
                                row.remark = value;
                            },
                        })
                    ),
            },
        ],
        tableList: formData.value.logisticsDTOList,
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: { padding: '0px' },
        tableBtns: [
            {
                btnName: '删除',
                btnColor: 'var(--base-color-red)',
                clickTableBtns: (_row: any, index: number) => {
                    if (formData.value.logisticsDTOList.length === 1) {
                        message.warning('至少保留一条物流运输费用');
                        return;
                    }
                    formData.value.logisticsDTOList.splice(index, 1);
                },
            },
        ],
        isShowPagination: false,
    }));

    // 市场价参考表格配置
    const marketPriceConfig = computed(() => ({
        columns: [
            {
                key: 'refCompanyName',
                width: 200,
                title: () => h('span', { class: 'require-label' }, '化工企业名称'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `refDTOList[${index}].refCompanyName`,
                            rule: requiredRule(
                                `市场价(参考价)第${index + 1}行的化工企业名称必填`,
                                row,
                                'refCompanyName'
                            ),
                        },
                        () => renderInput(row, 'refCompanyName')
                    ),
            },
            {
                key: 'grade',
                width: 150,
                title: () => h('span', { class: 'require-label' }, '品位(%)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `refDTOList[${index}].grade`,
                            rule: requiredRule(`市场价(参考价)第${index + 1}行的品位必填`, row, 'grade', 'number'),
                        },
                        () => renderNumber(row, 'grade', undefined, false, 0)
                    ),
            },
            {
                key: 'deliveryLocation',
                width: 200,
                title: () => h('span', { class: 'require-label' }, '交货地点'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `refDTOList[${index}].deliveryLocation`,
                            rule: requiredRule(
                                `市场价(参考价)第${index + 1}行的交货地点必填`,
                                row,
                                'deliveryLocation'
                            ),
                        },
                        () => renderYardSelect(row, 'deliveryLocation')
                    ),
            },
            {
                key: 'currentPrice',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '当前采购价(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `refDTOList[${index}].currentPrice`,
                            rule: requiredRule(
                                `市场价(参考价)第${index + 1}行的当前采购价必填`,
                                row,
                                'currentPrice',
                                'number'
                            ),
                        },
                        () => renderNumber(row, 'currentPrice')
                    ),
            },
            {
                key: 'remark',
                width: 220,
                title: '备注',
                render: (row: any) =>
                    h(NFormItem, {}, () =>
                        h(NInput, {
                            value: row.remark,
                            type: 'textarea',
                            maxlength: 250,
                            showCount: true,
                            clearable: true,
                            placeholder: '请输入',
                            onUpdateValue(value: string) {
                                row.remark = value;
                            },
                        })
                    ),
            },
            {
                key: 'attachmentUrls',
                width: 220,
                title: '附件',
                render: (row: any) => {
                    const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                    return h(MxWebFileUpload, {
                        limit: 9,
                        multiple: true,
                        showTips: false,
                        forceAppSize: true,
                        appSizeWidth: 80,
                        modelValue: row.attachmentUrls || [],
                        'onUpdate:modelValue': (value: any[]) => {
                            row.attachmentUrls = value;
                        },
                        accept: ATTACHMENT_ACCEPT,
                    })
                }
            },
        ],
        tableList: formData.value.refDTOList,
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: { padding: '0px' },
        tableBtns: [
            {
                btnName: '删除',
                btnColor: 'var(--base-color-red)',
                clickTableBtns: (_row: any, index: number) => {
                    if (formData.value.refDTOList.length === 1) {
                        message.warning('至少保留一条市场参考价');
                        return;
                    }
                    formData.value.refDTOList.splice(index, 1);
                },
            },
        ],
        isShowPagination: false,
    }));

    // 计划量以及价格表格配置
    const planPriceConfig = computed(() => ({
        columns: [
            {
                key: 'grade',
                width: 150,
                title: () => h('span', { class: 'require-label' }, '矿石品位(%)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `itemDTOList[${index}].grade`,
                            rule: requiredRule(`计划量以及价格第${index + 1}行的矿石品位必填`, row, 'grade', 'number'),
                        },
                        () => renderNumber(row, 'grade', undefined, false, 0)
                    ),
            },
            {
                key: 'planWeight',
                width: 170,
                title: () => h('span', { class: 'require-label' }, '计划重量(吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `itemDTOList[${index}].planWeight`,
                            rule: requiredRule(
                                `计划量以及价格第${index + 1}行的计划重量必填`,
                                row,
                                'planWeight',
                                'number'
                            ),
                        },
                        () => renderNumber(row, 'planWeight', calculateTotalAmount)
                    ),
            },
            {
                key: 'deliveryAddress',
                width: 240,
                title: () => h('span', { class: 'require-label' }, '交货地址'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `itemDTOList[${index}].deliveryAddress`,
                            rule: [
                                requiredRule(
                                    `计划量以及价格第${index + 1}行的交货地址必填`,
                                    row,
                                    'deliveryAddress'
                                ),
                                uniqueGradeDeliveryRule(
                                    formData.value.itemDTOList,
                                    row,
                                    index,
                                    'deliveryAddress',
                                    '计划量以及价格',
                                    '矿石品位(%)',
                                    '交货地址'
                                ),
                            ],
                        },
                        () => renderYardSelect(row, 'deliveryAddress')
                    ),
            },
            {
                key: 'taxIncludedPrice',
                width: 180,
                title: () => h('span', { class: 'require-label' }, '含税单价(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `itemDTOList[${index}].taxIncludedPrice`,
                            rule: requiredRule(
                                `计划量以及价格第${index + 1}行的含税单价必填`,
                                row,
                                'taxIncludedPrice',
                                'number'
                            ),
                        },
                        () => renderNumber(row, 'taxIncludedPrice', calculateTotalAmount)
                    ),
            },
            {
                key: 'pitPrice',
                width: 160,
                title: () => h('span', { class: 'require-label' }, '坑口价(元/吨)'),
                render: (row: any, index: number) =>
                    h(
                        NFormItem,
                        {
                            path: `itemDTOList[${index}].pitPrice`,
                            rule: requiredRule(`计划量以及价格第${index + 1}行的坑口价必填`, row, 'pitPrice', 'number'),
                        },
                        () => renderNumber(row, 'pitPrice')
                    ),
            },
        ],
        tableList: formData.value.itemDTOList,
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: { padding: '0px' },
        tableBtns: [
            {
                btnName: '删除',
                btnColor: 'var(--base-color-red)',
                clickTableBtns: (_row: any, index: number) => {
                    if (formData.value.itemDTOList.length === 1) {
                        message.warning('至少保留一条计划量以及价格');
                        return;
                    }
                    formData.value.itemDTOList.splice(index, 1);
                    calculateTotalAmount();
                },
            },
        ],
        isShowPagination: false,
    }));

    /**
     * 新增明细行
     */
    const addItem = (type: 'transport' | 'marketPrice' | 'planPrice') => {
        switch (type) {
            case 'transport':
                formData.value.logisticsDTOList.push(createLogisticsDTOItem());
                break;
            case 'marketPrice':
                formData.value.refDTOList.push(createRefDTOItem());
                break;
            case 'planPrice':
                formData.value.itemDTOList.push(createItemDTOItem());
                break;
        }
    };

    /**
     * 企业选择变更时同步企业名称
     */
    const handleCustomerChange = (customer: any) => {
        if (isInitializingDetail.value) return;
        if (!customer) {
            formData.value.customerId = null;
            formData.value.customerCode = '';
            formData.value.customerName = '';
            formData.value.extChemicalDTO.importantContractTerms = '';
            formData.value.extChemicalDTO.annualPurchaseVolume = '';
            clearChemicalSurvey();
            return;
        }
        const customerId = customer?.id ?? customer?.value ?? null;
        if (shouldSkipDetailInitialLinkage(customerId, formData.value.pricingMonth)) {
            return;
        }
        formData.value.customerName = toInputText(customer?.customerName || customer?.label);
        formData.value.customerId = customerId;
        formData.value.customerCode = toInputText(customer?.customerCode);
        formData.value.extChemicalDTO.importantContractTerms = customer?.importantContractCondition || '';
        if (!customerId) {
            formData.value.extChemicalDTO.annualPurchaseVolume = '';
            clearChemicalSurvey();
            return;
        }
        getChemicalSurveyByCustomer(customerId);
        getContractFramework(customerId);
    };

    /**
     * 子公司贸易商选择变更时同步名称。
     * @param value 当前选中的子公司贸易商ID
     */
    const handleSubsidiaryTraderChange = (value: number | string | null) => {
        const option = subsidiaryTraderOptions.value.find((item) => String(item.value) === String(value));
        formData.value.subsidiaryId = value;
        formData.value.subsidiaryName = option?.label || '';
    };

    /**
     * 定价月份变更时只更新基准定价月份，不影响调研数据查询月份。
     */
    const handlePricingMonthChange = (value: number | null) => {
        formData.value.pricingMonth = value;
    };

    const handleApplicantChange = (user: any) => {
        if (!user || Array.isArray(user)) return;
        formData.value.applicantName = user.label || user.username || '';
        formData.value.larkUserId = getApplicantLarkUserId(user);
        const dept = user.userDeptList?.[0];
        if (dept) {
            formData.value.applyDeptId = dept.deptCode;
            formData.value.applyDeptName = dept.deptName;
        }
    };

    /**
     * 将人员选择组件数据转换为接口结构
     */
    const formatAttendeesForSubmit = (attendees: any[]) => {
        return (Array.isArray(attendees) ? attendees : []).map((item: any) => ({
            code: item.value || item.code,
            larkUserId: item.larkUserId,
            username: item.label || item.username,
        }));
    };

    /**
     * 将接口人员结构转换为组件回显结构
     */
    const formatAttendeesForView = (attendees: any[]) => {
        return (Array.isArray(attendees) ? attendees : []).map((item: any) => ({
            ...item,
            value: item.code,
            larkUserId: item.larkUserId,
            label: item.username,
        }));
    };

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
     * 将审批附件字段统一转换为上传组件使用的数组结构。
     * @param value 接口返回的附件数组、JSON 字符串或逗号分隔字符串
     * @returns 附件列表
     */
    const parseAttachmentList = (value: any) => {
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined || value === '') return [];
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                return value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
        return [];
    };

    /**
     * 提交前整理接口参数
     */
    const buildSubmitData = (status: string) => {
        const formValue: any = _.cloneDeep(formData.value);
        const associatedApproval = JSON.stringify(formValue.associatedApproval || []);
        const submitData: any = {
            ...(isEdit.value ? { id: formValue.id, pricingCode: formValue.pricingCode } : {}),
            pricingMonth: formValue.pricingMonth ? dayjs(formValue.pricingMonth).format('YYYY-MM') : '',
            status,
            customerType: CUSTOMER_TYPE_CHEMICAL,
            customerId: formValue.customerId,
            customerCode: formValue.customerCode,
            customerName: formValue.customerName,
            subsidiaryId: formValue.subsidiaryId,
            subsidiaryName: formValue.subsidiaryName,
            projectName: formValue.projectName,
            attendees: formatAttendeesForSubmit(formValue.attendees),
            applicantId: formValue.applicantId,
            applicantName: formValue.applicantName,
            larkUserId: formValue.larkUserId,
            applyDeptId: formValue.applyDeptId,
            applyDeptName: formValue.applyDeptName,
            companyId: formValue.companyId,
            companyName: formValue.companyName || getCompanyOption(formValue.companyId)?.label || '',
            instruction: formValue.instruction,
            logistics: formValue.logistics || [],
            approvalDTO: {
                ...(isEdit.value ? (formValue.approvalDTO || {}) : {}),
                applicantId: formValue.applicantId,
                applicantName: formValue.applicantName,
                larkUserId: formValue.larkUserId,
                applyDeptId: formValue.applyDeptId,
                applyDeptName: formValue.applyDeptName,
                companyName: formValue.companyName || getCompanyOption(formValue.companyId)?.label || '',
                isTwoApprove: formValue.isTwoApprove,
                instruction: formValue.instruction,
                approveUrl: formValue.attachmentUrls || [],
                associatedApproval,
            },
            associatedApproval,
            extChemicalDTO: {
                ...(isEdit.value
                    ? {
                        id: formValue.extChemicalDTO?.id,
                        pricingId: formValue.extChemicalDTO?.pricingId,
                        pricingCode: formValue.extChemicalDTO?.pricingCode,
                    }
                    : {}),
                productScale: formValue.extChemicalDTO?.productScale,
                inventoryStatus: formValue.extChemicalDTO?.inventoryStatus,
                operatingRate: formValue.extChemicalDTO?.operatingRate,
                annualPurchaseVolume: formValue.extChemicalDTO?.annualPurchaseVolume,
                planPurchaseVolume: formValue.extChemicalDTO?.planPurchaseVolume,
                paymentTerms: formValue.extChemicalDTO?.paymentTerms,
                importantContractTerms: formValue.extChemicalDTO?.importantContractTerms,
                otherInfo: formValue.extChemicalDTO?.otherInfo,
                financialCost: formValue.extChemicalDTO?.financialCost,
            },
        };
        /*
        submitData.logisticsDTOList = (formValue.logisticsDTOList || []).map((item: any) => ({
            id: item.id,
            pricingId: item.pricingId,
            pricingCode: item.pricingCode,
            customerType: CUSTOMER_TYPE_CHEMICAL,
            routeInfo: item.routeInfo,
            freightFee: item.freightFee,
            loadingUnloadingFee: item.loadingUnloadingFee,
            transferFee: item.transferFee,
            terminalFee: item.terminalFee,
            totalFee: item.totalFee,
            remark: item.remark,
        }));
        */
        submitData.refDTOList = (formValue.refDTOList || []).map((item: any) => ({
            ...(isEdit.value
                ? {
                    id: item.id,
                    pricingId: item.pricingId,
                    pricingCode: item.pricingCode,
                }
                : {}),
            customerType: CUSTOMER_TYPE_CHEMICAL,
            refCompanyName: item.refCompanyName,
            grade: item.grade,
            deliveryLocation: getYardCode(item.deliveryLocation),
            deliveryLocationName: getYardName(item.deliveryLocation) || item.deliveryLocationName || '',
            currentPrice: item.currentPrice,
            remark: item.remark,
            attachmentUrls: item.attachmentUrls || [],
        }));
        submitData.itemDTOList = (formValue.itemDTOList || []).map((item: any) => ({
            ...(isEdit.value
                ? {
                    id: item.id,
                    pricingId: item.pricingId,
                    pricingCode: item.pricingCode,
                }
                : {}),
            customerType: CUSTOMER_TYPE_CHEMICAL,
            grade: item.grade,
            planWeight: item.planWeight,
            deliveryAddress: getYardCode(item.deliveryAddress),
            deliveryLocationName: getYardName(item.deliveryAddress) || item.deliveryLocationName || '',
            taxIncludedPrice: item.taxIncludedPrice,
            pitPrice: item.pitPrice,
        }));
        return submitData;
    };

    /**
     * 保存或提交表单
     */
    const confirmEvt = async (type: 'save' | 'submit') => {
        if (submitLoading.value) return;
        validationMode.value = type;
        await nextTick();
        formRef.value?.restoreValidation();

        try {
            await formRef.value?.validate();
        } catch (errors: any) {
            message.error(errors?.[0]?.[0]?.message || '请完善必填项');
            return;
        }

        submitLoading.value = true;
        try {
            const status = type === 'save' ? PRICING_STATUS_DRAFT : PRICING_STATUS_REVIEWING;
            const submitData = buildSubmitData(status);
            const res = isEdit.value
                ? await updateSalesPlanBasePricing(submitData)
                : await createSalesPlanBasePricing(submitData);
            if (res.code === 200) {
                router.go(-1);
            }
        } catch (error) {
            console.error(type === 'save' ? '保存化工企业基准定价失败:' : '提交化工企业基准定价失败:', error);
            message.error(type === 'save' ? '保存失败，请稍后重试' : '提交失败，请稍后重试');
        } finally {
            submitLoading.value = false;
        }
    };

    /**
     * 将详情接口返回的化工企业基准定价转换为编辑表单数据。
     * 主表字段只读取详情根节点，审批字段只读取 approvalDTO，明细不补默认空行。
     * @param data 详情接口 res.data
     * @returns 编辑表单数据
     */
    const formatChemicalDetailForEdit = (data: any, copy = false): FirmPriceFormData => {
        const approvalDTO = data.approvalDTO || {};
        const extChemicalDTO = data.extChemicalDTO;

        return {
            id: copy ? undefined : data.id,
            pricingCode: copy ? undefined : data.pricingCode,
            pricingMonth: data.pricingMonth ? dayjs(data.pricingMonth).valueOf() : null,
            status: copy ? PRICING_STATUS_DRAFT : data.status,
            customerType: data.customerType,
            customerId: data.customerId,
            customerCode: data.customerCode,
            customerName: data.customerName,
            subsidiaryId: data.subsidiaryId,
            subsidiaryName: toInputText(data.subsidiaryName),
            projectName: data.projectName,
            attendees: formatAttendeesForView(data.attendees),
            totalAmount: data.totalAmount,
            extChemicalDTO: {
                ...(copy
                    ? {}
                    : {
                        id: extChemicalDTO?.id,
                        pricingId: extChemicalDTO?.pricingId,
                        pricingCode: extChemicalDTO?.pricingCode,
                    }),
                productScale: extChemicalDTO?.productScale,
                inventoryStatus: extChemicalDTO?.inventoryStatus,
                operatingRate: extChemicalDTO?.operatingRate,
                annualPurchaseVolume: extChemicalDTO?.annualPurchaseVolume,
                planPurchaseVolume: extChemicalDTO?.planPurchaseVolume,
                paymentTerms: extChemicalDTO?.paymentTerms,
                importantContractTerms: extChemicalDTO?.importantContractTerms,
                otherInfo: extChemicalDTO?.otherInfo,
                financialCost: extChemicalDTO?.financialCost,
            },
            logistics: data.logistics || [],
            logisticsDTOList: [],
            refDTOList: (data.refDTOList || []).map((item: any) => ({
                ...(copy
                    ? {}
                    : {
                        id: item.id,
                        pricingId: item.pricingId,
                        pricingCode: item.pricingCode,
                    }),
                customerType: item.customerType,
                refCompanyName: item.refCompanyName,
                grade: item.grade,
                deliveryLocation: item.deliveryLocation,
                deliveryLocationName: item.deliveryLocationName,
                currentPrice: item.currentPrice,
                remark: item.remark,
                attachmentUrls: item.attachmentUrls,
            })),
            itemDTOList: (data.itemDTOList || []).map((item: any) => ({
                ...(copy
                    ? {}
                    : {
                        id: item.id,
                        pricingId: item.pricingId,
                        pricingCode: item.pricingCode,
                    }),
                customerType: item.customerType,
                grade: item.grade,
                planWeight: item.planWeight,
                deliveryAddress: item.deliveryAddress,
                deliveryLocationName: item.deliveryLocationName,
                taxIncludedPrice: item.taxIncludedPrice,
                pitPrice: item.pitPrice,
                lineTotal: item.lineTotal,
            })),
            applicantId: approvalDTO.applicantId ?? data.applicantId,
            applicantName: approvalDTO.applicantName ?? data.applicantName,
            larkUserId: approvalDTO.larkUserId ?? data.larkUserId,
            applyDeptId: approvalDTO.applyDeptId ?? data.applyDeptId,
            applyDeptName: approvalDTO.applyDeptName ?? data.applyDeptName,
            companyId: approvalDTO.companyId ?? data.companyId,
            companyName: approvalDTO.companyName ?? data.companyName,
            isTwoApprove: approvalDTO.isTwoApprove ?? data.isTwoApprove,
            instruction: approvalDTO.instruction ?? data.instruction,
            // 复制时保留审批信息区域的全部内容，但不携带原审批主表 ID/状态。
            attachmentUrls: parseAttachmentList(approvalDTO.approveUrl ?? data.approveUrl ?? data.attachmentUrls),
            associatedApproval: parseAssociatedApproval(approvalDTO.associatedApproval ?? data.associatedApproval),
            approvalDTO: copy ? undefined : approvalDTO,
        };
    };

    /**
     * 获取编辑详情并回显。
     */
    const initEditData = async () => {
        const sourceId = recordId.value || copyId.value;
        if (!sourceId) return;
        isInitializingDetail.value = true;
        pageLoading.value = true;
        try {
            const res = await getSalesPlanBasePricingDetail(sourceId);
            if (res.code === 200) {
                const detail = res.data;
                const pricingMonth = detail.pricingMonth ? dayjs(detail.pricingMonth).valueOf() : null;
                const subsidiaryName = toInputText(detail.subsidiaryName);
                ensureSubsidiaryTraderOption(detail.subsidiaryId, subsidiaryName);
                editInitialLinkageKey.value = getCustomerPricingKey(detail.customerId, pricingMonth);
                editInitialCustomerId.value = detail.customerId;
                editInitialPricingMonth.value = pricingMonth;
                formData.value = formatChemicalDetailForEdit(detail, isCopy.value);
                if (!isCopy.value) {
                    await loadEditApprovalLogs(detail.approvalDTO?.id);
                }
            }
        } catch (error) {
            console.error('加载化工企业基准定价详情失败:', error);
            message.error('详情加载失败，请稍后重试');
        } finally {
            // 等待企业选择组件完成详情值同步后再开放手动联动逻辑。
            await nextTick();
            isInitializingDetail.value = false;
            pageLoading.value = false;
        }
    };

    onMounted(async () => {
        await loadDeptTree();
        await loadYardOptions();
        await loadSubsidiaryTraderOptions();
        await initEditData();
    });

    watch(
        companyOptions,
        () => {
            if (!isEdit.value && !formData.value.companyId) {
                const defaultCompany = getDefaultCompany();
                formData.value.companyId = defaultCompany?.value || '';
                formData.value.companyName = defaultCompany?.label || '';
            }
        },
        { immediate: true }
    );

    return {
        formRef,
        formData,
        formRules,
        pageTitle,
        pageLoading,
        submitLoading,
        isEdit,
        deptTree,
        secondQuoteApprovalOptions,
        attachmentAccept: ATTACHMENT_ACCEPT,
        logisticsAttachmentAccept: LOGISTICS_ATTACHMENT_ACCEPT,
        attachmentLimit: FIRM_PRICE_ATTACHMENT_LIMIT,
        attachmentFileSize: FIRM_PRICE_ATTACHMENT_SIZE,
        subsidiaryTraderOptions,
        subsidiaryTraderLoading,
        // transportConfig,
        marketPriceConfig,
        planPriceConfig,
        confirmEvt,
        addItem,
        handleCustomerChange,
        handleSubsidiaryTraderChange,
        handlePricingMonthChange,
        handleApplicantChange,
        approvalLogs,
    };
};
