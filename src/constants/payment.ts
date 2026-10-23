// 回款单状态常量。
export const PAYMENT_STATUS_CONSTANT = {
  PAYMENT_STATUS_01: 'DRAFT',//草稿
  PAYMENT_STATUS_02: 'PROGRESS',//回款中
  PAYMENT_STATUS_03: 'COMPLETED',//已回款
  PAYMENT_STATUS_04: 'PROGRESS_OVERDUE',//回款中（逾期）
}
// 回款单状态展示配置，列表、详情和移动端标签统一使用。
export const paymentStatusMap = {
  [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01]: { label: "草稿", iconColor: '#FCBD12', textColor: '#E59222', borderColor: '#FFE49A', backgroundColor: '#FFF1D9' }, 
  [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02]: { label: "回款中", iconColor: '#0192FF', textColor: '#3370EB', borderColor: '#D9E3F5', backgroundColor: '#EFF4FF' }, 
  [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_03]: { label: "已回款", iconColor: "#18D851", textColor: "#5AA771", borderColor: '#E2F4D8', backgroundColor: '#F0F9EB' },
  [PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_04]: { label: "回款中（逾期）", iconColor: "#E34242", textColor: "#E34242", borderColor: '#f4d8d8', backgroundColor: '#ffd7d7' } 
};
export interface IStausItem {
  status?: string
}
/**
 * 回款单状态流转顺序。
 */
export const APPROVE_STATUS_LIST: IStausItem[] = [
  {
    status: PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_01,
  },
  {
    status: PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
  },
  {
    status: PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
  },
  {
    status: PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_02,
  },
  {
    status: PAYMENT_STATUS_CONSTANT.PAYMENT_STATUS_03,
  }
]
/**
 * 获取当前状态的上一个或下一个流程节点。
 * @param status  当前数据状态节点
 * @param isPass 是否通过，通过时取下一个节点，不通过时取上一个节点
 * @returns 目标流程节点，找不到时返回空对象
 */
export const getApproveNode = (status: string, isPass: boolean): IStausItem => {
  let node: IStausItem = {}
  let findIndex = APPROVE_STATUS_LIST.findIndex(item => item.status == status)
  if (isPass) {
    if (APPROVE_STATUS_LIST[findIndex + 1]) {
      node = APPROVE_STATUS_LIST[findIndex + 1]
    }
  } else {
    if (APPROVE_STATUS_LIST[findIndex - 1]) {
      node = APPROVE_STATUS_LIST[findIndex - 1]
    }
  }
  return node
}
