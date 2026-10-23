export const MONTHLY_STATUS_DRAFT = 'DRAFT';
export const MONTHLY_STATUS_APPROVAL_GENERATING = 'APPROVAL_GENERATING';
export const MONTHLY_STATUS_APPROVAL_GEN_FAILED = 'APPROVAL_GEN_FAILED';
export const MONTHLY_STATUS_CANCELING = 'CANCELING';

export const statusConfig = [
    { label: '草稿', value: 'DRAFT', listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '审核中', value: 'REVIEWING', listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5' },
    { label: '撤销中', value: MONTHLY_STATUS_CANCELING, listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '审批生成中', value: 'APPROVAL_GENERATING', listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF', bdColor: '#D9E3F5' },
    { label: '审批生成失败', value: 'APPROVAL_GEN_FAILED', listColor: '#C94837', color: '#C94837', backgroudColor: '#F8E5E2', bdColor: '#FFD2CC' },
    { label: '已审核', value: 'APPROVED', listColor: '#18D851', color: '#5AA771', backgroudColor: '#F0F9EB', bdColor: '#E2F4D8' },
    { label: '已归档', value: 'ARCHIVED', listColor: '#18D851', color: '#5AA771', backgroudColor: '#F0F9EB', bdColor: '#E2F4D8' },
];

export const MONTHLY_DISPATCH_BIZ_TYPE = 'MONTHLY_DISPATCH';

export const getMonthlyStatusConfig = (status?: string) => {
    if (!status) return undefined;
    return statusConfig.find((item) => item.value === String(status).trim());
};

export const getMonthlyStatusLabel = (status?: string) => {
    return getMonthlyStatusConfig(status)?.label || '--';
};

/**
 * 获取状态标签的样式配置（用于 StatusTag 组件）
 */
export const getMonthlyStatusTagStyle = (status?: string) => {
    const cfg = getMonthlyStatusConfig(status);
    if (!cfg) return {};
    return {
        color: cfg.color,
        bgColor: cfg.backgroudColor,
        borderColor: cfg.bdColor,
    };
};
