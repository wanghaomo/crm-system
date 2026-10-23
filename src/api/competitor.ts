import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

// 竞争对手创建
export function createCompetitorApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/create',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手修改
export function updateCompetitorApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/update',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手详情
export function queryCompetitorDetailApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketSurveyCompetitor/get/${id}`,
        method: 'GET',
        customParams: {
            isLoading: false,
        },
    });
}

// 竞争对手删除
export function deleteCompetitorApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketSurveyCompetitor/delete/${id}`,
        method: 'DELETE',
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手列表
export function queryCompetitorListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/page',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手与历史数据比较
export function compareCompetitorWithHistoryApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/compare',
        method: 'POST',
        data,
    });
}

// 竞争对手导入
export function importCompetitorApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/import',
        method: 'POST',
        data,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手导出
export function exportCompetitorApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/export',
        method: 'POST',
        data,
        responseType: 'blob',
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手导出错误数据
export function exportCompetitorErrorDataApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/exportErrorData',
        method: 'POST',
        data,
        responseType: 'blob',
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手模板下载
export function downloadCompetitorTemplateApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/template',
        method: 'GET',
        responseType: 'blob',
        customParams: {
            isLoading: true,
        },
    });
}

// 竞争对手库存情况
export function queryCompetitorInventorySituationApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/inventorySituation',
        method: 'GET',
        customParams: {
            isLoading: false,
        },
    });
}

// 竞争对手详情-库存变化趋势
export function queryCompetitorInventoryTrendApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/inventoryTrend',
        method: 'POST',
        data,
        customParams: {
            isLoading: false,
        },
    });
}

// 竞争对手详情-开工率价格对比图
export function queryCompetitorRatePriceContrastApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyCompetitor/ratePriceContrast',
        method: 'POST',
        data,
        customParams: {
            isLoading: false,
        },
    });
}
