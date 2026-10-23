export const MARKET_REPORT_STATUS_CONSTANT = {
  DRAFT: 'DRAFT',//草稿
  ARCHIVED: 'ARCHIVED',//已归档
}
export const marketReportStatusMap = {
  [MARKET_REPORT_STATUS_CONSTANT.DRAFT]: { label: "草稿", iconColor: '#FCBD12', textColor: '#FCBD12', borderColor: '#F4EADC', backgroundColor: '#FFF7E0' }, 
  [MARKET_REPORT_STATUS_CONSTANT.ARCHIVED]: { label: "已归档", iconColor: "#18D851", textColor: "#5AA771", borderColor: '#E2F4D8', backgroundColor: '#F0F9EB' },
};
export const MARKET_REPORT_PUSH_STATUS_CONSTANT = {
  NOT: 'NOT',//未推送
  PENDING: 'PENDING',//推送中
  SUCCESS: 'SUCCESS',//已推送
  FAILED: 'FAILED',//推送失败
}
export const marketReportPushStatusMap = {
  [MARKET_REPORT_PUSH_STATUS_CONSTANT.NOT]: { label: "未推送", iconColor: '#FCBD12', textColor: '#FCBD12', borderColor: '#F4EADC', backgroundColor: '#FFF7E0' }, 
  [MARKET_REPORT_PUSH_STATUS_CONSTANT.PENDING]: { label: "推送中", iconColor: '#0192FF', textColor: '#0192FF', borderColor: '#D8E7F4', backgroundColor: '#EBFAFF' }, 
  [MARKET_REPORT_PUSH_STATUS_CONSTANT.SUCCESS]: { label: "已推送", iconColor: "#18D851", textColor: "#5AA771", borderColor: '#E2F4D8', backgroundColor: '#F0F9EB' },
  [MARKET_REPORT_PUSH_STATUS_CONSTANT.FAILED]: { label: "推送失败", iconColor: "#E34242", textColor: "#E34242", borderColor: '#f4d8d8', backgroundColor: '#ffd7d7' } 
};