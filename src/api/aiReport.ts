import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

// 销售计划-AI预测报告主表分页
export function getSalesPlanAiReportPage(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/page',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-AI预测报告主表列表
export function getSalesPlanAiReportList(month: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/list/' + encodeURIComponent(month),
        method: 'get',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-AI预测报告主表列表（下拉）
export function getSalesPlanAiReportDropDownList(params?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/list',
        method: 'get',
        params,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

// 销售计划-AI预测规则配置表创建
export function createSalesPlanAiReport(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/createRule',
        method: 'post',
        data,
    });
}

// 销售计划-AI预测规则配置表修改
export function updateSalesPlanAiReport(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/updateRule',
        method: 'post',
        data,
    });
}

// 销售计划-AI预测规则配置表删除
export function deleteSalesPlanAiReportRule(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + `/aiReport/deleteRule/${id}`,
        method: 'delete',
    });
}

// 销售计划-AI预测报告生成
export function generateSalesPlanAiReport(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/generateReport',
        method: 'post',
        data,
    });
}

// 销售计划-AI预测规则配置表列表
export function getSalesPlanAiReportRuleList(params?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/getRuleList',
        method: 'get',
        params,
        customParams: {
            showSuccessToast: false,
        },
    });
}

// 销售计划-AI预测报告详情
export function getSalesPlanAiReportDetail(id: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/aiReport/get/' + id,
        method: 'get',
        customParams: {
            showSuccessToast: false,
        },
    });
}
