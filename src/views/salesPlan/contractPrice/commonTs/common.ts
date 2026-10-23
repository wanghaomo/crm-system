// 合同定价通用状态。
export const PRICING_STATUS_DRAFT = 'DRAFT';
export const PRICING_STATUS_STORAGE = 'STORAGE';
export const PRICING_STATUS_REVIEWING = 'REVIEWING';
export const PRICING_STATUS_CANCELING = 'CANCELING';
export const PRICING_STATUS_APPROVED = 'APPROVED';
export const PRICING_STATUS_REJECTED = 'REJECTED';
export const PRICING_STATUS_CANCELLED = 'CANCELLED';
export const PRICING_STATUS_ARCHIVED = 'ARCHIVED';
export const PRICING_STATUS_CONTRACTED = 'CONTRACTED';
export const PRICING_STATUS_APPROVAL_GENERATING = 'APPROVAL_GENERATING';
export const PRICING_STATUS_APPROVAL_GEN_FAILED = 'APPROVAL_GEN_FAILED';

export const statusConfig = [
    { label: '草稿', value: PRICING_STATUS_DRAFT, listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9',bdColor:'#FFE49A'},
    { label: '审核中', value: PRICING_STATUS_REVIEWING, listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF' ,bdColor:'#D9E3F5' },
    { label: '撤销中', value: PRICING_STATUS_CANCELING, listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '已生成合同', value: PRICING_STATUS_CONTRACTED,  listColor: '#18D851', color: '#5AA771', backgroudColor: '#F0F9EB',bdColor:'#E2F4D8' },
    { label: '审批生成中', value: PRICING_STATUS_APPROVAL_GENERATING, listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF' ,bdColor:'#D9E3F5' },
    { label: '审批生成失败', value: PRICING_STATUS_APPROVAL_GEN_FAILED, listColor: '#C94837', color: '#C94837', backgroudColor: '#F8E5E2',bdColor:'#FFD2CC' },
];
