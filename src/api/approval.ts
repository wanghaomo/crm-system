import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';
// 飞书审批实例列表
export function listApprovalInstances(data: Record<string, any> = {}) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/webhook/feishu/approval/list',
        method: 'GET',
        params: data,
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 飞书审批-我已办审批列表
export function listDoneApprovalInstances(data: Record<string, any> = {}) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/webhook/feishu/approval/done',
        method: 'GET',
        params: data,
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 飞书审批-抄送我审批列表
export function listCcMeApprovalInstances(data: Record<string, any> = {}) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/webhook/feishu/approval/ccMe',
        method: 'GET',
        params: data,
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 飞书审批-审批实例详情
export function getApprovalInstanceDetail(data: Record<string, any> = {}) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/webhook/feishu/approval/detail',
        method: 'GET',
        params: data,
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 飞书审批-审批评论列表
export function getFeishuApprovalComments(data: Record<string, any> = {}) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/webhook/feishu/approval/comments',
        method: 'GET',
        params: data,
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

/**
 * 撤销当前用户发起的飞书审批。
 * @param params 撤销参数，userId 为当前用户飞书 ID，approvalId 为审批 ID
 * @returns 撤销审批请求结果
 */
export function cancelFeishuApproval(params: { userId: string; approvalId: string | number }) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/webhook/feishu/approval/cancel',
        method: 'GET',
        params,
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 通用审批流程信息
export function getCommonApprovalLogsNewMap(approvalId: number | string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/commonApproval/logsNewMap/' + approvalId,
        method: 'GET',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}
