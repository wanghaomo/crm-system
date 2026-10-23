import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';

/**
 * 竞争对手档案（客户管理）分页查询。
 * @param data 查询参数（current/size/enterpriseName/status 等）
 * @returns Promise 分页结果
 */
export function queryCompetitorBaseListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketCompetitorBase/page',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

/**
 * 竞争对手档案详情（含调研数据记录）。
 * @param id 竞争对手 id
 * @returns Promise 详情数据
 */
export function queryCompetitorBaseDetailApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketCompetitorBase/detail/${id}`,
        method: 'GET',
        customParams: {
            isLoading: false,
        },
    });
}

/**
 * 创建竞争对手档案。
 * @param data 竞争对手基础信息
 * @returns Promise 创建结果
 */
export function createCompetitorBaseApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketCompetitorBase/create',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

/**
 * 更新竞争对手档案（已入库状态不可修改企业名称、矿山名称）。
 * @param data 竞争对手基础信息（含 id）
 * @returns Promise 更新结果
 */
export function updateCompetitorBaseApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/marketCompetitorBase/update',
        method: 'POST',
        data,
        customParams: {
            isLoading: true,
        },
    });
}

/**
 * 删除竞争对手档案（同步删除调研记录）。
 * @param id 竞争对手 id
 * @returns Promise 删除结果
 */
export function deleteCompetitorBaseApi(id: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + `/marketCompetitorBase/delete/${id}`,
        method: 'DELETE',
        customParams: {
            isLoading: true,
        },
    });
}
