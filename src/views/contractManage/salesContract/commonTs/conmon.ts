export const SALES_CONTRACT_STATUS_DRAFT = 'DRAFT';
export const SALES_CONTRACT_STATUS_AUDITING = 'AUDITING';
export const SALES_CONTRACT_STATUS_CANCELING = 'CANCELING';
export const SALES_CONTRACT_STATUS_EXECUTING = 'EXECUTING';
export const SALES_CONTRACT_STATUS_ARCHIVED = 'ARCHIVED';
export const SALES_CONTRACT_STATUS_INVALID = 'INVALID';
export const SALES_CONTRACT_STATUS_APPROVAL_GENERATING = 'APPROVAL_GENERATING';
export const SALES_CONTRACT_STATUS_APPROVAL_GEN_FAILED = 'APPROVAL_GEN_FAILED';

export const statusConfig = [
    { label: '草稿', value: SALES_CONTRACT_STATUS_DRAFT, color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A', tableColor: '#FCBD12', dotColor: '#FCBD12' },
    { label: '审批生成中', value: SALES_CONTRACT_STATUS_APPROVAL_GENERATING, color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5', tableColor: '#0192FF', dotColor: '#0192FF' },
    { label: '审批生成失败', value: SALES_CONTRACT_STATUS_APPROVAL_GEN_FAILED, color: '#C94837', backgroudColor: '#F8E5E2', bdColor: '#FFD2CC', tableColor: '#F56C6C', dotColor: '#F56C6C' },
    { label: '审核中', value: SALES_CONTRACT_STATUS_AUDITING, color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5', tableColor: '#0192FF', dotColor: '#0192FF' },
    { label: '撤销中', value: SALES_CONTRACT_STATUS_CANCELING, color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A', tableColor: '#FCBD12', dotColor: '#FCBD12' },
    { label: '执行中', value: SALES_CONTRACT_STATUS_EXECUTING, color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5', tableColor: '#0192FF', dotColor: '#0192FF' },
    { label: '归档', value: SALES_CONTRACT_STATUS_ARCHIVED, color: '#5AA771', backgroudColor: '#F0F9EB', bdColor: '#E2F4D8', tableColor: '#18D851', dotColor: '#18D851' },
    { label: '作废', value: SALES_CONTRACT_STATUS_INVALID, color: '#999999', backgroudColor: '#F0F0F0', bdColor: '#DDDFE6', tableColor: '#CBCBCB', dotColor: '#CBCBCB' },
];

export const SALES_CONTRACT_ROUTE = {
    ADD: '/salesContract/add',
    EDIT: '/salesContract/edit',
    DETAIL: '/salesContract/detail',
    FRAMEWORK_DETAIL: '/frameworkContract/detail',
    MONTHLY_PLAN_DETAIL: '/monthlyShippingPlan/detail',
};

export const SALES_CONTRACT_DICT = {
    ORE_TYPE: '矿种',
    TRANSPORT_MODE: '运输方式',
    DELIVERY_METHOD: '交割方式',
    PAYMENT_METHOD: '销售合同结算方式',
    PRICING_METHOD: '计价方式',
    SUPPLIER_UNIT: '供方单位',
};

export const SALES_CONTRACT_PRICING_STATUS_CONTRACTED = 'CONTRACTED';
export const SALES_CONTRACT_FRAMEWORK_STATUS_EFFECTIVE = 'EFFECTIVE';
export const SALES_CONTRACT_DATE_FORMAT = 'YYYY-MM-DD';
export const SALES_CONTRACT_MONTH_FORMAT = 'YYYY-MM';
export const SALES_CONTRACT_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const SALES_CONTRACT_DATE_PICKER_FORMAT = 'yyyy-MM-dd';
export const SALES_CONTRACT_MONTH_PICKER_FORMAT = 'yyyy-MM';
export const SALES_CONTRACT_FILE_ACCEPT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
export const SALES_CONTRACT_FILE_SIZE_LIMIT = '50M';
export const SALES_CONTRACT_DEFAULT_PAYMENT_METHOD_VALUES = ['SALES_CLEARING_01', '月付'];
export const SALES_CONTRACT_DEFAULT_PRICING_METHOD_VALUES = ['PRICING_METHOD_01', '单价合同'];
export const SALES_CONTRACT_DEFAULT_SUPPLIER_UNIT_VALUES = ['SUPPLIER_UNIT_01', '四川火石子贸易有限公司'];
export const SALES_CONTRACT_FILE_UPLOAD_LIMIT = 9;
export const SALES_CONTRACT_CODE_MAX_LENGTH = 32;
export const SALES_CONTRACT_CODE_PATTERN = /^[A-Za-z0-9()-]+$/;
export const SALES_CONTRACT_TEXTAREA_MAX_LENGTH = 500;
export const SALES_CONTRACT_SHORT_TEXT_MAX_LENGTH = 50;
export const SALES_CONTRACT_DETAIL_TEXTAREA_MAX_LENGTH = 250;
export const SALES_CONTRACT_DETAIL_NUMBER_MAX = 999999999;
export const SALES_CONTRACT_AMOUNT_PRECISION = 2;
export const SALES_CONTRACT_QUANTITY_PRECISION = 3;
export const SALES_CONTRACT_TRANSPORT_FALLBACK_OPTIONS = [
    { label: '汽运', value: '汽运' },
    { label: '船运', value: '船运' },
];
export const SALES_CONTRACT_DETAIL_TAB = {
    BASIC: 1,
    APPROVAL: 2,
    SHIPPING: 3,
    SETTLEMENT: 4,
    RECEIPT: 5,
};
export const SALES_CONTRACT_DETAIL_TABS = [
    { name: '基础信息', key: SALES_CONTRACT_DETAIL_TAB.BASIC },
    { name: '审批流程', key: SALES_CONTRACT_DETAIL_TAB.APPROVAL },
    { name: '发运进度', key: SALES_CONTRACT_DETAIL_TAB.SHIPPING },
    { name: '结算进度', key: SALES_CONTRACT_DETAIL_TAB.SETTLEMENT },
    { name: '回款进度', key: SALES_CONTRACT_DETAIL_TAB.RECEIPT },
];
export const TABLE_ACTION_COLOR = '#2C65F2';
export const TABLE_DANGER_COLOR = '#E34242';
