import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';
import type { CustomerBaseCreateDTO, StarLevel } from '@/types/customerManage';

/** 客户档案创建基础信息 */
export function createCustomerBaseApi(data: CustomerBaseCreateDTO) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerBase/create',
        method: 'POST',
        data,
            customParams: {
                showSuccessToast: true,
                successMessage: '创建成功',
                isLoading: true,
            },
    });
}

/** 客户档案修改基础信息 */
export function updateCustomerBaseApi(data: CustomerBaseCreateDTO) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerBase/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}

/** 客户档案删除基础信息 */
export function deleteCustomerBaseApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerBase/delete/${id}`,
        method: 'DELETE',
        customParams: {
            showSuccessToast: true,
            successMessage: '删除成功',
            isLoading: true,
        },
    });
}

/** 客户档案获取基础信息详情 */
export function getCustomerBaseApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerBase/get/${id}`,
        method: 'GET',
        customParams: {
            showSuccessToast: false,
            isLoading: true,
        },
    });
}

/** 客户档案调整星级 */
export function adjustStarLevelApi(data: { id: number; starLevel: StarLevel; adjustReason?: string }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerBase/adjustStarLevel',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '调整成功',
            isLoading: true,
        },
    });
}

/** 客户档案信息分页列表 */
export function getCustomerBasePageApi(data: { current: number; size: number; [key: string]: any }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerBase/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}

// 客户档案列表下拉数据
export function getCustomerBaseDropdownApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerBase/list',
        method: 'POST',
        data,
    });
}

/** 获取子公司贸易商列表。 */
export function getSubsidiaryTraderListApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerBase/listSubsidiaryTrader',
        method: 'GET',
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}

/** 来访记录创建 */
export function createVisitRecordApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerVisit/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}
/** 来访记录修改 */
export function updateVisitRecordApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerVisit/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}
/** 来访记录取消*/
export function cancelVisitRecordApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerVisit/cancel`,
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '取消成功',
            isLoading: true,
        },
    });
}

/** 来访记录分页列表 */
export function getVisitRecordPageApi(data: { current: number; size: number; [key: string]: any }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerVisit/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}

/** 来访记录归档 */
export function archiveVisitRecordApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerVisit/archive/${id}`,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '归档成功',
            isLoading: true,
        },
    });
}

/** 来访记录详情 */
export function getVisitRecordApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerVisit/get/${id}`,
        method: 'GET',
    });
}

/** 发起来访记录的飞书提醒。 */
export function sendVisitRecordMessageApi(id: number | string) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerVisit/sendMessage/${id}`,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '飞书提醒已发起',
            isLoading: true,
        },
    });
}

// 根据客户信息查询接待规则
export function getReceptionRuleByCustomerApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerVisit/serviceRule',
        method: 'POST',
        data,
    });
}

// 拜访记录修改
export function updateVisitPlanApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCall/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}

// 拜访记录创建
export function createVisitPlanApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCall/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}

// 拜访记录分页列表
export function getVisitPlanPageApi(data: { current: number; size: number; [key: string]: any }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCall/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}

// 根据客户信息查询拜访规则
export function getVisitPlanRuleByCustomerApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCall/serviceRule',
        method: 'POST',
        data,
    });
}

// 拜访记录取消
export function cancelVisitPlanApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCall/cancel',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '取消成功',
            isLoading: true,
        },
    });
}
// 拜访记录详情
export function getVisitPlanApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCall/get/${id}`,
        method: 'GET',
    });
}

/** 发起拜访记录的飞书提醒。 */
export function sendVisitPlanMessageApi(id: number | string) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCall/sendMessage/${id}`,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '飞书提醒已发起',
            isLoading: true,
        },
    });
}

// 拜访记录归档
export function archiveVisitPlanApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCall/archive/${id}`,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '归档成功',
            isLoading: true,
        },
    });
}

// 客户对接人列表
export function getCustomerContactListApi(customerId: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCall/contactList/${customerId}`,
        method: 'GET',
    });
}

// 客户关怀创建
export function createCustomerCareApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCare/create',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '创建成功',
            isLoading: true,
        },
    });
}
// 客户关怀修改
export function updateCustomerCareApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCare/update',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '修改成功',
            isLoading: true,
        },
    });
}

// 客户关怀分页列表
export function getCustomerCarePageApi(data: { current: number; size: number; [key: string]: any }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCare/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}
// 客户关怀详情
export function getCustomerCareApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCare/get/${id}`,
        method: 'GET',
    });
}

/** 发起客户关怀的飞书提醒。 */
export function sendCustomerCareMessageApi(id: number | string) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCare/sendMessage/${id}`,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '飞书提醒已发起',
            isLoading: true,
        },
    });
}
// 客户关怀取消
export function cancelCustomerCareApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCare/cancel`,
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: true,
            successMessage: '取消成功',
            isLoading: true,
        },
    });
}
// 客户关怀归档
export function archiveCustomerCareApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerCare/archive/${id}`,
        method: 'POST',
        customParams: {
            showSuccessToast: true,
            successMessage: '归档成功',
            isLoading: true,
        },
    });
}

// 根据客户信息查询关怀规则
export function getCustomerCareRuleByCustomerApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCare/serviceRule',
        method: 'POST',
        data,
    });
}

// 客户关怀提醒
export function customerCareRemindApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerCare/careReminder',
        method: 'GET',
        customParams: {
            showSuccessToast: true,
            successMessage: '提醒成功',
            isLoading: true,
        },
    });
}

// 客户评估分页列表
export function getCustomerEvaluationPageApi(data: { current: number; size: number; [key: string]: any }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerEvaluation/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}

// 客户评估详情
export function getCustomerEvaluationApi(id: number) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerEvaluation/get/${id}`,
        method: 'GET',
    });
}

/**
 * 根据评估编码查询评估记录详情。
 * @param evaluationCode 评估记录编码
 * @returns 评估记录详情请求
 */
export function getCustomerEvaluationByCodeApi(evaluationCode: string) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerEvaluation/getByEvaluationCode/${evaluationCode}`,
        method: 'GET',
    });
}

// 客户评估重估
export function reevaluateCustomerEvaluationApi(id: number | string) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerEvaluation/reEvaluate/${id}`,
        method: 'GET',
        customParams: {
            showSuccessToast: true,
            successMessage: '重新评估成功',
            isLoading: true,
        },
    });
}

// 增值服务
export function getCustomerPlusServicePageApi(data: { current: number; size: number; [key: string]: any }) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerPlusService/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: true,
        },
    });
}


// 待办事项完成
export function completeTodoApi(id: number | string) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/customerTodo/finish/${id}`,
        method: 'GET',
        customParams: {
            showSuccessToast: true,
            successMessage: '操作成功',
            isLoading: true,
        },
    });
}

/** 批量完成待办事项。 */
export function batchCompleteTodoApi(ids: Array<number | string>) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/customerTodo/batchFinish',
        method: 'POST',
        data: ids,
        customParams: {
            showSuccessToast: true,
            successMessage: '批量完成成功',
            isLoading: true,
        },
    });
}
