import { getSalesPlanAiReportDropDownList } from '@/api/aiReport';
import { getCustomerBaseApi } from '@/api/customerManage';
import {
    createContractFramework,
    getContractFramework,
    updateContractFramework,
} from '@/api/contractManage';
import { useDictStore } from '@/store/commStore';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';
import {
    FRAMEWORK_DEFAULT_PAYMENT_METHOD_VALUES,
    FRAMEWORK_DEFAULT_PRICE_MECHANISM_VALUES,
    FRAMEWORK_DEFAULT_PRICING_METHOD_VALUES,
    FRAMEWORK_DEFAULT_SUPPLIER_UNIT_VALUES,
    FRAMEWORK_FILE_ACCEPT,
    FRAMEWORK_FILE_SIZE_LIMIT,
    FRAMEWORK_STATUS_APPROVAL_GENERATING,
    FRAMEWORK_STATUS_DRAFT,
} from '../commonTs/common';

type Nullable<T> = T | null;

interface FormData {
    id: Nullable<number | string>;
    customerId: Nullable<number | string>;
    customerName: string;
    grade: Nullable<number>;
    mineralType: Nullable<string>;
    annualQuantity: Nullable<number>;
    priceMechanism: Nullable<string>;
    specificPrice: string;
    paymentMethod: Nullable<string>;
    aiReportCode: Nullable<string>;
    signDate: Nullable<number>;
    suggestion: string;
    remark: string;
    contractName: string;
    contractAmount: Nullable<number>;
    endDate: Nullable<string>;
    startDate: Nullable<string>;
    duration: Nullable<number>;
    pricingMethod: Nullable<string>;
    supplierUnit: Nullable<string>;
    directorName: string;
    directorId: Nullable<string>;
    directorSelectedPerson: any;
    contractInitiatorId: Nullable<string>;
    contractInitiatorName: string;
    contractInitiatorLarkId: string;
    initiatorSelectedPerson: any;
    deptName: string;
    deptId: Nullable<number | string>;
    contractDeptId: Nullable<number | string>;
    contractDeptName: string;
    oppositeDuration: string;
    oppositeTel: string;
    contractFileUrlObject: any[];
    fileUrlList: any[];
    associatedApprovalObjects: any[];
}

