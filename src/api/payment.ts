import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

/**
 * 获取回款单分页列表。
 * @param data 查询条件和分页参数
 * @returns 回款单分页数据请求结果
 */
export function getPaymentPageApi(data?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeReceipt/page',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取回款单列表。
 * @param data 回款单查询条件
 * @returns 回款单列表请求结果
 */
export function getPaymentListApi(data?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeReceipt/list',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取销售合同回款进度。
 * @param contractCode 销售合同编号
 * @returns 回款进度请求结果
 */
export function getPaymentProgressApi(contractCode: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + `/financeReceipt/progress/${encodeURIComponent(contractCode)}`,
        method: 'get',
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取回款单详情。
 * @param id 回款单 ID
 * @returns 回款单详情请求结果
 */
export function getPaymentDetailApi(id:string |number){
  return service.request({
    url: CRM_BASE_URL_PREFIX + `/financeReceipt/get/${id}`,
    method: 'get',
    customParams: {
      showSuccessToast: false,
    },
  });
}

/**
 * 更新回款单基础信息和状态。
 * @param data 回款单更新参数
 * @returns 更新请求结果
 */
export function updatePaymentApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeReceipt/update',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
        },
    });
}

/**
 * 根据客户获取可回款的回款单列表。
 * @param customerId 客户 ID
 * @returns 客户名下可回款的回款单列表请求结果
 */
export function getPaymentReceiptListApi(customerId: string | number) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financePaymentRecord/receiptList',
        method: 'get',
        params: {
            customerId,
        },
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取批量回款客户下拉列表。
 * @returns 批量回款可选客户列表请求结果
 */
export function getPaymentCustomerListApi() {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financePaymentRecord/customerList',
        method: 'get',
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取回款记录列表。
 * @param data 查询条件，通常包含回款单编号和客户 ID
 * @returns 回款记录列表请求结果
 */
export function getPaymentRecordListApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financePaymentRecord/list',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 批量新增回款记录。
 * @param data 批量回款主信息和明细记录
 * @returns 批量新增请求结果
 */
export function batchCreatePaymentRecordApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financePaymentRecord/batchCreate',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '保存成功',
        },
    });
}

/**
 * 新增单条回款记录。
 * @param data 回款记录提交参数
 * @returns 新增请求结果
 */
export function createPaymentRecordApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financePaymentRecord/create',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '保存成功',
        },
    });
}

/**
 * 新增催收记录。
 * @param data 催收记录提交参数
 * @returns 新增请求结果
 */
export function createCollectionRecordApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeCollectionRecord/create',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '保存成功',
        },
    });
}

/**
 * 获取催收记录列表。
 * @param data 查询条件，通常包含回款单编号
 * @returns 催收记录列表请求结果
 */
export function getCollectionRecordListApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeCollectionRecord/list',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}
