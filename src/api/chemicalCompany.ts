import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

// 化工企业创建
export function createChemicalCompanyApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/create',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

// 化工企业修改
export function updateChemicalCompanyApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/update',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

// 化工企业详情
export function queryChemicalCompanyDetailApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketSurveyChemical/get/${id}`,
        method: 'GET',
        customParams: {
            isLoading: false,
        },
    });
}

// 根据企业和调研月份查询化工企业调研
export function queryChemicalCompanyByCustomerIdApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/getByCustomerId',
        method: 'GET',
        params: data,
        customParams: {
            isLoading: false,
        },
    });
}

// 获取化工企业最新开工率变化原因
export function getLatestRateChangeReasonApi(customerId: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/getLatestRateChangeReason',
        method: 'GET',
        params: { customerId },
        customParams: {
            isLoading: false,
        },
    });
}

// 化工企业删除
export function deleteChemicalCompanyApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketSurveyChemical/delete/${id}`,
        method: 'DELETE',
        customParams: {
            isLoading: true,
        },
    });
}

// 化工企业列表
export function queryChemicalCompanyListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/page',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

// 比较历史数据
export function compareWithHistoryApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/compare',
        method: 'POST',
        data,
    });
}

// 化工企业导入
export function importChemicalCompanyApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/import',
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

// 化工企业导出
export function exportChemicalCompanyApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/export',
        method: 'POST',
        data,
        responseType: 'blob',
        customParams: {
            isLoading: true,
        },
    });
}

// 化工企业模板下载
export function downloadChemicalCompanyTemplateApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/template',
        method: 'GET',
        responseType: 'blob',
        customParams: {
            isLoading: true,
        },
    });
}

// 化工企业详情-库存变化趋势

/* 
@description: 化工企业详情-库存变化趋势
@param {any} accurateName	精确名称  months	时间范围：3-近3月，6-近6月，9-近9月，12-近12月
@return {Promise} - 返回一个Promise对象，包含接口响应数据
  inputTime	录入时间		
  inventory	库存（万吨）		
  operatingRate	开工率（%）	 
  price	价格（元/万吨）
*/
export function queryInventoryTrendApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketSurveyChemical/inventoryTrend`,
        method: 'POST',
        data,
        customParams: {
            isLoading: false,
        },
    });
}

// 化工企业导入错误数据下载
export function downloadImportErrorDataApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketSurveyChemical/exportErrorData',
        method: 'POST',
        data,
        responseType: 'blob',
        customParams: {
            isLoading: true,
        },
    });
}
