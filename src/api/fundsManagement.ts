import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

const DEFAULT_PAGE_PARAMS = {
    current: 1,
    size: 20,
};

/**
 * 获取客户资金分页列表。
 * @param data 客户资金查询条件和分页参数
 * @returns 客户资金分页数据请求结果
 */
export function getFundsManagementPageApi(data?: any) {
    return service
        .request({
            url: CRM_BASE_URL_PREFIX + '/financeSettlementReceiptFundRecord/listCustomerCapital',
            method: 'post',
            data: {
                ...DEFAULT_PAGE_PARAMS,
                ...data,
            },
            customParams: {
                showSuccessToast: false,
            },
        })
        .catch((error: any) => Promise.reject(error));
}

/**
 * 创建客户预付款资金记录。
 * @param data 预付款创建参数
 * @returns 预付款创建请求结果
 */
export function createFundsManagementRecordApi(data: any) {
    return service
        .request({
            url: CRM_BASE_URL_PREFIX + '/financeSettlementReceiptFundRecord/create',
            method: 'post',
            data,
            customParams: {
                isLoading: true,
                showSuccessToast: true,
                successMessage: '提交成功',
            },
        })
        .catch((error: any) => Promise.reject(error));
}

/**
 * 根据客户 ID 查询资金记录。
 * @param customerId 客户 ID
 * @returns 客户资金记录请求结果
 */
export function getFundsManagementRecordListByCustomerApi(customerId: string | number) {
    return service
        .request({
            url: CRM_BASE_URL_PREFIX + `/financeSettlementReceiptFundRecord/listByCustomer/${encodeURIComponent(customerId)}`,
            method: 'get',
            customParams: {
                showSuccessToast: false,
            },
        })
        .catch((error: any) => Promise.reject(error));
}