export default () => {
    const route = useRoute();
    const router = useRouter();
    const message = useMessage();
    const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
    const userInfo = computed(() => useUserStore().userInfo);
    const { dictMap } = storeToRefs(useDictStore());
    const formRef = ref<any>(null);
    const aiReportOptions = ref<any[]>([]);
    const submitLoading = ref(false);
    const editInitialCustomerId = ref<string | null>(null);
    const editId = computed(() => route.query.id as string | undefined);
    const isEdit = computed(() => Boolean(editId.value));
    const pageTitle = computed(() => (isEdit.value ? '编辑框架合同' : '新增框架合同'));

    const getDictEnum = computed(() => {
        return (name: string) => {
            if (dictMap.value) {
                return dictMap.value[name] || [];
            }
            return [];
        };
    });

    const getDictDefault = (dictName: string, preferredValues: string[] = []) => {
        const options = getDictEnum.value(dictName);
        for (const value of preferredValues) {
            const matched = options.find((item: any) => item.value === value || item.label === value);
            if (matched) return matched.value;
        }
        return options[0]?.value || null;
    };

    const getPersonLarkId = (person: any) => {
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
     * 判断详情是否返回了有效的合同发起人。
     * @param detail 框架合同详情
     * @returns 是否存在合同发起人姓名
     */
    const hasContractInitiator = (detail: any) => {
        const initiatorName = detail?.contractInitiatorName;
        return initiatorName !== null && initiatorName !== undefined && String(initiatorName).trim().length > 0;
    };

    /**
     * 解析编辑状态下的合同发起人；历史数据没有发起人时使用当前登录人补齐全部人员字段。
     * @param detail 框架合同详情
     * @returns 合同发起人的编码、姓名、飞书 ID 和选择组件回显对象
     */
    const resolveEditInitiator = (detail: any) => {
        if (hasContractInitiator(detail)) {
            return {
                id: detail.contractInitiatorId || '',
                name: detail.contractInitiatorName,
                larkId: detail.contractInitiatorLarkId || '',
                selectedPerson: createPersonOption(
                    detail.contractInitiatorId,
                    detail.contractInitiatorName,
                    detail.contractInitiatorLarkId
                ),
            };
        }

        const currentUser = userInfo.value || {};
        const currentUserLarkId = getPersonLarkId(currentUser);
        return {
            id: currentUser.code || '',
            name: currentUser.username || '',
            larkId: currentUserLarkId,
            selectedPerson: createPersonOption(currentUser.code, currentUser.username, currentUserLarkId),
        };
    };

    const createFormData = (): FormData => {
        const defaultDept = userInfo.value?.userDeptList?.[0] || {};
        const userId = userInfo.value?.code || '';
        const username = userInfo.value?.username || '';
        const userLarkId = getPersonLarkId(userInfo.value);
        return {
            id: null,
            customerId: null,
            customerName: '',
            grade: null,
            mineralType: null,
            annualQuantity: null,
            priceMechanism: getDictDefault('价格机制', FRAMEWORK_DEFAULT_PRICE_MECHANISM_VALUES),
            specificPrice: '',
            paymentMethod: getDictDefault('结算方式', FRAMEWORK_DEFAULT_PAYMENT_METHOD_VALUES),
            aiReportCode: null,
            signDate: dayjs().startOf('day').valueOf(),
            suggestion: '',
            remark: '',
            contractName: '',
            contractAmount: null,
            startDate: null,
            endDate: null,
            duration: null,
            pricingMethod: getDictDefault('计价方式', FRAMEWORK_DEFAULT_PRICING_METHOD_VALUES),
            supplierUnit: getDictDefault('供方单位', FRAMEWORK_DEFAULT_SUPPLIER_UNIT_VALUES),
            directorId: userId,
            directorName: username,
            directorSelectedPerson: createPersonOption(userId, username),
            contractInitiatorId: userId,
            contractInitiatorName: username,
            contractInitiatorLarkId: userLarkId,
            initiatorSelectedPerson: createPersonOption(userId, username, userLarkId),
            deptName: defaultDept.deptName || '',
            deptId: defaultDept.deptCode || '',
            contractDeptName: '',
            contractDeptId: null,
            oppositeDuration: '',
            oppositeTel: '',
            contractFileUrlObject: [],
            fileUrlList: [],
            associatedApprovalObjects: [],
        };
    };

    const formData = ref<FormData>(createFormData());

    const requiredMessage = (messageText: string, type?: string) => ({
        required: true,
        message: messageText,
        trigger: ['blur', 'change'],
        ...(type ? { type } : {}),
    });

    const formRules = ref<any>({
        customerId: [{ ...requiredMessage('请选择企业名称'), saveOnly: true }],
        mineralType: [requiredMessage('请选择矿石种类')],
        grade: [requiredMessage('请输入矿石品位', 'number')],
        annualQuantity: [requiredMessage('请输入年度约定总量', 'number')],
        priceMechanism: [requiredMessage('请选择价格机制')],
        specificPrice: [
            {
                required: true,
                message: '请输入具体价格',
                trigger: ['blur', 'input'],
            },
            {
                max: 100,
                message: '具体价格不能超过100个字符',
                trigger: ['blur', 'input'],
            },
        ],
        paymentMethod: [requiredMessage('请选择结算方式')],
        signDate: [requiredMessage('请选择签订时间', 'number')],
        contractName: [{ ...requiredMessage('请输入合同名称'), saveOnly: true }],
        contractAmount: [requiredMessage('请输入合同金额', 'number')],
        pricingMethod: [requiredMessage('请选择计价方式')],
        startDate: [
            requiredMessage('请选择开始时间'),
            {
                validator: (_rule: any, value: string) => {
                    if (!value || !formData.value.endDate) return true;
                    return !dayjs(value).isAfter(dayjs(formData.value.endDate), 'day');
                },
                message: '开始时间不能大于结束时间',
                trigger: ['change', 'blur'],
            },
        ],
        endDate: [
            requiredMessage('请选择结束时间'),
            {
                validator: (_rule: any, value: string) => {
                    if (!value || !formData.value.startDate) return true;
                    return !dayjs(value).isBefore(dayjs(formData.value.startDate), 'day');
                },
                message: '结束时间不能小于开始时间',
                trigger: ['change', 'blur'],
            },
        ],
        supplierUnit: [requiredMessage('请选择供方单位')],
        directorId: [requiredMessage('请选择我方负责人')],
        contractInitiatorId: [requiredMessage('请选择合同发起人')],
        deptId: [requiredMessage('请选择所属部门')],
        contractDeptId: [requiredMessage('请选择合同发起部门')],
        oppositeDuration: [requiredMessage('请输入对方负责人')],
        contractFileUrlObject: [
            { required: true, type: 'array', min: 1, message: '请上传合同初稿', trigger: ['change', 'blur'] },
        ],
    });

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

    const normalizeDateValue = (value: any) => {
        if (!value) return null;
        if (typeof value === 'number') return value;
        const date = dayjs(value);
        return date.isValid() ? date.valueOf() : null;
    };

    const normalizeDateString = (value: any) => {
        if (!value) return null;
        const date = dayjs(value);
        return date.isValid() ? date.format('YYYY-MM-DD') : null;
    };

    const formatDate = (value: any, pattern = 'YYYY-MM-DD') => {
        if (!value) return '';
        const date = dayjs(value);
        return date.isValid() ? date.format(pattern) : '';
    };

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

    const getCustomerAnnualDemand = (customer: any) => {
        if (!customer) return null;
        const chemicalList = Array.isArray(customer.chemicalList) ? customer.chemicalList : [];
        const traderList = Array.isArray(customer.traderList) ? customer.traderList : [];
        const chemicalDemand = chemicalList.reduce((sum: number, item: any) => sum + Number(item.oreDemand || 0), 0);
        if (chemicalDemand > 0) return Math.round(chemicalDemand);
        const traderDemand = traderList.reduce((sum: number, item: any) => sum + Number(item.tradeScale || 0), 0);
        if (traderDemand > 0) return Math.round(traderDemand);
        return null;
    };

    const getCustomerId = (customer: any) => customer?.id || customer?.value || null;

    const isEditInitialCustomer = (customerId: any) =>
        isEdit.value && editInitialCustomerId.value && String(customerId) === editInitialCustomerId.value;

    const handleCustomerChange = async (customer: any) => {
        const customerId = getCustomerId(customer);
        formData.value.customerId = customerId;
        formData.value.customerName = customer?.customerName || customer?.label || '';

        if (!customer) {
            formData.value.annualQuantity = null;
            return;
        }

        if (isEditInitialCustomer(customerId)) {
            return;
        }

        const demand = getCustomerAnnualDemand(customer);
        if (demand !== null) {
            formData.value.annualQuantity = demand;
            return;
        }

        if (!customerId) return;
        const res = await getCustomerBaseApi(Number(customerId));
        if (res.code === 200) {
            const detailDemand = getCustomerAnnualDemand(res.data);
            if (detailDemand !== null) {
                formData.value.annualQuantity = detailDemand;
            }
        }
    };

    const handleAiReportChange = (report: any) => {
        formData.value.aiReportCode = report?.reportCode || report?.value || null;
        if (report?.summaryConclusion) {
            formData.value.suggestion = report.summaryConclusion;
        }
    };

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
     * 补齐当前登录人的人员及部门默认值，编辑历史数据缺少合同发起人时同样适用。
     * @returns 无返回值
     */
    const syncUserDefaults = () => {
        if (!userInfo.value) return;
        const defaultDept = userInfo.value?.userDeptList?.[0] || {};
        const shouldDefaultInitiator =
            !formData.value.contractInitiatorId || !formData.value.contractInitiatorName;
        if (!isEdit.value && !formData.value.directorId) {
            formData.value.directorId = userInfo.value.code || '';
            formData.value.directorName = userInfo.value.username || '';
            formData.value.directorSelectedPerson = createPersonOption(formData.value.directorId, formData.value.directorName);
        }
        if (shouldDefaultInitiator) {
            formData.value.contractInitiatorId = userInfo.value.code || '';
            formData.value.contractInitiatorName = userInfo.value.username || '';
            formData.value.contractInitiatorLarkId = getPersonLarkId(userInfo.value);
            formData.value.initiatorSelectedPerson = createPersonOption(
                formData.value.contractInitiatorId,
                formData.value.contractInitiatorName,
                formData.value.contractInitiatorLarkId
            );
        } else if (
            !formData.value.contractInitiatorLarkId &&
            String(formData.value.contractInitiatorId) === String(userInfo.value.code || '')
        ) {
            formData.value.contractInitiatorLarkId = getPersonLarkId(userInfo.value);
        }
        if (!formData.value.deptId && (!isEdit.value || shouldDefaultInitiator)) {
            formData.value.deptId = defaultDept.deptCode || '';
            formData.value.deptName = defaultDept.deptName || '';
        }
    };

    const getAiReportList = async () => {
        const res = await getSalesPlanAiReportDropDownList();
        if (res.code === 200) {
            const list = Array.isArray(res.data) ? res.data : res.data?.records || [];
            aiReportOptions.value = list.map((item: any) => ({
                ...item,
                label: item.reportName,
                value: item.reportCode,
            }));
        }
    };

    const buildPayload = (status: string) => {
        const data = formData.value;
        return {
            ...(isEdit.value || data.id ? { id: Number(data.id || editId.value) } : {}),
            status,
            customerId: data.customerId ? Number(data.customerId) : null,
            customerName: data.customerName,
            mineralType: data.mineralType,
            grade: data.grade,
            annualQuantity: data.annualQuantity,
            priceMechanism: data.priceMechanism,
            specificPrice: data.specificPrice,
            paymentMethod: data.paymentMethod,
            aiReportCode: data.aiReportCode,
            signDate: formatDate(data.signDate, 'YYYY-MM-DD HH:mm:ss'),
            suggestion: data.suggestion,
            remark: data.remark,
            contractName: data.contractName,
            contractAmount: data.contractAmount,
            pricingMethod: data.pricingMethod,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            duration: data.duration,
            supplierUnit: data.supplierUnit,
            directorId: data.directorId,
            directorName: data.directorName,
            contractInitiatorId: data.contractInitiatorId,
            contractInitiatorName: data.contractInitiatorName,
            contractInitiatorLarkId: data.contractInitiatorLarkId,
            deptId: data.deptId ? String(data.deptId) : '',
            deptName: data.deptName,
            contractDeptId: data.contractDeptId ? String(data.contractDeptId) : '',
            contractDeptName: data.contractDeptName,
            oppositeDuration: data.oppositeDuration,
            oppositeTel: data.oppositeTel,
            contractFileUrl: serializeFileList(data.contractFileUrlObject),
            contractFileUrlObject: data.contractFileUrlObject,
            fileUrl: serializeFileList(data.fileUrlList),
            fileUrlList: data.fileUrlList,
            associatedApprovalObjects: data.associatedApprovalObjects || [],
        };
    };

    const saveContract = async (type: 'save' | 'submit') => {
        const payload = buildPayload(type === 'save' ? FRAMEWORK_STATUS_DRAFT : FRAMEWORK_STATUS_APPROVAL_GENERATING);
        const res = isEdit.value || payload.id
            ? await updateContractFramework(payload)
            : await createContractFramework(payload);
        if (res.code === 200 && res.data && !formData.value.id) {
            formData.value.id = res.data;
        }
        return res;
    };

    // 保存校验企业名称和合同名称，提交继续执行完整表单及日期校验。
    const confirmEvt = (type: 'save' | 'submit') => {
        formRef.value?.validate(async (errors: any) => {
            if (errors) {
                message.error(errors[0]?.[0]?.message || '请完善必填项');
                return;
            }
            if (
                type === 'submit' &&
                formData.value.startDate &&
                formData.value.endDate &&
                dayjs(formData.value.startDate).isAfter(dayjs(formData.value.endDate), 'day')
            ) {
                message.error('开始时间不能大于结束时间');
                return;
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

    const setEditData = (detail: any) => {
        editInitialCustomerId.value = detail.customerId ? String(detail.customerId) : null;
        const initiator = resolveEditInitiator(detail);
        const defaultDept = userInfo.value?.userDeptList?.[0] || {};
        const shouldUseCurrentUser = !hasContractInitiator(detail);
        formData.value = {
            ...formData.value,
            ...detail,
            id: detail.id || editId.value || null,
            signDate: normalizeDateValue(detail.signDate),
            startDate: normalizeDateString(detail.startDate),
            endDate: normalizeDateString(detail.endDate),
            directorSelectedPerson: createPersonOption(detail.directorId, detail.directorName),
            contractInitiatorId: initiator.id,
            contractInitiatorName: initiator.name,
            contractInitiatorLarkId: initiator.larkId,
            initiatorSelectedPerson: initiator.selectedPerson,
            deptId: shouldUseCurrentUser ? defaultDept.deptCode || detail.deptId || '' : detail.deptId,
            deptName: shouldUseCurrentUser ? defaultDept.deptName || detail.deptName || '' : detail.deptName,
            contractFileUrlObject: parseFileList(detail.contractFileUrlObject || detail.contractFileUrl),
            fileUrlList: parseFileList(detail.fileUrlList || detail.fileUrl),
            associatedApprovalObjects: Array.isArray(detail.associatedApprovalObjects) ? detail.associatedApprovalObjects : [],
        };
        calculateDuration();
    };

    const getDetail = async () => {
        if (!editId.value) return;
        const res = await getContractFramework(Number(editId.value));
        if (res.code === 200) {
            const detail = res.data || {};
            setEditData(detail);
            await loadEditApprovalLogs(detail.approvalId);
            console.log(approvalLogs, '0099')
        }
    };

    watch(
        () => [formData.value.startDate, formData.value.endDate],
        () => {
            calculateDuration();
        }
    );

    watch(
        () => dictMap.value,
        () => {
            if (!formData.value.priceMechanism) {
                formData.value.priceMechanism = getDictDefault('价格机制', FRAMEWORK_DEFAULT_PRICE_MECHANISM_VALUES);
            }
            if (!formData.value.paymentMethod) {
                formData.value.paymentMethod = getDictDefault('结算方式', FRAMEWORK_DEFAULT_PAYMENT_METHOD_VALUES);
            }
            if (!formData.value.pricingMethod) {
                formData.value.pricingMethod = getDictDefault('计价方式', FRAMEWORK_DEFAULT_PRICING_METHOD_VALUES);
            }
            if (!formData.value.supplierUnit) {
                formData.value.supplierUnit = getDictDefault('供方单位', FRAMEWORK_DEFAULT_SUPPLIER_UNIT_VALUES);
            }
        },
        { deep: true }
    );

    watch(
        () => userInfo.value,
        () => {
            syncUserDefaults();
        },
        { deep: true, immediate: true }
    );

    onMounted(() => {
        getAiReportList();
        getDetail();
    });

    return {
        confirmEvt,
        formData,
        formRules,
        formRef,
        getDictEnum,
        aiReportOptions,
        handleCustomerChange,
        handleAiReportChange,
        handleInitiatorChange,
        submitLoading,
        pageTitle,
        FILE_ACCEPT: FRAMEWORK_FILE_ACCEPT,
        FILE_SIZE_LIMIT: FRAMEWORK_FILE_SIZE_LIMIT,
        approvalLogs,
    };
};
