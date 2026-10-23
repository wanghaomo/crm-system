import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

/** 历史合同分页查询。 */
export function getHistoricalContractPageApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/historicalContractRecord/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/** 导入历史合同记录。 */
export function importHistoricalContractApi(data: FormData) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/historicalContractRecord/import',
        method: 'POST',
        data,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/** 导出历史合同记录。 */
export function exportHistoricalContractApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/historicalContractRecord/export',
        method: 'POST',
        data,
        responseType: 'blob',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/** 下载历史合同导入模板。 */
export function downloadHistoricalContractTemplateApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/historicalContractRecord/template',
        method: 'GET',
        responseType: 'blob',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/** 全量删除历史合同记录。 */
export function batchDeleteHistoricalContractApi() {
    return service({
        url: CRM_BASE_URL_PREFIX + '/historicalContractRecord/batchDelete',
        method: 'DELETE',
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}
