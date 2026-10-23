import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

/** 服务规则新增 */
export function addServiceRuleApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysServiceRule/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}

// 服务规则修改
export function editServiceRuleApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysServiceRule/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}

// 服务规则删除
export function deleteServiceRuleApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysServiceRule/delete/${id}`,
        method: 'DELETE',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
            isLoading: true,
        },
    });
}

// 服务规则查询详情
export function queryServiceRuleApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysServiceRule/get/${id}`,
        method: 'GET',
    });
}

// 服务规则分页列表
export function queryServiceRuleListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysServiceRule/page',
        method: 'POST',
        data,
    });
}

// 服务规则更新配置
export function updateServiceRuleConfigApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysServiceRule/updateStatus',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '更新成功',
            isLoading: true,
        },
    });
}

// 星级指标配置创建
export function createStarIndicatorApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelIndicator/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}

// 星级指标配置修改
export function updateStarIndicatorApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelIndicator/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}
// 星级指标配置删除
export function deleteStarIndicatorApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysStarLevelIndicator/delete/${id}`,
        method: 'DELETE',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
            isLoading: true,
        },
    });
}
// 星级指标配置查询详情
export function queryStarIndicatorApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysStarLevelIndicator/get/${id}`,
        method: 'GET',
    });
}

// 星级指标配置分页
export function queryStarIndicatorListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelIndicator/page',
        method: 'POST',
        data,
    });
}

// 客户星级配置创建
export function createCustomerStarApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelConfig/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}
// 客户星级配置修改
export function updateCustomerStarApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelConfig/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}
// 客户星级配置删除
export function deleteCustomerStarApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysStarLevelConfig/delete/${id}`,
        method: 'DELETE',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
            isLoading: true,
        },
    });
}
// 客户星级配置查询详情
export function queryCustomerStarApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysStarLevelConfig/get/${id}`,
        method: 'GET',
    });
}
// 客户星级配置分页
export function queryCustomerStarListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelConfig/page',
        method: 'POST',
        data,
    });
}

// 客户星级查询使用中或（无使用就取最大配置）
export function queryCustomerStarUsingApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelConfig/getUsingOrMax',
        method: 'GET',
        customParams: {
            showSuccessToast: false,
            successMessage: '查询成功',
            isLoading: true,
        },
    });
}

// 客户星级指标列表下拉
export function queryCustomerStarIndicatorListApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelIndicator/getAll',
        method: 'GET',
        customParams: {
            isLoading: true,
        },
    });
}

// 客户星级更改状态
export function updateCustomerStarStatusApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysStarLevelConfig/updateStatus',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '更新成功',
            isLoading: true,
        },
    });
}

// 同步客户星级
export function syncCustomerStarApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerEvaluation/evaluate',
        method: 'GET',
        customParams: {
            showSuccessToast: true,
            successMessage: '同步成功',
            isLoading: true,
        },
    });
}

// 回款提醒配置 创建
export function createReturnReminderApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysPaymentReminderConfig/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}
// 回款提醒配置 修改
export function updateReturnReminderApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysPaymentReminderConfig/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}

// 回款提醒配置 删除
export function deleteReturnReminderApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysPaymentReminderConfig/delete/${id}`,
        method: 'DELETE',
    });
}

// 回款提醒配置 查询详情
export function queryReturnReminderApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysPaymentReminderConfig/get/${id}`,
        method: 'GET',
    });
}

// 回款提醒配置 分页列表
export function queryReturnReminderListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysPaymentReminderConfig/page',
        method: 'POST',
        data,
    });
}

// 回款提醒配置 更新状态
export function updateReturnReminderStatusApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysPaymentReminderConfig/updateStatus',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '更新成功',
            isLoading: true,
        },
    });
}

// 消息配置 创建
export function createMessageConfigApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysMessageConfig/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}

// 消息配置 修改
export function updateMessageConfigApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysMessageConfig/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}

// 消息配置 删除
export function deleteMessageConfigApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysMessageConfig/delete/${id}`,
        method: 'DELETE',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
            isLoading: true,
        },
    });
}

// 消息配置 查询详情
export function queryMessageConfigApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysMessageConfig/get/${id}`,
        method: 'GET',
    });
}

// 消息配置 分页列表
export function queryMessageConfigListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysMessageConfig/page',
        method: 'POST',
        data,
    });
}

// 消息配置 更新状态
export function updateMessageConfigStatusApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysMessageConfig/updateStatus',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '更新成功',
            isLoading: true,
        },
    });
}

// 获取所有消息通知模块列表
export function queryAllMessageModuleApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/sysMessageNodeConfig/modules',
        method: 'GET',
    });
}

// 根据模块编码查询节点列表
export function queryMessageNodeListApi(moduleCode: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/sysMessageNodeConfig/nodes/${moduleCode}`,
        method: 'GET',
        customParams: {
            isLoading: true,
        },
    });
}
