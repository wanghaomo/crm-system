export const SETTLEMENT_STATUS_CONSTANT = {
    PAYMENT_STATUS_01: 'DRAFT', // 草稿
    PAYMENT_STATUS_02: 'REVIEWING', // 审批中
    PAYMENT_STATUS_03: 'ARCHIVED', // 已归档
    APPROVAL_GENERATING: 'APPROVAL_GENERATING', // 审批生成中
    APPROVAL_GEN_FAILED: 'APPROVAL_GEN_FAILED', // 审批生成失败
    CANCELING: 'CANCELING', // 撤销中
};

const SETTLEMENT_STATUS_STYLE = {
    DRAFT: { label: '草稿', iconColor: '#FCBD12', textColor: '#E59222', borderColor: '#FFE49A', backgroundColor: '#FFF1D9' },
    REVIEWING: { label: '审批中', iconColor: '#0192FF', textColor: '#3370EB', borderColor: '#D9E3F5', backgroundColor: '#EFF4FF' },
    ARCHIVED: { label: '已归档', iconColor: '#18D851', textColor: '#5AA771', borderColor: '#E2F4D8', backgroundColor: '#F0F9EB' },
    APPROVAL_GENERATING: { label: '审批生成中', iconColor: '#0192FF', textColor: '#3370EB', borderColor: '#D9E3F5', backgroundColor: '#EFF4FF' },
    APPROVAL_GEN_FAILED: { label: '审批生成失败', iconColor: '#F56C6C', textColor: '#C94837', borderColor: '#FFD2CC', backgroundColor: '#F8E5E2' },
    CANCELING: { label: '撤销中', iconColor: '#FCBD12', textColor: '#E59222', borderColor: '#FFE49A', backgroundColor: '#FFF1D9' },
};

export const settlementStatusMap = {
    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_01]: SETTLEMENT_STATUS_STYLE.DRAFT,
    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_02]: SETTLEMENT_STATUS_STYLE.REVIEWING,
    [SETTLEMENT_STATUS_CONSTANT.PAYMENT_STATUS_03]: SETTLEMENT_STATUS_STYLE.ARCHIVED,
    [SETTLEMENT_STATUS_CONSTANT.APPROVAL_GENERATING]: SETTLEMENT_STATUS_STYLE.APPROVAL_GENERATING,
    [SETTLEMENT_STATUS_CONSTANT.APPROVAL_GEN_FAILED]: SETTLEMENT_STATUS_STYLE.APPROVAL_GEN_FAILED,
    [SETTLEMENT_STATUS_CONSTANT.CANCELING]: SETTLEMENT_STATUS_STYLE.CANCELING,
};
