export const statusConfig = [
    { label: '草稿', value: 'DRAFT', dotColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '审批生成中', value: 'APPROVAL_GENERATING', dotColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5' },
    { label: '审批生成失败', value: 'APPROVAL_GEN_FAILED', dotColor: '#F56C6C', color: '#C94837', backgroudColor: '#F8E5E2', bdColor: '#FFD2CC' },
    { label: '审核中', value: 'AUDITING', dotColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5' },
    { label: '撤销中', value: 'CANCELING', dotColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '生效中', value: 'EFFECTIVE', dotColor: '#18D851', color: '#5AA771', backgroudColor: '#F0F9EB', bdColor: '#E2F4D8' },
    { label: '已到期', value: 'EXPIRED', dotColor: '#F59E0B', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '已作废', value: 'TERMINATED', dotColor: '#CBCBCB', color: '#999999', backgroudColor: '#F0F0F0', bdColor: '#DDDFE6' },
];

export const TABLE_ACTION_COLOR = 'var(--base-color)';
export const TABLE_DANGER_COLOR = 'var(--base-color-red)';
export const FRAMEWORK_STATUS_DRAFT = 'DRAFT';
export const FRAMEWORK_STATUS_AUDITING = 'AUDITING';
export const FRAMEWORK_STATUS_CANCELING = 'CANCELING';
export const FRAMEWORK_STATUS_EFFECTIVE = 'EFFECTIVE';
export const FRAMEWORK_STATUS_EXPIRED = 'EXPIRED';
export const FRAMEWORK_STATUS_TERMINATED = 'TERMINATED';
export const FRAMEWORK_STATUS_APPROVAL_GENERATING = 'APPROVAL_GENERATING';
export const FRAMEWORK_STATUS_APPROVAL_GEN_FAILED = 'APPROVAL_GEN_FAILED';

export const FRAMEWORK_FILE_ACCEPT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
export const FRAMEWORK_FILE_SIZE_LIMIT = '50M';

export const FRAMEWORK_DEFAULT_PRICE_MECHANISM_VALUES = ['PRICE_MECHANISM_02', '月度指数联动'];
export const FRAMEWORK_DEFAULT_PAYMENT_METHOD_VALUES = ['PAYMENT_METHOD_01', '银行转账'];
export const FRAMEWORK_DEFAULT_PRICING_METHOD_VALUES = ['PRICING_METHOD_01', '单价合同'];
export const FRAMEWORK_DEFAULT_SUPPLIER_UNIT_VALUES = ['SUPPLIER_UNIT_01', '四川火石子贸易有限公司'];

export const FRAMEWORK_TAB_BASIC = 1;
export const FRAMEWORK_TAB_APPROVAL = 2;
export const FRAMEWORK_TAB_LINKED_CONTRACT = 3;
export const FRAMEWORK_DETAIL_TABS = [
    { name: '基础信息', key: FRAMEWORK_TAB_BASIC },
    { name: '审批流程', key: FRAMEWORK_TAB_APPROVAL },
    { name: '关联合同', key: FRAMEWORK_TAB_LINKED_CONTRACT },
];
