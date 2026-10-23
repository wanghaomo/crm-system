import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

// 销售计划-基准定价-定价管理主表分页
export function getSalesPlanBasePricingPage(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/page',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-基准定价-定价管理主表查询列表
export function getSalesPlanBasePricingList(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/getList',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/**
 * 按定价月份范围查询已审核的基准定价单。
 * @param data 查询条件，包含定价月份范围和可选的定价单号列表
 * @returns 基准定价单列表请求
 */
export function getSalesPlanBasePricingByMonth(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/getPricingByMonth',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-基准定价-定价管理主表创建
export function createSalesPlanBasePricing(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/create',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '创建成功',
        },
    });
}

// 销售计划-基准定价-定价管理主表获取详情
export function getSalesPlanBasePricingDetail(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/get/' + id,
        method: 'get',
    });
}

// 销售计划-基准定价-定价管理主表删除
export function deleteSalesPlanBasePricing(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/delete/' + id,
        method: 'delete',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
        },
    });
}

// 销售计划-基准定价-定价管理主表修改
export function updateSalesPlanBasePricing(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/update',
        method: 'put',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '修改成功',
        },
    });
}

// 市场信息-调研数据-化工企业库存情况
export function getMarketSurveyChemicalInventorySituation() {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/inventorySituation',
        method: 'get',
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 销售计划-基准定价-定价管理主表作废
export function cancelSalesPlanBasePricing(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/salesPlanBasePricing/cancelled',
        method: 'put',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '作废成功',
        },
    });
}

// 销售计划-月发货计划主表分页
export function getSalesPlanMonthlyPlanPage(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/page',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-根据月份(非必传)、状态 (非必传) 查询月发货计划列表
export function getSalesPlanMonthlyPlanList(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/getList',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-查询计划月份最大，状态为已审核或已归档的月发货计划
export function getSalesPlanMaxMonthlyDispatch() {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/getMaxMonthly',
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-月发货计划主表修改
export function updateSalesPlanMonthlyPlan(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/update',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '修改成功',
        },
    });
}

// 销售计划-月发货计划主表创建
export function createSalesPlanMonthlyPlan(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/create',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '创建成功',
        },
    });
}

/**
 * 获取月发货计划主表详情。
 * @param id 月发货计划主表ID
 * @param type 编辑场景查询标识，传入 true 时由后端返回历史合同剩余明细
 * @returns 月发货计划详情请求
 */
export function getSalesPlanMonthlyPlanDetail(id: any, type?: boolean) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/get',
        method: 'get',
        params: {
            id,
            ...(type === undefined ? {} : { type }),
        },
    });
}

// 销售计划-月发货计划主表删除
export function deleteSalesPlanMonthlyPlan(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/delete/' + id,
        method: 'delete',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
        },
    });
}

// 销售计划-月发货计划主表根据基准定价单号展示本月新增计划明细列
export function getSalesPlanMonthlyPlanMonthlyDetail(codes: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/getMonthlyDetail/' + encodeURIComponent(codes),
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-月发货计划主表获取历史合同剩余明细
export function getSalesPlanMonthlyPlanHistRemainDetail(params?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/monthlyDispatch/getHistRemainDetail',
        method: 'get',
        params,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 通用审批主表根据业务类型和业务ID查询
export function getCommonApprovalByBiz(bizType: string, bizId: number | string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/commonApproval/getByBiz',
        method: 'get',
        params: { bizType, bizId },
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 通用审批记录列表
export function getCommonApprovalLogs(approvalId: number | string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/commonApproval/logs/' + approvalId,
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-合同定价主表分页
export function getSalesPlanContractPricingPage(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/page',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-根据状态(非必传) 查询合同定价列表
export function getSalesPlanContractPricingList(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/getList',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-合同定价主表删除
export function deleteSalesPlanContractPricing(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/delete/' + id,
        method: 'delete',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
        },
    });
}

// 销售计划-合同定价主表创建
export function createSalesPlanContractPricing(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/create',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '创建成功',
        },
    });
}

// 销售计划-合同定价主表修改
export function updateSalesPlanContractPricing(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/update',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '修改成功',
        },
    });
}

// 销售计划-合同定价主表获取详情
export function getSalesPlanContractPricingDetail(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/get/' + id,
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售合同调整记录表-根据合同定价单号查询列表
export function getContractSalesAdjustRecordByPricingCode(code: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/contractSalesAdjustRecord/getListByPricingCode/' + encodeURIComponent(code),
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-合同定价主表获取月发货已审核列表
export function getSalesPlanContractPricingMonthlyList() {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/getMonthlyList',
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-合同定价根据月发货计划获取关联客户列表
export function getSalesPlanContractPricingPlanNewItems(monthlyCode: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/getPlanNewItem/' + encodeURIComponent(monthlyCode),
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/**
 * 根据月发货计划编号、基准定价单号和月发货计划新增明细外层主项 ID 获取合同定价明细。
 * @param monthlyCode 月发货计划编号
 * @param pricingCode 客户下拉选项关联的基准定价单号
 * @param itemIds 月发货计划新增明细外层主项 ID
 * @returns 合同定价明细请求
 */
export function getSalesPlanContractPricingItems(monthlyCode: string, pricingCode: string, itemIds: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/pricing/getPricingDetail',
        method: 'get',
        params: { monthlyCode, pricingCode, itemIds },
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}
