// 发货订单主单和明细共用状态常量。
export const PLAN_STATUS_CONSTANT = {
  DRAFT: 'DRAFT', // 草稿（保存后未提交）
  PENDING: 'PENDING', // 待执行
  EXECUTING: 'EXECUTING', // 执行中
  COMPLETED: 'COMPLETED', // 已完成
  TERMINATED: 'TERMINATED', // 暂停发货
  PLAN_STATUS_01: 'PLAN_STATUS_01',
  PLAN_STATUS_02: 'PLAN_STATUS_02',
  PLAN_STATUS_03: 'PLAN_STATUS_03',
  PLAN_STATUS_04: 'PLAN_STATUS_04',
}

// 发货类型，主单和发货明细提交时保持一致。
export const DAILY_SHIPPING_PLAN_TYPE = {
    CONTRACT: 'CONTRACT',
    PRE: 'PRE',
} as const;

export const dailyShippingPlanTypeOptions = [
    { label: '合同发货', value: DAILY_SHIPPING_PLAN_TYPE.CONTRACT },
    { label: '预发货', value: DAILY_SHIPPING_PLAN_TYPE.PRE },
];

/**
 * 获取发货类型展示文案。
 * @param value 发货类型枚举值
 * @returns 发货类型中文文案，未知值返回占位符
 */
export const getDailyShippingPlanTypeLabel = (value: unknown) => {
    return dailyShippingPlanTypeOptions.find((item) => item.value === value)?.label || '--';
};
// 状态展示配置，列表、详情和 App 标签统一从这里取颜色和文案。
export const planStatusMap = {
  [PLAN_STATUS_CONSTANT.DRAFT]: { label: "草稿", iconColor: '#8C8C8C', textColor: '#666666', borderColor: '#E0E0E6', backgroundColor: '#F5F5F7' },
  [PLAN_STATUS_CONSTANT.PENDING]: { label: "待执行", iconColor: '#FCBD12', textColor: '#E59222', borderColor: '#FFE49A', backgroundColor: '#FFF1D9' },
  [PLAN_STATUS_CONSTANT.EXECUTING]: { label: "执行中", iconColor: '#0192FF', textColor: '#3370EB', borderColor: '#D9E3F5', backgroundColor: '#EFF4FF' },
  [PLAN_STATUS_CONSTANT.COMPLETED]: { label: "已完成", iconColor: "#18D851", textColor: "#5AA771", borderColor: '#E2F4D8', backgroundColor: '#F0F9EB' },
  [PLAN_STATUS_CONSTANT.TERMINATED]: { label: "暂停发货", iconColor: "#CBCBCB", textColor: "#999999", borderColor: '#DDDFE6', backgroundColor: '#F0F0F0' },
  [PLAN_STATUS_CONSTANT.PLAN_STATUS_01]: { label: "待执行", iconColor: '#FCBD12', textColor: '#E59222', borderColor: '#FFE49A', backgroundColor: '#FFF1D9' },
  [PLAN_STATUS_CONSTANT.PLAN_STATUS_02]: { label: "执行中", iconColor: '#0192FF', textColor: '#3370EB', borderColor: '#D9E3F5', backgroundColor: '#EFF4FF' },
  [PLAN_STATUS_CONSTANT.PLAN_STATUS_03]: { label: "已完成", iconColor: "#18D851", textColor: "#5AA771", borderColor: '#E2F4D8', backgroundColor: '#F0F9EB' },
  [PLAN_STATUS_CONSTANT.PLAN_STATUS_04]: { label: "已取消", iconColor: "#CBCBCB", textColor: "#999999", borderColor: '#DDDFE6', backgroundColor: '#F0F0F0' },
};
