import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

// 合同管理-框架合同-框架合同主表分页
export function getContractFrameworkPage(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/page',
        data,
        method: 'POST',
        customParams: {
            showSuccessToast: false,
        },
    })

}

// 合同管理-框架合同-框架合同主表列表
export function getContractFrameworkList(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/list',
        data,
        method: 'POST',
        customParams: {
            showSuccessToast: false,
        },
    })
}

// 合同管理-框架合同-框架合同主表创建
export function createContractFramework(data: any, showSuccessToast = true) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/create',
        data,
        method: 'POST',
        customParams: {
            showSuccessToast,
            successMessage: '创建成功'
        },
    })
}

// 合同管理-框架合同-框架合同主表获取详情
export function getContractFramework(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/get/' + id,
        method: 'GET',
         customParams: {
            showSuccessToast: false,
        },
    })
}

// 合同管理-框架合同-框架合同主表删除
export function deleteContractFramework(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/delete/' + id,
        method: 'DELETE',
         customParams: {
            showSuccessToast: true,
            successMessage: '删除成功'
        },
    })
}

// 合同管理-框架合同-终止
export function terminateContractFramework(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/terminate',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '终止成功'
        },
    })
}

// 合同管理-框架合同-框架合同主表修改
export function updateContractFramework(data: any, showSuccessToast = true) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast,
            successMessage: '修改成功'
        },
    })
}

// 合同管理-框架合同-提交审批
export function submitContractFrameworkApproval(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/submit/approval/' + id,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '提交成功'
        },
    })
}

// 合同管理-销售合同-销售合同主表分页
export function getContractSalePage(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
        },
    })
}

/**
 * 导出销售合同列表。
 * @param data 销售合同筛选条件，不包含分页参数
 * @returns 导出接口响应结果
 */
export function exportContractSaleList(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/export',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/**
 * 根据状态查询销售合同列表。
 * @param status 销售合同状态
 * @returns 指定状态下的销售合同列表请求结果
 */
export function getContractSalesListByStatus(status: string) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/listByStatus',
        method: 'GET',
        params: {
            status,
        },
        customParams: {
            showSuccessToast: false,
        },
    })
}

/**
 * 查询品位明细尚未生成发货明细的销售合同。
 * @returns 可用于创建合同发货明细的销售合同列表请求结果
 */
export function getContractSalesListBySalesContractCode() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/listBySalesContractCode',
        method: 'GET',
        customParams: {
            showSuccessToast: false,
        },
    })
}

// 合同管理-销售合同-销售合同主表创建
export function createContractSale(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
        },
    })
}

// 合同管理-销售合同-销售合同主表修改
export function updateContractSale(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
        },
    })
}

// 合同管理-销售合同-销售合同状态修改
export function updateContractSaleStatus(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/updateStatus',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '作废成功',
        },
    })
}

// 合同管理-销售合同-销售合同归档
export function archiveContractSale(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/updateArchive',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '归档成功',
        },
    })
}

// 合同管理-销售合同-销售合同主表获取详情
export function getContractSaleDetail(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/get/' + id,
        method: 'GET',
    })
}

// 合同管理-销售合同-根据框架合同编号查询关联合同
export function getContractSalesListByFrameworkCode(contractCode: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/listByFrameworkCode',
        method: 'GET',
        params: {
            frameworkCode: contractCode,
        },
        customParams: {
            showSuccessToast: false,
        },
    })
}

// 合同管理-销售合同-销售合同主表删除
export function deleteContractSale(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractSales/delete/' + id,
        method: 'DELETE',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
        },
    })
}

// 根据客户id查询最新的框架合同
export function queryLatestContractSaleByCustomerId(customerId: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/contractFramework/getByCustomerId/' + customerId,
        method: 'GET'
    })
}
