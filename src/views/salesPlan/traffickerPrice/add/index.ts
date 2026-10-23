import { NFormItem, NInput, NInputNumber, NSelect, useMessage } from 'naive-ui';
import { computed, h, onMounted, ref, watch, resolveComponent } from 'vue';
import dayjs from 'dayjs';
import {
    ATTACHMENT_ACCEPT,
    ATTACHMENT_FILE_SIZE,
    ATTACHMENT_LIMIT,
    CUSTOMER_TYPE_TRADER,
    FormData,
    LOGISTICS_FEE_MAX,
    LOGISTICS_ATTACHMENT_ACCEPT,
    LOGISTICS_TOTAL_FEE_MAX,
    PRICING_STATUS_DRAFT,
    PRICING_STATUS_REVIEWING,
    createLogisticsDTOItem,
    createRefDTOItem,
    createTraderItemDTOItem,
    creatFormData,
} from '../commonTs/conmon';
import _ from 'lodash';
import {
    createSalesPlanBasePricing,
    getMarketSurveyChemicalInventorySituation,
    getSalesPlanBasePricingDetail,
    updateSalesPlanBasePricing,
} from '@/api/salesPlan';
import { queryCompetitorInventorySituationApi } from '@/api/competitor';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { getDeptTree, getYardPageApi } from '@/api';
import { useUserStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import { storeToRefs } from 'pinia';
import { useEditApprovalLogs } from '@/hooks/useEditApprovalLogs';

/**
 * 贸易商基准定价新增/编辑页数据与事件。
 */
export default () => {
    const router = useRouter();
    const route = useRoute()
    const message = useMessage();
    const { userInfo } = storeToRefs(useUserStore());
    const { dictMap } = storeToRefs(useDictStore());
    const { approvalLogs, loadEditApprovalLogs } = useEditApprovalLogs();
    // 表单实例，用于触发表单和动态表格校验。
    const formRef = ref<any>(null);
    // 页面表单数据。
    const formData = ref<FormData>(creatFormData());
    // 申请部门树。
    const deptTree = ref<any[]>([]);
    // 堆场下拉选项，展示堆场名称并保存堆场编码。
    const yardOptions = ref<Array<{ label: string; value: string }>>([]);
    const yardLoading = ref(false);
    // 详情接口加载状态。
    const pageLoading = ref(false);
    // 保存/提交接口加载状态，防止重复提交。
    const submitLoading = ref(false);
    // 库存默认值请求序号，用于避免快速切换月份时旧请求覆盖新结果。
    const inventoryRequestNo = ref(0);
    // 路由携带 id 时为编辑模式。
    const recordId = computed(() => route.query.id as string | undefined);
    // 复制参数优先于编辑参数，复制不会更新原单。
    const copyId = computed(() => route.query.copyId as string | undefined);
    // 是否复制模式。
    const isCopy = computed(() => !!copyId.value);
    // 是否编辑模式。
    const isEdit = computed(() => !!recordId.value && !isCopy.value);
    // 页面标题。
    const pageTitle = computed(() => {
        if (isCopy.value) return '复制贸易商基准定价';
        return isEdit.value ? '编辑贸易商基准定价' : '新增贸易商基准定价';
    });
    // 保留当前路由 query，兼容页面原有写法。
    const query = ref<any>(route.query)
    // 基准定价本体字段和审批信息字段校验规则。
    const formRules = ref<any>({
        pricingMonth: [
            {
                required: true,
                type: 'number',
                message: '请选择定价月份',
                trigger: 'blur',
            },
        ],
        projectName: [
            {
                required: true,
                message: '请输入项目名称',
                trigger: 'blur',
            },
        ],
        attendees: [
            {
                required: true,
                type: 'array',
                message: '请选择与会人员',
                trigger: 'blur',
            },
        ],
        'extTraderDTO.mainstreamChemInventory': [
            {
                required: true,
                message: '请输入主流化工企业存库情况',
                trigger: 'blur',
            },
        ],
        'extTraderDTO.mineInventory': [
            {
                required: true,
                message: '请输入矿山存库情况',
                trigger: 'blur',
            },
        ],
        'extTraderDTO.downstreamMarketSituation': [
            {
                required: true,
                message: '请输入下游产品市场情况',
                trigger: 'blur',
            },
        ],
        'extTraderDTO.competitorConcessionAmount': [
            {
                required: true,
                message: '请输入竞品矿山让利金额',
                trigger: 'blur',
            },
        ],
        'extTraderDTO.financialCost': [
            {
                required: true,
                message: '请输入财务费用',
                trigger: 'blur',
            },
        ],
        applicantId: [{ required: true, message: '请选择申请人', trigger: ['change', 'blur'] }],
        applyDeptId: [{ required: true, message: '请选择申请部门', trigger: ['change', 'blur'] }],
        companyId: [{ required: true, message: '请选择所属公司', trigger: ['change', 'blur'] }],
        logistics: [{ required: true, type: 'array', message: '请上传物流运输费用附件', trigger: ['change', 'blur'] }],
        approvalRemark: [{ required: true, message: '请输入审批备注', trigger: ['input', 'blur'] }],
        instruction: [{ required: true, message: '请输入事项说明', trigger: ['input', 'blur'] }],
    });

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
     * 生成品位与交货地址的组合键，字段不完整时不参与重复校验。
     * @param row 当前明细行
     * @param deliveryField 交货地址字段名
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
     * 生成品位与交货地址不可重复的动态表格校验规则。
     * @param list 当前表格数据
     * @param row 当前明细行
     * @param index 当前行下标
     * @param deliveryField 交货地址字段名
     * @param sectionLabel 表格名称
     * @param gradeLabel 品位字段名称
     * @returns Naive UI 表单校验规则
     */
    const uniqueGradeDeliveryRule = (
        list: any[],
        row: any,
        index: number,
        deliveryField: DeliveryField,
        sectionLabel: string,
        gradeLabel: string
    ) => ({
        trigger: ['change', 'blur', 'input'],
        validator() {
            const currentKey = getGradeDeliveryKey(row, deliveryField);
            if (!currentKey) return true;
            const duplicateIndex = list.findIndex(
                (item, itemIndex) =>
                    itemIndex < index && getGradeDeliveryKey(item, deliveryField) === currentKey
            );
            if (duplicateIndex >= 0) {
                return new Error(
                    `${sectionLabel}第${index + 1}行的${gradeLabel}和交货地址与第${duplicateIndex + 1}行重复`
                );
            }
            return true;
        },
    });

    // 物流运输费用表格配置。
    const transportConfig = computed(() => {
        return {
            columns: [
                {
                    key: 'routeInfo',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '路线');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `logisticsDTOList[${index}].routeInfo`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.routeInfo) {
                                            return new Error(`物流运输费用第${index + 1}行的路线必填`);
                                        }
                                    },
                                },
                            },
                            h(NInput, {
                                value: row.routeInfo,
                                showCount: true,
                                maxlength: 50,
                                onUpdateValue(value: any) {
                                    row.routeInfo = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'freightFee',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '运费(元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `logisticsDTOList[${index}].freightFee`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    type: 'number',
                                    validator() {
                                        if (!row.freightFee && row.freightFee !== 0) {
                                            return new Error(`物流运输费用第${index + 1}行的运费必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.freightFee,
                                min: 0,
                                precision: 2,
                                max: LOGISTICS_FEE_MAX,
                                onUpdateValue(value: any) {
                                    row.freightFee = value;
                                    logisticsItemChange(row);
                                },
                            })
                        );
                    },
                },
                {
                    key: 'loadingUnloadingFee',
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '装卸费(元/吨)');
                    },
                    width: 200,
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `logisticsDTOList[${index}].loadingUnloadingFee`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    type: 'number',
                                    validator() {
                                        if (!row.loadingUnloadingFee && row.loadingUnloadingFee !== 0) {
                                            return new Error(`物流运输费用第${index + 1}行的装卸费必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.loadingUnloadingFee,
                                min: 0,
                                precision: 2,
                                max: LOGISTICS_FEE_MAX,
                                onUpdateValue(value: any) {
                                    row.loadingUnloadingFee = value;
                                    logisticsItemChange(row);
                                },
                            })
                        );
                    },
                },
                {
                    key: 'transferFee',
                    width: 200,
                    title: (row: any, index: number) => {
                        return h('span', { class: 'require-label' }, '翻坝费(元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `logisticsDTOList[${index}].transferFee`,

                                rule: {
                                    trigger: ['input', 'blur'],
                                    type: 'number',
                                    validator() {
                                        if (!row.transferFee && row.transferFee !== 0) {
                                            return new Error(`物流运输费用第${index + 1}行的翻坝费必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.transferFee,
                                min: 0,
                                precision: 2,
                                max: LOGISTICS_FEE_MAX,
                                onUpdateValue(value: any) {
                                    row.transferFee = value;
                                    logisticsItemChange(row);
                                },
                            })
                        );
                    },
                },
                {
                    key: 'terminalFee',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '码头费(元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `logisticsDTOList[${index}].terminalFee`,

                                rule: {
                                    trigger: ['input', 'blur'],
                                    type: 'number',
                                    validator() {
                                        if (!row.terminalFee && row.terminalFee !== 0) {
                                            return new Error(`物流运输费用第${index + 1}行的码头费必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.terminalFee,
                                min: 0,
                                precision: 2,
                                max: LOGISTICS_FEE_MAX,
                                onUpdateValue(value: any) {
                                    row.terminalFee = value;
                                    logisticsItemChange(row);
                                },
                            })
                        );
                    },
                },
                {
                    key: 'totalFee',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '合计(元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `logisticsDTOList[${index}].totalFee`,

                                rule: {
                                    trigger: ['input', 'blur'],
                                    type: 'number',
                                    validator() {
                                        if (!row.totalFee && row.totalFee !== 0) {
                                            return new Error(`物流运输费用第${index + 1}行的合计必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.totalFee,
                                precision: 2,
                                disabled: true,
                                min: 0,
                                max: LOGISTICS_TOTAL_FEE_MAX,
                            })
                        );
                    },
                },
                {
                    key: 'remark',
                    title: '备注',
                    width: 200,
                    render: (row: any) => {
                        return h(
                            NFormItem,
                            {},
                            h(NInput, {
                                value: row.remark,
                                type: 'textarea',
                                showCount: true,
                                maxlength: 250,
                                onUpdateValue(value: any) {
                                    row.remark = value;
                                },
                            })
                        );
                    },
                },
            ],
            tableList: formData.value.logisticsDTOList,
            flexHeight: false,
            bordered: true,
            singleLine: false,
            styleOption: {
                padding: '0px',
            },
            tableBtns: [
                {
                    btnName: '删除',
                    btnColor: 'var(--base-color-red)',

                    clickTableBtns: (row: any, index: number) => {
                        if (formData.value.logisticsDTOList.length === 1) {
                            message.warning('至少保留一条物流运输费用');
                            return;
                        }
                        formData.value.logisticsDTOList.splice(index, 1);
                    },
                },
            ],
            isShowPagination: false,
        };
    });

    // 市场价（参考价）表格配置。
    const marketPriceConfig = computed(() => {
        return {
            columns: [
                {
                    key: 'refCompanyName',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '化工企业名称');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `refDTOList[${index}].refCompanyName`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.refCompanyName) {
                                            return new Error(`市场价(参考价)第${index + 1}行的化工企业名称必填`);
                                        }
                                    },
                                },
                            },
                            h(NInput, {
                                value: row.refCompanyName,
                                showCount: true,
                                maxlength: 50,
                                onUpdateValue(value: any) {
                                    row.refCompanyName = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'grade',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '品位(%)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `refDTOList[${index}].grade`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.grade && row.grade !== 0) {
                                            return new Error(`市场价(参考价)第${index + 1}行的品位必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.grade,
                                min: 0,
                                precision: 0,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.grade = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'deliveryLocation',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '交货地址');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `refDTOList[${index}].deliveryLocation`,
                                rule: {
                                    trigger: ['change', 'blur'],
                                    validator() {
                                        if (!row.deliveryLocation) {
                                            return new Error(`市场价(参考价)第${index + 1}行的交货地址必填`);
                                        }
                                        return true;
                                    },
                                },
                            },
                            renderYardSelect(row, 'deliveryLocation')
                        );
                    },
                },
                {
                    key: 'currentPrice',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '当前采购价(元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `refDTOList[${index}].currentPrice`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.currentPrice && row.currentPrice !== 0) {
                                            return new Error(`市场价(参考价)第${index + 1}行的当前采购价必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.currentPrice,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.currentPrice = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'remark',
                    title: '备注',
                    width: 200,
                    render: (row: any) => {
                        return h(
                            NFormItem,
                            {},
                            h(NInput, {
                                value: row.remark,
                                type: 'textarea',
                                showCount: true,
                                maxlength: 250,
                                onUpdateValue(value: any) {
                                    row.remark = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'attachmentUrls',
                    title: '附件',
                    width: 260,
                    render: (row: any) => {
                        const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                        return h(MxWebFileUpload, {
                            class: 'market-price-upload',
                            limit: ATTACHMENT_LIMIT,
                            multiple: true,
                            fileSize: ATTACHMENT_FILE_SIZE,
                            forceAppSize: true,
                            appSizeWidth: 80,
                            // 修改点：将 value 改为 modelValue
                            modelValue: row.attachmentUrls,
                            // 建议添加：确保双向绑定更新
                            'onUpdate:modelValue': (val: any) => {
                                row.attachmentUrls = val;
                            },
                            accept: ATTACHMENT_ACCEPT,
                        });
                    },
                },
            ],
            tableList: formData.value.refDTOList,
            flexHeight: false,
            bordered: true,
            singleLine: false,
            styleOption: {
                padding: '0px',
            },
            tableBtns: [
                {
                    btnName: '删除',
                    btnColor: 'var(--base-color-red)',
                    clickTableBtns: (row: any, index: number) => {
                        if (formData.value.refDTOList.length === 1) {
                            message.warning('至少保留一条市场参考价');
                            return;
                        }
                        formData.value.refDTOList.splice(index, 1);
                    },
                },
            ],
            isShowPagination: false,
        };
    });

    // 贸易商磷矿石销售价表格配置。
    const goodsPriceConfig = computed(() => {
        return {
            columns: [
                {
                    key: 'grade',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '矿石品位(%)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].grade`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.grade && row.grade !== 0) {
                                            return new Error(`贸易商磷矿石销售价第${index + 1}行的矿石品位必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.grade,
                                min: 0,
                                precision: 0,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.grade = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'deliveryAddress',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '交货地址');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].deliveryAddress`,
                                rule: [
                                    {
                                        trigger: ['change', 'blur'],
                                        validator() {
                                            if (!row.deliveryAddress) {
                                                return new Error(`贸易商磷矿石销售价第${index + 1}行的交货地址必填`);
                                            }
                                            return true;
                                        },
                                    },
                                    uniqueGradeDeliveryRule(
                                        formData.value.traderItemDTOList,
                                        row,
                                        index,
                                        'deliveryAddress',
                                        '贸易商磷矿石销售价',
                                        '矿石品位(%)'
                                    ),
                                ],
                            },
                            renderYardSelect(row, 'deliveryAddress')
                        );
                    },
                },
                {
                    key: 'guidePrice',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '下游厂家指导价(元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].guidePrice`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.guidePrice && row.guidePrice !== 0) {
                                            return new Error(`贸易商磷矿石销售价第${index + 1}行的下游厂家指导价必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.guidePrice,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.guidePrice = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'transportFee',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '运输费用');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].transportFee`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.transportFee && row.transportFee !== 0) {
                                            return new Error(`贸易商磷矿石销售价第${index + 1}行的运输费用必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.transportFee,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.transportFee = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'marketAdjustment',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '市场调节金额');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].marketAdjustment`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.marketAdjustment && row.marketAdjustment !== 0) {
                                            return new Error(`贸易商磷矿石销售价第${index + 1}行的市场调节金额必填`);
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.marketAdjustment,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.marketAdjustment = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'financialAcceptanceDiscount',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '财务承兑优惠金额 (元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].financialAcceptanceDiscount`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.financialAcceptanceDiscount && row.financialAcceptanceDiscount !== 0) {
                                            return new Error(
                                                `贸易商磷矿石销售价第${index + 1}行的财务承兑优惠金额必填`
                                            );
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.financialAcceptanceDiscount,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.financialAcceptanceDiscount = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'financialCashDiscount',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '财务现金优惠金额 (元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].financialCashDiscount`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.financialCashDiscount && row.financialCashDiscount !== 0) {
                                            return new Error(
                                                `贸易商磷矿石销售价第${index + 1}行的财务现金优惠金额必填`
                                            );
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.financialCashDiscount,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.financialCashDiscount = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'traderDraftMinPrice',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '贸易商汇票最低报价 (元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].traderDraftMinPrice`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.traderDraftMinPrice && row.traderDraftMinPrice !== 0) {
                                            return new Error(
                                                `贸易商磷矿石销售价第${index + 1}行的贸易商汇票最低报价必填`
                                            );
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.traderDraftMinPrice,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.traderDraftMinPrice = value;
                                },
                            })
                        );
                    },
                },
                {
                    key: 'traderCashMinPrice',
                    width: 200,
                    title: (row: any) => {
                        return h('span', { class: 'require-label' }, '贸易商现金最低报价 (元/吨)');
                    },
                    render: (row: any, index: number) => {
                        return h(
                            NFormItem,
                            {
                                path: `traderItemDTOList[${index}].traderCashMinPrice`,
                                rule: {
                                    trigger: ['input', 'blur'],
                                    validator() {
                                        if (!row.traderCashMinPrice && row.traderCashMinPrice !== 0) {
                                            return new Error(
                                                `贸易商磷矿石销售价第${index + 1}行的贸易商现金最低报价必填`
                                            );
                                        }
                                    },
                                },
                            },
                            h(NInputNumber, {
                                value: row.traderCashMinPrice,
                                min: 0,
                                precision: 2,
                                max: 9999999,
                                onUpdateValue(value: any) {
                                    row.traderCashMinPrice = value;
                                },
                            })
                        );
                    },
                },
            ],
            tableList: formData.value.traderItemDTOList,
            flexHeight: false,
            bordered: true,
            singleLine: false,
            styleOption: {
                padding: '0px',
            },
            tableBtns: [
                {
                    btnName: '删除',
                    btnColor: 'var(--base-color-red)',
                    clickTableBtns: (row: any, index: number) => {
                        if (formData.value.traderItemDTOList.length === 1) {
                            message.warning('至少保留一条贸易商磷矿石销售价');
                            return;
                        }
                        formData.value.traderItemDTOList.splice(index, 1);
                    },
                },
            ],
            isShowPagination: false,
        };
    });

    /**
     * 计算物流运输费用合计。
     */
    const logisticsItemChange = (row: any) => {
        row.totalFee =
            Number(row.freightFee || 0) +
            Number(row.loadingUnloadingFee || 0) +
            Number(row.transferFee || 0) +
            Number(row.terminalFee || 0);
    };
    /**
     * 新增动态表格明细行。
     */
    const addItem = (type: 'transport' | 'marketPrice' | 'goodsPrice') => {
        switch (type) {
            case 'transport':
                formData.value.logisticsDTOList.push(createLogisticsDTOItem());
                break;
            case 'marketPrice':
                formData.value.refDTOList.push(createRefDTOItem());
                break;
            case 'goodsPrice':
                formData.value.traderItemDTOList.push(createTraderItemDTOItem());
                break;
        }
    };

    const companyOptions = computed<any[]>(() => dictMap.value?.['所属公司'] || []);

    const findCompany = (companyId: any, companyName?: string) => {
        return companyOptions.value.find(
            (item: any) => String(item.value) === String(companyId) || item.label === companyName
        );
    };

    const getDefaultCompany = () => {
        return companyOptions.value.find((item: any) => item.label === '四川火石子贸易有限公司') || companyOptions.value[0];
    };

    const setCompanyName = (companyId = formData.value.companyId) => {
        const company = findCompany(companyId);
        formData.value.companyName = company?.label || '';
    };

    const getApplicantLarkUserId = (user: any) => {
        return user?.larkUserId || user?.feishuUserId || user?.larkId || '';
    };

    const fillDefaultApprovalInfo = () => {
        const info: any = userInfo.value || {};
        const defaultDept = info.userDeptList?.[0] || {};
        formData.value.applicantId = info.code || '';
        formData.value.applicantName = info.username || '';
        formData.value.larkUserId = getApplicantLarkUserId(info);
        formData.value.applyDeptId = defaultDept.deptCode || '';
        formData.value.applyDeptName = defaultDept.deptName || '';
        if (!formData.value.companyId) {
            const defaultCompany = getDefaultCompany();
            formData.value.companyId = defaultCompany?.value || '';
            formData.value.companyName = defaultCompany?.label || '';
        } else {
            setCompanyName();
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

    /**
     * 将人员选择组件数据转换为接口需要的人员结构。
     */
    const formatAttendeesForSubmit = (attendees: any[]) => {
        return (Array.isArray(attendees) ? attendees : []).map((item: any) => ({
            code: item.value || item.code,
            larkUserId: item.larkUserId,
            username: item.label || item.username,
        }));
    };

    /**
     * 将接口返回的人员结构转换为人员选择组件回显结构。
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
     * 提交前组装基准定价接口参数。
     */
    const buildSubmitData = (status: string) => {
        const formValue: any = _.cloneDeep(formData.value);
        const companyName = formValue.companyName || findCompany(formValue.companyId)?.label || '';
        const associatedApproval = JSON.stringify(formValue.associatedApproval || []);
        // 显式组装接口 DTO，避免把详情回显的冗余字段或未联调的审批字段一并提交。
        const submitData: any = {
            ...(isEdit.value ? { id: formValue.id, pricingCode: formValue.pricingCode } : {}),
            pricingMonth: formValue.pricingMonth ? dayjs(formValue.pricingMonth).format('YYYY-MM') : '',
            status,
            customerType: CUSTOMER_TYPE_TRADER,
            projectName: formValue.projectName,
            attendees: formatAttendeesForSubmit(formValue.attendees),
            applicantId: formValue.applicantId,
            applicantName: formValue.applicantName,
            larkUserId: formValue.larkUserId,
            applyDeptId: formValue.applyDeptId,
            applyDeptName: formValue.applyDeptName,
            companyId: formValue.companyId,
            companyName,
            approvalRemark: formValue.approvalRemark,
            instruction: formValue.instruction,
            logistics: formValue.logistics || [],
            approvalDTO: {
                ...(isEdit.value ? (formValue.approvalDTO || {}) : {}),
                applicantId: formValue.applicantId,
                applicantName: formValue.applicantName,
                larkUserId: formValue.larkUserId,
                applyDeptId: formValue.applyDeptId,
                applyDeptName: formValue.applyDeptName,
                companyId: formValue.companyId,
                companyName,
                remark: formValue.approvalRemark,
                instruction: formValue.instruction,
                approveUrl: formValue.attachmentUrls || [],
                associatedApproval,
            },
            associatedApproval,
            extTraderDTO: {
                ...(isEdit.value
                    ? {
                        id: formValue.extTraderDTO?.id,
                        pricingId: formValue.extTraderDTO?.pricingId,
                        pricingCode: formValue.extTraderDTO?.pricingCode,
                    }
                    : {}),
                mainstreamChemInventory: formValue.extTraderDTO?.mainstreamChemInventory,
                mineInventory: formValue.extTraderDTO?.mineInventory,
                downstreamMarketSituation: formValue.extTraderDTO?.downstreamMarketSituation,
                competitorConcessionAmount: formValue.extTraderDTO?.competitorConcessionAmount,
                financialCost: formValue.extTraderDTO?.financialCost,
                remark: formValue.extTraderDTO?.remark,
            },
        };
        /*
        submitData.logisticsDTOList = (formValue.logisticsDTOList || []).map((item: any) => ({
            id: item.id,
            pricingId: item.pricingId,
            pricingCode: item.pricingCode,
            customerType: CUSTOMER_TYPE_TRADER,
            // 后端字段为 routeInfo，兼容历史页面曾经使用的 name 字段。
            routeInfo: item.routeInfo || item.name,
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
            customerType: CUSTOMER_TYPE_TRADER,
            refCompanyName: item.refCompanyName,
            grade: item.grade,
            deliveryLocation: getYardCode(item.deliveryLocation),
            deliveryLocationName: getYardName(item.deliveryLocation) || item.deliveryLocationName || '',
            currentPrice: item.currentPrice,
            remark: item.remark,
            attachmentUrls: item.attachmentUrls || [],
        }));
        submitData.traderItemDTOList = (formValue.traderItemDTOList || []).map((item: any) => ({
            ...(isEdit.value
                ? {
                    id: item.id,
                    pricingId: item.pricingId,
                    pricingCode: item.pricingCode,
                }
                : {}),
            grade: item.grade,
            deliveryAddress: getYardCode(item.deliveryAddress),
            deliveryLocationName: getYardName(item.deliveryAddress) || item.deliveryLocationName || '',
            guidePrice: item.guidePrice,
            transportFee: item.transportFee,
            marketAdjustment: item.marketAdjustment,
            financialAcceptanceDiscount: item.financialAcceptanceDiscount,
            financialCashDiscount: item.financialCashDiscount,
            traderDraftMinPrice: item.traderDraftMinPrice,
            traderCashMinPrice: item.traderCashMinPrice,
        }));
        return submitData;
    };

    /**
     * 校验保存贸易商基准定价时的基础必填字段。
     * @returns 首个校验错误文案，校验通过返回 null
     */
    const validateSaveFields = (): string | null => {
        const { pricingMonth, projectName } = formData.value;
        if (pricingMonth === null || pricingMonth === undefined || pricingMonth === '') {
            return '请选择定价月份';
        }
        if (!String(projectName || '').trim()) {
            return '请输入项目名称';
        }
        return null;
    };

    /**
     * 保存或提交表单。
     */
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
                message.error(errors?.[0]?.[0]?.message || '请完善必填项');
                return;
            }
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
            console.error(type === 'save' ? '保存贸易商基准定价失败:' : '提交贸易商基准定价失败:', error);
            message.error(type === 'save' ? '保存失败，请稍后重试' : '提交失败，请稍后重试');
        } finally {
            submitLoading.value = false;
        }
    };

    /**
     * 将库存统计接口数据格式化为 PRD 要求的默认文案。
     */
    const formatInventorySummary = (type: 'chemical' | 'mine', data: any) => {
        const companyCount = data?.companyCount ?? 0;
        const inventorySum = data?.inventorySum ?? 0;
        if (type === 'chemical') {
            return `调研${companyCount}家磷化工企业中，库存合计：${inventorySum}万吨，最多库存${data?.inventoryMax ?? 0
                }万吨，最少库存${data?.inventoryMin ?? 0}万吨`;
        }
        return `调研${companyCount}家矿石企业中，库存合计${inventorySum}万吨左右`;
    };


    /**
     * 根据当前月份调用库存统计接口，带出主流化工企业和矿山库存默认文案。
     * 主流化工企业存库情况：/marketSurveyChemical/inventorySituation
     * 矿山存库情况：/marketSurveyCompetitor/inventorySituation
     */
    const fillInventoryByCurrentMonth = async (force = false) => {
        const requestNo = ++inventoryRequestNo.value;
        // 两个库存接口互不依赖，单个接口失败时不影响另一个字段回填。
        const [chemicalRes, mineRes] = await Promise.all([
            getMarketSurveyChemicalInventorySituation().catch(() => null),
            queryCompetitorInventorySituationApi().catch(() => null),
        ]);
        if (requestNo !== inventoryRequestNo.value) return;
        if (chemicalRes?.code === 200 && (force || !formData.value.extTraderDTO.mainstreamChemInventory)) {
            formData.value.extTraderDTO.mainstreamChemInventory = formatInventorySummary('chemical', chemicalRes.data);
        }
        if (mineRes?.code === 200 && (force || !formData.value.extTraderDTO.mineInventory)) {
            formData.value.extTraderDTO.mineInventory = formatInventorySummary('mine', mineRes.data);
        }
    };

    /**
     * 定价月份变更时只更新基准定价月份，不影响调研库存查询月份。
     */
    const handlePricingMonthChange = (value: number | null) => {
        formData.value.pricingMonth = value;
    };

    /**
     * 将接口返回的贸易商基准定价详情转换为编辑表单数据。
     * 主表字段只读取详情根节点，审批字段只读取 approvalDTO，明细字段只读取接口定义的数组。
     * @param data 贸易商基准定价详情
     * @returns 编辑表单数据
     */
    const formatTraderDetailForEdit = (data: any, copy = false): FormData => {
        const approvalDTO = data.approvalDTO || {};
        const extTraderDTO = data.extTraderDTO;

        return {
            id: copy ? undefined : data.id,
            pricingCode: copy ? undefined : data.pricingCode,
            status: copy ? PRICING_STATUS_DRAFT : data.status,
            customerType: CUSTOMER_TYPE_TRADER,
            pricingMonth: data.pricingMonth ? dayjs(data.pricingMonth).valueOf() : null,
            projectName: data.projectName,
            attendees: formatAttendeesForView(data.attendees),
            extTraderDTO: {
                ...(copy
                    ? {}
                    : {
                        id: extTraderDTO?.id,
                        pricingId: extTraderDTO?.pricingId,
                        pricingCode: extTraderDTO?.pricingCode,
                    }),
                mainstreamChemInventory: extTraderDTO?.mainstreamChemInventory,
                mineInventory: extTraderDTO?.mineInventory,
                downstreamMarketSituation: extTraderDTO?.downstreamMarketSituation,
                competitorConcessionAmount: extTraderDTO?.competitorConcessionAmount,
                financialCost: extTraderDTO?.financialCost,
                remark: extTraderDTO?.remark,
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
            traderItemDTOList: (data.traderItemDTOList || []).map((item: any) => ({
                ...(copy
                    ? {}
                    : {
                        id: item.id,
                        pricingId: item.pricingId,
                        pricingCode: item.pricingCode,
                    }),
                grade: item.grade,
                deliveryAddress: item.deliveryAddress,
                deliveryLocationName: item.deliveryLocationName,
                guidePrice: item.guidePrice,
                transportFee: item.transportFee,
                marketAdjustment: item.marketAdjustment,
                financialAcceptanceDiscount: item.financialAcceptanceDiscount,
                financialCashDiscount: item.financialCashDiscount,
                traderDraftMinPrice: item.traderDraftMinPrice,
                traderCashMinPrice: item.traderCashMinPrice,
            })),
            applicantId: approvalDTO.applicantId ?? data.applicantId,
            applicantName: approvalDTO.applicantName ?? data.applicantName,
            larkUserId: approvalDTO.larkUserId ?? data.larkUserId,
            applyDeptId: approvalDTO.applyDeptId ?? data.applyDeptId,
            applyDeptName: approvalDTO.applyDeptName ?? data.applyDeptName,
            companyId: approvalDTO.companyId ?? data.companyId,
            companyName: approvalDTO.companyName ?? data.companyName,
            // 复制时保留审批信息区域的全部内容，但不携带原审批主表 ID/状态。
            approvalRemark: approvalDTO.remark ?? data.approvalRemark ?? '',
            instruction: approvalDTO.instruction ?? data.instruction,
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
        pageLoading.value = true;
        try {
            const res = await getSalesPlanBasePricingDetail(sourceId);
            if (res.code === 200) {
                const detail: any = res.data;
                formData.value = formatTraderDetailForEdit(detail, isCopy.value);
                if (!isCopy.value) {
                    await loadEditApprovalLogs(detail.approvalDTO?.id);
                }
            }
        } catch (error) {
            console.error('加载贸易商基准定价详情失败:', error);
            message.error('详情加载失败，请稍后重试');
        } finally {
            pageLoading.value = false;
        }
    }

    /**
     * 页面初始化：编辑模式只回显详情，新增模式按默认定价月份带出库存文案。
     */
    onMounted(async () => {
        await loadDeptTree();
        await loadYardOptions();
        if (query.value?.id || query.value?.copyId) {
            await initEditData();
        } else {
            fillDefaultApprovalInfo();
            fillInventoryByCurrentMonth();
        }
    })

    watch(
        companyOptions,
        () => {
            if (!query.value?.id && !query.value?.copyId && !formData.value.companyId) {
                fillDefaultApprovalInfo();
            }
        },
        { immediate: true }
    );

    return {
        formRef,
        confirmEvt,
        formData,
        formRules,
        pageTitle,
        pageLoading,
        submitLoading,
        isEdit,
        // transportConfig,
        marketPriceConfig,
        goodsPriceConfig,
        addItem,
        handlePricingMonthChange,
        deptTree,
        handleApplicantChange,
        ATTACHMENT_ACCEPT,
        LOGISTICS_ATTACHMENT_ACCEPT,
        ATTACHMENT_FILE_SIZE,
        ATTACHMENT_LIMIT,
        approvalLogs,
    };
};
